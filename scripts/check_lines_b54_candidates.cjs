const fs = require("fs");
const files = [
  "apps/frontend/src/pages/super-admin/StaffCompanyAccess.tsx",
  "apps/frontend/src/pages/super-admin/PlatformSiteMetaPixel.tsx",
  "apps/frontend/src/pages/super-admin/PlatformSignupCoupons.tsx",
  "apps/frontend/src/pages/super-admin/PlatformPartnerManagement.tsx",
  "apps/frontend/src/pages/super-admin/BusinessSpecialtiesManagement.tsx",
  "apps/frontend/src/pages/super-admin/SuperAdminMarketingLinks.tsx",
  "apps/frontend/src/pages/super-admin/MarketplaceAppsManagement.tsx",
  "apps/frontend/src/pages/super-admin/MarketplaceCoverageCenter.tsx"
];
files.forEach(f => {
  const lines = fs.readFileSync(f, "utf8").split("\n").length;
  console.log(`${f}: ${lines} lines`);
});
