const fs = require('fs');

const p = 'apps/frontend/src/pages/advertising/product-landing/types.ts';
let c = fs.readFileSync(p, 'utf8');

c = c.replace(/icon:\s*"[^"]*[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}][^"]*"/gu, 'icon: ""');
c = c.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '');
c = c.replace(/  +/g, ' ');

fs.writeFileSync(p, c, 'utf8');
console.log('Sanitized product-landing types.ts successfully!');
