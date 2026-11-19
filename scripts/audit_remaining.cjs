const fs = require('fs');
const path = require('path');

function walk(dir, list = []) {
  if (!fs.existsSync(dir)) return list;
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!['node_modules', 'dist', 'build', '.git', '__tests__'].includes(f)) {
        walk(full, list);
      }
    } else if (f.endsWith('.tsx') || f.endsWith('.jsx')) {
      list.push(full);
    }
  }
  return list;
}

const all = walk('apps/frontend/src');

const storefrontFiles = all.filter(p => {
  const norm = p.replace(/\\/g, '/');
  return norm.includes('/storefront/') ||
         norm.includes('/templates/') ||
         norm.includes('FrequentlyBoughtTogether');
});

const uiPrimitives = all.filter(p => {
  const norm = p.replace(/\\/g, '/');
  return norm.includes('/components/ui/') || norm.includes('/ui/');
});

const dashboardPagesAndComponents = all.filter(p => {
  const norm = p.replace(/\\/g, '/');
  return !norm.includes('/storefront/') &&
         !norm.includes('/templates/') &&
         !norm.includes('FrequentlyBoughtTogether') &&
         !norm.includes('/components/ui/');
});

console.log('--- REPO AUDIT ---');
console.log('Total TSX/JSX files:', all.length);
console.log('Storefront / Templates (Forbidden):', storefrontFiles.length);
console.log('Base UI Primitives (shadcn/radix buttons, dialogs):', uiPrimitives.length);
console.log('Dashboard Pages & Feature Components:', dashboardPagesAndComponents.length);

// Let's also check git commit log to count how many batches were done
const { execSync } = require('child_process');
const log = execSync('git log --grep="feat: elevate batch" --oneline').toString();
const batchCommits = log.trim().split('\n').filter(Boolean);
console.log('Total Batch Commits pushed:', batchCommits.length);

// Let's check which folders have files in dashboardPagesAndComponents
const folderMap = {};
for (const f of dashboardPagesAndComponents) {
  const rel = path.relative('apps/frontend/src', f).replace(/\\/g, '/');
  const top = rel.split('/')[0] + (rel.split('/')[1] ? '/' + rel.split('/')[1] : '');
  folderMap[top] = (folderMap[top] || 0) + 1;
}
console.log('\nBreakdown by feature folder:');
console.table(folderMap);
