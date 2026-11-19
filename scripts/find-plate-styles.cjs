const fs = require('fs');
const html = fs.readFileSync('scratch_operix.html', 'utf8');

const regex = /orders-card-a[\s\S]*?<\/div>/gi;
const match = html.match(/<div[^>]*class="[^"]*plate[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi) || [];
console.log('Plate matches:', match.length);

const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
styles.forEach((s, idx) => {
  if (s.includes('orders-card-a') || s.includes('plate') || s.includes('tabs/orders')) {
    console.log(`Style ${idx} matched plate!`);
    const lines = s.split('\n');
    lines.slice(0, 15).forEach(l => console.log('  ', l.trim().slice(0, 120)));
  }
});
