const fs = require('fs');
const content = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const lines = content.split('\n');
[2225, 4486, 3547, 4892].forEach(target => {
  console.log(`=== Target line ${target} ===`);
  for (let i = Math.max(0, target - 6); i <= Math.min(lines.length - 1, target + 2); i++) {
    console.log(`${i+1}: ${lines[i]}`);
  }
});
