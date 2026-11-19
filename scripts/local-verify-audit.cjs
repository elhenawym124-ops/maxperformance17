// Browser verification of the fixed bundle: /lp/clothing-taste must render
// fast, with a small resource count and zero console errors.
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "H:/maxp-platform/scripts/local-verify-audit.result.txt";
const log = (line) => {
  fs.appendFileSync(OUT, line + "\n");
  console.log(line);
};

(async () => {
  fs.writeFileSync(OUT, "");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const consoleErrors = [];
    page.on("console", (m) => {
      if (m.type() === "error") consoleErrors.push(m.text().slice(0, 160));
    });
    page.on("pageerror", (e) => consoleErrors.push("PAGEERROR " + String(e).slice(0, 160)));

    const jsFiles = [];
    page.on("response", (res) => {
      if (res.url().endsWith(".js") && res.url().includes("/assets/")) jsFiles.push(res.url().split("/").pop());
    });

    const t0 = Date.now();
    await page.goto("http://127.0.0.1:4173/lp/clothing-taste", { waitUntil: "commit", timeout: 30000 });
    let visible = true;
    try {
      await page.waitForSelector(".cst-root", { timeout: 20000 });
    } catch {
      visible = false;
    }
    const renderMs = Date.now() - t0;
    log(`UI visible=${visible} in ${renderMs}ms`);
    log(`JS asset files loaded: ${jsFiles.length}`);
    log(`route-* JS loaded on landing: ${jsFiles.filter((f) => /^route-/.test(f)).join(", ") || "NONE"}`);
    log(`console errors: ${consoleErrors.length}${consoleErrors.length ? " :: " + consoleErrors.join(" | ") : ""}`);
    const heroText = await page.evaluate(() => document.querySelector(".cst-root")?.innerText?.slice(0, 120) || "");
    log(`page text sample: ${heroText.replace(/\n/g, " / ").slice(0, 100)}`);
    await page.screenshot({ path: "H:/maxp-platform/scripts/local-verify.png" });
    log("screenshot saved");
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
})().catch((e) => {
  log("FATAL: " + (e && e.message));
  process.exit(1);
});
