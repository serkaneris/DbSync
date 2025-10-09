import { havuzaBaglan, sql } from '../../core/db/mssql.js';
import { CONFIG } from '../../core/config.js';

export async function veritabaniCTEtkinlestir() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await havuzaBaglan();

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

export async function tabloCTEtkinlestir() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await havuzaBaglan();
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

export async function syncStateTablosunuBaslat() {
  const pool = await havuzaBaglan();

  const exists = await pool.request().query(`
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.SyncState') AND type='U';
  `);
  if (exists.recordset.length === 0) {
    await pool.request().query(`
      CREATE TABLE dbo.SyncState (TableName sysname PRIMARY KEY, LastSyncVersion bigint NOT NULL);
    `);
  }

  const setTables = new Set();
  (CONFIG.enableChangeTracking?.tables || []).forEach(t => setTables.add(t));
  (CONFIG.flows || []).forEach(f => setTables.add(f.table));

  for (const t of setTables) {
    const r = await pool.request().input('t', sql.NVarChar, t)
      .query(`SELECT 1 FROM dbo.SyncState WHERE TableName=@t;`);
    if (r.recordset.length === 0) {
      await pool.request().input('t', sql.NVarChar, t)
        .query(`INSERT INTO dbo.SyncState(TableName, LastSyncVersion) VALUES(@t, 0);`);
    }
  }
}
