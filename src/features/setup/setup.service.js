import { getConnectionPool, sql } from '../../core/db/mssql.js';
import { CONFIG } from '../../core/config.js';




export async function enableDatabaseCT() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await getConnectionPool();

  const retentionDays = Number(CONFIG.enableChangeTracking.retentionDays || 7);
  const exists = await pool.request().query(`
    SELECT 1 AS x FROM sys.change_tracking_databases WHERE database_id = DB_ID();
  `);
  if (exists.recordset.length === 0) {
    await pool.request().query(`
      ALTER DATABASE CURRENT SET CHANGE_TRACKING = ON
      (CHANGE_RETENTION = ${retentionDays} DAYS, AUTO_CLEANUP = ON);
    `);
  }
}

export async function enableTableCT() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await getConnectionPool();
  const trackCols = CONFIG.enableChangeTracking.trackColumnsUpdated !== false;
  const tables = CONFIG.enableChangeTracking.tables || [];

  for (const t of tables) {
    const rs = await pool.request().input('t', sql.NVarChar, t).query(`SELECT OBJECT_ID(@t) AS oid;`);
    const oid = rs.recordset[0]?.oid;
    if (!oid) { console.warn(`[warn] Table not found: ${t}`); continue; }

    const rs2 = await pool.request().input('oid', sql.Int, oid).query(`
      SELECT 1 AS x FROM sys.change_tracking_tables WHERE object_id=@oid;
    `);
    if (rs2.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE ${t} ENABLE CHANGE_TRACKING WITH (TRACK_COLUMNS_UPDATED = ${trackCols ? 'ON' : 'OFF'});
        Update ${t} set Status=0 where Status=0
        Update ${t} set Status=1 where Status=1
      `);
    }
  }
}



