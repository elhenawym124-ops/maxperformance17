const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    locale: 'ar-EG',
  });

  const page = await context.newPage();
  console.log('Navigating to https://swan.maxp.online/shop...');
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Click first "اختيار المقاس والطلب"
  const cta = page.locator('button:has-text("اختيار المقاس والطلب")').first();
  await cta.click();
  await page.waitForTimeout(1500);

  const screenshotPath = path.join(__dirname, '..', 'screenshots', 'swan_mobile_quickview_modal.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved modal screenshot to:', screenshotPath);

  // Check modal elements
  const modalData = await page.evaluate(() => {
    const modal = document.querySelector('[role="dialog"]');
    if (!modal) return { modalFound: false };
    const buttons = Array.from(modal.querySelectorAll('button')).map(b => b.innerText.trim());
    const hasZap = modal.innerText.includes('⚡');
    return {
      modalFound: true,
      modalButtons: buttons,
      hasZap,
      textPreview: modal.innerText.slice(0, 300),
    };
  });

  console.log('Modal inspection data:', JSON.stringify(modalData, null, 2));

  await browser.close();
})();
