const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const OUTPUT_DIR = path.join(__dirname, '..', 'apps', 'frontend', 'public', 'operix-assets', 'maxp-screens');

if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Mock User & Company: Swan Store (High Fashion Apparel)
const mockUser = {
  id: 'cmleybpg2002bjuo2m44y4kip',
  firstName: 'سوان',
  lastName: 'ستور',
  name: 'سوان ستور للأزياء',
  email: 'swan@h2m.com',
  role: 'COMPANY_ADMIN',
  companyId: 'cmu5iix000aa6juwmmqcrls8i',
  company: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    slug: 'swan',
    currency: 'EGP',
    logo: '/logo.png',
    activeApps: ['store', 'orders', 'inventory', 'shipping', 'pos', 'marketing', 'shipping-ops'],
    installedApps: ['store', 'orders', 'inventory', 'shipping', 'pos', 'marketing', 'shipping-ops']
  },
  companies: [
    {
      id: 'cmu5iix000aa6juwmmqcrls8i',
      name: 'سوان ستور للأزياء الراقية',
      role: 'COMPANY_ADMIN',
      currency: 'EGP'
    }
  ],
  currentCompany: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    role: 'COMPANY_ADMIN',
    currency: 'EGP',
    activeApps: ['store', 'orders', 'inventory', 'shipping', 'pos', 'marketing', 'shipping-ops']
  },
  permissions: ['*']
};

const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWxleWJwZzIwMDJianVvMm00NHk0a2lwIiwiZW1haWwiOiJzd2FuQGgybS5jb20iLCJyb2xlIjoiQ09NUEFOWV9BRE1JTiIsImNvbXBhbnlJZCI6ImNtdTVpaXgwMDBhYTZqdXdtbXFjcmxzOGkiLCJpYXQiOjE3OTM2Njc3OTIsImV4cCI6MTc5MzY5NjU5Mn0.5DmNV_7HWvDrSYkStQkb41s3x-ZJ62CQ30ynobUVYWQ';

// Mock Warehouses
const mockWarehouses = [
  { id: 'wh-cairo', name: 'المخزن الرئيسي - التجمع الخامس' },
  { id: 'wh-alex', name: 'فرع ومخزن الإسكندرية - سموحة' },
  { id: 'wh-zayed', name: 'فرع الشيخ زايد - أركان' }
];

// Mock Inventory Items
const mockInventoryItems = [
  {
    id: 'inv-1',
    productId: 'p-1',
    products: { name: 'فستان سواريه شيفون ملكي بيج', sku: 'SW-DRS-01', price: 2450, cost: 1200 },
    warehouseId: 'wh-cairo',
    warehouses: { name: 'المخزن الرئيسي - التجمع' },
    quantity: 148,
    available: 132,
    reserved: 16,
    reorderPoint: 30,
    batchNumber: 'B-2026-09',
    updatedAt: new Date().toISOString(),
    canEditStock: true
  },
  {
    id: 'inv-2',
    productId: 'p-2',
    products: { name: 'عباية كريب رويال تطريز حرير يدوي', sku: 'SW-ABY-04', price: 3890, cost: 1850 },
    warehouseId: 'wh-cairo',
    warehouses: { name: 'المخزن الرئيسي - التجمع' },
    quantity: 84,
    available: 71,
    reserved: 13,
    reorderPoint: 20,
    batchNumber: 'B-2026-10',
    updatedAt: new Date().toISOString(),
    canEditStock: true
  },
  {
    id: 'inv-3',
    productId: 'p-3',
    products: { name: 'بليزر لينين إيطالي أوفر سايز زيتي', sku: 'SW-BLZ-12', price: 1950, cost: 920 },
    warehouseId: 'wh-alex',
    warehouses: { name: 'فرع الإسكندرية - سموحة' },
    quantity: 92,
    available: 85,
    reserved: 7,
    reorderPoint: 25,
    batchNumber: 'B-2026-11',
    updatedAt: new Date().toISOString(),
    canEditStock: true
  },
  {
    id: 'inv-4',
    productId: 'p-4',
    products: { name: 'طقم كتان كامل (قميص وبنطلون روز)', sku: 'SW-SET-08', price: 2100, cost: 1050 },
    warehouseId: 'wh-zayed',
    warehouses: { name: 'فرع الشيخ زايد - أركان' },
    quantity: 65,
    available: 54,
    reserved: 11,
    reorderPoint: 15,
    batchNumber: 'B-2026-12',
    updatedAt: new Date().toISOString(),
    canEditStock: true
  },
  {
    id: 'inv-5',
    productId: 'p-5',
    products: { name: 'طرحة حرير طبيعي بيور أوف وايت', sku: 'SW-SCF-02', price: 400, cost: 180 },
    warehouseId: 'wh-cairo',
    warehouses: { name: 'المخزن الرئيسي - التجمع' },
    quantity: 340,
    available: 312,
    reserved: 28,
    reorderPoint: 50,
    batchNumber: 'B-2026-08',
    updatedAt: new Date().toISOString(),
    canEditStock: true
  }
];

