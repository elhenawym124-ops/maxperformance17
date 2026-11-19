const { chromium } = require('playwright');

async function testPage() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on('console', msg => console.log(`[CONSOLE ${msg.type()}]:`, msg.text()));
  page.on('pageerror', err => console.log('[PAGE ERROR]:', err));

  await page.addInitScript(() => {
    const mockUser = {
      id: "u-mock-admin-89",
      name: "مدير المتجر العام",
      email: "admin@maxp.online",
      role: "OWNER",
      companyId: "c-mock-89",
      companies: [{ id: "c-mock-89", name: "شركة الأفق الرقمي", role: "OWNER", logo: "/logo.png" }],
      currentCompany: { id: "c-mock-89", name: "شركة الأفق الرقمي", role: "OWNER", logo: "/logo.png" }
    };
    const mockJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6InN1cGVyLWFkbWluLWlkIiwicm9sZSI6IlNVUEVSX0FETUlOIiwiZXhwIjoyNTI0NjA4MDAwfQ.mocksignature";
    localStorage.setItem("token", mockJwt);
    localStorage.setItem("accessToken", mockJwt);
    localStorage.setItem("user", JSON.stringify(mockUser));
    sessionStorage.setItem("token", mockJwt);
    sessionStorage.setItem("user", JSON.stringify(mockUser));
    localStorage.setItem("companyId", "c-mock-89");
    localStorage.setItem("activeCompanyId", "c-mock-89");
  });

  await page.route('**/*', route => {
    const url = route.request().url();
    if (url.includes('/comments/facebook-pages')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ pageId: "p1", pageName: "صفحة الاختبار", totalPosts: 10, totalComments: 50 }]
        })
      });
    }
    if (url.includes('/api/')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] })
      });
    }
    return route.continue();
  });

  console.log("Navigating to /unified-comments-split...");
  await page.goto('http://127.0.0.1:5173/unified-comments-split', { waitUntil: 'networkidle', timeout: 15000 });
  await page.waitForTimeout(1000);
  console.log("Navigation complete!");
  await browser.close();
}

testPage().catch(e => console.error("RUN ERR:", e));
