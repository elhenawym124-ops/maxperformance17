// Production load audit: https://maxp.online/lp/clothing-taste
// Writes results synchronously to stdout (no pipes) with hard timeouts everywhere.
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "H:/maxp-platform/scripts/prod-speed-audit.result.txt";
const log = (line) => {
  fs.appendFileSync(OUT, line + "\n");
  console.log(line);
};

(async () => {
  fs.writeFileSync(OUT, "");
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
    args: ["--host-resolver-rules=MAP maxp.online 104.21.52.106"],
  });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();

    const requests = [];
    const failed = [];
    page.on("request", (r) => requests.push({ url: r.url(), type: r.resourceType(), t0: Date.now() }));
    page.on("requestfailed", (r) => failed.push(`${r.url()} :: ${r.failure() && r.failure().errorText}`));
    page.on("response", (res) => {
      const m = requests.find((r) => r.url === res.url() && r.duration === undefined);
      if (m) {
        m.duration = Date.now() - m.t0;
        m.status = res.status();
        if (res.url().includes("maxp.online") && res.url().includes("lp/")) {
          m.cfCache = res.headers()["cf-cache-status"] || "";
        }
      }
    });

    const url = "https://maxp.online/lp/clothing-taste";
    log(`Navigating (production): ${url}`);
    const t0 = Date.now();
    await page.goto(url, { waitUntil: "commit", timeout: 30000 });
    log(`commit: ${Date.now() - t0}ms`);

    try {
      await page.waitForSelector(".cst-root", { timeout: 30000 });
      log(`UI VISIBLE (.cst-root): ${Date.now() - t0}ms`);
    } catch {
      log(`UI VISIBLE: TIMEOUT after ${Date.now() - t0}ms`);
      const bodyInfo = await page.evaluate(() => {
        const root = document.getElementById("root");
        return {
          bodyClasses: document.body.className,
          rootChildren: root ? root.children.length : -1,
          rootSnippet: root ? root.innerHTML.slice(0, 300) : "NO ROOT",
          routeNow: location.pathname,
        };
      });
      log("STATE AT TIMEOUT: " + JSON.stringify(bodyInfo, null, 1));
    }
    await page.screenshot({ path: "H:/maxp-platform/scripts/prod-audit.png" });
    log("screenshot saved");

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType("navigation")[0];
      const paint = performance.getEntriesByType("paint");
      const fcp = paint.find((p) => p.name === "first-contentful-paint");
      const res = performance.getEntriesByType("resource");
      const totalTransfer = res.reduce((s, r) => s + (r.transferSize || 0), 0);
      return {
        ttfb: Math.round(nav.responseStart - nav.requestStart),
        fcp: fcp ? Math.round(fcp.startTime) : null,
        dcl: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
        load: Math.round(nav.loadEventEnd - nav.startTime),
        resources: res.length,
        transferKB: Math.round(totalTransfer / 1024),
        proto: nav.nextHopProtocol,
      };
    });
    log(`proto=${metrics.proto} TTFB=${metrics.ttfb}ms FCP=${metrics.fcp}ms DCL=${metrics.dcl}ms LOAD=${metrics.load}ms`);
    log(`resources=${metrics.resources} transfer=${metrics.transferKB}KB`);
    log(`failed=${failed.length}${failed.length ? " :: " + failed.join(" | ") : ""}`);

    const doc = requests.find((r) => r.url.includes("maxp.online/lp/clothing-taste"));
    if (doc) log(`document: ${doc.duration}ms status=${doc.status} cf-cache=${doc.cfCache}`);

    const slow = requests.filter((r) => r.duration !== undefined).sort((a, b) => b.duration - a.duration).slice(0, 10);
    log("--- slowest 10 ---");
    slow.forEach((r, i) => log(`${i + 1}. [${r.status}] ${r.duration}ms [${r.type}] ${r.url.slice(0, 100)}`));
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
})().catch((e) => {
  log("FATAL: " + (e && e.message));
  process.exit(1);
});
