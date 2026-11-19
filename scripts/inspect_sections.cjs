const { chromium } = require('playwright');

async function test() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto('https://h2m.maxp.online/proposal/codetreps-growth-os', { waitUntil: 'networkidle', timeout: 45000 });
  await page.waitForTimeout(3000);

  const sections = await page.$$eval('section', els => els.map(e => ({ id: e.id, class: e.className.slice(0, 30), text: e.innerText.slice(0, 50) })));
  console.log('Sections on page:', sections);
  await browser.close();
}
test().catch(console.error);
