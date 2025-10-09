
import { havuzaBaglan, sql } from '../../core/db/mssql.js';
import { mergeSorgusuOlustur, paramBagla } from './sync.helpers.js';

/**
 * ApplyLog: idempotency log (TableName, RowId, ChangeVersion) UNIQUE
 */
async function ensureApplyLog(pool) {
  const ddl = `
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApplyLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[ApplyLog](
    [TableName] sysname NOT NULL,
    [RowId] uniqueidentifier NOT NULL,
    [ChangeVersion] bigint NOT NULL,
    [AppliedAt] datetime2(3) NOT NULL CONSTRAINT DF_ApplyLog_AppliedAt DEFAULT (sysdatetime()),
    CONSTRAINT PK_ApplyLog PRIMARY KEY CLUSTERED (TableName, RowId, ChangeVersion)
  );
END;`;
  await pool.request().query(ddl);
}

/**
 * safeTable already validated against CONFIG.flows (controller side).
 * rows: array of objects with at least { Ver, Op, Id, ... }
 * Atomic per call (transaction per part/segment).
 * Idempotent: insert into ApplyLog first; on duplicate (2627/2601) skip row.
 */
export async function veriUygula(safeTable, rows) {
  const pool = await havuzaBaglan();
  await ensureApplyLog(pool);

  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    let applied = 0;

    for (const rawRow of rows) {
      const Ver = rawRow.Ver ?? null;
      const Op = rawRow.Op;
      const Id = rawRow.Id;
      if (!Id) throw new Error('row without Id');
      if (Ver == null) throw new Error('row without Ver');

      // 1) Idempotency: try to mark as applied
      const ins = new sql.Request(tx);
      ins.input('TableName', sql.NVarChar(128), String(safeTable));
      ins.input('RowId', sql.UniqueIdentifier, Id);
      ins.input('ChangeVersion', sql.BigInt, Ver);

      try {
        await ins.query(`
INSERT INTO dbo.ApplyLog(TableName, RowId, ChangeVersion) VALUES (@TableName, @RowId, @ChangeVersion);
`);
      } catch (e) {
        // 2627 (PK violation) or 2601 (unique index) => already applied
        const code = e && e.number;
        if (code === 2627 || code === 2601) {
          // SKIP this row: it's already applied in a prior attempt/segment
          continue;
        }
        throw e;
      }

      // 2) Apply data mutation
      if (Op === 'D') {
        const delReq = new sql.Request(tx);
        delReq.input('Id', sql.UniqueIdentifier, Id);
        await delReq.query(`DELETE FROM ${safeTable} WHERE Id = @Id;`);
        applied++;
        continue;
      }

      const metaKeys = new Set(['Ver','Op']);
      const uniqKeys = Array.from(new Set(Object.keys(rawRow).filter(k => !metaKeys.has(k))));

      const reqMerge = new sql.Request(tx);
      paramBagla(reqMerge, uniqKeys, rawRow, sql);

      const { cols, srcCols, setCols, valuesCols } = mergeSorgusuOlustur(uniqKeys);
      const mergeSql = `
MERGE ${safeTable} AS t
USING (SELECT ${srcCols}) AS s
ON (t.[Id] = s.[Id])
WHEN MATCHED THEN
  UPDATE SET ${setCols}
WHEN NOT MATCHED THEN
  INSERT (${cols})
  VALUES (${valuesCols});
`;
      await reqMerge.query(mergeSql);
      applied++;
    }

    await tx.commit();
    return applied;
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}
