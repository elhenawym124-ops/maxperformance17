const fs = require('fs');
const html = fs.readFileSync('scratch_operix.html', 'utf8');

const modules = html.match(/<section[^>]*id="modules"[^>]*>([\s\S]*?)<\/section>/i);
if (modules) {
  // Find first card inside
  const firstCard = modules[1].match(/<li[\s\S]*?<\/li>/i) || modules[1].match(/<article[\s\S]*?<\/article>/i) || modules[1].match(/<div class="[^"]*card[^"]*"[\s\S]*?<\/div>/i);
  console.log('Modules preview:');
  console.log(modules[1].slice(0, 3000));
}
