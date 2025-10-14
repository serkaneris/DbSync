import { getConnectionPool, sql } from '../../core/db/mssql.js';
import { CONFIG } from '../../core/config.js';


/**
 * Gerekli tabloların oluşturulması
 */
export async function ensureDocuments() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.Documents') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[Documents](
        [Id] [uniqueidentifier] NOT NULL,
        [DocumentTypeId] [uniqueidentifier] NOT NULL,
         NULL,
         NULL,
        [CustomerId] [uniqueidentifier] NOT NULL,
        [CustomerAddressId] [uniqueidentifier] NULL,
         NULL,
        [BranchId] [uniqueidentifier] NOT NULL,
        [CashierId] [uniqueidentifier] NOT NULL,
        [DocumentKindId] [uniqueidentifier] NOT NULL,
        [WarehouseId] [uniqueidentifier] NOT NULL,
        [UserId] [uniqueidentifier] NOT NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [SubDiscount1] [decimal](18, 6) NOT NULL,
        [SubDiscount2] [decimal](18, 6) NOT NULL,
        [SubDiscount3] [decimal](18, 6) NOT NULL,
        [SubDiscount4] [decimal](18, 6) NOT NULL,
        [SubTotal] [decimal](28, 6) NOT NULL,
        [RowDiscountTotal] [decimal](28, 6) NOT NULL,
        [SubDiscountTotal] [decimal](28, 6) NOT NULL,
        [DiscountTotal] [decimal](28, 6) NOT NULL,
        [MidTotal] [decimal](28, 6) NOT NULL,
        [SpecialCommunicationTaxTotal] [decimal](28, 6) NOT NULL,
        [ExciseTaxTotal] [decimal](28, 6) NOT NULL,
        [ValueAddedTaxTotal] [decimal](28, 6) NOT NULL,
        [ValueAddedTaxDiscount] [decimal](18, 6) NOT NULL,
        [GrandTotal] [decimal](28, 6) NOT NULL,
        [SpecialExpenseAmountTotal] [decimal](28, 6) NOT NULL,
        [SpecialDiscountAmountTotal] [decimal](28, 6) NOT NULL,
        [IsEWaybill] [bit] NOT NULL,
         NULL,
         NULL,
        [EWaybillStatus] [int] NOT NULL,
         NULL,
        [IsEBill] [bit] NOT NULL,
         NULL,
         NULL,
        [EBillStatus] [int] NOT NULL,
         NULL,
        [IsETrade] [bit] NOT NULL,
         NULL,
        [ETradeStatus] [int] NOT NULL,
         NULL,
        [BusinessId] [uniqueidentifier] NOT NULL,
         NULL,
        [DocumentDescription] [nvarchar](max) NULL,
        [CurrencyUnitId] [uniqueidentifier] NULL,
        [CurrencyUnitAmount] [decimal](28, 6) NULL,
        [CurrencyUnitRate] [decimal](18, 6) NULL,
        [IntegrationStatusType] [int] NULL,
         NULL,
        [EBillResponse] [int] NULL,
         NULL,
         NULL,
        [EWaybillResponse] [int] NULL,
         NULL,
         NULL,
        [ETradeResponse] [int] NULL,
         NULL,
        [WarehouseTransactionId] [uniqueidentifier] NULL,
        [TargetWarehouseId] [uniqueidentifier] NULL,
         NULL,
         NULL,
        [IsLocked] [bit] NULL,
        [IsPrinted] [bit] NOT NULL,
        [IsWriteToStock] [bit] NOT NULL,
        [IsWriteToCustomer] [bit] NOT NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
         NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
         NULL,
        [Status] [bit] NULL,
        [AdditionalTaxTotal] [decimal](28, 6) NULL,
        [DeductedTotal] [decimal](28, 6) NULL,
        [IsOpen] [bit] NULL,
        [IsRetail] [bit] NOT NULL,
        [EquSettingId] [uniqueidentifier] NULL,
        CONSTRAINT [PK_Documents] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, 
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) 
        ON [PRIMARY]
      ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[Documents]
      ADD CONSTRAINT [DF__Documents__Id__0EF836A4] DEFAULT (newid()) FOR [Id];
    `;

    const alterIsRetailDefault = `
      ALTER TABLE [dbo].[Documents]
      ADD CONSTRAINT [DF__Documents__IsRet__5DEAEAF5] DEFAULT (CONVERT([bit], (1))) FOR [IsRetail];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
    await request.query(alterIsRetailDefault);
  }
}

