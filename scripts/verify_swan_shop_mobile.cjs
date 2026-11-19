const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.5 Mobile/15E148 Safari/604.1',
    isMobile: true,
    hasTouch: true,
    locale: 'ar-EG',
  });

  const page = await context.newPage();
  console.log('Navigating to https://swan.maxp.online/shop...');
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for product cards
  await page.waitForTimeout(3000);

  const screenshotDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true });
  }

  // Viewport screenshot
  const vpPath = path.join(screenshotDir, 'swan_mobile_viewport.png');
  await page.screenshot({ path: vpPath });
  console.log('Saved viewport screenshot to:', vpPath);

  // Inspect DOM elements
  const data = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button')).map(b => b.innerText.trim()).filter(Boolean);
    const bodyText = document.body.innerText;
    const hasZapEmoji = bodyText.includes('⚡');
    const currencyMatches = bodyText.match(/(?:EGP\s*[\d,.]+|[\d,.]+\s*ج\.م)/g) || [];
    
    // Find product card CTAs
    const productCards = Array.from(document.querySelectorAll('article, [class*="group relative"]'));
    const cardButtons = Array.from(document.querySelectorAll('button')).filter(b => 
      b.innerText.includes('طلب') || b.innerText.includes('مقاس') || b.innerText.includes('أضف')
    ).map(b => b.innerText.trim());

    // Check category pills in ShopCommandBar
    const categoryButtons = Array.from(document.querySelectorAll('section button')).map(b => b.innerText.trim());

    return {
      buttonsCount: buttons.length,
      sampleButtons: buttons.slice(0, 15),
      hasZapEmoji,
      currencyMatches: currencyMatches.slice(0, 10),
      cardButtons: cardButtons.slice(0, 10),
      categoryButtons: categoryButtons.slice(0, 10),
    };
  });

  console.log('Verification data:', JSON.stringify(data, null, 2));

  await browser.close();
})();
