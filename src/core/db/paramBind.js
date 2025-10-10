//Bir satırdaki alanları şemaya göre doğru tiple bağlar.

import { mapSqlType } from './typeMap.js';

function toBufferSmart(v) {
  if (Buffer.isBuffer(v)) return v;
  if (v && typeof v === 'object' && v.type === 'Buffer' && Array.isArray(v.data)) {
    return Buffer.from(v.data); // JSON.stringify(Buffer) default formatı
  }
  if (typeof v === 'string') {
    // basit hex/base64 heuristics
    if (/^([A-Fa-f0-9]{2})+$/.test(v)) return Buffer.from(v, 'hex');
    try { return Buffer.from(v, 'base64'); } catch { /* fallthrough */ }
  }
  return Buffer.from(v); // en son çare
}

/** fields: bağlanacak kolon listesi (genelde Object.keys(row)) */
export function bindParamsBySchema(req, sql, schemaMap, row, fields) {
  for (const k of fields) {
    const col = schemaMap.get(k);
    const v = row[k];

    if (!col) { // şemada yoksa güvenli varsayılan
      req.input(k, sql.NVarChar(sql.MAX), v == null ? null : String(v));
      continue;
    }

    if (v == null) {
      req.input(k, mapSqlType(sql, col), null);
      continue;
    }

    switch (col.type) {
      case 'bit':
        req.input(k, sql.Bit, Boolean(v));
        break;

      case 'tinyint':
      case 'smallint':
      case 'int':
        req.input(k, mapSqlType(sql, col), Number(v));
        break;

      case 'bigint':
        // JS büyük sayılarda güvenli değil → string ver
        req.input(k, sql.BigInt, typeof v === 'bigint' ? v.toString() : String(v));
        break;

      case 'decimal':
      case 'numeric':
        req.input(k, mapSqlType(sql, col), Number(v));
        break;

      case 'uniqueidentifier':
        req.input(k, sql.UniqueIdentifier, String(v));
        break;

      case 'date':
      case 'datetime':
      case 'smalldatetime':
      case 'datetime2':
      case 'datetimeoffset':
      case 'time':
        req.input(k, mapSqlType(sql, col), (v instanceof Date) ? v : new Date(v));
        break;

      case 'varbinary':
      case 'image':
        req.input(k, mapSqlType(sql, col), toBufferSmart(v));
        break;

      case 'varchar':
      case 'char':
      case 'text':
      case 'nchar':
      case 'nvarchar':
      case 'ntext':
        req.input(k, mapSqlType(sql, col), String(v));
        break;

      default:
        req.input(k, sql.NVarChar(sql.MAX), String(v));
    }
  }
}