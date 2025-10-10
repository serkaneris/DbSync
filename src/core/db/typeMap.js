// src/core/db/typeMap.js
//SQL Server tipini mssql tipine çevirir (uzunluk/precision dahil).
export function mapSqlType(sql, col) {
  switch (col.type) {
    case 'bit': return sql.Bit;

    case 'tinyint': return sql.TinyInt;
    case 'smallint': return sql.SmallInt;
    case 'int': return sql.Int;
    case 'bigint': return sql.BigInt;

    case 'decimal':
    case 'numeric': return sql.Decimal(col.precision || 38, col.scale ?? 0);
    case 'float': return sql.Float;
    case 'real':  return sql.Real;

    case 'money': return sql.Money;
    case 'smallmoney': return sql.SmallMoney;

    case 'date': return sql.Date;
    case 'datetime': return sql.DateTime;
    case 'smalldatetime': return sql.SmallDateTime;
    case 'datetime2': return sql.DateTime2;
    case 'datetimeoffset': return sql.DateTimeOffset;
    case 'time': return sql.Time;

    case 'uniqueidentifier': return sql.UniqueIdentifier;

    case 'varbinary':
    case 'image':
      return col.maxLength === -1 ? sql.VarBinary(sql.MAX) : sql.VarBinary(Math.max(1, col.maxLength));

    case 'varchar':
    case 'char':
    case 'text':
      return col.maxLength === -1 ? sql.VarChar(sql.MAX) : sql.VarChar(Math.max(1, col.maxLength));

    case 'nchar':
    case 'nvarchar':
    case 'ntext':
      if (col.maxLength === -1) return sql.NVarChar(sql.MAX);
      return sql.NVarChar(Math.max(1, Math.floor(col.maxLength / 2))); // NVARCHAR byte→char

    default:
      return sql.NVarChar(sql.MAX);
  }
}
