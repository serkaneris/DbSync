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

// 1) CleanQueue tablosu
export async function ensureCleanQueue() {
  const pool = await havuzaBaglan();
  await pool.request().query(`
IF NOT EXISTS (
  SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CleanQueue') AND type = 'U'
)
BEGIN
  CREATE TABLE dbo.CleanQueue(
    Id           int IDENTITY(1,1) PRIMARY KEY,
    BatchId      uniqueidentifier NOT NULL,
    Status       tinyint NOT NULL CONSTRAINT DF_CleanQueue_Status DEFAULT(0), -- 0=pending,1=running,2=done,3=error
    Attempts     int NOT NULL CONSTRAINT DF_CleanQueue_Attempts DEFAULT(0),
    RequestedAt  datetime2(3) NOT NULL CONSTRAINT DF_CleanQueue_RequestedAt DEFAULT(sysdatetime()),
    StartedAt    datetime2(3) NULL,
    FinishedAt   datetime2(3) NULL
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CleanQueue_Status' AND object_id = OBJECT_ID('dbo.CleanQueue'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_CleanQueue_Status ON dbo.CleanQueue(Status, Id);
END;
  `);
}


/**
 * Ensure ApplyLog exists and has BatchId column for per-batch cleanup.
 */
export async function ensureApplyLog() {
  const pool = await havuzaBaglan();
  const ddlTable = `
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApplyLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[ApplyLog](
    [TableName] sysname NOT NULL,
    [RowId] uniqueidentifier NOT NULL,
    [ChangeVersion] bigint NOT NULL,
    [BatchId] uniqueidentifier NULL,
    [AppliedAt] datetime2(3) NOT NULL CONSTRAINT DF_ApplyLog_AppliedAt DEFAULT (sysdatetime()),
    CONSTRAINT PK_ApplyLog PRIMARY KEY CLUSTERED (TableName, RowId, ChangeVersion)
  );
END;`;

  const ddlColumn = `
IF COL_LENGTH('dbo.ApplyLog', 'BatchId') IS NULL
BEGIN
  ALTER TABLE dbo.ApplyLog ADD BatchId uniqueidentifier NULL;
END
`;

  const ddlIndex = `
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ApplyLog_BatchId' AND object_id = OBJECT_ID('dbo.ApplyLog'))
BEGIN
  CREATE INDEX IX_ApplyLog_BatchId ON dbo.ApplyLog(BatchId);
END
`;

  await pool.request().query(ddlTable);
  await pool.request().query(ddlColumn);
  await pool.request().query(ddlIndex);
}

