const fs = require('fs');
const path = require('path');

const app = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');

// Find all Route elements: <Route path="X" ... element={<Component ... />} />
const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*element=\{([^}]+)\}/g;
let m;
const componentToRoute = new Map();

// Let's do a more robust parse of Routes in App.tsx
const lines = app.split('\n');
let currentPath = null;
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const pathMatch = line.match(/path=["']([^"']+)["']/);
  if (pathMatch) {
    currentPath = pathMatch[1];
  }
  const elMatch = line.match(/<([A-Z][A-Za-z0-9]+)\s*\/>/);
  if (elMatch && currentPath) {
    const comp = elMatch[1];
    if (!componentToRoute.has(comp)) {
      componentToRoute.set(comp, currentPath);
    }
  }
}

// Find lazy imports: const Component = React.lazy(() => import("PATH"));
const lazyMap = new Map();
const lazyRegex = /const\s+([A-Z][A-Za-z0-9]+)\s*=\s*React\.lazy\(\s*(?:\(\)\s*=>\s*)?import\(\s*["']([^"']+)["']\s*\)/g;
while ((m = lazyRegex.exec(app)) !== null) {
  lazyMap.set(m[1], m[2]);
}

const candidates = [];
for (const [comp, routePath] of componentToRoute.entries()) {
  const importPath = lazyMap.get(comp);
  if (!importPath) continue;

  let fullPath = path.resolve('apps/frontend/src', importPath);
  if (!fs.existsSync(fullPath)) {
    if (fs.existsSync(fullPath + '.tsx')) fullPath += '.tsx';
    else if (fs.existsSync(fullPath + '.jsx')) fullPath += '.jsx';
    else if (fs.existsSync(fullPath + '/index.tsx')) fullPath += '/index.tsx';
  }

  if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
    const code = fs.readFileSync(fullPath, 'utf8');
    if (code.includes('@heroicons/react')) {
      const lineCount = code.split('\n').length;
      candidates.push({
        comp,
        routePath,
        relPath: path.relative('.', fullPath).replace(/\\/g, '/'),
        lineCount
      });
    }
  }
}

candidates.sort((a,b) => a.lineCount - b.lineCount);
console.log('Total actively routed pages with heroicons:', candidates.length);
candidates.slice(0, 30).forEach(c => {
  console.log(`${c.lineCount} lines | Route: ${c.routePath.padEnd(35)} | ${c.relPath} (${c.comp})`);
});
