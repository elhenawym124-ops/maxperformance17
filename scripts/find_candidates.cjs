const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;

const appContent = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
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
  if (norm.includes('storefront') || norm.includes('templates') || norm.includes('themes') || norm.includes('/components/')) continue;
  if (elevatedSet.has(norm)) continue;
  
  const baseName = path.basename(norm, '.tsx');
  if (appContent.includes(baseName)) {
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    if (lines >= 120 && lines <= 380) {
      candidates.push({ path: norm, baseName, lines });
    }
  }
}

console.log('Total standalone routed candidates (120-380 lines):', candidates.length);
console.log(JSON.stringify(candidates.slice(0, 30), null, 2));
