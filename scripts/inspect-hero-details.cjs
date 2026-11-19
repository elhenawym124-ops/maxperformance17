const fs = require('fs');
const content = fs.readFileSync('scratch_operix.html', 'utf8');

const homeSection = content.match(/<section[^>]*id="home"[^>]*>([\s\S]*?)<\/section>/i);
if (homeSection) {
  const inner = homeSection[1];
  // find tab buttons and images
  const tabs = inner.match(/<button[^>]*role="tab"[^>]*>[\s\S]*?<\/button>/gi) || [];
  console.log('Tabs in Operix hero:', tabs.length);
  tabs.forEach(t => console.log('  Tab:', t.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()));

  const imagesInHero = inner.match(/<img[^>]*>/gi) || [];
  console.log('Images in Operix hero:', imagesInHero.length);
  imagesInHero.forEach(img => console.log('  Img:', img.slice(0, 120)));
}
