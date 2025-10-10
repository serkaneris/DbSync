// src/core/db/schema.js
//Tablo şemasını (kolon ad–tip–uzunluk) 1 kez okuyup cache’ler.
import { sql } from './mssql.js';

const __schemaCache = new Map();

/** fullName: 'dbo.Tablo' veya 'Tablo'  */
export async function getTableSchema(pool, fullName) {
  if (__schemaCache.has(fullName)) return __schemaCache.get(fullName);

  const [schema, table] = fullName.includes('.') ? fullName.split('.') : ['dbo', fullName];

  const q = `
    SELECT
      c.name         AS column_name,
      t.name         AS type_name,
      c.max_length,  -- NVARCHAR: byte (n = max_length/2), MAX = -1
      c.precision,
      c.scale,
      c.is_nullable
    FROM sys.columns c
    JOIN sys.types   t ON t.user_type_id = c.user_type_id
    JOIN sys.objects o ON o.object_id     = c.object_id
    JOIN sys.schemas s ON s.schema_id     = o.schema_id
    WHERE o.type = 'U' AND s.name = @schema AND o.name = @table
    ORDER BY c.column_id;
  `;

  const rs = await pool.request()
    .input('schema', sql.NVarChar(128), schema)
    .input('table',  sql.NVarChar(128), table)
    .query(q);

  const map = new Map();
  for (const r of rs.recordset) {
    map.set(r.column_name, {
      type: r.type_name.toLowerCase(), // nvarchar, varbinary, datetime2, int, decimal, uniqueidentifier...
      maxLength: r.max_length,
      precision: r.precision,
      scale: r.scale,
      isNullable: !!r.is_nullable,
    });
  }
  __schemaCache.set(fullName, map);
  return map;
}
