const { chromium } = require('playwright');
const path = require('path');
const ARTIFACT_DIR = 'C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\33542c37-73aa-499d-9499-fcc91fecaa34';

async function run() {
  console.log('=== Step 1: Login & Switch to Red Line ===');
  const loginRes = await fetch('https://maxp.online/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'swan@h2m.com', password: '0165676135' })
  });
  const { data: { token } } = await loginRes.json();
  const switchRes = await fetch('https://maxp.online/api/v1/auth/switch-company/cmu5iix000aa6juwmmqcrls8i', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
  });
  const { data: { token: switchedToken } } = await switchRes.json();
  const meRes = await fetch('https://maxp.online/api/v1/auth/me', {
    headers: { Authorization: 'Bearer ' + switchedToken }
  });
  const { data: switchedUser } = await meRes.json();
  console.log('Switched to:', switchedUser?.company?.name || 'red line');

  console.log('=== Step 2: Launch Chrome ===');
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox']
  });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  await page.goto('https://maxp.online/login', { waitUntil: 'domcontentloaded' });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('auth_token', token);
    localStorage.setItem('accessToken', token);
  }, { token: switchedToken, user: switchedUser });

  console.log('=== Step 3: Navigate to Preparation Queue ===');
  await page.goto('https://maxp.online/orders/preparation?pageSize=96', { waitUntil: 'networkidle', timeout: 35000 });
  await page.waitForTimeout(3000);

  // Click on 'الكل' tab to see all orders
  console.log('Clicking on الكل tab...');
  const allTab = page.locator('button:has-text("الكل")').first();
  await allTab.click();
  await page.waitForTimeout(3000);

  // Take screenshot of preparation table
  await page.screenshot({ path: path.join(ARTIFACT_DIR, '28_prep_table_all.png') });

  const rowCount = await page.locator('tbody tr').count();
  console.log('Row count in table after clicking الكل:', rowCount);

  // Select 4 orders
  const checkboxes = page.locator('tbody tr input[type="checkbox"]');
  const cbCount = await checkboxes.count();
  console.log('Checkboxes found:', cbCount);
  const toSelect = Math.min(4, cbCount);
  for (let i = 0; i < toSelect; i++) {
    await checkboxes.nth(i).click();
    await page.waitForTimeout(200);
  }

  // Click print button
  console.log('=== Step 4: Click Print Invoices Button ===');
  const printBtn = page.locator('button:has-text("طباعة")').first();
  console.log('Print button text:', await printBtn.innerText().catch(() => 'none'));

  // Listen for popup
  const [popup] = await Promise.all([
    context.waitForEvent('page', { timeout: 15000 }).catch(() => null),
    printBtn.click()
  ]);

  const targetPage = popup || page;
  console.log('Target page URL:', targetPage.url());
  await targetPage.waitForTimeout(4000);

  // Take screenshot of printed invoice
  const shotPath = path.join(ARTIFACT_DIR, '29_live_prep_printed_invoices.png');
  await targetPage.screenshot({ path: shotPath, fullPage: true });
  console.log('Printed invoices screenshot saved to:', shotPath);

  const textContent = await targetPage.evaluate(() => document.body.innerText);
  console.log('=== PRINTED INVOICE TEXT SAMPLE ===');
  console.log(textContent.slice(0, 1500));
  console.log('=== END SAMPLE ===');

  await browser.close();
}

run().catch(console.error);
