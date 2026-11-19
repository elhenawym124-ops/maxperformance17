const { execSync } = require("child_process");
const fs = require("fs");

const inspectScript = `
const fs = require('fs');

// Check all occurrences of print-multiple in the entire /var/www/frontend2/dist/assets/
const files = fs.readdirSync('/var/www/frontend2/dist/assets/').filter(f => f.endsWith('.js'));
for (const file of files) {
  const c = fs.readFileSync('/var/www/frontend2/dist/assets/' + file, 'utf8');
  if (c.includes('print-multiple')) {
    console.log('File with print-multiple:', file);
  }
}
`;

fs.writeFileSync("temp_inspect.js", inspectScript);
execSync("scp -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no temp_inspect.js root@srv974554.hstgr.cloud:/tmp/temp_inspect.js", { stdio: "inherit" });
const out = execSync(`ssh -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no root@srv974554.hstgr.cloud "bash -l -c 'node /tmp/temp_inspect.js'"`, { encoding: "utf8" });
console.log(out);
if (fs.existsSync("temp_inspect.js")) fs.unlinkSync("temp_inspect.js");
