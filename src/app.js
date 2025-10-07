import express from 'express';
import { PORT, CONFIG } from './core/config.js';
import { havuzaBaglan } from './core/db/mssql.js';

import healthRoutes from './features/health/health.routes.js';
import syncRoutes from './features/sync/sync.routes.js';
import { uygulamaAcilisHazirliklari } from './features/setup/setup.startup.js';
import { periyodikUreticiBaslat } from './features/producer/producer.job.js';

export async function uygulamayiBaslat() {
  await havuzaBaglan();
  console.log('[ok] DB bağlantısı hazır');

  await uygulamaAcilisHazirliklari();

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.use('/', healthRoutes);
  app.use('/', syncRoutes);

  app.listen(PORT, () => console.log(`[ok] API listening on ${PORT}`));
  periyodikUreticiBaslat(CONFIG.nodeName);
}
