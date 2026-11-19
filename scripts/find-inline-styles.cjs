const fs = require('fs');
const html = fs.readFileSync('scratch_operix.html', 'utf8');

const styles = html.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || [];
console.log('Total style tags:', styles.length);

styles.forEach((s, idx) => {
  if (s.includes('perspective-grid') || s.includes('streaks') || s.includes('grid')) {
    console.log(`Style ${idx} matched!`);
    const lines = s.split('\n');
    lines.forEach(l => {
      if (l.includes('grid') || l.includes('streaks') || l.includes('horizon') || l.includes('pflc8n')) {
        console.log(' ', l.trim());
      }
    });
  }
});
