import { veriUygula } from './sync.service.js';
import { CONFIG } from '../../core/config.js';
import {SHARED_SECRET} from "../../core/config.js";

export async function veriAl(req, res) {
  try {
    const auth = (req.headers['x-auth'] || '');
    if (!auth || auth !== (SHARED_SECRET || '')) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    if (CONFIG.apply === false) {
      return res.json({ ok: true, note: 'apply disabled' });
    }

    const { table, rows } = req.body || {};
    if (!table || !Array.isArray(rows)) {
      return res.status(400).json({ ok: false, error: 'invalid payload' });
    }

    
    const allowed = new Set((CONFIG.flows || []).map(f => f.table));
   

    const applied = await veriUygula(table, rows);
    res.json({ ok: true, applied });
  } catch (e) {
    console.error('[err] /veri-al', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}

