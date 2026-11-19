const fs = require('fs');
const html = fs.readFileSync('scratch_operix.html', 'utf8');

const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('--- STYLE 18 ---');
console.log(styles[18].slice(0, 1500));
console.log('--- STYLE 27 ---');
console.log(styles[27].slice(0, 1500));
