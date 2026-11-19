const fs = require("fs");
const files = [
  "apps/frontend/src/pages/super-admin/SuperAdminAIKeyLogs.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminAIKeyDialogs.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminAIKeyTable.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminAIKeyManager.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminVisualSearchDetailDialog.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminVisualSearchLogs.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminEmbeddingsJobCard.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminKnowledgeEmbeddingsSection.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminProductEmbeddingsCompanyList.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminProductEmbeddings.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminSelfReviewLogsTable.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminSelfReviewAnalyticsTab.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminSelfReviewSettingsTab.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminSelfReviewLogs.tsx"
];

let allOk = true;
files.forEach(f => {
  const content = fs.readFileSync(f, "utf8");
  const count = content.split("\n").length;
  const ok = count < 400;
  if (!ok) allOk = false;
  console.log(`${ok ? "PASS" : "FAIL"} (${count} lines): ${f}`);
});

if (!allOk) {
  process.exit(1);
} else {
  console.log("All files strictly < 400 lines!");
}
