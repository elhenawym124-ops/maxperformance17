// Boot timeline probe: sample page state every 500ms from commit to .cst-root
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "H:/maxp-platform/scripts/prod-boot-timeline.result.txt";
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
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    page.on("console", (m) => {
      const t = m.text();
      if (m.type() === "error" || t.includes("[App]") || t.includes("MaxP") || t.includes("boot") || t.includes("SW") || t.includes("worker"))
        log(`[console:${m.type()}] ${t.slice(0, 140)}`);
    });
    const t0 = Date.now();
    await page.goto("https://maxp.online/lp/clothing-taste", { waitUntil: "commit", timeout: 45000 });

    const probe = async () =>
      page.evaluate(() => {
        const pend = performance
          .getEntriesByType("resource")
          .filter((r) => r.responseEnd === 0)
          .map((r) => r.name.split("/").pop().slice(0, 60));
        return {
          readyState: document.readyState,
          hasInitialLoading: !!document.getElementById("initial-loading"),
          appRoot: !!document.querySelector(".App"),
          cstRoot: !!document.querySelector(".cst-root"),
          bodyClass: document.body.className.slice(0, 40),
          scripts: performance.getEntriesByType("resource").filter((r) => r.initiatorType === "script").length,
          pending: pend.slice(0, 4),
          swController: !!(navigator.serviceWorker && navigator.serviceWorker.controller),
        };
      }).catch(() => null);

    let done = false;
    for (let i = 0; i < 80 && !done; i++) {
      await page.waitForTimeout(500);
      const s = await probe();
      if (s) {
        log(`${String(Date.now() - t0).padStart(6)}ms rs=${s.readyState} loader=${s.hasInitialLoading ? "Y" : "n"} app=${s.appRoot ? "Y" : "n"} cst=${s.cstRoot ? "Y" : "n"} sw=${s.swController ? "Y" : "n"} scripts=${s.scripts} pend=${s.pending.join("|") || "-"}`);
        if (s.cstRoot) done = true;
      }
    }
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
})().catch((e) => {
  log("FATAL: " + (e && e.message));
  process.exit(1);
});
