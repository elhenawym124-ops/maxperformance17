const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function test() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5 });
  await page.goto('https://h2m.maxp.online/proposal/codetreps-growth-os', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const el = await page.$('#telemetry');
  console.log('Telemetry element found:', !!el);
  if (el) {
    const box = await el.boundingBox();
    console.log('Telemetry bounding box:', box);
    const brainDir = 'C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\6672c613-01d4-4114-836d-ceee6b3830e9';
    await el.screenshot({ path: path.join(brainDir, 'live_telemetry_section.png') });
    console.log('Saved live_telemetry_section.png');
  }
  await browser.close();
}
test().catch(console.error);