export async function ensureDocumentDetails() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.DocumentDetails') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[DocumentDetails](
        [Id] [uniqueidentifier] NOT NULL,
        [VoucherId] [uniqueidentifier] NULL,
        [WaybillId] [uniqueidentifier] NULL,
        [BillId] [uniqueidentifier] NULL,
        [RowNumber] [int] NOT NULL,
        [ProductType] [int] NOT NULL,
        [ProductId] [uniqueidentifier] NOT NULL,
        [ParentId] [uniqueidentifier] NOT NULL,
         NULL,
         NULL,
         NULL,
        [Quantity] [decimal](28, 6) NOT NULL,
        [ProductUnitId] [uniqueidentifier] NOT NULL,
        [PurchasePrice] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxFreePrice] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxFreeAmount] [decimal](28, 6) NOT NULL,
        [Discount1] [decimal](18, 6) NOT NULL,
        [Discount2] [decimal](18, 6) NOT NULL,
        [Discount3] [decimal](18, 6) NOT NULL,
        [Discount4] [decimal](18, 6) NOT NULL,
        [Discount5] [decimal](18, 6) NOT NULL,
        [Discount6] [decimal](18, 6) NOT NULL,
        [Discount7] [decimal](18, 6) NOT NULL,
        [Discount8] [decimal](18, 6) NOT NULL,
        [Discount9] [decimal](18, 6) NOT NULL,
        [Discount10] [decimal](18, 6) NOT NULL,
        [DiscountAmountTotal] [decimal](28, 6) NOT NULL,
        [SubDiscountTotalOnRow] [decimal](28, 6) NOT NULL,
        [DiscountedAmount] [decimal](28, 6) NOT NULL,
        [SpecialCommunicationTaxRate] [decimal](18, 6) NOT NULL,
        [SpecialCommunicationTaxAmount] [decimal](18, 6) NOT NULL,
        [ExciseTaxRate] [decimal](18, 6) NOT NULL,
        [ExciseTaxAmount] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxBase] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxRate] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxAmount] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxExemptionRateId] [uniqueidentifier] NOT NULL,
        [ValueAddedTaxDiscount] [decimal](18, 6) NOT NULL,
        [RowAmount] [decimal](28, 6) NOT NULL,
        [SpecialExpenseAmount] [decimal](18, 6) NOT NULL,
        [SpecialDiscountAmount] [decimal](18, 6) NOT NULL,
        [CostAmount] [decimal](28, 6) NOT NULL,
        [UnitCost] [decimal](18, 6) NOT NULL,
         NULL,
        [ProjectId] [uniqueidentifier] NOT NULL,
        [CurrencyUnitId] [uniqueidentifier] NOT NULL,
        [CurrencyUnitAmount] [decimal](28, 6) NOT NULL,
        [ReportCurrencyUnitId] [uniqueidentifier] NOT NULL,
        [ReportCurrencyUnitAmount] [decimal](28, 6) NOT NULL,
        [CurrencyUnitRate] [decimal](18, 6) NOT NULL,
        [ReportCurrencyUnitRate] [decimal](18, 6) NOT NULL,
        [IsValueAddedTax] [bit] NOT NULL,
         NULL,
        [ApplyExemption] [bit] NOT NULL,
        [NumberLine] [decimal](18, 6) NOT NULL,
         NULL,
         NULL,
        [IsWithholding] [bit] NULL,
         NULL,
        [WithholdingRate] [decimal](18, 6) NULL,
         NULL,
        [WithholdingAmount] [decimal](18, 6) NULL,
        [GvsTopjRate] [decimal](18, 6) NULL,
        [KvsTopajRate] [decimal](18, 6) NULL,
        [ExchangeRegistrationRate] [decimal](18, 6) NULL,
        [RangeFundRate] [decimal](18, 6) NULL,
        [StampTaxRate] [decimal](18, 6) NULL,
        [OrderTransactionId] [uniqueidentifier] NULL,
        [QuantityMF] [decimal](18, 6) NULL,
        [QuantityGM] [decimal](18, 6) NULL,
        [PurchasePriceWithTax] [decimal](18, 6) NULL,
         NULL,
        [WarehouseTransactionState] [int] NULL,
        [Cost] [decimal](28, 6) NULL,
        [CostWithVat] [decimal](28, 6) NULL,
        [CostCurrency] [decimal](28, 6) NULL,
        [CostCurrencyWithVat] [decimal](28, 6) NULL,
        [CostCurrencyRate] [decimal](18, 6) NULL,
        [CostCurrencyUnitId] [uniqueidentifier] NULL,
        [MergeId] [uniqueidentifier] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
         NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
         NULL,
        [Status] [bit] NULL,
        [ExciseTaxBase] [decimal](18, 6) NULL,
        [IsTreatWasteCancel] [int] NULL,
        CONSTRAINT [PK_DocumentDetails] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    // Kaynak betikteki gibi varsayılan kısıt adı belirtilmemiş — aynı şekilde ekliyoruz
    const alterIdDefault = `
      ALTER TABLE [dbo].[DocumentDetails] 
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureBusinesses() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.Businesses') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[Businesses](
        [Id] [uniqueidentifier] NOT NULL,
         NULL,
        [MainBusinessId] [uniqueidentifier] NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [Stock] [decimal](18, 6) NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [CountryId] [uniqueidentifier] NULL,
        [CityId] [uniqueidentifier] NULL,
        [TownId] [uniqueidentifier] NULL,
        [DistrictId] [uniqueidentifier] NULL,
        [NeighbourhoodId] [uniqueidentifier] NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [IsEBill] [bit] NULL,
        [IsEWaybill] [bit] NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [IsCompany] [bit] NULL,
         NULL,
         NULL,
         NULL,
         NULL,
        [CostType] [int] NULL,
         NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
         NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
         NULL,
        [Status] [bit] NULL,
        [CustomerSearchType] [int] NULL,
        [IsDiscontsIncludedInCost] [bit] NULL,
        [IsExpenseIncludedInCost] [bit] NULL,
        [DefaultCurrencyUnitId] [uniqueidentifier] NOT NULL,
        [IsCustomerDependent] [bit] NOT NULL,
        [IsProductDependent] [bit] NOT NULL,
         NULL,
        CONSTRAINT [PK_Businesses] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, 
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[Businesses]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const alterDefaultCurrencyUnitId = `
      ALTER TABLE [dbo].[Businesses]
      ADD DEFAULT ('00000000-0000-0000-0000-000000000000') FOR [DefaultCurrencyUnitId];
    `;

    const alterIsCustomerDependent = `
      ALTER TABLE [dbo].[Businesses]
      ADD DEFAULT (CONVERT([bit], (1))) FOR [IsCustomerDependent];
    `;

    const alterIsProductDependent = `
      ALTER TABLE [dbo].[Businesses]
      ADD DEFAULT (CONVERT([bit], (1))) FOR [IsProductDependent];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
    await request.query(alterDefaultCurrencyUnitId);
    await request.query(alterIsCustomerDependent);
    await request.query(alterIsProductDependent);
  }
}

