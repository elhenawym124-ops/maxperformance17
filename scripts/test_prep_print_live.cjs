const path = require("path");
const fs = require("fs");
const { chromium } = require("playwright");

const ARTIFACT_DIR = "C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\33542c37-73aa-499d-9499-fcc91fecaa34";

async function run() {
  console.log("=== Step 1: Login & Switch to Red Line ===");
  const loginRes = await fetch("https://maxp.online/api/v1/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "swan@h2m.com", password: "0165676135" })
  });
  const loginData = await loginRes.json();
  const initialToken = loginData.data?.token;
  if (!initialToken) {
    throw new Error("Login failed: " + JSON.stringify(loginData));
  }

  const redLineId = "cmu5iix000aa6juwmmqcrls8i";
  const switchRes = await fetch(`https://maxp.online/api/v1/auth/switch-company/${redLineId}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${initialToken}`
    }
  });
  const switchData = await switchRes.json();
  const switchedToken = switchData.data?.token;
  if (!switchedToken) {
    throw new Error("Company switch failed: " + JSON.stringify(switchData));
  }

  const meRes = await fetch("https://maxp.online/api/v1/auth/me", {
    headers: { "Authorization": `Bearer ${switchedToken}` }
  });
  const meData = await meRes.json();
  const switchedUser = meData.data?.user || meData.data;
  console.log("Logged in & switched to:", switchedUser?.company?.name);

  console.log("=== Step 2: Launch Headless Chrome ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-setuid-sandbox"]
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  // Listen to console and dialogs
  page.on("console", msg => {
    const text = msg.text();
    if (msg.type() === "error" || msg.type() === "warn" || text.includes("DEBUG") || text.includes("Custom") || text.includes("Invoice")) {
      console.log(`[Browser ${msg.type()}]:`, text);
    }
  });

  page.on("request", req => {
    const url = req.url();
    if (url.includes("route-orders") || url.includes("Invoice") || url.includes("Print")) {
      console.log("[ASSET LOADED]:", url);
    }
  });

  // Inject auth tokens into localStorage
  await page.goto("https://maxp.online/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);
    localStorage.setItem("accessToken", token);
  }, { token: switchedToken, user: switchedUser });

  console.log("=== Step 3: Navigate to PREPARING Queue ===");
  const targetUrl = "https://maxp.online/orders/preparation?pageSize=96&activeStage=PREPARING";
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(3000);

  const shot1 = path.join(ARTIFACT_DIR, "23_redline_live_queue_preparing.png");
  await page.screenshot({ path: shot1, fullPage: false });
  console.log("Screenshot saved:", shot1);

  // Check rows in table
  const rows = await page.locator("tbody tr").count();
  console.log("Table row count in PREPARING:", rows);

  // Select all or first 4 orders
  console.log("=== Step 4: Selecting orders ===");
  const checkboxes = page.locator("tbody tr input[type='checkbox']");
  const cbCount = await checkboxes.count();
  console.log("Checkbox count:", cbCount);

  const selectCount = Math.min(4, cbCount);
  for (let i = 0; i < selectCount; i++) {
    await checkboxes.nth(i).click();
    await page.waitForTimeout(200);
  }

  const shotSelect = path.join(ARTIFACT_DIR, "23b_redline_prep_orders_selected.png");
  await page.screenshot({ path: shotSelect, fullPage: false });

  // Click bulk print button
  console.log("=== Step 5: Clicking Print Invoices ===");
  // Find button with text containing طباعة
  const printBtn = page.locator("button:has-text('طباعة')").first();
  const btnText = await printBtn.innerText().catch(() => "");
  console.log("Found button:", btnText);

  await Promise.all([
    page.waitForNavigation({ timeout: 30000 }).catch(e => console.log("Navigation wait finished or timed out:", e.message)),
    printBtn.click()
  ]);

  await page.waitForTimeout(4000);
  console.log("Current URL after click:", page.url());

  const shotPrint = path.join(ARTIFACT_DIR, "25_redline_live_preparing_invoices_fixed.png");
  await page.screenshot({ path: shotPrint, fullPage: false });
  console.log("Screenshot saved:", shotPrint);

  // Inspect invoice content text
  const invoiceTexts = await page.evaluate(() => {
    const divs = Array.from(document.querySelectorAll("body *"));
    const textContent = document.body.innerText;
    const hasCarSpecs = textContent.includes("نوع وموديل وسنة صنع السيارة") || textContent.includes("موديل السيارة");
    const hasProduct = textContent.includes("ستائر شبابيك سيارات");
    const sampleHeaders = Array.from(document.querySelectorAll("h1, h2, h3, div, span"))
      .map(el => el.textContent.trim())
      .filter(t => t.includes("السيارة") || t.includes("تفاصيل") || t.includes("المواصفات") || t.includes("النوع") || t.includes("قطع"));
    return {
      hasCarSpecs,
      hasProduct,
      sampleHeaders: Array.from(new Set(sampleHeaders)).slice(0, 15),
      bodySnippet: textContent.slice(0, 800)
    };
  });

  console.log("Invoice Content Inspection Result:", JSON.stringify(invoiceTexts, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error("FATAL ERROR in run():", err);
  process.exit(1);
});
