const fs = require('fs');
const content = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const lines = content.split('\n');

const candidates = [
  'OrdersAnalytics',
  'StoreAnalyticsDashboard',
  'ABTestDetails',
  'ScheduledOrderSettings',
  'CustomDomainPage',
];

candidates.forEach(name => {
  lines.forEach((l, idx) => {
    if (l.includes(`<${name}`)) {
      console.log(`=== ${name} (line ${idx+1}) ===`);
      for (let i = Math.max(0, idx - 4); i <= Math.min(lines.length - 1, idx + 2); i++) {
        console.log(`${i+1}: ${lines[i]}`);
      }
    }
  });
});
