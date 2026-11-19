const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!full.includes('node_modules') && !full.includes('dist') && !full.includes('storefront') && !full.includes('footer-variants')) {
        results = results.concat(walk(full));
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
      results.push(full);
    }
  });
  return results;
}

const all = walk('apps/frontend/src/components');

const candidates = [];
for (const f of all) {
  const content = fs.readFileSync(f, 'utf8');
  // Check if it looks unelevated
  const isCandidate = (
    (content.includes('bg-white') || content.includes('text-gray-500') || content.includes('border-gray-200')) &&
    !content.includes('Single-Surface') &&
    !content.includes('single-surface') &&
    !content.includes('SingleSurface')
  );
  if (isCandidate) {
    const lines = content.split('\n').length;
    if (lines < 380) {
      candidates.push({ file: f.replace(/\\/g, '/'), lines });
    }
  }
}

console.log('Unelevated candidates count:', candidates.length);
candidates.slice(0, 25).forEach((c, i) => console.log(`${i + 1}. ${c.file} (${c.lines} lines)`));
