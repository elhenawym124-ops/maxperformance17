const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/mokhtar/.gemini/antigravity/brain/41ef79a3-5cc9-46f9-9677-3f9a7948aeaa';

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
    await page.goto('http://localhost:3001/orders', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);
    const filterBtn = page.locator('button[aria-label="الفلاتر"], button:has-text("الفلاتر")').first();
    await filterBtn.click();
    await page.waitForTimeout(1000);
    const statusTrigger = page.locator('button[aria-label="كل الحالات"]').first();
    if (await statusTrigger.isVisible()) {
      await statusTrigger.click();
      await page.waitForTimeout(1000);
      const popover = page.locator('[data-radix-popper-content-wrapper]').first();
      if (await popover.isVisible()) {
        await popover.screenshot({ path: path.join(ARTIFACT_DIR, 'popover_zoomed.png') });
        console.log('Saved popover_zoomed.png');
        const labels = await page.locator('[data-radix-popper-content-wrapper] label').all();
        console.log('Found labels:', labels.length);
        if (labels.length > 0) {
          const firstHtml = await labels[0].evaluate(el => el.outerHTML);
          console.log('First label HTML:', firstHtml);
        }
      } else {
        console.log('Popover not visible');
      }
    } else {
      console.log('Status trigger not visible');
    }
  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
})();
