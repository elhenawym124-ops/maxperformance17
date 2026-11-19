const { chromium } = require('playwright');
const os = require('os');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-inspect-'));
  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  await page.addInitScript(() => {
    localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXZoOHNmcG4wMW5janVyOXAxMDBoaGpuIiwiZW1haWwiOiJ0ZXN0ZXJAbWF4cC5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdXV4cmZwejA4Y2RqdTB3YXF3emZyZjAiLCJpYXQiOjE3OTI1NDAwMjksImV4cCI6MTc5MzE0NDgyOX0.9A_9kLvj4p00lb8wYGK6HH_1Uu6lME_lZkghw3e8wBg');
    localStorage.setItem('user', JSON.stringify({ id: 'cmvh8sfpn01ncjur9p100hhjn', email: 'tester@maxp.com', role: 'COMPANY_ADMIN', companyId: 'cmuuxrfpz08cdju0waqwzfrf0' }));
  });

  await page.goto('http://localhost:3002/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[placeholder*="اختر صنفاً"]', { timeout: 20000 });
  await page.waitForTimeout(1500);
  
  // Find visible combobox in the table
  const input = page.locator('table input[placeholder*="اختر صنفاً"]').first();
  await input.click();
  await page.waitForTimeout(1000);

  const screenshotPath = path.join(screenshotsDir, 'proof_hierarchical_combobox_clean.png');
  await page.screenshot({ path: screenshotPath });
  console.log('📸 Clean combobox screenshot saved:', screenshotPath);

  await context.close();
})();
