const fs = require('fs');
const { execSync } = require('child_process');

const output = execSync('git grep -l "@heroicons" apps/frontend/src/pages/', { encoding: 'utf8' });
const files = output.trim().split('\n');

const res = [];
files.forEach(f => {
  f = f.trim();
  if (!fs.existsSync(f)) return;
  if (f.includes('test') || f.includes('Modal') || f.includes('components/')) return;
  const lines = fs.readFileSync(f, 'utf8').split('\n').length;
  if (lines <= 460) {
    res.push({ f, lines });
  }
});

res.sort((a,b) => a.lines - b.lines);
res.forEach(r => console.log(r.f, '->', r.lines, 'lines'));
