import { enableDatabaseCT, enableTableCT, ensureSyncStateTable,ensureCleanQueue,ensureApplyLog } from './setup.service.js';

export async function prepareApplicationStartup() {
  await enableDatabaseCT();
  await enableTableCT();
  await ensureSyncStateTable();
  await ensureCleanQueue();
  await ensureApplyLog();
}
