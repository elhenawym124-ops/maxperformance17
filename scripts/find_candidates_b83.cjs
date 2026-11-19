const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const elevatedOutput = execSync('git log --grep="elevate" --name-only --format=""', { encoding: 'utf8' });
const elevatedSet = new Set(elevatedOutput.split('\n').map(l => l.trim().replace(/\\/g, '/')).filter(Boolean));

function getAllFiles(dir) {
  let res = [];
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      res = res.concat(getAllFiles(full));
    } else if (f.endsWith('.tsx') && !f.endsWith('.d.ts')) {
      res.push(full);
    }
  }
  return res;
}

const allPages = getAllFiles('apps/frontend/src/pages');
const candidates = [];

for (const p of allPages) {
  const norm = p.replace(/\\/g, '/');
  if (
    norm.includes('storefront') ||
    norm.includes('templates') ||
    norm.includes('themes') ||
    norm.includes('__tests__') ||
    norm.includes('.test.') ||
    norm.includes('/components/') ||
    norm.endsWith('Modal.tsx') ||
    norm.endsWith('Dialog.tsx') ||
    norm.endsWith('Drawer.tsx')
  ) continue;

  if (!elevatedSet.has(norm)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    if (lines >= 100 && lines <= 380) {
      candidates.push({ path: norm, lines });
    }
  }
}

console.log('Total standalone candidates 100-380 lines:', candidates.length);
candidates.sort((a,b) => a.lines - b.lines);
console.log(JSON.stringify(candidates.slice(0, 40), null, 2));
