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
  for (const p of ["/admin/education/enrollments", "/admin/education/packages"]) {
    await page.goto(BASE + p, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(5000);
    const info = await page.evaluate(() => {
      const main = document.querySelector("main");
      return {
        head: (main?.innerText || "").replace(/\s+/g, " ").slice(0, 260),
        buttons: [...(main?.querySelectorAll("button") ?? [])].map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 16),
      };
    });
    console.log("=== " + p + " ===");
    console.log(JSON.stringify(info, null, 1).slice(0, 1100));
  }
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
