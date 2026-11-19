const { chromium } = require("playwright");

async function measureSpeed() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  const requests = [];
  const failedRequests = [];

  page.on("request", (req) => {
    requests.push({
      url: req.url(),
      type: req.resourceType(),
      startTime: Date.now(),
    });
  });

  page.on("requestfailed", (req) => {
    failedRequests.push({
      url: req.url(),
      type: req.resourceType(),
      failure: req.failure() ? req.failure().errorText : "unknown",
    });
  });

  page.on("response", (res) => {
    const match = requests.find((r) => r.url === res.url());
    if (match) {
      match.duration = Date.now() - match.startTime;
      match.status = res.status();
    }
  });

  const targetUrl = "http://127.0.0.1:5173/lp/clothing-taste";
  console.log(`Navigating to: ${targetUrl} (waiting for load)...`);

  const t0 = Date.now();
  await page.goto(targetUrl, { waitUntil: "load", timeout: 30000 });
  const loadTimeMs = Date.now() - t0;

  // Measure Navigation Timing & Paint Timings
  const metrics = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((p) => p.name === "first-contentful-paint");
    const fp = paint.find((p) => p.name === "first-paint");

    return {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      domInteractive: Math.round(nav.domInteractive - nav.startTime),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
      loadEvent: Math.round(nav.loadEventEnd - nav.startTime),
      duration: Math.round(nav.duration),
      firstPaint: fp ? Math.round(fp.startTime) : null,
      fcp: fcp ? Math.round(fcp.startTime) : null,
    };
  });

  console.log("\n=== ⏱️ Key Performance Indicators (Real In-Browser Metrics) ===");
  console.log(`Time to First Byte (TTFB): ${metrics.ttfb} ms`);
  console.log(`First Paint (FP): ${metrics.firstPaint} ms`);
  console.log(`First Contentful Paint (FCP): ${metrics.fcp} ms`);
  console.log(`DOM Interactive: ${metrics.domInteractive} ms`);
  console.log(`DOM Content Loaded (DCL): ${metrics.domContentLoaded} ms`);
  console.log(`Window Load Event: ${metrics.loadEvent} ms`);
  console.log(`Total Initial Navigation: ${loadTimeMs} ms`);

  console.log("\n=== 🌐 Network Requests Audit ===");
  console.log(`Total Requests Sent: ${requests.length}`);
  console.log(`Failed Requests: ${failedRequests.length}`);
  if (failedRequests.length > 0) {
    console.log("Failed Requests Detail:", failedRequests);
  }

  // Slowest requests
  const slowRequests = requests
    .filter((r) => r.duration !== undefined)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0))
    .slice(0, 10);

  console.log("\nSlowest 10 Requests:");
  slowRequests.forEach((r, idx) => {
    console.log(`  ${idx + 1}. [${r.status || "pending"}] [${r.type}] ${r.duration}ms: ${r.url.substring(0, 90)}`);
  });

  // Evaluate Resources breakdown
  const resources = await page.evaluate(() => {
    return performance.getEntriesByType("resource").map((r) => ({
      name: r.name.split("/").pop().split("?")[0],
      initiator: r.initiatorType,
      duration: Math.round(r.duration),
      transferSizeKB: (r.transferSize / 1024).toFixed(1),
      decodedBodySizeKB: (r.decodedBodySize / 1024).toFixed(1),
    }));
  });

  console.log(`\nTotal Resources loaded: ${resources.length}`);
  const topSize = resources
    .sort((a, b) => parseFloat(b.transferSizeKB) - parseFloat(a.transferSizeKB))
    .slice(0, 5);
  console.log("\nTop 5 Heaviest Resources:");
  topSize.forEach((res, i) => {
    console.log(`  ${i + 1}. ${res.name} (${res.initiator}): ${res.transferSizeKB} KB (decoded: ${res.decodedBodySizeKB} KB) in ${res.duration}ms`);
  });

  await browser.close();
}

measureSpeed().catch((err) => {
  console.error("Speed test failed:", err);
  process.exit(1);
});
