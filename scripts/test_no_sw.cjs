const { chromium } = require("playwright");

async function run() {
  const loginRes = await fetch("https://maxp.online/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "swan@h2m.com", password: "0165676135" })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;

  const redLineId = "cmu5iix000aa6juwmmqcrls8i";
  const switchRes = await fetch(`https://maxp.online/api/v1/auth/switch-company/${redLineId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }
  });
  const switchData = await switchRes.json();
  const switchedToken = switchData.data?.token;

  const meRes = await fetch("https://maxp.online/api/v1/auth/me", {
    headers: { "Authorization": `Bearer ${switchedToken}` }
  });
  const meData = await meRes.json();
  const switchedUser = meData.data?.user || meData.data;

  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    serviceWorkers: "block" // BLOCK SERVICE WORKERS!
  });
  const page = await context.newPage();

  page.on("console", msg => {
    console.log("[CONSOLE " + msg.type() + "]:", msg.text());
  });

  await page.goto("https://maxp.online/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);
    localStorage.setItem("accessToken", token);
  }, { token: switchedToken, user: switchedUser });

  const invoiceId = "cmv7qldrj002jjuzzey04bu70";
  console.log("Navigating to print-multiple without service worker...");
  await page.goto(`https://maxp.online/orders/invoices/print-multiple?ids=${invoiceId}`, { waitUntil: "networkidle", timeout: 30000 });
  await page.waitForTimeout(3000);

  const fullText = await page.evaluate(() => document.body.innerText);
  console.log("=== FULL BODY TEXT ===");
  console.log(fullText);
  console.log("=== END FULL BODY TEXT ===");

  await browser.close();
}

run().catch(console.error);
