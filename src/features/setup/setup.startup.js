import { enableDatabaseCT, enableTableCT, ensureSyncStateTable,ensureCleanQueue,ensureApplyLog, ensureUsers } from './setup.service.js';

export async function prepareApplicationStartup() {
  await ensureUsers();
  await enableDatabaseCT();
  await enableTableCT();
  await ensureSyncStateTable();
  await ensureCleanQueue();
  await ensureApplyLog();
}
