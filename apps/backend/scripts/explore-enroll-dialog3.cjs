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
    const ov = [...document.querySelectorAll('[class*="fixed"]')].find(e => /إضافة تسجيل|تسجيل جديد|الباقة/.test(e.innerText || ""));
    const selects = ov ? [...ov.querySelectorAll("select")] : [];
    return {
      text: ov ? ov.innerText.replace(/\s+/g, " ").slice(0, 500) : "none",
      selects: selects.map((s, i) => ({ i, opts: [...s.options].slice(0, 4).map(o => o.text.slice(0, 30)) })),
    };
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 1600));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
