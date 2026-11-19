const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!fullPath.includes('storefront') && !fullPath.includes('templates') && !fullPath.includes('node_modules')) {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      if (!fullPath.includes('FrequentlyBoughtTogether') && !fullPath.includes('components/ui/')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const allFiles = walk('apps/frontend/src/pages');

let elevatedFiles = new Set();
try {
  const log = execSync('git log --grep="elevate" --name-only --oneline', { encoding: 'utf8', maxBuffer: 15 * 1024 * 1024 });
  const lines = log.split('\n');
  for (const line of lines) {
    const trimmed = line.trim().replace(/\\/g, '/');
    if (trimmed.startsWith('apps/frontend/src/') && (trimmed.endsWith('.tsx') || trimmed.endsWith('.jsx'))) {
      elevatedFiles.add(trimmed);
    }
  }
} catch (e) {
  console.error(e);
}

const folderCounts = {};
allFiles.forEach(f => {
  const norm = f.replace(/\\/g, '/');
  if (!elevatedFiles.has(norm)) {
    const lines = fs.readFileSync(f, 'utf8').split('\n').length;
    if (lines >= 50 && lines <= 400) {
      const folder = path.dirname(norm);
      folderCounts[folder] = (folderCounts[folder] || 0) + 1;
    }
  }
});

const sorted = Object.entries(folderCounts).sort((a, b) => b[1] - a[1]);
console.log('--- Folders with untouched 50-400 line components ---');
sorted.slice(0, 20).forEach(([folder, count]) => {
  console.log(`${folder}: ${count} files`);
});
