const { execSync } = require("child_process");
const fs = require("fs");

const inspectScript = `
const fs = require('fs');
const c = fs.readFileSync('/var/www/frontend2/dist/assets/route-orders-Dlbj99Xr.js', 'utf8');

const idx = c.indexOf('s(Sv,"InvoiceContent")');
console.log('Index of InvoiceContent definition:');
const start = c.indexOf('const Sv=s(');
console.log('start of Sv:', start);
const slCall = c.indexOf('Sl(', start);
console.log('Sl call:', slCall);
console.log('Code from start of Sv to Sl call:');
console.log(c.substring(start, slCall + 50));
`;

fs.writeFileSync("temp_inspect.js", inspectScript);
execSync("scp -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no temp_inspect.js root@srv974554.hstgr.cloud:/tmp/temp_inspect.js", { stdio: "inherit" });
const out = execSync(`ssh -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no root@srv974554.hstgr.cloud "bash -l -c 'node /tmp/temp_inspect.js'"`, { encoding: "utf8" });
console.log(out);
if (fs.existsSync("temp_inspect.js")) fs.unlinkSync("temp_inspect.js");
