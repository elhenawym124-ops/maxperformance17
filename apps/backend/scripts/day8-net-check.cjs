const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  const reqs = [];
  page.on("response", async (r) => {
    if (r.url().includes("/facebook-ads/campaigns")) {
      reqs.push({ url: r.url().replace(BASE, ""), status: r.status(), body: (await r.text().catch(() => "")).slice(0, 120) });
    }
  });
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "trial.marketing@maxp.test");
  await page.fill("#password", "Maxp@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(BASE + "/advertising/facebook-ads/campaigns", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(10000);
  const t = await page.evaluate(() => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " "));
  console.log(JSON.stringify({ reqs, hasLocal: /حملات محلية مسجّلة/.test(t) }, null, 1).slice(0, 1200));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
