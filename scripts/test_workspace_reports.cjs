const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/mokhtar/.gemini/antigravity/brain/41ef79a3-5cc9-46f9-9677-3f9a7948aeaa';

(async () => {
  let browser;
  try {
    const loginRes = await fetch('https://maxp.online/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'swan@h2m.com', password: '0165676135' })
    });
    const loginData = await loginRes.json();
    const token = loginData?.data?.token;
    const switchRes = await fetch('https://maxp.online/api/v1/auth/switch-company/cmu5iix000aa6juwmmqcrls8i', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
    });
    const switchData = await switchRes.json();
    const switchedToken = switchData?.data?.token || token;
    const meRes = await fetch('https://maxp.online/api/v1/auth/me', {
      headers: { Authorization: 'Bearer ' + switchedToken }
    });
    const meData = await meRes.json();
    const switchedUser = meData?.data || { id: 'test', email: 'swan@h2m.com' };

    browser = await chromium.launch({ headless: true, channel: 'msedge' });
    const context = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      colorScheme: 'dark',
    });

    await context.addInitScript(({ token, user }) => {
      localStorage.setItem('auth_token', token);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      localStorage.setItem('currentCompanyId', 'cmu5iix000aa6juwmmqcrls8i');
      localStorage.setItem('active_company_id', 'cmu5iix000aa6juwmmqcrls8i');
      localStorage.setItem('theme', 'dark');
      document.documentElement.classList.add('dark');
    }, { token: switchedToken, user: switchedUser });

    const page = await context.newPage();
    const targetUrl = 'http://127.0.0.1:3001/orders/confirmation-queue';
    console.log('Navigating to', targetUrl);
    await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    });
    await page.waitForTimeout(4000);

    console.log('Clicking on reports tab in tablist...');
    await page.click('div[role="tablist"] button[role="tab"]:has-text("التقارير")');
    console.log('Clicked! Waiting for reports to render...');
    await page.waitForTimeout(6000);

    const shotPath = path.join(ARTIFACT_DIR, 'ord_workspace_reports_b199_after.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('Saved to', shotPath);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    if (browser) await browser.close();
  }
})();
