const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const log = execSync('git log --grep="elevate" --name-only --oneline').toString();

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', '__tests__'].includes(f)) walk(full, list);
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      list.push(full.replace(/\\/g, '/'));
    }
  }
  return list;
}

const targetDirs = [
  'apps/frontend/src/pages/comments',
  'apps/frontend/src/pages/tickets',
  'apps/frontend/src/pages/competitors',
  'apps/frontend/src/pages/support',
  'apps/frontend/src/pages/returns'
];

for (const d of targetDirs) {
  const files = walk(d);
  for (const p of files) {
    const isDone = log.includes(p);
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    if (!isDone) {
      console.log(`PENDING: ${p} (${lines} lines)`);
    }
  }
}
