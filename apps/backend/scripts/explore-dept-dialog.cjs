const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "trial.hr@maxp.test");
  await page.fill("#password", "Maxp@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(BASE + "/hr/departments", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(4500);
  await page.locator('main button:has-text("إضافة قسم جديد")').first().click();
  await page.waitForTimeout(2500);
  const dump = await page.evaluate(() => {
    const ds = [...document.querySelectorAll('[role="dialog"]')];
    return ds.map((d, i) => ({
      i,
      text: d.innerText.replace(/\s+/g, " ").slice(0, 200),
      fields: [...d.querySelectorAll("input,textarea,select")].map((e) => ({ tag: e.tagName, type: e.type, ph: e.placeholder, name: e.name })),
      buttons: [...d.querySelectorAll("button")].map((b) => (b.innerText || "").trim()).filter(Boolean),
    }));
  });
  console.log(JSON.stringify(dump, null, 1).slice(0, 1800));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
