const fs = require('fs');

const candidates = [
  'apps/frontend/src/pages/orders/OrdersAnalytics.tsx',
  'apps/frontend/src/pages/Analytics/StoreAnalyticsDashboard.tsx',
  'apps/frontend/src/pages/advertising/ABTestDetails.tsx',
  'apps/frontend/src/pages/settings/ScheduledOrderSettings.tsx',
  'apps/frontend/src/pages/settings/CustomDomainPage.tsx',
];

candidates.forEach(f => {
  if (fs.existsSync(f)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n');
    console.log(`${f}: ${lines.length} lines, exists: true`);
  } else {
    console.log(`${f}: NOT FOUND`);
  }
});
