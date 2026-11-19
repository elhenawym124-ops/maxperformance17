const fs = require('fs');
const path = require('path');

const appTsx = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const regex = /React\.lazy\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;

let m;
const candidates = [];
while ((m = regex.exec(appTsx)) !== null) {
  let importPath = m[1];
  let filePath = path.resolve('apps/frontend/src', importPath + '.tsx');
  if (!fs.existsSync(filePath)) {
    filePath = path.resolve('apps/frontend/src', importPath, 'index.tsx');
  }
  if (fs.existsSync(filePath)) {
    const rel = path.relative('.', filePath);
    if (rel.includes('storefront') || rel.includes('templates')) continue;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/).length;
    if (content.includes('bg-white') && (content.includes('border-gray-200') || content.includes('border-gray-300')) && !content.includes('border-border/70')) {
      candidates.push({ file: rel, lines });
    }
  }
}

console.log('Candidates count:', candidates.length);
candidates.sort((a,b) => a.lines - b.lines);
candidates.slice(0, 20).forEach(c => console.log(`${c.lines} lines: ${c.file}`));
