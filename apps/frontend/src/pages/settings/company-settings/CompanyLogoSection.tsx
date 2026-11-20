import React from "react";
import { BuildingOfficeIcon, GlobeAltIcon } from "@heroicons/react/24/outline";

interface CompanyLogoSectionProps {
  logoPreview: string | null;
  uploadingLogo: boolean;
  handleLogoUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CompanyLogoSection: React.FC<CompanyLogoSectionProps> = ({
  logoPreview,
  uploadingLogo,
  handleLogoUpload,
}) => {
  return (
    <>
      {/* Logo Upload Section */}
      <div className="bg-card shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-foreground mb-4">
          لوجو الشركة
        </h3>
        <div className="flex items-start space-x-4 space-x-reverse">
          {/* Logo Preview */}
          <div className="flex-shrink-0">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Company Logo"
                className="h-24 w-24 rounded-lg object-cover border-2 border-border dark:border-border"
              />
            ) : (
              <div className="h-24 w-24 rounded-lg bg-muted flex items-center justify-center border-2 border-dashed border-border">
                <BuildingOfficeIcon className="h-12 w-12 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Upload Button */}
          <div className="flex-1">
            <label
              htmlFor="company-logo-upload"
              className="block text-sm font-medium text-foreground mb-2"
            >
              رفع لوجو جديد
            </label>
            <div className="flex items-center">
              <label
                htmlFor="company-logo-upload"
                className="relative cursor-pointer bg-card rounded-md font-medium text-primary hover:text-primary focus-within:outline-none"
              >
                <span className="inline-flex items-center px-4 py-2 border border-border rounded-md shadow-sm text-sm font-medium text-foreground bg-card hover:bg-muted dark:hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary">
                  {uploadingLogo ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ms-2"></div>
                      جاري الرفع...
                    </>
                  ) : (
                    <>
                      <svg
                        className="ms-2 h-5 w-5 text-muted-foreground"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                        />
                      </svg>
                      اختر صورة
                    </>
                  )}
                </span>
                <input
                  id="company-logo-upload"
                  name="companyLogo"
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={uploadingLogo}
                />
              </label>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            PNG, JPG, GIF حتى 5MB
          </p>
        </div>
      </div>

      {/* Custom Domain Redirect Section */}
      <div className="bg-indigo-50 dark:bg-primary/20 border border-primary dark:border-primary rounded-xl p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="p-2 bg-primary dark:bg-primary/30 rounded-lg shrink-0">
            <GlobeAltIcon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground mb-1">
              إعدادات الدومين المخصص انتقلت لمكان جديد!
            </h3>
            <p className="text-sm text-foreground dark:text-muted-foreground mb-4">
              لقد قمنا بتحسين تجربة ربط الدومينات المخصصة وتوفير شرح مفصل في
              صفحة مستقلة لضمان ربط متجرك بأمان وسهولة.
            </p>
            <div className="flex items-center gap-3">
              <p className="text-xs text-muted-foreground font-medium whitespace-nowrap">
                تجدها الآن في القائمة الجانبية تحت مسمى &quot;الدومين المخصص&quot;.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
