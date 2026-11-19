const fs = require('fs');
const { execSync } = require('child_process');
const log = execSync('git log --grep="elevate" --name-only --oneline').toString();

const paths = [
  'apps/frontend/src/pages/inventory/Inventory.tsx',
  'apps/frontend/src/pages/inventory/InventoryAnalytics.tsx',
  'apps/frontend/src/pages/inventory/InventoryAudits.tsx',
  'apps/frontend/src/pages/inventory/InventoryReports.tsx',
  'apps/frontend/src/pages/inventory/ReorderPointsPage.tsx',
  'apps/frontend/src/pages/inventory/StockMovementsPage.tsx',
  'apps/frontend/src/pages/inventory/WarehouseManagement.tsx',
  'apps/frontend/src/pages/shipping/SettlementOrdersTable.tsx',
  'apps/frontend/src/pages/shipping/SettlementPage.tsx',
  'apps/frontend/src/pages/shipping/ShippingCompanies.tsx',
  'apps/frontend/src/pages/shipping/ShippingCompanyDetail.tsx',
  'apps/frontend/src/pages/woocommerce/WooCommerceSync.tsx'
];

for (const p of paths) {
  const isDone = log.includes(p);
  const exists = fs.existsSync(p);
  const lines = exists ? fs.readFileSync(p, 'utf8').split('\n').length : 0;
  console.log(p.replace('apps/frontend/src/pages/', ''), '->', isDone ? 'DONE' : 'PENDING', `(${lines} lines)`);
}
