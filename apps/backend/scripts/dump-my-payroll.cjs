const { chromium } = require("playwright");
const BASE = "https://maxp.online";
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
(async () => {
  const browser = await chromium.launch({ executablePath: CHROME });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/login", { waitUntil: "domcontentloaded" });
  await page.fill("#email", "trial.agent@maxp.test");
  await page.fill("#password", "Maxp@2026");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(9000);
  await page.goto(BASE + "/my-payroll", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(6000);
  const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " "));
  console.log(txt.slice(0, 900));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
