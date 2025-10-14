import { enableDatabaseCT, enableTableCT} from './setup.service.js';
import { ensureSyncStateTable,ensureCleanQueue,ensureApplyLog,
  ensureDocuments, ensureDocumentDetails, ensureBusinesses, ensureCalculateCostOperations, 
  ensureExpenseDiscountDetails, ensureInventories,ensureDocumentDetailCosts, ensureInventoryRemainders, ensureOperationClaims, 
  ensureProductionInOuts, ensureProducts, ensureUnitCostByDates, ensureUsers, 
  ensureUserOperationClaims, ensureUserTableLocks} from './ensureTables.js';

  export async function prepareApplicationStartup() {
  // 1️⃣ Ana tablo kontrolleri
  await ensureDocuments();
  console.log('[DDL] creating table Documents'); 
  await ensureDocumentDetails();
  console.log('[DDL] creating table DocumentDetails'); 
  await ensureDocumentDetailCosts();
  console.log('[DDL] creating table DocumentDetailCosts'); 
  await ensureBusinesses();
  console.log('[DDL] creating table Businesses'); 
  await ensureCalculateCostOperations();
  console.log('[DDL] creating table CalculateCostOperations'); 
  await ensureExpenseDiscountDetails();
  console.log('[DDL] creating table ExpenseDiscountDetails'); 
  await ensureInventories();
  console.log('[DDL] creating table Inventories'); 
  await ensureInventoryRemainders();
  console.log('[DDL] creating table InventoryRemainders');
  await ensureOperationClaims();
  console.log('[DDL] creating table OperationClaims');
  await ensureProductionInOuts();
  console.log('[DDL] creating table ProductionInOuts');
  await ensureProducts();
  console.log('[DDL] creating table Products');
  await ensureUnitCostByDates();
  console.log('[DDL] creating table UnitCostByDates');
  await ensureUsers();
  console.log('[DDL] creating table Users');
  await ensureUserOperationClaims();
  console.log('[DDL] creating table UserOperationClaims');
  await ensureUserTableLocks();
  console.log('[DDL] creating table UserTableLocks');

  // 2️⃣ Change Tracking yapılandırması
  await enableDatabaseCT();
  await enableTableCT();
  
  // 3️⃣ Senkronizasyon altyapısı
  await ensureSyncStateTable();
  await ensureCleanQueue();
  await ensureApplyLog();
}
