const fs = require("fs");
const app = fs.readFileSync("apps/frontend/src/App.tsx", "utf8");

const names = [
  "MonthlyPnLDashboard",
  "ProfitabilityEngine",
  "ProjectBreakEvenCalculator",
  "RefundRateCalculator",
  "ShippingOptimizer"
];

for (const n of names) {
  const target = "<" + n;
  const idx = app.indexOf(target);
  if (idx !== -1) {
    const chunk = app.substring(Math.max(0, idx - 400), idx);
    const pathMatch = chunk.match(/path=["']([^"']+)["']/g);
    const lastPath = pathMatch ? pathMatch[pathMatch.length - 1] : "no path match";
    console.log(`${n} => ${lastPath}`);
  } else {
    console.log(`${n} => NOT IN APP.TSX`);
  }
}
