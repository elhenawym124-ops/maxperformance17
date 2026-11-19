const { chromium } = require("playwright");

async function testMobile4G() {
  const browser = await chromium.launch({
    channel: "msedge",
    headless: true,
  });

  // iPhone 14 context
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
  });

  const page = await context.newPage();

  // Emulate Egyptian 4G mobile network via CDP session
  // Regular 4G: 4 Mbps download, 3 Mbps upload, 100ms latency
  const client = await page.context().newCDPSession(page);
  await client.send("Network.emulateNetworkConditions", {
    offline: false,
    latency: 100, // 100ms RTT
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4 Mbps
    uploadThroughput: (3 * 1024 * 1024) / 8, // 3 Mbps
  });

  const url = "http://127.0.0.1:5173/lp/clothing-taste";
  console.log("Measuring Mobile 4G Simulated Load (100ms RTT, 4 Mbps)...");

  const t0 = Date.now();
  await page.goto(url, { waitUntil: "commit" });
  await page.waitForSelector(".cst-root", { timeout: 15000 });
  const renderTime = Date.now() - t0;
  console.log(`Mobile 4G Initial UI Render: ${renderTime}ms`);

  const metrics = await page.evaluate(() => {
    const paint = performance.getEntriesByType("paint");
    const fcp = paint.find((p) => p.name === "first-contentful-paint");
    const nav = performance.getEntriesByType("navigation")[0];
    return {
      fcp: fcp ? Math.round(fcp.startTime) : null,
      domInteractive: Math.round(nav.domInteractive - nav.startTime),
      domContentLoaded: Math.round(nav.domContentLoadedEventEnd - nav.startTime),
    };
  });

  console.log("Mobile 4G Web Vitals:", metrics);

  await browser.close();
}

testMobile4G().catch(console.error);