export async function ensureCalculateCostOperations() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.CalculateCostOperations') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[CalculateCostOperations](
        [Id] [uniqueidentifier] NOT NULL,
        [InventoryId] [uniqueidentifier] NOT NULL,
         NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
         NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
         NULL,
        [Status] [bit] NULL,
        CONSTRAINT [PK_CalculateCostOperations] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[CalculateCostOperations]
      ADD CONSTRAINT [DF__CalculateCos__Id__45A94D10] DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureExpenseDiscountDetails() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.ExpenseDiscountDetails') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[ExpenseDiscountDetails](
        [Id] [uniqueidentifier] NOT NULL,
        [DocumentDetailId] [uniqueidentifier] NULL,
        [ExpenseDiscountDocumentDetailId] [uniqueidentifier] NULL,
        [Amount] [decimal](18, 6) NOT NULL,
          NULL,
        [Type] [int] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NULL,
        CONSTRAINT [PK_ExpenseDiscountDetails] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[ExpenseDiscountDetails]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureInventories() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.Inventories') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[Inventories](
        [Id] [uniqueidentifier] NOT NULL,
        [ProductId] [uniqueidentifier] NOT NULL,
        [ProcessQuantity] [decimal](28, 6) NOT NULL,
        [ProcessUnitId] [uniqueidentifier] NOT NULL,
        [Factor] [decimal](18, 6) NOT NULL,
        [InventoryQuantity] [decimal](28, 6) NOT NULL,
        [IsInput] [bit] NOT NULL,
        [WarehouseId] [uniqueidentifier] NOT NULL,
          NOT NULL,
        [MainUnitId] [uniqueidentifier] NOT NULL,
        [DocumentId] [uniqueidentifier] NOT NULL,
        [DocumentDetailId] [uniqueidentifier] NOT NULL,
        [CreatedUserId] [uniqueidentifier] NOT NULL,
          NOT NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NOT NULL,
        [ProductUnitId] [uniqueidentifier] NOT NULL,
        [Remainder] [decimal](28, 6) NULL,
        [Price] [decimal](28, 6) NULL,
        CONSTRAINT [PK_Inventories] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF,
                 ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF)
        ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[Inventories]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureInventoryRemainders() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.InventoryRemainders') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[InventoryRemainders](
        [Id] [uniqueidentifier] NOT NULL,
        [ProductId] [uniqueidentifier] NULL,
        [WarehouseId] [uniqueidentifier] NULL,
        [InventoryQuantity] [decimal](18, 6) NULL,
        [MainUnitId] [uniqueidentifier] NULL,
        [Remainder] [decimal](18, 6) NULL,
        [Price] [decimal](18, 6) NULL,
        [ReportCurrencyAmount] [decimal](18, 6) NULL,
        [ReportCurrencyAmountWithTax] [decimal](18, 6) NULL,
        [CostCurrencyAmountWithTax] [decimal](18, 6) NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NULL,
        CONSTRAINT [PK_InventoryRemainders] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF, 
          STATISTICS_NORECOMPUTE = OFF, 
          IGNORE_DUP_KEY = OFF, 
          ALLOW_ROW_LOCKS = ON, 
          ALLOW_PAGE_LOCKS = ON, 
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[InventoryRemainders]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureOperationClaims() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.OperationClaims') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[OperationClaims](
        [Id] [uniqueidentifier] NOT NULL,
          NOT NULL,
        [Status] [bit] NOT NULL,
          NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
        CONSTRAINT [PK_OperationClaims] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF, 
          STATISTICS_NORECOMPUTE = OFF, 
          IGNORE_DUP_KEY = OFF, 
          ALLOW_ROW_LOCKS = ON, 
          ALLOW_PAGE_LOCKS = ON, 
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[OperationClaims]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureProductionInOuts() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.ProductionInOuts') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[ProductionInOuts](
        [Id] [uniqueidentifier] NOT NULL,
        [OutputDocumentDetailId] [uniqueidentifier] NOT NULL,
        [Quantity] [decimal](28, 6) NOT NULL,
        [InputDocumentDetailId] [uniqueidentifier] NOT NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NULL,
        [TempDocumentDetailId] [uniqueidentifier] NOT NULL,
        CONSTRAINT [PK_ProductionInOuts] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF, 
          STATISTICS_NORECOMPUTE = OFF, 
          IGNORE_DUP_KEY = OFF, 
          ALLOW_ROW_LOCKS = ON, 
          ALLOW_PAGE_LOCKS = ON, 
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[ProductionInOuts]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const alterTempDocumentDetailIdDefault = `
      ALTER TABLE [dbo].[ProductionInOuts]
      ADD DEFAULT ('00000000-0000-0000-0000-000000000000') FOR [TempDocumentDetailId];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
    await request.query(alterTempDocumentDetailIdDefault);
  }
}

export async function ensureProducts() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.Products') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[Products](
        [Id] [uniqueidentifier] NOT NULL,
        [ParentId] [uniqueidentifier] NULL,
          NULL,
          NULL,
          NULL,
        [TypeNo] [int] NOT NULL,
        [IsInventoryTrack] [bit] NOT NULL,
        [KindNo] [int] NULL,
        [SecretInfo] [nvarchar](max) NULL,
        [ValueAddedTaxRate] [decimal](18, 6) NOT NULL,
        [ValueAddedTaxRateForWholesale] [decimal](18, 6) NOT NULL,
        [SpecialCommunicationTaxRate] [decimal](18, 6) NOT NULL,
        [ExciseTaxRate] [decimal](18, 6) NOT NULL,
        [IsExciseTaxProportional] [bit] NOT NULL,
        [PurchaseValueAddedTaxRate] [decimal](18, 6) NOT NULL,
        [OriginId] [uniqueidentifier] NOT NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
          NULL,
        [FunctionNo] [int] NULL,
        [ECommerce] [bit] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NULL,
        [IntegrationType] [int] NULL,
        [ValueAddedTaxRateGroupId] [uniqueidentifier] NULL,
          NULL,
        CONSTRAINT [PK_Products] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF,
          STATISTICS_NORECOMPUTE = OFF,
          IGNORE_DUP_KEY = OFF,
          ALLOW_ROW_LOCKS = ON,
          ALLOW_PAGE_LOCKS = ON,
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[Products]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureUnitCostByDates() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.UnitCostByDates') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[UnitCostByDates](
        [Id] [uniqueidentifier] NOT NULL,
          NULL,
        [BusinessId] [uniqueidentifier] NULL,
        [WarehouseId] [uniqueidentifier] NULL,
        [ProductId] [uniqueidentifier] NULL,
        [Price] [decimal](28, 6) NULL,
        [BranchId] [uniqueidentifier] NULL,
        [UnitId] [uniqueidentifier] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NULL,
        CONSTRAINT [PK_UnitCostByDates] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF,
          STATISTICS_NORECOMPUTE = OFF,
          IGNORE_DUP_KEY = OFF,
          ALLOW_ROW_LOCKS = ON,
          ALLOW_PAGE_LOCKS = ON,
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[UnitCostByDates]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureUserOperationClaims() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.UserOperationClaims') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[UserOperationClaims](
        [Id] [uniqueidentifier] NOT NULL,
        [UserId] [uniqueidentifier] NOT NULL,
        [OperationClaimId] [uniqueidentifier] NOT NULL,
        [Status] [bit] NOT NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        CONSTRAINT [PK_UserOperationClaims] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF,
          STATISTICS_NORECOMPUTE = OFF,
          IGNORE_DUP_KEY = OFF,
          ALLOW_ROW_LOCKS = ON,
          ALLOW_PAGE_LOCKS = ON,
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[UserOperationClaims]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}

export async function ensureUsers() {
  const pool = await getConnectionPool();

  const exists = await pool.request().query(`
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.Users') AND type='U';
  `);
  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[Users](
        [Id] [uniqueidentifier] NOT NULL,
        [FirstName] [nvarchar](100) NOT NULL,
        [LastName] [nvarchar](100) NOT NULL,
        [Email] [nvarchar](50) NOT NULL,
        [PasswordHash] [varbinary](500) NOT NULL,
        [PasswordSalt] [varbinary](500) NOT NULL,
        [UserType] [int] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
        [CreatedAt] [datetime2](7) NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
        [UpdatedAt] [datetime2](7) NULL,
        [Status] [bit] NOT NULL,
        [IsAdmin] [bit] NULL,
        [PasswordKey] [nvarchar](500) NULL,
      CONSTRAINT [PK_Users] PRIMARY KEY CLUSTERED 
      (
        [Id] ASC
      )WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
      ) ON [PRIMARY]`;

    const alterTableQuery = `
      ALTER TABLE [dbo].[Users] ADD CONSTRAINT DF_Users_Id DEFAULT (newid()) FOR [Id]`;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterTableQuery);
  }
}

