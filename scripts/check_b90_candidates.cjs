const fs = require('fs');

const candidates = [
  'apps/frontend/src/pages/owner/OwnerUsersManagement.tsx',
  'apps/frontend/src/pages/affiliates/AffiliateQuickActions.tsx',
  'apps/frontend/src/pages/shipping/SettlementPage.tsx',
  'apps/frontend/src/pages/cancellations/CancellationSettingsPage.tsx',
  'apps/frontend/src/pages/products/WooCommerceImport.tsx',
];

candidates.forEach(f => {
  if (fs.existsSync(f)) {
    const content = fs.readFileSync(f, 'utf8');
    const lines = content.split('\n');
    console.log(`${f}: ${lines.length} lines, exists: true`);
  } else {
    console.log(`${f}: NOT FOUND`);
  }
});
