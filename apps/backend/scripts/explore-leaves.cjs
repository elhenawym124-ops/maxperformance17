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
  await page.goto(BASE + "/my-leaves", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(5000);
  const info = await page.evaluate(() => {
    const main = document.querySelector("main");
    return {
      head: (main?.innerText || "").replace(/\s+/g, " ").slice(0, 260),
      buttons: [...(main?.querySelectorAll("button") ?? [])].map(b => (b.innerText || "").trim()).filter(Boolean).slice(0, 12),
    };
  });
  console.log(JSON.stringify(info, null, 1).slice(0, 900));
  const add = page.locator("main button").filter({ hasText: /طلب إجازة|إضافة|جديد/ }).first();
  if (await add.count()) {
    await add.click();
    await page.waitForTimeout(2500);
    const dlg = await page.evaluate(() => {
      const ds = [...document.querySelectorAll('[role="dialog"]')];
      if (!ds.length) return { none: true };
      const d = ds[ds.length - 1];
      return {
        text: d.innerText.replace(/\s+/g, " ").slice(0, 260),
        fields: [...d.querySelectorAll("input,select,textarea")].map(e => ({ tag: e.tagName, type: e.type, ph: e.placeholder, name: e.name })),
        buttons: [...d.querySelectorAll("button")].map(b => (b.innerText || "").trim()).filter(Boolean),
      };
    });
    console.log(JSON.stringify(dlg, null, 1).slice(0, 1500));
  } else console.log("no add button");
  await browser.close();
})().catch(e => { console.error("FAILED:", e.message); process.exit(1); });