export async function ensureUserTableLocks() {
  const pool = await getConnectionPool();

  // tablo var mı?
  const exists = await pool.request().query(`
    SELECT 1
    FROM sys.objects
    WHERE object_id = OBJECT_ID('dbo.UserTableLocks') AND type = 'U';
  `);

  if (exists.recordset.length === 0) {
    const createTableQuery = `
      CREATE TABLE [dbo].[UserTableLocks](
        [Id] [uniqueidentifier] NOT NULL,
        [TableName] [nvarchar](max) NULL,
        [LockedId] [uniqueidentifier] NULL,
        [CreatedUserId] [uniqueidentifier] NULL,
          NULL,
        [UpdatedUserId] [uniqueidentifier] NULL,
          NULL,
        [Status] [bit] NOT NULL,
        CONSTRAINT [PK_UserTableLocks] PRIMARY KEY CLUSTERED 
        (
          [Id] ASC
        ) WITH (
          PAD_INDEX = OFF,
          STATISTICS_NORECOMPUTE = OFF,
          IGNORE_DUP_KEY = OFF,
          ALLOW_ROW_LOCKS = ON,
          ALLOW_PAGE_LOCKS = ON,
          OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF
        ) ON [PRIMARY]
      ) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY];
    `;

    const alterIdDefault = `
      ALTER TABLE [dbo].[UserTableLocks]
      ADD DEFAULT (newid()) FOR [Id];
    `;

    const request = pool.request();
    await request.query(createTableQuery);
    await request.query(alterIdDefault);
  }
}


