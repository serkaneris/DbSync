import sql from 'mssql';
import { DB_CONN } from '../config.js';

let pool;
export async function getConnectionPool() {
  if (!pool) {
    pool = await new sql.ConnectionPool(DB_CONN).connect();
  }
  return pool;
}

export { sql };
