import sql from 'mssql';
import { DB_CONN } from '../config.js';

let pool;
export async function havuzaBaglan() {
  if (!pool) {
    pool = await new sql.ConnectionPool(DB_CONN).connect();
  }
  return pool;
}
export function yeniIstek(txOrPool = null) {
  return new (txOrPool ? sql.Request : sql.Request)(txOrPool || pool);
}
export { sql };