export async function enableDatabaseCT() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await getConnectionPool();

  const retentionDays = Number(CONFIG.enableChangeTracking.retentionDays || 7);
  const exists = await pool.request().query(`
    SELECT 1 AS x FROM sys.change_tracking_databases WHERE database_id = DB_ID();
  `);
  if (exists.recordset.length === 0) {
    await pool.request().query(`
      ALTER DATABASE CURRENT SET CHANGE_TRACKING = ON
      (CHANGE_RETENTION = ${retentionDays} DAYS, AUTO_CLEANUP = ON);
    `);
  }
}

export async function enableTableCT() {
  if (!CONFIG.enableChangeTracking || CONFIG.enableChangeTracking.enable === false) return;
  const pool = await getConnectionPool();
  const trackCols = CONFIG.enableChangeTracking.trackColumnsUpdated !== false;
  const tables = CONFIG.enableChangeTracking.tables || [];

  for (const t of tables) {
    const rs = await pool.request().input('t', sql.NVarChar, t).query(`SELECT OBJECT_ID(@t) AS oid;`);
    const oid = rs.recordset[0]?.oid;
    if (!oid) { console.warn(`[warn] Table not found: ${t}`); continue; }

    const rs2 = await pool.request().input('oid', sql.Int, oid).query(`
      SELECT 1 AS x FROM sys.change_tracking_tables WHERE object_id=@oid;
    `);
    if (rs2.recordset.length === 0) {
      await pool.request().query(`
        ALTER TABLE ${t} ENABLE CHANGE_TRACKING WITH (TRACK_COLUMNS_UPDATED = ${trackCols ? 'ON' : 'OFF'});
        Update ${t} set Status=0 where Status=0
        Update ${t} set Status=1 where Status=1
      `);
    }
  }
}

