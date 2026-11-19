const { execSync } = require('child_process');
const fs = require('fs');

const log = execSync('git log --grep="feat: elevate batch" --name-only --oneline').toString();
const lines = log.split('\n');

const modifiedFiles = new Set();
let currentCommit = null;
let batchCount = 0;

for (const line of lines) {
  if (line.match(/^[a-f0-9]{7,9}\sfeat:\selevate\sbatch/)) {
    batchCount++;
    currentCommit = line;
  } else if (line.trim() && line.startsWith('apps/frontend/src/')) {
    modifiedFiles.add(line.trim());
  }
}

console.log('Total elevate batch commits:', batchCount);
console.log('Total unique elevated frontend files in git log:', modifiedFiles.size);
