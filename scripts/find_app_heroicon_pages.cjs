const fs = require('fs');
const path = require('path');

const app = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');

// find all import('./pages/...')
const regex = /import\(\s*['"](\.\/pages\/[^'"]+)['"]\s*\)/g;
let m;
const pages = new Set();
while ((m = regex.exec(app)) !== null) {
  pages.add(m[1]);
}

const results = [];
for (const p of pages) {
  let fullPath = path.resolve('apps/frontend/src', p);
  if (!fs.existsSync(fullPath)) {
    if (fs.existsSync(fullPath + '.tsx')) fullPath += '.tsx';
    else if (fs.existsSync(fullPath + '.jsx')) fullPath += '.jsx';
    else if (fs.existsSync(fullPath + '/index.tsx')) fullPath += '/index.tsx';
  }
  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const code = fs.readFileSync(fullPath, 'utf8');
    if (code.includes('@heroicons/react')) {
      const lines = code.split('\n').length;
      results.push({ path: path.relative('.', fullPath).replace(/\\/g, '/'), lines });
    }
  }
}

results.sort((a,b) => a.lines - b.lines);
console.log('Total App.tsx pages with heroicons:', results.length);
results.slice(0, 30).forEach(r => console.log(r.lines, 'lines:', r.path));
