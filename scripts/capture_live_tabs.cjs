const { chromium } = require('playwright');
const path = require('path');

async function test() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await page.goto('https://h2m.maxp.online/proposal/codetreps-growth-os', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(2000);

  const brainDir = 'C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\6672c613-01d4-4114-836d-ceee6b3830e9';

  // Find tab button with text 'التقارير وقياس الأداء'
  const tabButton = await page.$('button:has-text("التقارير وقياس الأداء")');
  console.log('Tab button found:', !!tabButton);
  if (tabButton) {
    await tabButton.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(brainDir, 'live_tab_telemetry_active.png'), clip: { x: 0, y: 700, width: 1440, height: 1100 } });
    console.log('Saved live_tab_telemetry_active.png');
  }

  // Also capture full hero and overview
  await page.screenshot({ path: path.join(brainDir, 'live_page_top.png'), clip: { x: 0, y: 0, width: 1440, height: 950 } });

  await browser.close();
}
test().catch(console.error);
