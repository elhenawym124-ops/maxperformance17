const fs = require('fs');

const css = fs.readFileSync('scratch_matched_css.css', 'utf8');

const terms = ['streaks', 'horizon', 'perspective-grid', 'grid', 'e9iajj41'];
terms.forEach(term => {
  const regex = new RegExp(`[^{}]*${term}[^{}]*\\{[^{}]*\\}`, 'gi');
  const matches = css.match(regex) || [];
  console.log(`Matches for "${term}": ${matches.length}`);
  matches.forEach(m => console.log('  ' + m.trim().replace(/\s+/g, ' ')));
});