// Mock Dashboard Metrics
const mockDashboardData = {
  success: true,
  company: {
    id: 'cmu5iix000aa6juwmmqcrls8i',
    name: 'سوان ستور للأزياء الراقية',
    currency: 'EGP'
  },
  counts: {
    orders: 4128,
    products: 184,
    customers: 8940,
    conversations: 12450
  },
  metrics: {
    orders: 142,
    conversionRate: 4.8,
    confirmedOrders: 136,
    confirmedRate: 95.7,
    deliveredOrders: 128,
    returnRate: 4.3,
    piecesPerOrder: 2.1
  },
  financials: {
    totalRevenue: 348500,
    codCollected: 214000,
    digitalPaid: 134500,
    averageOrderValue: 2454
  },
  revenueTrend: [
    { date: '2026-10-27', revenue: 42100, orders: 18 },
    { date: '2026-10-28', revenue: 51300, orders: 22 },
    { date: '2026-10-29', revenue: 48900, orders: 20 },
    { date: '2026-10-30', revenue: 64500, orders: 27 },
    { date: '2026-10-31', revenue: 58200, orders: 24 },
    { date: '2026-11-01', revenue: 72100, orders: 31 },
    { date: '2026-11-02', revenue: 84200, orders: 36 }
  ]
};

// Mock Orders
const mockOrders = [
  {
    id: 'ord_10821',
    orderNumber: 'SW-10821',
    customerName: 'مي أحمد العبد',
    customerPhone: '01012345678',
    customerAddress: 'التجمع الخامس - حي النرجس، فيلا 14، القاهرة',
    total: 2450,
    subtotal: 2350,
    shippingCost: 100,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'SHIPPED',
    bostaTracking: 'BST-EG-99214',
    status: 'SHIPPED',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_1', name: 'فستان ميدي شيفون بيج سواريه', quantity: 1, price: 1650 },
      { id: 'item_2', name: 'طرحة حرير بيور أوف وايت', quantity: 2, price: 400 }
    ]
  },
  {
    id: 'ord_10822',
    orderNumber: 'SW-10822',
    customerName: 'سارة عبد الرحمن فؤاد',
    customerPhone: '01123456789',
    customerAddress: 'سموحة - ش فوزي معاذ - برج السلام، الإسكندرية',
    total: 3890,
    subtotal: 3790,
    shippingCost: 100,
    paymentMethod: 'INSTAPAY',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'DELIVERED',
    bostaTracking: 'BST-EG-99215',
    status: 'DELIVERED',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_3', name: 'عباية كريب رويال كحلي تطريز يدوي', quantity: 1, price: 2890 },
      { id: 'item_4', name: 'حزام جلد طبيعي نبيتي', quantity: 1, price: 900 }
    ]
  },
  {
    id: 'ord_10823',
    orderNumber: 'SW-10823',
    customerName: 'هدى مصطفى صادق',
    customerPhone: '01234567890',
    customerAddress: 'الدقي - ش مصدق، الجيزة',
    total: 1950,
    subtotal: 1850,
    shippingCost: 100,
    paymentMethod: 'COD',
    paymentStatus: 'PENDING',
    fulfillmentStatus: 'OUT_FOR_DELIVERY',
    bostaTracking: 'BST-EG-99218',
    status: 'OUT_FOR_DELIVERY',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_5', name: 'بليزر لينين زيتي كلاسيك', quantity: 1, price: 1950 }
    ]
  },
  {
    id: 'ord_10824',
    orderNumber: 'SW-10824',
    customerName: 'نورهان طارق الشريف',
    customerPhone: '01511223344',
    customerAddress: 'مدينة نصر - عباس العقاد، القاهرة',
    total: 4200,
    subtotal: 4100,
    shippingCost: 100,
    paymentMethod: 'CARD',
    paymentStatus: 'PAID',
    fulfillmentStatus: 'PROCESSING',
    bostaTracking: 'BST-EG-99220',
    status: 'PROCESSING',
    createdAt: new Date().toISOString(),
    items: [
      { id: 'item_6', name: 'طقم كتان كامل - بنطلون وقميص روز', quantity: 2, price: 2100 }
    ]
  }
];

