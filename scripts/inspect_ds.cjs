const { execSync } = require("child_process");
const fs = require("fs");

const inspectScript = `
const fs = require('fs');
const file = '/var/www/frontend2/dist/assets/route-orders-Dlbj99Xr.js';
const c = fs.readFileSync(file, 'utf8');
const idx = c.indexOf('const Ds=');
if (idx >= 0) {
  console.log('Ds definition:');
  console.log(c.substring(idx, idx + 500));
} else {
  const m = c.match(/Ds\s*=\s*\{[^}]+\}/);
  console.log('Match Ds:', m ? m[0] : 'not found');
}
`;

fs.writeFileSync("temp_inspect.js", inspectScript);
execSync("scp -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no temp_inspect.js root@srv974554.hstgr.cloud:/tmp/temp_inspect.js", { stdio: "inherit" });
const out = execSync(`ssh -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no root@srv974554.hstgr.cloud "bash -l -c 'node /tmp/temp_inspect.js'"`, { encoding: "utf8" });
console.log(out);
if (fs.existsSync("temp_inspect.js")) fs.unlinkSync("temp_inspect.js");
