
import axios from 'axios';
import { SHARED_SECRET } from '../config.js';
import { gzipSync } from 'zlib';

/**
 * Ortak axios istemcisi
 */
export const http = axios.create({
  headers: { 'content-type': 'application/json' },
  timeout: 30000, // varsayılanı biraz yükselttik
  maxBodyLength: Infinity,
  maxContentLength: Infinity,
});

/**
 * Gzip'li JSON POST.
 * - İstek gövdesini manuel olarak gzip'ler ve uygun başlıklarla gönderir.
 * - Yanıt JSON ise parse edilir; değilse raw text dönebilir.
 */
export async function postJsonGzip(url, bodyObj, { timeoutMs = 30000, auth = SHARED_SECRET } = {}) {
  const json = JSON.stringify(bodyObj);
  const gz = gzipSync(json);

  try {
    const res = await http.post(url, gz, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Encoding': 'gzip',
        'Accept-Encoding': 'gzip',
        'x-auth': auth || ''
      },
      timeout: timeoutMs,
      responseType: 'json',
      // Buffer'ı aynen gönderelim (axios'un transformRequest'i JSON.stringify yapmasın)
      transformRequest: [(data) => data],
      maxBodyLength: Infinity,
      maxContentLength: Infinity,
      validateStatus: () => true, // 4xx/5xx'yi biz ele alalım
    });

    const isText = typeof res.data === 'string';
    const text = isText ? res.data : null;
    const ok = res.status >= 200 && res.status < 300;

    if (!ok) {
      const msg = text ?? JSON.stringify(res.data ?? '');
      const err = new Error(`POST ${url} failed (${res.status}): ${String(msg).slice(0, 500)}`);
      // @ts-ignore
      err.status = res.status;
      // @ts-ignore
      err.body = msg;
      throw err;
    }

    return res.data ?? {};
  } catch (err) {
    if (err.response) {
      const e = new Error(`POST ${url} failed (${err.response.status}): ${JSON.stringify(err.response.data)}`);
      // @ts-ignore
      e.status = err.response.status;
      throw e;
    }
    if (err.request)  {
      const e = new Error(`POST ${url} no response: ${err.message}`);
      // @ts-ignore
      e.status = 0;
      throw e;
    }
    throw err;
  }
}

/**
 * Basit JSON POST (geri uyumluluk)
 * - Gzip kullanmaz; küçük yükler için uygundur.
 */
export async function jsonGonder(url, body) {
  try {
    const res = await http.post(url, body, { headers: { 'x-auth': SHARED_SECRET || '' } });
    return res.data;
  } catch (err) {
    if (err.response) throw new Error(`POST ${url} failed (${err.response.status}): ${JSON.stringify(err.response.data)}`);
    if (err.request)  throw new Error(`POST ${url} no response: ${err.message}`);
    throw new Error(`POST ${url} error: ${err.message}`);
  }
}

/**
 * Exponential backoff ile tekrar dene.
 */
export async function retryWithBackoff(fn, {
  retries = 4,
  baseMs = 1000,
  maxMs = 8000,
  onRetry = () => {}
} = {}) {
  let attempt = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      attempt++;
      if (attempt > retries) throw e;
      const wait = Math.min(maxMs, baseMs * Math.pow(2, attempt - 1));
      await onRetry(e, attempt, wait);
      await new Promise(r => setTimeout(r, wait));
    }
  }
}

/**
 * Tek bir 'parça'yı (part) gönderir.
 * - Parça büyükse ve 413 alırsak otomatik olarak segmentlere böler ve yeniden dener.
 * - Her segment bağımsız bir transaction varsayımıyla sunucuya iletilir.
 */
export async function sendPartAdaptive({ url, baseMeta, rows, partIndex, partCount }) {
  // Başlangıçta tek segment
  let queue = [{ rows, segmentIndex: 1, segmentCount: 1 }];
  let sent = 0;

  while (queue.length) {
    const seg = queue.shift();
    if (!seg || !seg.rows || seg.rows.length === 0) continue;

    const payload = {
      ...baseMeta,
      partIndex,
      partCount,
      segmentIndex: seg.segmentIndex,
      segmentCount: seg.segmentCount,
      rows: seg.rows
    };

    try {
      const res = await retryWithBackoff(() => postJsonGzip(url, payload), {
        onRetry: (err, attempt, wait) => {
          console.warn(`[batch:${baseMeta.batchId}] part#${partIndex}/${partCount} seg#${seg.segmentIndex}/${seg.segmentCount} hata: ${err?.status || ''} ${err?.message || err}. ${attempt}. deneme ${wait}ms sonra`);
        }
      });

      if (res?.ok === false) {
        throw new Error(`Server NACK for part ${partIndex} / seg ${seg.segmentIndex}: ${JSON.stringify(res).slice(0,500)}`);
      }

      sent += seg.rows.length;
    } catch (e) {
      // 413: yük büyük → segmenti ikiye bölüp yeniden sıraya koy
      if (e && e.status === 413 && seg.rows.length > 1) {
        const mid = Math.floor(seg.rows.length / 2);
        const left = seg.rows.slice(0, mid);
        const right = seg.rows.slice(mid);
        const newCount = seg.segmentCount * 2;

        queue.unshift(
          { rows: right, segmentIndex: seg.segmentIndex * 2,     segmentCount: newCount },
          { rows: left,  segmentIndex: seg.segmentIndex * 2 - 1, segmentCount: newCount }
        );
        continue;
      }
      // başka hata → retryWithBackoff limitini aşmıştır; dışarı fırlat
      throw e;
    }
  }
  return sent;
}

/**
 * Birden çok parçayı sırayla gönderir.
 * - Tüm parçalar başarıyla bitmeden dışarıdaki ilerlemeyi güncellemeyin.
 */
export async function sendBatchParts({ url, baseMeta, parts }) {
  let totalSent = 0;
  const partCount = parts.length;
  for (let i = 0; i < parts.length; i++) {
    const partRows = parts[i];
    const partIndex = i + 1;
    totalSent += await sendPartAdaptive({
      url,
      baseMeta,
      rows: partRows,
      partIndex,
      partCount
    });
  }
  return { totalSent, partCount };
}
