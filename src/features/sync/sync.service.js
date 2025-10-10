
import { getConnectionPool, sql } from '../../core/db/mssql.js';
import { mergeSorgusuOlustur } from './sync.helpers.js';
import { getTableSchema } from '../../core/db/schema.js';
import { bindParamsBySchema } from '../../core/db/paramBind.js';



/**
 * safeTable: validated table name ('dbo.Table')
 * rows: array of objects with at least { Ver, Op, Id, ... }
 * batchId: uniqueidentifier of current sync batch (can be null)
 * Atomic per request (transaction).
 * Idempotent: insert ApplyLog first; duplicate -> skip row.
 */
export async function applyChanges(safeTable, rows, batchId = null) {
  const pool = await getConnectionPool();
  const schema = await getTableSchema(pool, safeTable);

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

      // 1) Idempotency marker
      const ins = new sql.Request(tx);
      ins.input('TableName', sql.NVarChar(128), String(safeTable));
      ins.input('RowId', sql.UniqueIdentifier, Id);
      ins.input('ChangeVersion', sql.BigInt, Ver);
      ins.input('BatchId', sql.UniqueIdentifier, batchId);

      try {
        await ins.query(`
INSERT INTO dbo.ApplyLog(TableName, RowId, ChangeVersion, BatchId)
VALUES (@TableName, @RowId, @ChangeVersion, @BatchId);
`);
      } catch (e) {
        const code = e && e.number;
        if (code === 2627 || code === 2601) {
          // already applied previously
          continue;
        }
        throw e;
      }

      // 2) Apply mutation
      if (Op === 'D') {
        const delReq = new sql.Request(tx);
        delReq.input('Id', sql.UniqueIdentifier, Id);
        await delReq.query(`DELETE FROM ${safeTable} WHERE Id = @Id;`);
        applied++;
        continue;
      }

      const metaKeys = new Set(['Ver', 'Op']);
      const uniqKeys = Array.from(new Set(Object.keys(rawRow).filter(k => !metaKeys.has(k))));

      const reqMerge = new sql.Request(tx);
      bindParamsBySchema(reqMerge, sql, schema, rawRow, uniqKeys);
      //paramBagla(reqMerge, uniqKeys, rawRow, sql); // eski, tip güvenli değil - iptal edildi.

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

/**
 * Batch bazlı temizlik: belirli BatchId'ye ait ApplyLog kayıtlarını sil.
 */
export async function deleteApplyLogByBatchId(batchId) {
  const pool = await getConnectionPool();
 

  const start = Date.now();
  let totalDeleted = 0;

  // Her turda en fazla 20.000 kayıt sil (DB'ne göre 10k–100k arası deneyebilirsin)
  const BATCH_SIZE = 20000;
  // Tek fonksiyon çağrısında toplam 12 sn bütçe tut (15 sn sınırına güvenli mesafe)
  const TIME_BUDGET_MS = 12000;

  while (true) {
    const req = pool.request();
    req.timeout = 14000; // her round için 14 sn (15 sn altı)

    const r = await req
      .input('BatchId', sql.UniqueIdentifier, batchId)
      .query(`
        SET DEADLOCK_PRIORITY LOW;
        -- küçük kilitlerle ilerle
        DELETE TOP (${BATCH_SIZE})
        FROM dbo.ApplyLog WITH (ROWLOCK)
        WHERE BatchId = @BatchId;

        SELECT @@ROWCOUNT AS Deleted;
      `);

    const del = Number(r.recordset?.[0]?.Deleted || 0);
    totalDeleted += del;

    // Silinecek kalmadı → çık
    if (del === 0) break;

    // 12 sn’lik bütçeyi aştıysak çık (kalanını bir sonraki çağrıda temizleriz)
    if ((Date.now() - start) > TIME_BUDGET_MS) break;
  }

  return totalDeleted; // kaç kayıt silindiğini döndür
}