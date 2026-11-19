const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('1. Logging in afresh as tester@maxp.com ...');
  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', 'tester@maxp.com');
  await page.fill('input[type="password"]', 'tester@maxp.com');
  await page.click('button[type="submit"]');

  await page.waitForFunction(
    () => localStorage.getItem('token') !== null && !window.location.pathname.includes('/login'),
    { timeout: 15000 }
  );
  console.log('Logged in successfully!');

  console.log('2. Navigating to https://maxp.online/agency/visual-identity ...');
  await page.goto('https://maxp.online/agency/visual-identity', {
    waitUntil: 'networkidle',
    timeout: 30000,
  });
  await page.waitForTimeout(3000);

  const identityPath = path.join(screenshotsDir, 'visual_identity_tab_live.png');
  await page.screenshot({ path: identityPath, fullPage: true });
  console.log('Saved visual identity screenshot to:', identityPath);

  await browser.close();
  console.log('Verification finished.');
})();
