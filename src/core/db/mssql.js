import sql from 'mssql';
import { DB_CONN } from '../config.js';

let poolDefault;
let poolMaster;

/**
 * 
 * mertin eklediği method aşağıda
 */
// export async function getConnectionPool() {


//   const match = /Database=([^;]+)/i.exec(DB_CONN);
//   const dbName = match ? match[1] : null;

//   if (!dbName) {
//     throw new Error("Connection string içinde 'Database=' kısmı bulunamadı.");
//   }
//   try {
//     // Önce master’a bağlan
//     const masterConn = DB_CONN.replace(/Database=[^;]+/i, "Database=master");
//     const masterPool = await new sql.ConnectionPool(masterConn).connect();

//     // Database var mı kontrol et, yoksa oluştur
//     const checkQuery = `
//       IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'${dbName}')
//       BEGIN
//           PRINT 'Database ${dbName} oluşturuluyor...';
//           CREATE DATABASE [${dbName}];
//       END
//     `;
//     await masterPool.request().query(checkQuery);
//     console.log(`Database '${dbName}' kontrol edildi / oluşturuldu.`);

//     // Artık asıl veritabanına bağlan
//     const pool = await new sql.ConnectionPool(DB_CONN).connect();
//     console.log(`Bağlantı başarılı: ${pool.config.database}`);

//     if (!pool) {
//       pool = await new sql.ConnectionPool(DB_CONN).connect();
//     }
//     console.log(DB_CONN, pool)
//     return pool;

//     // Burada pool üzerinden sorgu çalıştırabilirsin
//     // örn: const result = await pool.request().query("SELECT GETDATE() as now");

//   } catch (err) {
//     console.error("Bağlantı hatası:", err);
//   } finally {
//     sql.close();
//   }
// }

// export async function getConnectionMasterPool() {
//   if (!masterPool) {
//     masterPool = await new sql.ConnectionPool(MASTER_DB_CONN).connect();
//   }
//   console.log(MASTER_DB_CONN,masterPool)
//   return masterPool;
// }


function toMasterConnStr(connStr) {
  if (/(?:^|;)\s*Database\s*=/i.test(connStr)) {
    return connStr.replace(/(?:^|;)\s*Database\s*=\s*[^;]+/i, ';Database=master');
  }
  if (/(?:^|;)\s*Initial\s+Catalog\s*=/i.test(connStr)) {
    return connStr.replace(/(?:^|;)\s*Initial\s+Catalog\s*=\s*[^;]+/i, ';Initial Catalog=master');
  }
  // Hiçbiri yoksa master ekle
  return connStr.endsWith(';') ? connStr + 'Database=master' : connStr + ';Database=master';
}

export async function getConnectionPool(useMaster = false) {
  if (useMaster) {
    if (poolMaster && poolMaster.connected) return poolMaster;
    const masterConn = toMasterConnStr(DB_CONN);
    console.log('Using master connection string:', masterConn);
    poolMaster = new sql.ConnectionPool(masterConn);
    await poolMaster.connect();
    return poolMaster;
  } else {
    if (poolDefault && poolDefault.connected) return poolDefault;
    poolDefault = new sql.ConnectionPool(DB_CONN);
    console.log('Using default connection string:', DB_CONN);
    await poolDefault.connect();
    return poolDefault;
  }
}


export { sql };
