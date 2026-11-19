// Deep diagnosis: console + all requests + 60s patience on production landing
const { chromium } = require("playwright");
const fs = require("fs");

const OUT = "H:/maxp-platform/scripts/prod-console-audit.result.txt";
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
    page.on("console", (m) => log(`[console:${m.type()}] ${m.text().slice(0, 160)}`));
    page.on("pageerror", (e) => log(`[pageerror] ${String(e).slice(0, 200)}`));

    const done = [];
    page.on("response", (res) => {
      const u = res.url();
      if (u.includes("/assets/") || u.includes("maxp.online/lp"))
        done.push({ url: u.split("/").pop(), ms: -1, status: res.status(), t: Date.now() });
    });
    const t0 = { v: 0 };
    page.on("request", (r) => {
      if (t0.v === 0) t0.v = Date.now();
    });

    const url = "https://maxp.online/lp/clothing-taste";
    log(`navigate ${url}`);
    const start = Date.now();
    await page.goto(url, { waitUntil: "commit", timeout: 45000 });
    log(`commit ${Date.now() - start}ms`);

    const nav = async () => {
      try {
        await page.waitForSelector(".cst-root", { timeout: 60000 });
        log(`*** .cst-root VISIBLE at ${Date.now() - start}ms ***`);
        return true;
      } catch {
        log(`.cst-root NOT visible after ${Date.now() - start}ms`);
        return false;
      }
    };
    const visible = await nav();

    const state = await page.evaluate(() => ({
      appDiv: !!document.querySelector(".App"),
      rootHTML: (document.getElementById("root") || {}).innerHTML?.slice(0, 200),
      reloads: performance.getEntriesByType("navigation").length,
      redirect: performance.navigation ? performance.navigation.redirectCount : undefined,
      readyState: document.readyState,
    }));
    log("state: " + JSON.stringify(state));

    const allRes = await page.evaluate(() =>
      performance
        .getEntriesByType("resource")
        .map((r) => ({
          name: r.name.split("/").pop(),
          ms: Math.round(r.duration),
          kb: Math.round((r.transferSize || 0) / 1024),
          done: r.responseEnd > 0,
        }))
        .sort((a, b) => b.ms - a.ms)
    );
    log("--- all resources (" + allRes.length + ") ---");
    allRes.forEach((r) => log(`${r.done ? "OK " : "PENDING"} ${String(r.ms).padStart(6)}ms ${String(r.kb).padStart(5)}KB ${r.name}`));
    await page.screenshot({ path: "H:/maxp-platform/scripts/prod-console-audit.png" });
    log(`screenshot saved (visible=${visible})`);
  } finally {
    await browser.close().catch(() => {});
  }
  process.exit(0);
})().catch((e) => {
  log("FATAL: " + (e && e.message));
  process.exit(1);
});
