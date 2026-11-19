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

  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();

  page.on("console", msg => {
    console.log("[CONSOLE " + msg.type() + "]:", msg.text());
  });

  page.on("request", req => {
    if (req.url().endsWith(".js") || req.url().includes(".js?")) {
      console.log("[JS REQ]:", req.url());
    }
  });

  page.on("response", async res => {
    if (res.url().includes("order-invoice")) {
      console.log("[RES]:", res.status(), res.url());
      try {
        const text = await res.text();
        console.log("[RES BODY]:", text.slice(0, 300));
      } catch (e) {}
    }
  });

  await page.goto("https://maxp.online/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);
    localStorage.setItem("accessToken", token);
  }, { token: switchedToken, user: switchedUser });

  const invoiceId = "cmv82lxdt021eju5gof7bn0cn,cmv82lxdt021fju5gp1yqp76e,cmv82g81l00icjuh4q5jcz0k9,cmv82g81m00idjuh4q8ubgdut";
  console.log("Navigating to print-multiple for 4 orders...");
  await page.goto(`https://maxp.online/orders/invoices/print-multiple?ids=${invoiceId}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(3000);

  const html = await page.evaluate(() => {
    const sheet = document.querySelector(".a4-sheet");
    return sheet ? sheet.innerHTML : "NO SHEET FOUND";
  });

  const fullText = await page.evaluate(() => document.body.innerText);
  console.log("=== FULL BODY TEXT ===");
  console.log(fullText);
  console.log("=== END FULL BODY TEXT ===");

  const screenshotPath = "C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\33542c37-73aa-499d-9499-fcc91fecaa34\\27_redline_live_invoice_clean_no_duplicates.png";
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log("Screenshot saved to:", screenshotPath);

  await browser.close();
}

run().catch(console.error);
