const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'maxp-screens');

const mockUser = {
  id: 'cmleybpg2002bjuo2m44y4kip',
  name: 'سوان ستور للأزياء',
  email: 'swan@h2m.com',
  role: 'COMPANY_ADMIN',
  companyId: 'cmu5iix000aa6juwmmqcrls8i',
  company: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    currency: 'EGP',
    activeApps: ['store', 'orders', 'inventory', 'shipping', 'pos', 'marketing']
  },
  currentCompany: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    currency: 'EGP',
    activeApps: ['store', 'orders', 'inventory', 'shipping', 'pos', 'marketing']
  },
  permissions: ['*']
};

const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWxleWJwZzIwMDJianVvMm00NHk0a2lwIiwiZW1haWwiOiJzd2FuQGgybS5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdTVpaXgwMDBhYTZqdXdtbXFjcmxzOGkiLCJpYXQiOjE3OTM2Njc3OTIsImV4cCI6MTc5MzY5NjU5Mn0.5DmNV_7HWvDrSYkStQkb41s3x-ZJ62CQ30ynobUVYWQ';

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-gpu']
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    locale: 'ar-EG'
  });

  await page.addInitScript(({ user, jwt }) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('accessToken', jwt);
    localStorage.setItem('maxp_token', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentCompanyId', user.companyId);
    localStorage.setItem('activeCompanyId', user.companyId);
  }, { user: mockUser, jwt: mockJwt });

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { user: mockUser } }) });
    }
    if (url.includes('/companies/current')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser.currentCompany) });
    }
    return route.continue();
  });

  console.log('Capturing /orders/bosta-records ...');
  await page.goto('http://127.0.0.1:5173/orders/bosta-records', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2000);

  const pngFile = path.join(OUTPUT_DIR, 'maxp-shipping.png');
  await page.screenshot({ path: pngFile, fullPage: false });
  console.log('Saved maxp-shipping.png successfully!');

  await browser.close();
})();
