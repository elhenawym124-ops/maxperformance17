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
    viewport: { width: 1440, height: 900 }
  });

  const page = await context.newPage();

  await page.goto("https://maxp.online/login", { waitUntil: "domcontentloaded" });
  await page.evaluate(({ token, user }) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    localStorage.setItem("auth_token", token);
    localStorage.setItem("accessToken", token);
  }, { token: switchedToken, user: switchedUser });

  const invoiceUrl = "https://maxp.online/orders/invoices/print-multiple?ids=cmv7ppdzu028hjup828ofmce0,cmv7ppdzt028gjup8eer9ftke,cmugyy0jx02p3ju5r71y4qwt0";
  console.log("Navigating to invoice URL:", invoiceUrl);
  await page.goto(invoiceUrl, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(3000);

  const shot = path.join(ARTIFACT_DIR, "26_redline_invoices_with_real_car_models.png");
  await page.screenshot({ path: shot, fullPage: false });
  console.log("Saved screenshot:", shot);

  const invoiceTexts = await page.evaluate(() => {
    const textContent = document.body.innerText;
    const hasKia = textContent.includes("كيا كارينز 2015");
    const hasTucson = textContent.includes("هيونداي توسان 2020");
    const hasCreta = textContent.includes("هيونداي كريتا ٢٠١٦");
    return {
      hasKia,
      hasTucson,
      hasCreta,
      bodySnippet: textContent.slice(0, 1500)
    };
  });

  console.log("Inspection Result:", JSON.stringify(invoiceTexts, null, 2));

  await browser.close();
}

run().catch(console.error);
