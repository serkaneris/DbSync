
import { veriUygula, temizleApplyLogByBatch } from './sync.service.js';
import { CONFIG, SHARED_SECRET } from '../../core/config.js';

/**
 * Basit tablo adı doğrulama: allowed list (CONFIG.flows[].table)
 */
function validateTable(table) {
  const allowed = new Set((CONFIG.flows || []).map(f => f.table));
  if (!table || !allowed.has(table)) return false;
  return /^[A-Za-z0-9_]+\.[A-Za-z0-9_]+$/.test(table);
}

export async function veriAl(req, res) {
  try {
    const auth = (req.headers['x-auth'] || '');
    if (!auth || auth !== (SHARED_SECRET || '')) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }
    if (CONFIG.apply === false) {
      return res.json({ ok: true, note: 'apply disabled' });
    }

    const {
      batchId,
      sourceDb,
      fromVersion,
      toVersion,
      partIndex,
      partCount,
      segmentIndex,
      segmentCount,
      table,
      rows
    } = req.body || {};

    if (!table || !Array.isArray(rows)) {
      return res.status(400).json({ ok: false, error: 'invalid payload' });
    }
    // if (!validateTable(table)) {
    //   return res.status(400).json({ ok: false, error: 'table not allowed' });
    // }

    // Yüksek versiyon ölçümü
    let highestAppliedVersion = 0;
    for (const r of rows) {
      const v = Number(r?.Ver || 0);
      if (v > highestAppliedVersion) highestAppliedVersion = v;
    }
    if (!highestAppliedVersion && toVersion) highestAppliedVersion = Number(toVersion) || 0;

    // Uygula (idempotent + transaction)
    const applied = await veriUygula(table, rows, batchId || null);

    // ACK
    res.json({
      ok: true,
      applied,
      received: {
        batchId: batchId || null,
        partIndex: partIndex ?? null,
        partCount: partCount ?? null,
        segmentIndex: segmentIndex ?? null,
        segmentCount: segmentCount ?? null,
        table
      },
      highestAppliedVersion
    });
  } catch (e) {
    console.error('[err] /veri-al', e);
    const status = e?.statusCode || 500;
    res.status(status).json({ ok: false, error: e.message });
  }
}

/**
 * İstemci, tüm parçaları bitirdikten sonra çağırır.
 * Bu uç; verilen BatchId'ye ait ApplyLog kayıtlarını siler.
 * Güvenli kullanım sırası:
 * 1) Üretici tüm part/segment OK oldu →
 * 2) Üretici /applyLogClean (batchId) çağırır →
 * 3) Üretici LastSyncVersion'ı ilerletir.
 */
export async function applyLogClean(req, res) {

  req.setTimeout(120000); // 2 dakika
  try {
    const auth = (req.headers['x-auth'] || '');
    if (!auth || auth !== (SHARED_SECRET || '')) {
      return res.status(401).json({ ok: false, error: 'unauthorized' });
    }

    const { batchId } = req.body || {};
    if (!batchId) return res.status(400).json({ ok: false, error: 'batchId required' });

    const deleted = await temizleApplyLogByBatch(batchId);

    res.json({ ok: true, deleted, batchId });
  } catch (e) {
    console.error('[err] /applyLogClean', e);
    res.status(500).json({ ok: false, error: e.message });
  }
}
