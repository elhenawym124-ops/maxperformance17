const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const log = execSync('git log --grep="elevate" --name-only --oneline').toString();
const elevatedFiles = new Set();
for (const line of log.split('\n')) {
  const trimmed = line.trim().replace(/\\/g, '/');
  if (trimmed.startsWith('apps/frontend/src/')) {
    elevatedFiles.add(trimmed);
  }
}

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

const allComponents = walk('apps/frontend/src/components')
  .filter(p => !p.includes('/ui/') && !p.includes('/storefront/') && !p.includes('/templates/'));

let elevatedComps = 0;
for (const p of allComponents) {
  if (elevatedFiles.has(p)) elevatedComps++;
}

console.log('Total Feature Components in src/components:', allComponents.length);
console.log('Elevated in src/components:', elevatedComps);
console.log('Remaining in src/components:', allComponents.length - elevatedComps);
