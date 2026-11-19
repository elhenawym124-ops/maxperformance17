const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  'services/turbo/shipmentService.js',
  'services/orderService.js',
  'services/shippingProviderService.js',
  'controller/turbo/shipmentHandlers.js',
  'utils/turbo/constants.js',
  'services/turboStatusSyncService.js',
  'routes/shipmentsRoutes.js',
  'routes/turboWebhook.js',
];

console.log('🚀 Syncing modified backend files to production server (/var/www/backend2)...');

for (const relPath of files) {
  const localFile = path.join(__dirname, '..', 'apps', 'backend', relPath);
  const remoteFile = `/var/www/backend2/${relPath.replace(/\\/g, '/')}`;
  console.log(`Uploading ${relPath} -> ${remoteFile}...`);
  const content = fs.readFileSync(localFile, 'utf8');
  const base64 = Buffer.from(content, 'utf8').toString('base64');
  execSync(`ssh maxp "base64 -d > ${remoteFile}"`, { input: base64, stdio: ['pipe', 'inherit', 'inherit'] });
  console.log(`✅ ${relPath} uploaded.`);
}

console.log('🔄 Reloading PM2 backend...');
execSync('ssh maxp "pm2 reload maxp-backend"', { stdio: 'inherit' });
console.log('🎉 Done!');
