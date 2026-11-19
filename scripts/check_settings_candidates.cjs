const fs = require('fs');
const { execSync } = require('child_process');

function checkFile(file) {
  try {
    const log = execSync(`git log --oneline -n 1 -- "${file}"`, { encoding: 'utf8' }).trim();
    return log;
  } catch (e) {
    return '';
  }
}

const list = fs.readdirSync('apps/frontend/src/pages/settings');
const candidateSettings = [];
for (const f of list) {
  const p = 'apps/frontend/src/pages/settings/' + f;
  const stat = fs.statSync(p);
  if (stat.isFile() && (f.endsWith('.tsx') || f.endsWith('.jsx'))) {
    const lines = fs.readFileSync(p, 'utf8').split('\n').length;
    if (lines >= 50 && lines <= 400) {
      const lastCommit = checkFile(p);
      const isElevated = lastCommit.includes('elevate batch') || lastCommit.includes('feat(batch-');
      candidateSettings.push({ file: p, lines, isElevated, lastCommit });
    }
  }
}

console.log('--- Settings files analysis ---');
candidateSettings.forEach(c => {
  console.log(`${c.file} (${c.lines} lines) - Elevated: ${c.isElevated} | ${c.lastCommit.slice(0, 60)}`);
});