export async function ensureSyncStateTable() {
  const pool = await getConnectionPool();

  const exists = await pool.request().query(`
    SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID('dbo.SyncState') AND type='U';
  `);
  if (exists.recordset.length === 0) {
    await pool.request().query(`
      CREATE TABLE dbo.SyncState (TableName sysname PRIMARY KEY, LastSyncVersion bigint NOT NULL);
    `);
  }

  const setTables = new Set();
  (CONFIG.enableChangeTracking?.tables || []).forEach(t => setTables.add(t));
  (CONFIG.flows || []).forEach(f => setTables.add(f.table));

  for (const t of setTables) {
    const r = await pool.request().input('t', sql.NVarChar, t)
      .query(`SELECT 1 FROM dbo.SyncState WHERE TableName=@t;`);
    if (r.recordset.length === 0) {
      await pool.request().input('t', sql.NVarChar, t)
        .query(`INSERT INTO dbo.SyncState(TableName, LastSyncVersion) VALUES(@t, 0);`);
    }
  }
}

// 1) CleanQueue tablosu
export async function ensureCleanQueue() {
  const pool = await getConnectionPool();
  await pool.request().query(`
IF NOT EXISTS (
  SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.CleanQueue') AND type = 'U'
)
BEGIN
  CREATE TABLE dbo.CleanQueue(
    Id           int IDENTITY(1,1) PRIMARY KEY,
    BatchId      uniqueidentifier NOT NULL,
    Status       tinyint NOT NULL CONSTRAINT DF_CleanQueue_Status DEFAULT(0), -- 0=pending,1=running,2=done,3=error
    Attempts     int NOT NULL CONSTRAINT DF_CleanQueue_Attempts DEFAULT(0),
    RequestedAt  datetime2(3) NOT NULL CONSTRAINT DF_CleanQueue_RequestedAt DEFAULT(sysdatetime()),
    StartedAt    datetime2(3) NULL,
    FinishedAt   datetime2(3) NULL
  );
END;
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_CleanQueue_Status' AND object_id = OBJECT_ID('dbo.CleanQueue'))
BEGIN
  CREATE NONCLUSTERED INDEX IX_CleanQueue_Status ON dbo.CleanQueue(Status, Id);
END;
  `);
}


