const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });

  const url = 'https://h2m.maxp.online/proposal/codetreps-growth-os';
  console.log('Navigating to', url);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const brainDir = 'C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\6672c613-01d4-4114-836d-ceee6b3830e9';

  // 1. Full page
  await page.screenshot({ path: path.join(brainDir, 'live_audit_full.png'), fullPage: true });
  console.log('Saved live_audit_full.png');

  // 2. Sections
  const sections = await page.$$('main > *');
  console.log('Found main child sections:', sections.length);

  for (let i = 0; i < sections.length; i++) {
    const sec = sections[i];
    const secPath = path.join(brainDir, `live_sec_${i}.png`);
    try {
      await sec.screenshot({ path: secPath });
      console.log(`Saved live_sec_${i}.png`);
    } catch (e) {
      console.warn(`Could not screenshot sec ${i}:`, e.message);
    }
  }

  await browser.close();
  console.log('All sections captured!');
})();
