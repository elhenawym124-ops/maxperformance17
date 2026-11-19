const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'maxp-screens');

const mockUser = {
  id: 'cmleybpg2002bjuo2m44y4kip',
  firstName: 'كاشير',
  lastName: 'سوان',
  name: 'سوان ستور للأزياء',
  email: 'swan@h2m.com',
  role: 'COMPANY_ADMIN',
  companyId: 'cmu5iix000aa6juwmmqcrls8i',
  company: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    currency: 'EGP',
    activeApps: ['pos-pro', 'store-pro', 'pos', 'store', 'orders', 'inventory'],
    installedApps: ['pos-pro', 'store-pro', 'pos', 'store', 'orders', 'inventory']
  },
  currentCompany: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    currency: 'EGP',
    activeApps: ['pos-pro', 'store-pro', 'pos', 'store', 'orders', 'inventory'],
    installedApps: ['pos-pro', 'store-pro', 'pos', 'store', 'orders', 'inventory']
  },
  permissions: ['*']
};

const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWxleWJwZzIwMDJianVvMm00NHk0a2lwIiwiZW1haWwiOiJzd2FuQGgybS5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdTVpaXgwMDBhYTZqdXdtbXFjcmxzOGkiLCJpYXQiOjE3OTM2Njc3OTIsImV4cCI6MTc5MzY5NjU5Mn0.5DmNV_7HWvDrSYkStQkb41s3x-ZJ62CQ30ynobUVYWQ';

const mockProducts = [
  {
    id: 'prod-1',
    name: 'فستان سواريه شيفون ملكي بيج',
    price: 2450,
    sku: 'SW-DRS-01',
    category: { name: 'فساتين وسواريه' },
    stock: 45,
    trackInventory: true
  },
  {
    id: 'prod-2',
    name: 'عباية كريب رويال تطريز حرير يدوي',
    price: 3890,
    sku: 'SW-ABY-04',
    category: { name: 'عبايات كريب' },
    stock: 28,
    trackInventory: true
  },
  {
    id: 'prod-3',
    name: 'بليزر لينين إيطالي أوفر سايز زيتي',
    price: 1950,
    sku: 'SW-BLZ-12',
    category: { name: 'بليزرات وكاجوال' },
    stock: 35,
    trackInventory: true
  },
  {
    id: 'prod-4',
    name: 'طقم كتان كامل (قميص وبنطلون روز)',
    price: 2100,
    sku: 'SW-SET-08',
    category: { name: 'أطقم كتان' },
    stock: 19,
    trackInventory: true
  },
  {
    id: 'prod-5',
    name: 'طرحة حرير طبيعي بيور أوف وايت',
    price: 400,
    sku: 'SW-SCF-02',
    category: { name: 'إكسسوارات وطرح' },
    stock: 120,
    trackInventory: true
  },
  {
    id: 'prod-6',
    name: 'فستان حرير ساتان سهرة كحلي',
    price: 2750,
    sku: 'SW-DRS-09',
    category: { name: 'فساتين وسواريه' },
    stock: 22,
    trackInventory: true
  }
];

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
    if (url.includes('/products')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: mockProducts }) });
    }
    return route.continue();
  });

  console.log('Navigating to http://127.0.0.1:5173/pos ...');
  await page.goto('http://127.0.0.1:5173/pos', { waitUntil: 'networkidle', timeout: 25000 });
  await page.waitForTimeout(2000);

  // Click first product card to populate cart
  const productCards = await page.$$('button, div[role="button"], [class*="product-card"], [class*="cursor-pointer"]');
  console.log(`Found ${productCards.length} clickable elements on POS page`);

  // Try clicking product item
  const itemBtn = await page.$('text=فستان سواريه شيفون ملكي بيج');
  if (itemBtn) {
    await itemBtn.click();
    await page.waitForTimeout(500);
  }
  const itemBtn2 = await page.$('text=طرحة حرير طبيعي بيور أوف وايت');
  if (itemBtn2) {
    await itemBtn2.click();
    await page.waitForTimeout(500);
  }

  const pngPath = path.join(OUTPUT_DIR, 'maxp-pos.png');
  await page.screenshot({ path: pngPath, fullPage: false });
  console.log('Saved flawless maxp-pos.png');

  // Convert to WebP
  const base64Png = fs.readFileSync(pngPath).toString('base64');
  const webpBase64 = await page.evaluate(async (uri) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const webpUri = canvas.toDataURL('image/webp', 0.90);
        resolve(webpUri.split(',')[1]);
      };
      img.src = uri;
    });
  }, `data:image/png;base64,${base64Png}`);

  const webpPath = path.join(OUTPUT_DIR, 'maxp-pos.webp');
  fs.writeFileSync(webpPath, Buffer.from(webpBase64, 'base64'));
  const stat = fs.statSync(webpPath);
  console.log(`Converted maxp-pos.webp (${(stat.size / 1024).toFixed(1)} KB)`);

  await browser.close();
})();
