const { chromium } = require('playwright');

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

  console.log('Navigating to root URL: http://127.0.0.1:5173/ ...');
  const startTime = Date.now();
  await page.goto('http://127.0.0.1:5173/', { waitUntil: 'commit', timeout: 20000 });
  await page.waitForSelector('#home, #new-hero-title, h1', { timeout: 15000 });
  const loadDuration = Date.now() - startTime;

  const pageInfo = await page.evaluate(() => {
    return {
      title: document.title,
      h1: document.querySelector('h1')?.innerText?.replace(/\s+/g, ' '),
      hasOperixNav: !!document.querySelector('.ol-nav-container'),
      hasCockpit: !!document.querySelector('#cockpit'),
      hasBento: !!document.querySelector('#modules'),
      hasOldDarkBg: document.body.classList.contains('dark') || document.querySelector('.bg-\\[\\#071120\\]') !== null
    };
  });

  console.log(`Loaded in ${loadDuration}ms!`);
  console.log('Page Inspection:', pageInfo);

  // Take full screenshot of the root page
  const screenshotPath = 'H:/maxp-platform/apps/frontend/public/operix-assets/root-landing-verified.png';
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log('Saved root verified screenshot:', screenshotPath);

  await browser.close();
})();
