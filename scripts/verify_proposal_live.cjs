const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function main() {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1.5,
  });
  const page = await context.newPage();

  const url = 'https://h2m.maxp.online/proposal/codetreps-growth-os';
  console.log('Navigating to', url);

  const res = await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
  console.log('Page response status:', res ? res.status() : 'unknown');

  await page.waitForTimeout(2000);

  const outDir = path.join(__dirname, '..', 'screenshots');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const brainDir = 'C:\\Users\\mokhtar\\.gemini\\antigravity\\brain\\6672c613-01d4-4114-836d-ceee6b3830e9';

  // 1. Full Page Screenshot
  const fullPath = path.join(outDir, 'h2m_proposal_luxury_full.png');
  await page.screenshot({ path: fullPath, fullPage: true });
  console.log('Full screenshot saved to', fullPath);
  fs.copyFileSync(fullPath, path.join(brainDir, 'h2m_proposal_luxury_full.png'));

  // 2. Hero
  const heroPath = path.join(outDir, 'h2m_proposal_luxury_hero.png');
  await page.screenshot({ path: heroPath, clip: { x: 0, y: 0, width: 1440, height: 950 } });
  fs.copyFileSync(heroPath, path.join(brainDir, 'h2m_proposal_luxury_hero.png'));

  // 3. Workstreams
  const wsEl = await page.$('#workstreams');
  if (wsEl) {
    const wsPath = path.join(outDir, 'h2m_proposal_luxury_workstreams.png');
    await wsEl.screenshot({ path: wsPath });
    fs.copyFileSync(wsPath, path.join(brainDir, 'h2m_proposal_luxury_workstreams.png'));
  }

  // 4. Audit
  const auditEl = await page.$('#audit');
  if (auditEl) {
    const auditPath = path.join(outDir, 'h2m_proposal_luxury_audit.png');
    await auditEl.screenshot({ path: auditPath });
    fs.copyFileSync(auditPath, path.join(brainDir, 'h2m_proposal_luxury_audit.png'));
  }

  // 5. Analytics & Telemetry
  const telEl = await page.$('#telemetry');
  if (telEl) {
    const telPath = path.join(outDir, 'h2m_proposal_luxury_telemetry.png');
    await telEl.screenshot({ path: telPath });
    fs.copyFileSync(telPath, path.join(brainDir, 'h2m_proposal_luxury_telemetry.png'));
    console.log('Telemetry screenshot saved to', telPath);
  }

  // 6. Calculator
  const calcEl = await page.$('#calculator');
  if (calcEl) {
    const calcPath = path.join(outDir, 'h2m_proposal_luxury_calculator.png');
    await calcEl.screenshot({ path: calcPath });
    fs.copyFileSync(calcPath, path.join(brainDir, 'h2m_proposal_luxury_calculator.png'));
  }

  // 7. Packages
  const pkgEl = await page.$('#packages');
  if (pkgEl) {
    const pkgPath = path.join(outDir, 'h2m_proposal_luxury_packages.png');
    await pkgEl.screenshot({ path: pkgPath });
    fs.copyFileSync(pkgPath, path.join(brainDir, 'h2m_proposal_luxury_packages.png'));
  }

  console.log('All screenshots captured and copied to brain directory successfully!');
  await browser.close();
}

main().catch(e => {
  console.error('Error during capture:', e);
  process.exit(1);
});
