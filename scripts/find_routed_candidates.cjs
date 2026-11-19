const fs = require('fs');
const path = require('path');

const content = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');

const lazyRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*(?:React\.)?lazy\s*\(\s*(?:\(\)\s*=>\s*)?import\s*\(\s*["']([^"']+)["']\s*\)/g;
const lazyMap = {};
let m;
while ((m = lazyRegex.exec(content)) !== null) {
  lazyMap[m[1]] = m[2];
}

// Find route blocks: path="..." followed eventually by element={... <Comp ...}
const routeBlockRegex = /path=["']([^"']+)["'][\s\S]*?element=\{([\s\S]*?)\}/g;
const routedComponents = [];
while ((m = routeBlockRegex.exec(content)) !== null) {
  const rPath = m[1];
  const elContent = m[2];
  // Find all component names in elContent like <ComponentName
  const compMatch = elContent.match(/<([A-Z][A-Za-z0-9_]+)/g);
  if (compMatch) {
    compMatch.forEach(c => {
      const compName = c.substring(1);
      if (lazyMap[compName]) {
        routedComponents.push({ path: rPath, component: compName });
      }
    });
  }
}

console.log(`Found ${routedComponents.length} routed lazy components.`);

const unelevated = [];
const seen = new Set();
routedComponents.forEach(({ path: rPath, component }) => {
  if (seen.has(component)) return;
  const relPath = lazyMap[component];
  if (relPath && relPath.startsWith('./pages/')) {
    const fullPath = path.resolve('apps/frontend/src', relPath + '.tsx');
    if (fs.existsSync(fullPath)) {
      const fileContent = fs.readFileSync(fullPath, 'utf8');
      const lines = fileContent.split('\n');
      if (lines.length > 250 && (fileContent.includes('bg-gray-') || fileContent.includes('text-gray-') || fileContent.includes('border-gray-') || fileContent.includes('@heroicons'))) {
        seen.add(component);
        unelevated.push({
          component,
          route: rPath,
          file: relPath + '.tsx',
          lines: lines.length
        });
      }
    }
  }
});

console.log(`Found ${unelevated.length} routed unelevated candidate pages:`);
unelevated.forEach((u, idx) => {
  console.log(`${idx+1}. [${u.component}] route: ${u.route} -> ${u.file} (${u.lines} lines)`);
});
