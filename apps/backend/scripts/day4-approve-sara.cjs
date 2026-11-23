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
  await page.goto(BASE + "/hr/payroll", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const rows = page.locator("main table tbody tr");
  const n = await rows.count();
  let picked = false;
  for (let i = 0; i < n; i++) {
    const t = await rows.nth(i).innerText();
    if (t.includes("سارة") && t.includes("مسودة")) {
      await rows.nth(i).locator('input[type="checkbox"]').click();
      picked = true;
      break;
    }
  }
  if (picked) {
    await page.waitForTimeout(1500);
    await page.locator('main button:has-text("اعتماد المحدد")').first().click();
    await page.waitForTimeout(6000);
  }
  const txt = await page.evaluate(() => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " "));
  console.log(JSON.stringify({ picked, approved: /معتمد/.test(txt) }, null, 1));
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
