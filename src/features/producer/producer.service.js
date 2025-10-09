
import { sql, getConnectionPool } from '../../core/db/mssql.js';
import { CONFIG } from '../../core/config.js';
import { sendBatchParts } from '../../core/http/axiosClient.js';
import { postJsonGzip } from '../../core/http/axiosClient.js';
import crypto from 'crypto';

/* ======================
   CT yardımcıları
   ====================== */
export async function gecerliCTSurumunuAl() {
  const pool = await getConnectionPool();
  const r = await pool.request().query('SELECT CHANGE_TRACKING_CURRENT_VERSION() AS v');
  return Number(r.recordset[0].v);
}

export async function sonSenkSurumunuAl(table) {
  const pool = await getConnectionPool();
  const r = await pool.request()
    .input('t', sql.NVarChar, table)
    .query('SELECT LastSyncVersion FROM dbo.SyncState WHERE TableName=@t');
  return r.recordset.length === 0 ? 0 : Number(r.recordset[0].LastSyncVersion);
}

export async function sonSenkSurumunuGuncelle(table, ver) {
  const pool = await getConnectionPool();
  await pool.request()
    .input('v', sql.BigInt, ver)
    .input('t', sql.NVarChar, table)
    .query('UPDATE dbo.SyncState SET LastSyncVersion=@v WHERE TableName=@t');
}

/* ======================
   Değişiklik sorgusu
   ====================== */
export function degisiklikSorgusuOlustur(tableQualified /* 'dbo.DocumentDetailCosts' */) {
  return `
DECLARE @qualified NVARCHAR(300) = 
  QUOTENAME(PARSENAME(N'${tableQualified}', 2)) + N'.' + QUOTENAME(PARSENAME(N'${tableQualified}', 1));

DECLARE @cols NVARCHAR(MAX);
SELECT @cols = STRING_AGG(QUOTENAME(c.name), N', ')
FROM sys.columns AS c
WHERE c.object_id = OBJECT_ID(@qualified)
  AND c.name <> N'Id';

IF @cols IS NULL SET @cols = N'';

DECLARE @sql NVARCHAR(MAX) = N'
WITH C AS (
  SELECT ct.SYS_CHANGE_VERSION AS Ver, ct.SYS_CHANGE_OPERATION AS Op, ct.[Id]
  FROM CHANGETABLE(CHANGES ' + @qualified + N', @last) AS ct
)
SELECT C.Ver, C.Op, C.Id'
+ CASE WHEN @cols <> N'' THEN N', ' + @cols ELSE N'' END + N'
FROM ' + @qualified + N' AS T
RIGHT JOIN C ON T.[Id] = C.[Id]
ORDER BY C.Ver ASC;';

EXEC sp_executesql @sql, N'@last BIGINT', @last = @last;
`;
}

/* ======================
   Parçalama (part) yardımcıları
   ====================== */
function chunkRows(rows, { maxRows = 4000, maxBytes = 3_500_000 } = {}) {
  const parts = [];
  let cur = [];
  let curBytes = 0;

  for (const r of rows) {
    const s = JSON.stringify(r);
    const b = Buffer.byteLength(s);
    if (cur.length > 0 && (cur.length + 1 > maxRows || curBytes + b > maxBytes)) {
      parts.push(cur);
      cur = [];
      curBytes = 0;
    }
    cur.push(r);
    curBytes += b;
  }
  if (cur.length) parts.push(cur);
  return parts;
}

// applyLogClean'i tamamen bitirene kadar tekrar tekrar çağırır
async function applyLogCleanFully(remoteBase, batchId, {
  timeoutMs = 30000,     // tek çağrı için bekleme süresi
  sleepMs = 200,         // turlar arasında küçük bekleme (DB'yi rahatlatır)
  maxRounds = 500        // güvenlik: sonsuz döngü olmasın
} = {}) {
  let total = 0;
  for (let round = 1; round <= maxRounds; round++) {
    const r = await postJsonGzip(`${remoteBase}/applyLogClean`, { batchId }, { timeoutMs });

    if (!r?.ok) {
      throw new Error(`applyLogClean NACK/ERROR: ${JSON.stringify(r)}`);
    }

    const del = Number(r.deleted || 0);
    total += del;

    // Sunucu bu turda hiç satır silmediyse, artık bitti demektir.
    if (del === 0) {
      return total;
    }

    // İsteğe bağlı: çok hızlı üst üste vurmayalım
    if (sleepMs > 0) {
      await new Promise(res => setTimeout(res, sleepMs));
    }
  }
  // güvenlik amaçlı: çok fazla tur atılırsa hata ver
  throw new Error('applyLogClean loops exceeded maxRounds; check server cleanup batching.');
}

/* ======================
   Ana akış (axiosClient yardımcılarını kullanır)
   ====================== */
export async function pushLocalChanges(table, nodeName) {
  const pool = await getConnectionPool();
  const fromVersion = await sonSenkSurumunuAl(table);
  const toVersion   = await gecerliCTSurumunuAl();

  // Değişiklikleri çek
  const rs = await pool.request()
    .input('last', sql.BigInt, fromVersion)
    .query(degisiklikSorgusuOlustur(table));

  const rows = rs.recordset;
  if (rows.length === 0) {
    // Hiç değişiklik yoksa versiyonu gönül rahatlığıyla ilerlet
    await sonSenkSurumunuGuncelle(table, toVersion);
    return { sent: 0, last: fromVersion, current: toVersion };
  }

  // Gönderim/temizlik için meta
  const parts   = chunkRows(rows, { maxRows: 4000, maxBytes: 3_500_000 });
  const url     = `${CONFIG.remoteApiBase}/apply-changes`;
  const batchId = crypto.randomUUID();
  const baseMeta = { batchId, table, sourceDb: nodeName, fromVersion, toVersion };

  try {
    // 1) Gönderim (send → gerekirse segment, gzip, retry)
    const { totalSent, partCount } = await sendBatchParts({ url, baseMeta, parts });

    // 2) Temizlik (applyLog’u bitene kadar parça parça temizle)
    const totalCleaned = await applyLogCleanFully(CONFIG.remoteApiBase, batchId, {
      timeoutMs: 60000,   // istersen 30-120 sn arası ayarlayabilirsin
      sleepMs: 200,
      maxRounds: 1000
    });
    
    console.log("\x1b[33m%s\x1b[0m ","🟡 ApplyLog Cleaned:", totalCleaned);
    
    // 3) Hepsi ok → versiyonu ilerlet
    await sonSenkSurumunuGuncelle(table, toVersion);

    return {
      sent: totalSent,
      last: fromVersion,
      current: toVersion,
      batchId,
      chunks: partCount,
      totalCleaned
    };

  } catch (err) {
    // ÖNEMLİ: Hata varsa versiyonu İLERLETME!
    console.error('[pushLocalChanges] hata:', {
      table, batchId, fromVersion, toVersion, message: err?.message
    });
    // üst kata fırlat ki çağıran katman (job/cron) yeniden denesin
    throw err;
  }
}
