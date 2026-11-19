const { chromium } = require("playwright");

async function testSpeedWarm() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });

  const page = await context.newPage();

  const url = "http://127.0.0.1:5173/lp/clothing-taste";
  
  // Prime Vite cache
  console.log("Priming Vite dev cache...");
  await page.goto(url, { waitUntil: "commit" });
  await page.waitForSelector(".cst-root", { timeout: 15000 });
  console.log("Vite cache primed.");

  // Test Warm Page Reload (or new tab in same browser)
  console.log("\nTesting Warm Navigation (Simulating real visitor on warm server)...");
  const t0 = Date.now();
  await page.goto(url, { waitUntil: "domcontentloaded" });
  const dclTime = Date.now() - t0;
  console.log(`DOMContentLoaded reached in: ${dclTime}ms`);

  await page.waitForSelector(".cst-root");
  const visibleTime = Date.now() - t0;
  console.log(`UI Fully Rendered in: ${visibleTime}ms`);

  // Performance timings
  const timing = await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0];
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((p) => p.name === "first-contentful-paint");
    return {
      ttfb: Math.round(nav.responseStart - nav.requestStart),
      fcp: fcp ? Math.round(fcp.startTime) : null,
      domInteractive: Math.round(nav.domInteractive - nav.startTime),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    };
  });

  console.log("\nTiming Metrics:", timing);

  // Measure bundle size and assets in production build
  await browser.close();
}

testSpeedWarm().catch(console.error);
