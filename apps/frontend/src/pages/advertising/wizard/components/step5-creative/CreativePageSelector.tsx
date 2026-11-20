import React from "react";
import { Loader2 } from "lucide-react";
import type { FormData } from "../../types";
import type {
  FacebookPage,
  FacebookPagesMeta,
} from "../../../../../services/facebookAdsService";
import { InstagramIdentitySelector } from "../InstagramIdentitySelector";

interface CreativePageSelectorProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  getError: (field: string) => string;
  facebookPages: FacebookPage[];
  facebookPagesMeta: FacebookPagesMeta | null;
  loadingPages: boolean;
  selectedFacebookPage: FacebookPage | undefined;
  isEn: boolean;
}

export const CreativePageSelector: React.FC<CreativePageSelectorProps> = ({
  formData,
  handleChange,
  getError,
  facebookPages,
  facebookPagesMeta,
  loadingPages,
  selectedFacebookPage,
  isEn,
}) => {
  const readyCompanyPages = facebookPages.filter(
    (page) => page.status === "READY",
  );
  const accessibleUnlinkedPages = facebookPages.filter(
    (page) => page.status === "ACCESSIBLE_BUT_NOT_CONNECTED",
  );
  const connectedButUnavailablePages = facebookPages.filter(
    (page) => page.status === "CONNECTED_BUT_NOT_ACCESSIBLE",
  );

  return (
    <div>
      <label className="block text-sm font-medium text-foreground mb-2">
        {isEn ? "Facebook Page" : "صفحة Facebook"} <span className="text-red-500">*</span>
      </label>

      {facebookPagesMeta?.primaryWarning && (
        <div className="mb-3 rounded-lg border border-warning dark:border-warning/60 bg-warning/10 dark:bg-warning/40 p-3 text-sm text-warning dark:text-warning">
          {facebookPagesMeta.primaryWarning}
        </div>
      )}

      {loadingPages ? (
        <div className="flex items-center gap-2 text-muted-foreground p-3 border border-border bg-card rounded-lg">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">{isEn ? "Loading pages..." : "جاري تحميل الصفحات..."}</span>
        </div>
      ) : facebookPages.length > 0 ? (
        <select
          value={formData.pageId}
          onChange={(e) => handleChange("pageId", e.target.value)}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-card text-foreground ${
            getError("pageId") ? "border-red-500" : "border-border"
          }`}
        >
          <option value="">{isEn ? "Select Page" : "اختر الصفحة"}</option>
          {readyCompanyPages.length > 0 && (
            <optgroup label={isEn ? "Ready Company Pages" : "صفحات الشركة الجاهزة"}>
              {readyCompanyPages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name} {page.category && `(${page.category})`}
                </option>
              ))}
            </optgroup>
          )}
          {accessibleUnlinkedPages.length > 0 && (
            <optgroup label={isEn ? "Meta Pages Not Linked to Company" : "صفحات Meta غير المربوطة بالشركة"}>
              {accessibleUnlinkedPages.map((page) => (
                <option key={page.id} value={page.id} disabled>
                  {page.name} {page.category && `(${page.category})`} - {isEn ? "Link to company before publishing" : "اربطها بالشركة قبل النشر"}
                </option>
              ))}
            </optgroup>
          )}
          {connectedButUnavailablePages.length > 0 && (
            <optgroup label={isEn ? "Currently Unavailable Company Pages" : "صفحات الشركة غير المتاحة حالياً"}>
              {connectedButUnavailablePages.map((page) => (
                <option
                  key={page.id}
                  value={page.id}
                  disabled={page.isSelectable === false}
                >
                  {page.name} - {isEn ? "Requires Facebook reconnection" : "تحتاج إعادة ربط Facebook"}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      ) : (
        <div className="bg-yellow-50 dark:bg-warning/40 border border-warning dark:border-warning/60 rounded-lg p-3">
          <p className="text-sm text-warning dark:text-warning mb-2">
            {isEn ? "⚠️ No pages available. You can enter the page ID manually:" : "⚠️ لا توجد صفحات متاحة. يمكنك إدخال معرف الصفحة يدوياً:"}
          </p>
          <input
            type="text"
            value={formData.pageId}
            onChange={(e) => handleChange("pageId", e.target.value)}
            placeholder={isEn ? "e.g. 123456789" : "مثال: 123456789"}
            className="w-full px-3 py-2 border border-border bg-card text-foreground placeholder-muted dark:placeholder-muted rounded-lg text-sm"
          />
        </div>
      )}

      {facebookPagesMeta?.counts && (
        <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-3">
          <div className="rounded-lg border border-success dark:border-success/60 bg-success/10 dark:bg-success/40 px-3 py-2 text-xs text-success dark:text-success">
            {isEn ? "Ready Pages: " : "صفحات الشركة الجاهزة: "}{facebookPagesMeta.counts.ready}
          </div>
          <div className="rounded-lg border border-warning dark:border-warning/60 bg-warning/10 dark:bg-warning/40 px-3 py-2 text-xs text-warning dark:text-warning">
            {isEn ? "Unlinked Meta Pages: " : "صفحات Meta غير المربوطة: "}{facebookPagesMeta.counts.accessibleButNotConnected}
          </div>
          <div className="rounded-lg border border-destructive dark:border-destructive/60 bg-destructive/10 dark:bg-destructive/40 px-3 py-2 text-xs text-destructive dark:text-destructive">
            {isEn ? "Unavailable Pages: " : "صفحات الشركة غير المتاحة: "}{facebookPagesMeta.counts.connectedButNotAccessible}
          </div>
        </div>
      )}

      {selectedFacebookPage &&
        selectedFacebookPage.isConnectedToCompany === false && (
          <div className="mt-3 rounded-lg border border-warning dark:border-warning/60 bg-warning/10 dark:bg-warning/40 p-3 text-sm text-warning dark:text-warning">
            {isEn
              ? "The ad will be published under an available page from the current Meta account, but it is not linked to this company in Max P."
              : "سيتم إنشاء الإعلان باسم صفحة متاحة من حساب Meta الحالي لكنها غير مربوطة بهذه الشركة داخل Max P."}
          </div>
        )}

      {selectedFacebookPage?.warning && (
        <p className="mt-2 text-xs text-muted-foreground">
          {selectedFacebookPage.warning}
        </p>
      )}

      {facebookPagesMeta?.permissions?.missingRecommended?.length ? (
        <p className="mt-2 text-xs text-muted-foreground">
          {isEn ? "Recommended permissions to display all pages: " : "الصلاحيات التي قد نحتاجها لإظهار الصفحات بشكل أكمل: "}
          {facebookPagesMeta.permissions.missingRecommended.join(", ")}
        </p>
      ) : null}

      {getError("pageId") && (
        <p className="mt-1 text-sm text-destructive">{getError("pageId")}</p>
      )}

      {/* Instagram Account Identity */}
      {formData.pageId && (
        <InstagramIdentitySelector
          pageName={selectedFacebookPage?.name}
          instagramActorId={formData.instagramActorId || ""}
          onInstagramActorIdChange={(val) => handleChange("instagramActorId", val)}
        />
      )}
    </div>
  );
};
