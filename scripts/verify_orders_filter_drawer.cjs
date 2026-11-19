const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/mokhtar/.gemini/antigravity/brain/41ef79a3-5cc9-46f9-9677-3f9a7948aeaa';

(async () => {
  let browser;
  try {
    let switchedToken = null;
    let switchedUser = null;
    try {
      const loginRes = await fetch('https://maxp.online/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'swan@h2m.com', password: '0165676135' })
      });
      const loginData = await loginRes.json();
      if (loginData?.data?.token) {
        const token = loginData.data.token;
        const switchRes = await fetch('https://maxp.online/api/v1/auth/switch-company/cmu5iix000aa6juwmmqcrls8i', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }
        });
        const switchData = await switchRes.json();
        switchedToken = switchData?.data?.token || token;
        const meRes = await fetch('https://maxp.online/api/v1/auth/me', {
          headers: { Authorization: 'Bearer ' + switchedToken }
        });
        const meData = await meRes.json();
        switchedUser = meData?.data || { id: 'test', email: 'swan@h2m.com' };
      }
    } catch (e) {
      console.log('Online auth fetch error:', e.message);
    }

    browser = await chromium.launch({ headless: true, channel: 'msedge' });

    // 1. LIGHT MODE TEST
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: 'light',
      });

      if (switchedToken) {
        await context.addInitScript(({ token, user }) => {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('currentCompanyId', 'cmu5iix000aa6juwmmqcrls8i');
          localStorage.setItem('active_company_id', 'cmu5iix000aa6juwmmqcrls8i');
          localStorage.setItem('theme', 'light');
          document.documentElement.classList.remove('dark');
          document.documentElement.setAttribute('dir', 'rtl');
        }, { token: switchedToken, user: switchedUser });
      }

      const page = await context.newPage();
      await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);

      const filterBtn = page.locator('button[aria-label="الفلاتر"], button:has-text("الفلاتر")').first();
      await filterBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ord_filter_drawer_light_after.png'), fullPage: false });
      console.log('Saved ord_filter_drawer_light_after.png');

      const statusTrigger = page.locator('button[aria-label="كل الحالات"]').first();
      if (await statusTrigger.isVisible()) {
        await statusTrigger.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ord_filter_popover_light_after.png'), fullPage: false });
        console.log('Saved ord_filter_popover_light_after.png');
      }
      await context.close();
    }

    // 2. DARK MODE TEST
    {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 900 },
        colorScheme: 'dark',
      });

      if (switchedToken) {
        await context.addInitScript(({ token, user }) => {
          localStorage.setItem('auth_token', token);
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('currentCompanyId', 'cmu5iix000aa6juwmmqcrls8i');
          localStorage.setItem('active_company_id', 'cmu5iix000aa6juwmmqcrls8i');
          localStorage.setItem('theme', 'dark');
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('dir', 'rtl');
        }, { token: switchedToken, user: switchedUser });
      }

      const page = await context.newPage();
      await page.goto('http://localhost:3001/orders', { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(2500);

      const filterBtn = page.locator('button[aria-label="الفلاتر"], button:has-text("الفلاتر")').first();
      await filterBtn.click();
      await page.waitForTimeout(1000);

      await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ord_filter_drawer_dark_after.png'), fullPage: false });
      console.log('Saved ord_filter_drawer_dark_after.png');

      const statusTrigger = page.locator('button[aria-label="كل الحالات"]').first();
      if (await statusTrigger.isVisible()) {
        await statusTrigger.click();
        await page.waitForTimeout(800);
        await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ord_filter_popover_dark_after.png'), fullPage: false });
        console.log('Saved ord_filter_popover_dark_after.png');
      }
      await context.close();
    }

  } catch (err) {
    console.error('Test error:', err);
  } finally {
    if (browser) await browser.close();
  }
})();
