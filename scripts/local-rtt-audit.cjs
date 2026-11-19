// RTT-simulated load test: emulates Egyptian mobile latency against the
// locally-served fixed bundle, measuring commit -> .cst-root.
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "H:/maxp-platform/scripts/local-rtt-audit.result.txt";
const log = (line) => {
  fs.appendFileSync(OUT, line + "\n");
  console.log(line);
};

(async () => {
  fs.writeFileSync(OUT, "");
  const browser = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const client = await page.context().newCDPSession(page);
    await client.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: 150,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (3 * 1024 * 1024) / 8,
    });

    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text().slice(0, 120)));
    page.on("pageerror", (e) => errors.push("PAGEERROR " + String(e).slice(0, 120)));

    const t0 = Date.now();
    await page.goto("http://127.0.0.1:4173/lp/clothing-taste", { waitUntil: "commit", timeout: 60000 });
    log(`commit: ${Date.now() - t0}ms`);
    try {
      await page.waitForSelector(".cst-root", { timeout: 60000 });
      log(`UI VISIBLE: ${Date.now() - t0}ms`);
    } catch {
      log(`UI TIMEOUT after ${Date.now() - t0}ms`);
    }
    const fcp = await page.evaluate(() => {
      const p = performance.getEntriesByType("paint").find((x) => x.name === "first-contentful-paint");
      return p ? Math.round(p.startTime) : null;
    });
    log(`FCP=${fcp}ms consoleErrors=${errors.length}${errors.length ? " :: " + errors.join("|") : ""}`);
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
})().catch((e) => {
  log("FATAL: " + (e && e.message));
  process.exit(1);
});