/**
 * Ensure ApplyLog exists and has BatchId column for per-batch cleanup.
 */
export async function ensureApplyLog() {
  const pool = await getConnectionPool();
  const ddlTable = `
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ApplyLog]') AND type in (N'U'))
BEGIN
  CREATE TABLE [dbo].[ApplyLog](
    [TableName] sysname NOT NULL,
    [RowId] uniqueidentifier NOT NULL,
    [ChangeVersion] bigint NOT NULL,
    [BatchId] uniqueidentifier NULL,
    [AppliedAt] datetime2(3) NOT NULL CONSTRAINT DF_ApplyLog_AppliedAt DEFAULT (sysdatetime()),
    CONSTRAINT PK_ApplyLog PRIMARY KEY CLUSTERED (TableName, RowId, ChangeVersion)
  );
END;`;

  const ddlColumn = `
IF COL_LENGTH('dbo.ApplyLog', 'BatchId') IS NULL
BEGIN
  ALTER TABLE dbo.ApplyLog ADD BatchId uniqueidentifier NULL;
END
`;

  const ddlIndex = `
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_ApplyLog_BatchId' AND object_id = OBJECT_ID('dbo.ApplyLog'))
BEGIN
  CREATE INDEX IX_ApplyLog_BatchId ON dbo.ApplyLog(BatchId);
END
`;

  await pool.request().query(ddlTable);
  await pool.request().query(ddlColumn);
  await pool.request().query(ddlIndex);
}

