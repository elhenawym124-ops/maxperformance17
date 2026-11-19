const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all files touched in elevate commits
const log = execSync('git log --grep="elevate" --name-only --oneline').toString();
const elevatedFiles = new Set();
for (const line of log.split('\n')) {
  const trimmed = line.trim().replace(/\\/g, '/');
  if (trimmed.startsWith('apps/frontend/src/pages/')) {
    elevatedFiles.add(trimmed);
  }
}

// Walk pages dir
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

const allPages = walk('apps/frontend/src/pages').filter(p => !p.includes('/templates/') && !p.includes('/storefront/'));

const moduleStats = {};
let totalPages = 0;
let totalElevated = 0;

for (const p of allPages) {
  const rel = p.replace('apps/frontend/src/pages/', '');
  const section = rel.includes('/') ? rel.split('/')[0] : 'root-pages';
  if (!moduleStats[section]) {
    moduleStats[section] = { total: 0, elevated: 0, remaining: 0 };
  }
  moduleStats[section].total++;
  totalPages++;
  if (elevatedFiles.has(p)) {
    moduleStats[section].elevated++;
    totalElevated++;
  } else {
    moduleStats[section].remaining++;
  }
}

console.log(`TOTAL PAGES/COMPONENTS (Excluding Templates): ${totalPages}`);
console.log(`ELEVATED: ${totalElevated}`);
console.log(`REMAINING: ${totalPages - totalElevated}`);
console.log('\n--- SECTION BREAKDOWN ---');
for (const [k, v] of Object.entries(moduleStats).sort((a,b) => b[1].total - a[1].total)) {
  console.log(`${k.padEnd(25)}: Total ${String(v.total).padStart(3)} | Done ${String(v.elevated).padStart(3)} | Left ${String(v.remaining).padStart(3)}`);
}
