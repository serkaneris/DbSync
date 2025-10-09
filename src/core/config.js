// src/core/config.js
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

let __CONFIG_CACHE = null;
let __ENV_LOADED = false;

function ensureFileExists(p, varNameForMsg) {
  const abs = path.isAbsolute(p) ? p : path.resolve(process.cwd(), p);
  if (!fs.existsSync(abs)) {
    throw new Error(`[config] ${varNameForMsg} dosyası bulunamadı: ${abs}`);
  }
  return abs;
}

function requireVar(name, val) {
  if (val == null || String(val).trim() === '') {
    throw new Error(`[config] Zorunlu değişken eksik: ${name}`);
  }
  return val;
}

function resolveEnvPath() {
  const p = process.env.ENV_PATH;
  return requireVar('ENV_PATH', p);
}

function resolveConfigPath() {
  const p = process.env.CONFIG_PATH;
  return requireVar('CONFIG_PATH', p);
}

function loadDotenvOnce() {
  if (__ENV_LOADED) return;
  const envPath = ensureFileExists(resolveEnvPath(), 'ENV_PATH');
  dotenv.config({ path: envPath });
  __ENV_LOADED = true;
}

function readJsonStrict(filePath) {
  const abs = ensureFileExists(filePath, 'CONFIG_PATH');
  let raw;
  try {
    raw = fs.readFileSync(abs, 'utf8');
  } catch (e) {
    throw new Error(`[config] Okunamadı: ${abs}\n${e.message}`);
  }
  try {
    const obj = JSON.parse(raw);
    Object.defineProperty(obj, '__source', { value: abs, enumerable: false });
    return obj;
  } catch (e) {
    throw new Error(`[config] Geçersiz JSON: ${abs}\n${e.message}`);
  }
}

export function getConfig() {
  if (!__CONFIG_CACHE) {
    loadDotenvOnce();
    const configPath = resolveConfigPath();
    __CONFIG_CACHE = Object.freeze(readJsonStrict(configPath));
  }
  return __CONFIG_CACHE;
}

export function reloadConfig() {
  __CONFIG_CACHE = null;
  __ENV_LOADED = false; // .env yeniden yüklenebilir
  return getConfig();
}

// Geriye dönük uyum alanı
export const CONFIG = getConfig();
console.log(CONFIG)
// PORT öncelik: CONFIG.port → process.env.PORT → 3000
// (CONFIG.port sayısal değilse Number(...) NaN olabilir; bu yüzden fallback sırası korunuyor)
const cfgPort = Number(CONFIG.port);
export const PORT = Number.isFinite(cfgPort)
  ? cfgPort
  : Number(process.env.PORT ?? 3000);

// DB bağlantısı ve shared secret'ı zorunlu kıl
// Tercih: ENV öncelikli; istersen CONFIG içine de koyabilirsin (ör: CONFIG.db.conn)
export const DB_CONN =
  (() => {
    const conn =
      process.env.DB_CONN
      ?? CONFIG?.db?.conn
      ?? (() => { throw new Error('[config] DB_CONN bulunamadı (ENV veya CONFIG.db.conn).'); })();

    // Eğer bağlantı bir nesneyse, timeout ekle
    if (typeof conn === 'object') {
      return {
        ...conn,
        requestTimeout: conn.requestTimeout || 120000,   // 120 saniye
        connectionTimeout: conn.connectionTimeout || 30000,
      };
    }

    // Eğer bağlantı string ise, değiştirmeden döndür
    return conn;
  })();

export const SHARED_SECRET =
  process.env.SHARED_SECRET
  ?? CONFIG?.security?.sharedSecret
  ?? (() => { throw new Error('[config] SHARED_SECRET bulunamadı (ENV veya CONFIG.security.sharedSecret).'); })();

// Küçük yardımcı
export function cfg(key, defVal = undefined) {
  const c = getConfig();
  return key in c ? c[key] : defVal;
}
