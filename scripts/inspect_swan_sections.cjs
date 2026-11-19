const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--host-rules=MAP swan.maxp.online 172.67.198.46, MAP maxp.online 172.67.198.46']
  });
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.goto('https://swan.maxp.online/shop', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const data = await page.evaluate(() => {
    // Check all headers, sections, and product grids
    const sectionTags = Array.from(document.querySelectorAll('section')).map((s, i) => ({
      index: i,
      id: s.id,
      className: s.className,
      first100Chars: s.innerText.slice(0, 100).replace(/\s+/g, ' ')
    }));

    // Check how many times filters appear
    const filterButtons = Array.from(document.querySelectorAll('button')).filter(b => b.innerText.includes('فلاتر') || b.innerText.includes('الفلاتر')).map(b => b.innerText.trim());

    // Check how many times sort appears
    const sortSelects = Array.from(document.querySelectorAll('select')).map(s => ({
      id: s.id,
      name: s.name,
      className: s.className,
      options: Array.from(s.options).map(o => o.text)
    }));

    // Check how many times categories appear
    const categoryContainers = Array.from(document.querySelectorAll('[class*="overflow-x-auto"]')).map(el => el.innerText.replace(/\s+/g, ' '));

    // Check how many product cards are on the page
    const productCardTitles = Array.from(document.querySelectorAll('h3')).map(h => h.innerText.trim());

    return {
      sectionTags,
      filterButtons,
      sortSelects,
      categoryContainers,
      totalProductTitles: productCardTitles.length,
      sampleProductTitles: productCardTitles.slice(0, 10)
    };
  });

  console.log(JSON.stringify(data, null, 2));
  await browser.close();
})();
