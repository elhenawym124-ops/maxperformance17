const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 1200 },
    deviceScaleFactor: 2,
    locale: 'ar-EG'
  });

  console.log('Navigating...');
  await page.goto('http://127.0.0.1:5173/?landingVariant=operix-luxury', { waitUntil: 'commit', timeout: 30000 });
  await page.waitForSelector('#modules', { timeout: 15000 });
  await page.waitForTimeout(3000);

  const bento = await page.$('#modules');
  if (bento) {
    const bentoImg = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'preview-bento-full.png');
    await bento.screenshot({ path: bentoImg });
    console.log('Saved full bento screenshot:', bentoImg);
  }

  await browser.close();
})();
