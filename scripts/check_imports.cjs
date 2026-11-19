const fs = require('fs');
const path = require('path');

function walk(dir) {
  let files = [];
  try {
    for (const item of fs.readdirSync(dir)) {
      if (item === 'node_modules' || item === 'dist' || item === '.git') continue;
      const full = path.join(dir, item);
      if (fs.statSync(full).isDirectory()) files = files.concat(walk(full));
      else if (full.endsWith('.ts') || full.endsWith('.tsx') || full.endsWith('.js') || full.endsWith('.jsx')) files.push(full);
    }
  } catch (e) {}
  return files;
}

const all = walk('apps/frontend/src');
let broken = [];

for (const f of all) {
  const content = fs.readFileSync(f, 'utf8');
  // Match relative imports: from './...' or from '../...'
  const matches = content.matchAll(/from\s+['"](\.\.?\/[^'"]+)['"]/g);
  for (const m of matches) {
    const imp = m[1];
    const target = path.resolve(path.dirname(f), imp);
    const extensions = ['', '.ts', '.tsx', '.js', '.jsx', '.json', '.d.ts', '/index.ts', '/index.tsx', '/index.js', '/index.jsx'];
    const exists = extensions.some(ext => fs.existsSync(target + ext));
    if (!exists) {
      broken.push({ file: f.replace(/\\/g, '/'), import: imp });
    }
  }
}

console.log('Total broken relative imports:', broken.length);
broken.forEach(b => console.log('BROKEN:', b.file, '-->', b.import));
