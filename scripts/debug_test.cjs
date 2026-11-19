const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const os = require('os');

const token =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbXZoOHNmcG4wMW5janVyOXAxMDBoaGpuIiwiZW1haWwiOiJ0ZXN0ZXJAbWF4cC5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdXV4cmZwejA4Y2RqdTB3YXF3emZyZjAiLCJpYXQiOjE3OTI1NDAwMjksImV4cCI6MTc5MzE0NDgyOX0.9A_9kLvj4p00lb8wYGK6HH_1Uu6lME_lZkghw3e8wBg';

const userObj = {
  id: 'cmvh8sfpn01ncjur9p100hhjn',
  email: 'tester@maxp.com',
  firstName: 'محمد',
  lastName: 'سامى',
  role: 'COMPANY_ADMIN',
  companyId: 'cmuuxrfpz08cdju0waqwzfrf0',
  company: {
    id: 'cmuuxrfpz08cdju0waqwzfrf0',
    name: 'HUINZO',
    activeApps: ['procurement-pro', 'store-pro']
  }
};

(async () => {
  const screenshotsDir = path.resolve('screenshots');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'chrome-debug-'));

  const context = await chromium.launchPersistentContext(tmpDir, {
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
    viewport: { width: 1440, height: 900 }
  });

  const page = context.pages().length > 0 ? context.pages()[0] : await context.newPage();

  page.on('console', msg => console.log('BROWSER LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));

  console.log('1. Setting auth credentials...');
  await page.addInitScript(({ t, u }) => {
    localStorage.setItem('token', t);
    localStorage.setItem('user', JSON.stringify(u));
  }, { t: token, u: userObj });

  console.log('2. Navigating...');
  await page.goto('http://localhost:3002/procurement/purchase-orders/new', { waitUntil: 'domcontentloaded', timeout: 25000 });

  await page.waitForTimeout(2500);

  console.log('3. Clicking modal button...');
  await page.click('button:has-text("استعراض منتجات المتجر")');

  await page.waitForTimeout(3000);

  const modalHtml = await page.evaluate(() => {
    const m = document.querySelector('[role="dialog"]');
    return m ? m.innerText : 'NO DIALOG FOUND';
  });
  console.log('MODAL INNER TEXT:\n', modalHtml);

  await page.screenshot({ path: path.join(screenshotsDir, 'debug_modal.png'), fullPage: true });
  console.log('Debug screenshot saved.');

  await context.close();
})();