// Mock Shipping Parcels (Bosta Integration)
const mockParcels = [
  {
    id: 'pcl-01',
    trackingNumber: 'BST-EG-99214',
    carrier: 'Bosta',
    carrierLogo: '/carriers/bosta.png',
    customerName: 'مي أحمد العبد',
    destinationCity: 'القاهرة - التجمع الخامس',
    codAmount: 2450,
    status: 'OUT_FOR_DELIVERY',
    pickupDate: '2026-11-02',
    deliveryAttempts: 1,
    awbUrl: 'https://bosta.co/awb/99214'
  },
  {
    id: 'pcl-02',
    trackingNumber: 'BST-EG-99215',
    carrier: 'Bosta',
    carrierLogo: '/carriers/bosta.png',
    customerName: 'سارة عبد الرحمن فؤاد',
    destinationCity: 'الإسكندرية - سموحة',
    codAmount: 0,
    status: 'DELIVERED',
    pickupDate: '2026-11-01',
    deliveryAttempts: 1,
    awbUrl: 'https://bosta.co/awb/99215'
  },
  {
    id: 'pcl-03',
    trackingNumber: 'BST-EG-99218',
    carrier: 'Bosta',
    carrierLogo: '/carriers/bosta.png',
    customerName: 'هدى مصطفى صادق',
    destinationCity: 'الجيزة - الدقي',
    codAmount: 1950,
    status: 'IN_TRANSIT',
    pickupDate: '2026-11-02',
    deliveryAttempts: 0,
    awbUrl: 'https://bosta.co/awb/99218'
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

  // Inject session storage and local storage
  await page.addInitScript(({ user, jwt }) => {
    localStorage.setItem('token', jwt);
    localStorage.setItem('accessToken', jwt);
    localStorage.setItem('maxp_token', jwt);
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('currentCompanyId', user.companyId);
    localStorage.setItem('activeCompanyId', user.companyId);

    sessionStorage.setItem('token', jwt);
    sessionStorage.setItem('accessToken', jwt);
    sessionStorage.setItem('maxp_token', jwt);
    sessionStorage.setItem('user', JSON.stringify(user));
  }, { user: mockUser, jwt: mockJwt });

  // Route interception
  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.includes('/auth/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: { user: mockUser } })
      });
    }

    if (url.includes('/companies/current')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser.currentCompany)
      });
    }

    if (url.includes('/company-dashboard')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDashboardData)
      });
    }

    if (url.includes('/orders')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockOrders,
          pagination: { total: mockOrders.length, page: 1, limit: 20 }
        })
      });
    }

    if (url.includes('/inventory/alerts')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            lowStock: [mockInventoryItems[3]],
            outOfStock: []
          }
        })
      });
    }

    if (url.includes('/inventory')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockInventoryItems
        })
      });
    }

    if (url.includes('/warehouses')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockWarehouses
        })
      });
    }

    if (url.includes('/shipping-ops') || url.includes('/parcels')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: mockParcels,
          parcels: mockParcels
        })
      });
    }

    return route.continue();
  });

  const targets = [
    {
      name: 'maxp-orders',
      path: '/orders',
      waitSelector: 'table, main',
      label: 'إدارة الطلبات والمبيعات والشحن'
    },
    {
      name: 'maxp-inventory',
      path: '/inventory',
      waitSelector: 'table, main',
      label: 'إدارة المخزون وتعدد الفروع والمستودعات'
    },
    {
      name: 'maxp-dashboard',
      path: '/company-dashboard',
      waitSelector: 'main, [class*="grid"]',
      label: 'لوحة التحكم والتحليلات المالية والتحصيل'
    },
    {
      name: 'maxp-pos',
      path: '/pos',
      waitSelector: 'main, [class*="pos"]',
      label: 'نقطة البيع والكاشير المباشر في الفروع'
    }
  ];

  for (const t of targets) {
    console.log(`\n=== Capturing [${t.name}] (${t.label}) ===`);
    try {
      await page.goto(`http://127.0.0.1:5173${t.path}`, { waitUntil: 'networkidle', timeout: 25000 });
      await page.waitForTimeout(2000);

      const pageTitle = await page.title();
      console.log(`  Page title: ${pageTitle}`);

      const pngFile = path.join(OUTPUT_DIR, `${t.name}.png`);
      await page.screenshot({ path: pngFile, fullPage: false });
      const stat = fs.statSync(pngFile);
      console.log(`  Saved screenshot: ${pngFile} (${stat.size} bytes)`);
    } catch (err) {
      console.error(`  Error capturing ${t.name}:`, err.message);
    }
  }

  await browser.close();
  console.log('\nMaster capture finished successfully!');
})();
