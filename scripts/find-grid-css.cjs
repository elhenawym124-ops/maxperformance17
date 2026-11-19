const fs = require('fs');
const content = fs.readFileSync('scratch_operix.html', 'utf8');

const regex = /<div[^>]*class="[^"]*(streaks|horizon|perspective-grid)[^"]*"[^>]*>[\s\S]*?<\/div>/gi;
const matches = content.match(/<div[^>]*class="[^"]*streaks[^"]*"[\s\S]*?<\/div>\s*<\/div>/gi) || [];
console.log('Found streaks matches:', matches.length);
matches.forEach(m => console.log(m.slice(0, 300)));

const gridMatches = content.match(/<img[^>]*perspective-grid[^>]*>/gi) || [];
gridMatches.forEach(m => console.log('Grid img:', m));
