const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "trial.owner@maxp.test");
  await page.fill("#password", "Maxp@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(BASE + "/admin/education/enrollments", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  await page.locator('main button:has-text("إضافة تسجيل جديد")').first().click();
  await page.waitForTimeout(3000);
  const info = await page.evaluate(() => {
    const overlays = [...document.querySelectorAll('[class*="fixed"]')]
      .map(e => ({ cls: (e.className || "").toString().slice(0, 40), text: (e.innerText || "").replace(/\s+/g, " ").slice(0, 300) }))
      .filter(x => x.text.length > 40);
    return {
      url: location.pathname,
      overlays: overlays.slice(0, 2),
      fields: [...document.querySelectorAll("input,select,textarea")].map((e, i) => ({ i, tag: e.tagName, type: e.type, ph: e.placeholder })).slice(0, 14),
      buttons: [...document.querySelectorAll("button")].map(b => (b.innerText || "").trim()).filter(t => /حفظ|إضافة|تسجيل|إلغاء/.test(t)).slice(0, 8),
    };
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 1800));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
