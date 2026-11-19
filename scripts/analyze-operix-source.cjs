const fs = require('fs');

const content = fs.readFileSync('scratch_operix.html', 'utf8');

console.log('--- ALL SECTIONS ---');
const sectionRegex = /<section\b([^>]*)>([\s\S]*?)<\/section>/gi;
let match;
let count = 0;
while ((match = sectionRegex.exec(content)) !== null) {
  count++;
  const attrs = match[1];
  const body = match[2];
  const id = (attrs.match(/id="([^"]+)"/) || [])[1] || 'no-id';
  const h2 = (body.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1] || '';
  const cleanH2 = h2.replace(/<[^>]+>/g, '').trim();
  console.log(`[${count}] ID: ${id} | H2: "${cleanH2}"`);
}

console.log('\n--- HERO STRUCTURE ---');
const heroMatch = content.match(/<section[^>]*id="new-hero"[^>]*>([\s\S]*?)<\/section>/i) || content.match(/<section[^>]*class="[^"]*hero[^"]*"[^>]*>([\s\S]*?)<\/section>/i);
if (heroMatch) {
  console.log('Hero inner preview length:', heroMatch[1].length);
  // find images or videos in hero
  const media = heroMatch[1].match(/<(img|video|svg)[^>]*>/gi) || [];
  console.log('Hero media elements count:', media.length);
  media.slice(0, 10).forEach(m => console.log('  Media:', m.slice(0, 100)));
}

console.log('\n--- MODULES SECTION ---');
const modulesMatch = content.match(/<section[^>]*id="modules"[^>]*>([\s\S]*?)<\/section>/i);
if (modulesMatch) {
  const titles = modulesMatch[1].match(/<h[34][^>]*>([\s\S]*?)<\/h[34]>/gi) || [];
  console.log('Modules titles:', titles.map(t => t.replace(/<[^>]+>/g, '').trim()));
  const imgs = modulesMatch[1].match(/<img[^>]*>/gi) || [];
  imgs.forEach(img => console.log('  Module img:', img.slice(0, 120)));
}
