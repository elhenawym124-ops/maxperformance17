const fs = require("fs");
const files = [
  "apps/frontend/src/pages/super-admin/StaffCompanyAccess.tsx",
  "apps/frontend/src/pages/super-admin/StorefrontThemesManagement.tsx",
  "apps/frontend/src/pages/super-admin/PlatformSiteMetaPixel.tsx",
  "apps/frontend/src/pages/super-admin/PlatformSignupCoupons.tsx",
  "apps/frontend/src/pages/super-admin/PlatformPartnerManagement.tsx"
];
files.forEach(f => {
  const lines = fs.readFileSync(f, "utf8").split("\n").length;
  console.log(`${f}: ${lines} lines`);
});
