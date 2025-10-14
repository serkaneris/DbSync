import express from 'express';
import { PORT, CONFIG } from './core/config.js';
import { getConnectionPool } from './core/db/mssql.js';

import healthRoutes from './features/health/health.routes.js';
import syncRoutes from './features/sync/sync.routes.js';
import { prepareApplicationStartup } from './features/setup/setup.startup.js';
import { startPeriodicProducer } from './features/producer/producer.job.js';

export async function initializeApp() {
  
  await prepareApplicationStartup();
  console.log('✅ Uygulama başlangıç hazırlığı tamamlandı');

  await getConnectionPool();
   console.log('✅ DB bağlantısı hazır');

  const app = express();
  app.use(express.json({ limit: '5mb' }));

  app.use('/', healthRoutes);
  app.use('/', syncRoutes);

  app.listen(PORT, () => console.log(`✅ API listening on ${PORT}`));
  startPeriodicProducer(CONFIG.nodeName);
}
