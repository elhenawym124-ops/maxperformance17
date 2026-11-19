const { execSync } = require("child_process");
const fs = require("fs");

const patchScript = `
const fs = require('fs');
const file = '/var/www/frontend2/dist/assets/route-orders-Dlbj99Xr.js';
const bak = file + '.bak_patch_' + Date.now();
const content = fs.readFileSync(file, 'utf8');

// Target string inside Sl:
const target = 'if(!i||!n)return{isEnabled:!1,customFields:[],displayNotes:d};const c=qf(d,a);return{isEnabled:!0,customFields:a,displayNotes:c}}s(Sl,"resolveCustomFieldsForDisplay");';

if (!content.includes(target)) {
  console.error("Target string not found in chunk!");
  process.exit(1);
}

// Backup
fs.writeFileSync(bak, content);
console.log("Backup written to:", bak);

const fallbackLogic = 'if(r?.showCustomFields===!0&&!n){const itms=Array.isArray(t?.order?.orderItems)?t.order.orderItems:Array.isArray(t?.orderItems)?t.orderItems:Array.isArray(t?.items)?t.items:[];const isC=itms.some(it=>{const nm=String(it.productName||it.name||"").toLowerCase();return nm.includes("سيار")||nm.includes("عرب")||nm.includes("تفصيل")||nm.includes("ستائر")});if(isC||itms.length>0){const lbl=r?.defaultLabel?.trim()||"نوع وموديل وسنة صنع السيارة";return{isEnabled:!0,customFields:[{label:lbl,value:"—"}],displayNotes:d};}}' + target;

const newContent = content.replace(target, fallbackLogic);
fs.writeFileSync(file, newContent);
console.log("Successfully patched", file);
`;

fs.writeFileSync("temp_patch.js", patchScript);
execSync("scp -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no temp_patch.js root@srv974554.hstgr.cloud:/tmp/temp_patch.js", { stdio: "inherit" });
const out = execSync(`ssh -i ~/.ssh/maxp_server -o StrictHostKeyChecking=no root@srv974554.hstgr.cloud "bash -l -c 'node /tmp/temp_patch.js'"`, { encoding: "utf8" });
console.log(out);
if (fs.existsSync("temp_patch.js")) fs.unlinkSync("temp_patch.js");
