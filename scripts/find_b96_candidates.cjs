const fs = require('fs');
const path = require('path');

// Scan App.tsx for routes and their component imports
const appContent = fs.readFileSync('apps/frontend/src/App.tsx', 'utf8');

// Find all lazy imports: const ComponentName = ...('./pages/path/to/File')
const lazyRegex = /const\s+([A-Za-z0-9_]+)\s*=\s*(?:ResilientLazy|lazy)\s*\(\s*\(\)\s*=>\s*import\(['"]([^'"]+)['"]\)/g;
let match;
const importMap = new Map();

while ((match = lazyRegex.exec(appContent)) !== null) {
  const comp = match[1];
  let fileRel = match[2];
  if (fileRel.startsWith('./')) {
    fileRel = path.join('apps/frontend/src', fileRel);
  }
  importMap.set(comp, fileRel);
}

// Find all routes: path="some/path" element={<ComponentName ...
const routeRegex = /<Route\s+[^>]*path=["']([^"']+)["'][^>]*element={<([A-Za-z0-9_]+)/g;
const routedComponents = [];

while ((match = routeRegex.exec(appContent)) !== null) {
  const rPath = match[1];
  const comp = match[2];
  if (importMap.has(comp)) {
    let filePath = importMap.get(comp);
    // test extensions
    if (fs.existsSync(filePath + '.tsx')) filePath += '.tsx';
    else if (fs.existsSync(filePath + '.jsx')) filePath += '.jsx';
    else if (fs.existsSync(filePath + '/index.tsx')) filePath += '/index.tsx';
    
    if (fs.existsSync(filePath)) {
      routedComponents.push({ comp, route: rPath, filePath });
    }
  }
}

// Filter out already modern/elevated files or customer storefront templates
// We want pages with heroicons, or emojis, or old classes like bg-gray-50 / bg-white dark:bg-gray-800
const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

const candidates = [];
for (const item of routedComponents) {
  // skip storefront templates
  if (item.filePath.includes('storefront') || item.filePath.includes('template')) continue;
  
  const content = fs.readFileSync(item.filePath, 'utf8');
  const hasHeroicons = content.includes('@heroicons/react');
  const hasEmoji = emojiRegex.test(content);
  const lines = content.split('\n').length;
  const isOldCard = content.includes('bg-white dark:bg-gray-800') || content.includes('bg-white dark:bg-slate-900') || content.includes('border-slate-200');

  if (hasHeroicons || hasEmoji || isOldCard) {
    candidates.push({
      comp: item.comp,
      route: item.route,
      filePath: item.filePath,
      hasHeroicons,
      hasEmoji,
      isOldCard,
      lines
    });
  }
}

console.log(`Found ${candidates.length} candidates for elevation.`);
candidates.slice(0, 15).forEach((c, i) => {
  console.log(`${i+1}. [${c.comp}] route: "${c.route}" file: ${c.filePath} (${c.lines} lines, heroicons:${c.hasHeroicons}, emoji:${c.hasEmoji})`);
});
