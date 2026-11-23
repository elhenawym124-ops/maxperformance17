const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 860 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/parent/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "011306128");
  await page.fill("#password", "Parent@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  const txt = await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " "));
  const kids = txt.match(/الأبناء المسجلين\s*(\d+)/);
  console.log(JSON.stringify({ url: page.url(), childSeen: /اليوم٥/.test(txt), children: kids ? kids[1] : "n/a", head: txt.slice(0, 120) }, null, 1));
  await page.screenshot({ path: "docs/qa/trial-14d/evidence/52-day5-parent-portal.png" });
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
