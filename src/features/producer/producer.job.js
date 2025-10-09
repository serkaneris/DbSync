import { CONFIG } from '../../core/config.js';
import { pushLocalChanges } from './producer.service.js';

export function startPeriodicProducer(nodeName) {
  const POLL_MS = CONFIG.pollMs || 10000;
  setInterval(async () => {
    for (const f of (CONFIG.flows || [])) {
      try {
        console.log('🔍', f.table);
        
        const r = await pushLocalChanges(f.table, nodeName);
        if (r.sent > 0) console.log(`🔄 ${nodeName} pushed ${r.sent} rows from ${f.table} (${r.last}→${r.current})`);
        else console.log(`✅ ${nodeName} ${f.table}: no changes (${r.last}→${r.current})`);
      } catch (e) {
        console.error(`[err] ${f.table}`, e.message);
      }
    }
  }, POLL_MS);
}
