const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const DIR = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'maxp-screens');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  const files = ['maxp-orders', 'maxp-inventory', 'maxp-dashboard', 'maxp-shipping', 'maxp-pos', 'maxp-inbox'];

  for (const name of files) {
    const pngPath = path.join(DIR, `${name}.png`);
    if (!fs.existsSync(pngPath)) continue;

    const base64Png = fs.readFileSync(pngPath).toString('base64');
    const dataUri = `data:image/png;base64,${base64Png}`;

    const webpBase64 = await page.evaluate(async (uri) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          const webpUri = canvas.toDataURL('image/webp', 0.90);
          resolve(webpUri.split(',')[1]);
        };
        img.src = uri;
      });
    }, dataUri);

    const webpPath = path.join(DIR, `${name}.webp`);
    fs.writeFileSync(webpPath, Buffer.from(webpBase64, 'base64'));
    const stat = fs.statSync(webpPath);
    console.log(`Converted ${name}.png -> ${name}.webp (${(stat.size / 1024).toFixed(1)} KB)`);
  }

  await browser.close();
  console.log('All WebP conversions done!');
})();
