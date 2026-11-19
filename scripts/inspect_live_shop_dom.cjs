const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('select', { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  await page.screenshot({ path: 'screenshots/swan_shop_tightened_live.png' });

  const data = await page.evaluate(() => {
    const sel = document.querySelector('select');
    return {
      selectClass: sel ? sel.className : null,
      selectId: sel ? sel.id : null,
      firstCardTop: document.querySelector('article, [class*="group relative"]')?.getBoundingClientRect().top
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
