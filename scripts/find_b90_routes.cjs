const fs = require('fs');
const content = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const lines = content.split('\n');

['Settlement', 'Cancellation', 'SettlementPage', 'CancellationSettingsPage'].forEach(term => {
  console.log(`=== Matches for ${term} ===`);
  lines.forEach((l, i) => {
    if (l.toLowerCase().includes(term.toLowerCase())) {
      console.log(`${i+1}: ${l.trim()}`);
    }
  });
});
