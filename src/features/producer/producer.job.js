import { CONFIG } from '../../core/config.js';
import { yerelDegisiklikleriGonder } from './producer.service.js';

export function periyodikUreticiBaslat(nodeName) {
  const POLL_MS = CONFIG.pollMs || 10000;
  setInterval(async () => {
    for (const f of (CONFIG.flows || [])) {
      try {
        console.log('f', f);
        
        const r = await yerelDegisiklikleriGonder(f.table, nodeName);
        if (r.sent > 0) console.log(`[>] ${nodeName} pushed ${r.sent} rows from ${f.table} (${r.last}→${r.current})`);
        else console.log(`[=] ${nodeName} ${f.table}: no changes (${r.last}→${r.current})`);
      } catch (e) {
        console.error(`[err] ${f.table}`, e.message);
      }
    }
  }, POLL_MS);
}
