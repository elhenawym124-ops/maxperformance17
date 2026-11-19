const { chromium } = require("playwright");

async function debugLoad() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const page = await browser.newPage();

  const activeRequests = new Map();

  page.on("request", (req) => {
    activeRequests.set(req.url(), {
      url: req.url(),
      type: req.resourceType(),
      time: Date.now(),
    });
  });

  page.on("requestfinished", (req) => {
    activeRequests.delete(req.url());
  });

  page.on("requestfailed", (req) => {
    console.log(`[FAILED] ${req.url()}: ${req.failure() ? req.failure().errorText : ""}`);
    activeRequests.delete(req.url());
  });

  const url = "http://127.0.0.1:5173/lp/clothing-taste";
  console.log("Navigating with waitUntil: 'commit'...");
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "commit" });
  console.log(`Commit reached in ${Date.now() - t0}ms`);

  await page.waitForSelector(".cst-root", { timeout: 15000 });
  console.log(`DOM ready (.cst-root visible) in ${Date.now() - t0}ms`);

  // Wait 3 seconds and see what requests are still pending
  await page.waitForTimeout(3000);

  console.log(`Still pending requests count: ${activeRequests.size}`);
  for (const [reqUrl, info] of activeRequests.entries()) {
    console.log(`PENDING: [${info.type}] ${reqUrl} (waiting for ${Date.now() - info.time}ms)`);
  }

  // Also check window.performance timing
  const perf = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    return {
      nav: nav ? JSON.stringify(nav) : null,
      paint: paint ? JSON.stringify(paint) : null,
    };
  });
  console.log("\nNavigation Timing:", perf.nav);
  console.log("Paint Timing:", perf.paint);

  await browser.close();
}

debugLoad().catch(console.error);
