
import { sql, havuzaBaglan } from '../../core/db/mssql.js';
import { CONFIG } from '../../core/config.js';
import { sendBatchParts } from '../../core/http/axiosClient.js';
import crypto from 'crypto';

/* ======================
   CT yardımcıları
   ====================== */
export async function gecerliCTSurumunuAl() {
  const pool = await havuzaBaglan();
  const r = await pool.request().query('SELECT CHANGE_TRACKING_CURRENT_VERSION() AS v');
  return Number(r.recordset[0].v);
}

export async function sonSenkSurumunuAl(table) {
  const pool = await havuzaBaglan();
  const r = await pool.request()
    .input('t', sql.NVarChar, table)
    .query('SELECT LastSyncVersion FROM dbo.SyncState WHERE TableName=@t');
  return r.recordset.length === 0 ? 0 : Number(r.recordset[0].LastSyncVersion);
}

export async function sonSenkSurumunuGuncelle(table, ver) {
  const pool = await havuzaBaglan();
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

/* ======================
   Ana akış (axiosClient yardımcılarını kullanır)
   ====================== */
export async function yerelDegisiklikleriGonder(table, nodeName) {
  const pool = await havuzaBaglan();
  const last = await sonSenkSurumunuAl(table);
  const current = await gecerliCTSurumunuAl();

  // Pencere sabit kalsın (resume için)
  const fromVersion = last;
  const toVersion = current;

  const rs = await pool.request()
    .input('last', sql.BigInt, fromVersion)
    .query(degisiklikSorgusuOlustur(table));

  const rows = rs.recordset;
  if (rows.length === 0) {
    await sonSenkSurumunuGuncelle(table, toVersion);
    return { sent: 0, last: fromVersion, current: toVersion, chunks: 0 };
  }

  // Parçala (part)
  const parts = chunkRows(rows, { maxRows: 4000, maxBytes: 3_500_000 });
  const url = `${CONFIG.remoteApiBase}/veri-al`;

  // Batch meta
  const batchId = crypto.randomUUID();
  const baseMeta = {
    batchId,
    table,
    sourceDb: nodeName,
    fromVersion,
    toVersion
  };

  // Parçaları sırayla gönder (sendBatchParts -> her part gerekirse segmentlere bölünür)
  const { totalSent, partCount } = await sendBatchParts({ url, baseMeta, parts });

  // Tüm part/segment başarılı ise ilerlemeyi güncelle
  await sonSenkSurumunuGuncelle(table, toVersion);

  return {
    sent: totalSent,
    last: fromVersion,
    current: toVersion,
    batchId,
    chunks: partCount
  };
}
