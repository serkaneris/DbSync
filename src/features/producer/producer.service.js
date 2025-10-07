import { sql, havuzaBaglan } from '../../core/db/mssql.js';
import { jsonGonder } from '../../core/http/axiosClient.js';
import { CONFIG } from '../../core/config.js';

export async function gecerliCTSurumunuAl() {
  const pool = await havuzaBaglan();
  const r = await pool.request().query('SELECT CHANGE_TRACKING_CURRENT_VERSION() AS v');
  return Number(r.recordset[0].v);
}

export async function sonSenkSurumunuAl(table) {
  const pool = await havuzaBaglan();
  const r = await pool.request().input('t', sql.NVarChar, table)
    .query('SELECT LastSyncVersion FROM dbo.SyncState WHERE TableName=@t');
  return r.recordset.length === 0 ? 0 : Number(r.recordset[0].LastSyncVersion);
}

export async function sonSenkSurumunuGuncelle(table, ver) {
  const pool = await havuzaBaglan();
  await pool.request().input('v', sql.BigInt, ver).input('t', sql.NVarChar, table)
    .query('UPDATE dbo.SyncState SET LastSyncVersion=@v WHERE TableName=@t');
}

export function degisiklikSorgusuOlustur(table) {
  return `



  

DECLARE @cols NVARCHAR(MAX);

SELECT @cols = STRING_AGG(name, ', ')
FROM sys.columns
WHERE object_id = OBJECT_ID('${table}')
  AND name <> 'Id';


  DECLARE @sql NVARCHAR(MAX) = '

  ;
WITH C AS (
  SELECT ct.SYS_CHANGE_VERSION AS Ver, ct.SYS_CHANGE_OPERATION AS Op, ct.Id
  FROM CHANGETABLE(CHANGES ${table}, 0) ct
)
SELECT C.Ver, C.Op, C.Id,' + @cols + '
FROM C
LEFT JOIN ${table} AS T ON T.Id = C.Id
ORDER BY C.Ver ASC;


';

EXEC sp_executesql @sql;


`;
}

export async function yerelDegisiklikleriGonder(table, nodeName) {
  const pool = await havuzaBaglan();
  const last = await sonSenkSurumunuAl(table);
  const current = await gecerliCTSurumunuAl();

  const rs = await pool.request()
    .input('last', sql.BigInt, last)
    .query(degisiklikSorgusuOlustur(table));

  const rows = rs.recordset;
  if (rows.length === 0) {
    await sonSenkSurumunuGuncelle(table, current);
    return { sent: 0, last, current };
  }

  const payload = { sourceDb: nodeName, sourceVer: current, table, rows };
  await jsonGonder(`${CONFIG.remoteApiBase}/veri-al`, payload);
  await sonSenkSurumunuGuncelle(table, current);
  return { sent: rows.length, last, current };
}
