import { havuzaBaglan, sql } from '../../core/db/mssql.js';
import { mergeSorgusuOlustur, paramBagla } from './sync.helpers.js';

export async function veriUygula(safeTable, rows) {
  const pool = await havuzaBaglan();
  const tx = new sql.Transaction(pool);
  await tx.begin();
  try {
    let applied = 0;

    for (const rawRow of rows) {
      const Op = rawRow.Op;
      const Id = rawRow.Id;
      if (!Id) throw new Error('row without Id');

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
