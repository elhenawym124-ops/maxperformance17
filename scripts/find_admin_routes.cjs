const fs = require('fs');
const app = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');
const regex = /const\s+(\w+)\s*=\s*React\.lazy\(\s*\(\)\s*=>\s*import\(['"]\.\/pages\/admin\/([^'"]+)['"]\)/g;
let match;
while ((match = regex.exec(app)) !== null) {
  const componentName = match[1];
  const relativePath = match[2];
  // find route path
  const routeRegex = new RegExp(`<Route[^>]+path=['"]([^'"]+)['"][^>]*element={[^<]*<${componentName}`, 'g');
  const routeMatch = routeRegex.exec(app);
  console.log(`${componentName} (${relativePath}): route = ${routeMatch ? routeMatch[1] : 'not directly found'}`);
}
