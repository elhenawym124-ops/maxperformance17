const fs = require('fs');
const css = fs.readFileSync('scratch_matched_css.css', 'utf8');

const regex = /\.css-pflc8n[^{]*\{[^{}]*\}/gi;
const matches = css.match(regex) || [];
console.log('Matches for .css-pflc8n:', matches.length);
matches.forEach(m => console.log('  ' + m.trim().replace(/\s+/g, ' ')));

// also find any css that targets .grid inside hero
const regexGrid = /\.css-pflc8n[^{]*\.grid[^{]*\{[^{}]*\}/gi;
const mGrid = css.match(regexGrid) || [];
console.log('Matches for .grid:', mGrid.length);
mGrid.forEach(m => console.log('  ' + m.trim().replace(/\s+/g, ' ')));
