const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('dir', 'rtl');
    });
    const page = await context.newPage();
    await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle' });
    await page.waitForTimeout(2000);
    const filterBtn = page.locator('button[aria-label="الفلاتر"], button:has-text("الفلاتر")').first();
    await filterBtn.click();
    await page.waitForTimeout(800);
    const statusTrigger = page.locator('button[aria-label="كل الحالات"]').first();
    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();
      await page.waitForTimeout(500);
      const label = page.locator('[data-radix-popper-content-wrapper] label').first();
      if (await label.isVisible()) {
        const bounds = await label.evaluate(el => {
          const rect = el.getBoundingClientRect();
          const children = Array.from(el.children).map(c => ({
            tag: c.tagName,
            rect: c.getBoundingClientRect(),
            classes: c.className,
            text: c.textContent
          }));
          return { labelRect: rect, computedDir: window.getComputedStyle(el).direction, children };
        });
        console.log('Bounds:', JSON.stringify(bounds, null, 2));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await browser.close();
  }
})();
