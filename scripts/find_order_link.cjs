const { chromium } = require('playwright');

(async () => {
  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage', '--disable-software-rasterizer']
    });
    const page = await browser.newPage();
    await page.goto('http://127.0.0.1:5173/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);
    const links = await page.$$eval('a', els => els.map(e => e.href).filter(h => h.includes('/orders/')));
    console.log('Order links found:', links.slice(0, 5));
  } catch (e) {
    console.error(e);
  } finally {
    if (browser) await browser.close();
  }
})();
