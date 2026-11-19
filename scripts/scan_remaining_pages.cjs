const fs = require('fs');
const path = require('path');

const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}]/u;

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (!file.includes('template') && !file.includes('storefront') && !file.includes('__tests__')) {
        results = results.concat(walk(fullPath));
      }
    } else if (file.endsWith('.tsx') && !file.endsWith('.d.ts') && !file.endsWith('.test.tsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const allPages = walk('apps/frontend/src/pages');
console.log(`Total page files found: ${allPages.length}`);

const heroiconPages = [];
const emojiPages = [];
const oldClassPages = [];

allPages.forEach(p => {
  const content = fs.readFileSync(p, 'utf8');
  const hasHeroicons = content.includes('@heroicons/react');
  const hasEmoji = emojiRegex.test(content);
  const isOld = content.includes('bg-white dark:bg-gray-800') || content.includes('bg-white dark:bg-slate-900') || content.includes('border-slate-200');

  if (hasHeroicons) heroiconPages.push(p);
  if (hasEmoji) emojiPages.push(p);
  if (isOld) oldClassPages.push(p);
});

console.log(`Pages with @heroicons: ${heroiconPages.length}`);
console.log(`Pages with emojis: ${emojiPages.length}`);
console.log(`Pages with old container classes: ${oldClassPages.length}`);

console.log('\n--- First 20 Pages with @heroicons ---');
heroiconPages.slice(0, 20).forEach((p, i) => console.log(`${i+1}. ${p.replace(/\\/g, '/')}`));

console.log('\n--- First 20 Pages with emojis ---');
emojiPages.slice(0, 20).forEach((p, i) => console.log(`${i+1}. ${p.replace(/\\/g, '/')}`));
