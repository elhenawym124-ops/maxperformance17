const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "trial.marketing@maxp.test");
  await page.fill("#password", "Maxp@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(BASE + "/advertising/facebook-ads/campaigns", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(9000);
  const t = await page.evaluate(() => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " "));
  console.log(JSON.stringify({
    hasCampaign1: /تسجيل الترم/.test(t),
    hasCampaign2: /إعادة استهداف/.test(t),
    hint: /حملات محلية|بدون ربط|لا يوجد حساب/.test(t),
    tail: t.slice(-320),
  }, null, 1));
  await page.screenshot({ path: "docs/qa/trial-14d/evidence/55-day8-campaigns.png" });
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
