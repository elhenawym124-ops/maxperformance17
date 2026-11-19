const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      if (!file.includes("__tests__") && !file.includes("node_modules") && !file.includes("components")) {
        results = results.concat(getFiles(full));
      }
    } else if (file.endsWith(".tsx")) {
      results.push(full);
    }
  });
  return results;
}

const allPages = getFiles("apps/frontend/src/pages");
const domainCounts = {};
const domainFiles = {};

for (const p of allPages) {
  try {
    const log = execSync(`git log -n 5 --oneline -- "${p}"`, { encoding: "utf8" });
    if (!log.includes("Linear single-surface") && !log.includes("chassis") && !log.includes("elevate")) {
      const rel = path.relative("apps/frontend/src/pages", p).replace(/\\/g, "/");
      const parts = rel.split("/");
      const domain = parts[0];
      domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      if (!domainFiles[domain]) domainFiles[domain] = [];
      domainFiles[domain].push(rel);
    }
  } catch (e) {}
}

console.log("Domain counts of unelevated pages:");
for (const [dom, count] of Object.entries(domainCounts).sort((a,b) => b[1] - a[1])) {
  console.log(`- ${dom}: ${count} pages`);
}

console.log("\nSome interesting domains:");
for (const d of ["advertising", "marketing", "competitors", "coupons", "categories", "tasks", "support", "cancellations", "comments", "inventory"]) {
  if (domainFiles[d]) {
    console.log(`\n--- ${d} (${domainFiles[d].length}) ---`);
    console.log(domainFiles[d].slice(0, 10).join("\n"));
  }
}
