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

const allFiles = walk('apps/frontend/src');
console.log(`Total scanned files: ${allFiles.length}`);

// Get all files touched in elevate batches
let elevatedFiles = new Set();
try {
  const log = execSync('git log --grep="elevate batch" --grep="feat(batch-" --name-only --oneline', { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
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

console.log(`Elevated files found in git log: ${elevatedFiles.size}`);

const remaining = [];
for (const file of allFiles) {
  const norm = file.replace(/\\/g, '/');
  if (!elevatedFiles.has(norm)) {
    const content = fs.readFileSync(file, 'utf8');
    const lineCount = content.split('\n').length;
    if (lineCount >= 60 && lineCount <= 400) {
      remaining.push({ file: norm, lines: lineCount });
    }
  }
}

console.log(`Remaining eligible files (60-400 lines): ${remaining.length}`);
remaining.sort((a, b) => b.lines - a.lines);
console.log('Top 25 candidates:');
remaining.slice(0, 25).forEach((r, idx) => {
  console.log(`${idx + 1}. ${r.file} (${r.lines} lines)`);
});
