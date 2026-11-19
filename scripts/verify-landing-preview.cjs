const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'ar-EG'
  });

  page.on('console', msg => console.log('[Console]:', msg.text()));
  page.on('pageerror', err => console.log('[PageError]:', err.message));

  console.log('Navigating to http://127.0.0.1:5173/?landingVariant=operix-luxury ...');
  await page.goto('http://127.0.0.1:5173/?landingVariant=operix-luxury', { waitUntil: 'load', timeout: 20000 }).catch(e => console.log('goto err:', e.message));
  await page.waitForTimeout(4000);

  // Scroll to cockpit
  const cockpit = await page.$('#cockpit');
  if (cockpit) {
    await cockpit.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  const heroCockpitPath = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'preview-hero-cockpit.png');
  await page.screenshot({ path: heroCockpitPath, fullPage: false });
  console.log('Saved preview hero cockpit to:', heroCockpitPath);

  // Scroll to modules bento
  const modules = await page.$('#modules');
  if (modules) {
    await modules.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);
  }

  const bentoPath = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'preview-modules-bento.png');
  await page.screenshot({ path: bentoPath, fullPage: false });
  console.log('Saved preview modules bento to:', bentoPath);

  await browser.close();
})();
