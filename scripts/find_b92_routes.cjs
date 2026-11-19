const fs = require('fs');

const app = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const names = ['OnlineTeam', 'SalaryUpdates', 'CreateAdvance', 'ClearanceChecklist', 'CreateCatalog'];

names.forEach(n => {
  const regex = new RegExp(`path=["']([^"']+)["'][^>]*>[\\s\\S]*?<${n}`, 'g');
  const matches = [...app.matchAll(regex)];
  if (matches.length > 0) {
    console.log(n, '->', matches.map(m => m[1]).join(', '));
  } else {
    console.log(n, '-> NOT FOUND IN APP.TSX');
  }
});
