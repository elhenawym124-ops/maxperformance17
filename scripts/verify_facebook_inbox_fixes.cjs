const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-gpu',
      '--host-rules=MAP maxp.online 104.21.52.106, MAP *.maxp.online 104.21.52.106',
      '--ignore-certificate-errors'
    ]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ar-EG',
  });
  const page = await context.newPage();

  console.log('1. Navigating to login...');
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2000);

  // Fill login
  await page.fill('input[type="email"], input[name="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"], input[name="password"]', 'tester@maxp.com');
  await page.keyboard.press('Enter');

  console.log('2. Waiting for navigation post-login...');
  await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
  await page.waitForTimeout(3000);

  console.log('3. Navigating to /facebook-inbox...');
  await page.goto('https://maxp.online/facebook-inbox', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(5000);

  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir, { recursive: true });

  const targetPath = path.join(screenshotDir, 'facebook_inbox_live_verified.png');
  await page.screenshot({ path: targetPath, fullPage: false });
  console.log('Screenshot saved to:', targetPath);

  // Check texts
  const pageContent = await page.content();
  const hasMotahElrad = pageContent.includes('متاح الرد');
  const hasYanfaaTrad = pageContent.includes('ينفع ترد');
  const hasElNashat = pageContent.includes('النشاط');
  const hasHajzDemo = pageContent.includes('حجز ديمو داي') || pageContent.includes('Lead');

  console.log({
    hasMotahElrad,
    hasYanfaaTrad,
    hasElNashat,
    hasHajzDemo
  });

  await browser.close();
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
