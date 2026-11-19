const fs = require('fs');
const html = fs.readFileSync('scratch_operix.html', 'utf8');

const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('--- STYLE 32 ---');
console.log(styles[32].slice(0, 2500));
