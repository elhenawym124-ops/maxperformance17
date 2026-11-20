import React from "react";
import { Loader2, CheckCircle } from "lucide-react";
import { PublishConfirmationModal } from "./PublishConfirmationModal";
import type { useCreateAdWizardController } from "./useCreateAdWizardController";

interface AiDraftReviewViewProps {
  controller: ReturnType<typeof useCreateAdWizardController>;
}

export const AiDraftReviewView: React.FC<AiDraftReviewViewProps> = ({
  controller,
}) => {
  const {
    isEn,
    navigate,
    setShowFullWizard,
    setCurrentStep,
    selectedAdAccountName,
    selectedAdAccountId,
    requestedAdAccountId,
    selectedFacebookPage,
    formData,
    selectedFacebookPixel,
    selectedObjectiveLabel,
    formatSelectedAdAccountCurrency,
    selectedGeoSummary,
    selectedCreativeSummary,
    prefillProductTitle,
    errors,
    handleChange,
    handleRequestPublishConfirmation,
    loading,
  } = controller;

  const compactRows = [
    [
      isEn ? "Account" : "الحساب",
      `${selectedAdAccountName} / act_${selectedAdAccountId || requestedAdAccountId}`,
    ],
    [
      isEn ? "Page" : "الصفحة",
      selectedFacebookPage?.name ||
        formData.pageId ||
        (isEn ? "Unspecified" : "غير محددة"),
    ],
    [
      "Pixel",
      selectedFacebookPixel
        ? `${selectedFacebookPixel.name} / ${selectedFacebookPixel.id}`
        : formData.pixelId || (isEn ? "Unspecified" : "غير محدد"),
    ],
    [isEn ? "Objective" : "الهدف", selectedObjectiveLabel],
    [
      isEn ? "Budget" : "الميزانية",
      `${formatSelectedAdAccountCurrency(formData.budgetAmount)} / ${
        formData.budgetType === "DAILY"
          ? isEn
            ? "Daily"
            : "يوميا"
          : isEn
            ? "Lifetime"
            : "إجمالي"
      }`,
    ],
    [
      isEn ? "Audience" : "الجمهور",
      selectedGeoSummary || (isEn ? "Unspecified" : "غير محدد"),
    ],
    [isEn ? "Age" : "السن", `${formData.ageMin} - ${formData.ageMax}`],
    [isEn ? "Creative" : "الكرياتيف", selectedCreativeSummary],
  ];

  const returnParams = new URLSearchParams();
  const returnAccountId = selectedAdAccountId || requestedAdAccountId;
  if (returnAccountId) {
    returnParams.set("adAccountId", returnAccountId);
  }

  return (
    <div
      className="min-h-screen bg-muted px-3 py-3 text-foreground dark:bg-muted dark:text-white sm:px-4 lg:px-5"
      dir={isEn ? "ltr" : "rtl"}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="flex flex-col gap-2 rounded-lg border border-border bg-white p-3 shadow-sm dark:border-border dark:bg-muted lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="text-xs font-bold text-primary">
              {isEn ? "Draft Review" : "مراجعة المسودة"}
            </div>
            <h1 className="mt-1 truncate text-lg font-black text-foreground dark:text-white">
              {formData.campaignName || prefillProductTitle}
            </h1>
            <div className="mt-1 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
              <span>{prefillProductTitle}</span>
              <span>{selectedCreativeSummary}</span>
              <span>{formData.status}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setShowFullWizard(true);
                setCurrentStep(1);
              }}
              className="rounded-md border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              {isEn ? "Full Edit" : "تعديل كامل"}
            </button>
            <button
              type="button"
              onClick={() =>
                navigate(
                  `/advertising/facebook-ads${
                    returnParams.toString() ? `?${returnParams.toString()}` : ""
                  }`
                )
              }
              className="rounded-md border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
            >
              {isEn ? "Back to Ads Center" : "رجوع لمركز الإعلانات"}
            </button>
          </div>
        </div>

        {Object.values(errors).some(Boolean) && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3 text-sm font-semibold text-destructive">
            {Object.values(errors).filter(Boolean).join(" - ")}
          </div>
        )}

        <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
          <section className="rounded-lg border border-border bg-white p-3 shadow-sm dark:border-border dark:bg-muted">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {compactRows.map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-md border border-border bg-muted px-3 py-2 dark:border-border dark:bg-muted"
                >
                  <div className="text-[11px] font-bold uppercase text-muted-foreground">
                    {label}
                  </div>
                  <div className="mt-1 break-words text-sm font-bold text-foreground dark:text-white">
                    {value}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 grid gap-3 lg:grid-cols-2">
              <div className="rounded-md border border-border p-3 dark:border-border">
                <div className="text-xs font-bold text-muted-foreground">
                  {isEn ? "Primary Text" : "النص الأساسي"}
                </div>
                <p className="mt-2 max-h-28 overflow-y-auto text-sm leading-6 text-foreground dark:text-muted-foreground">
                  {formData.primaryText || (isEn ? "Unspecified" : "غير محدد")}
                </p>
              </div>
              <div className="rounded-md border border-border p-3 dark:border-border">
                <div className="text-xs font-bold text-muted-foreground">
                  {isEn ? "Headline & Link" : "العنوان والرابط"}
                </div>
                <div className="mt-2 text-sm font-bold text-foreground dark:text-white">
                  {formData.headline || (isEn ? "No headline" : "بدون عنوان")}
                </div>
                <div className="mt-1 truncate text-xs font-semibold text-primary">
                  {formData.linkUrl || (isEn ? "No link" : "بدون رابط")}
                </div>
              </div>
            </div>
          </section>

          <aside className="rounded-lg border border-border bg-white p-3 shadow-sm dark:border-border dark:bg-muted">
            <div className="text-sm font-black text-foreground dark:text-white">
              {isEn ? "Publish Status" : "حالة النشر"}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleChange("status", "PAUSED")}
                className={`rounded-md border px-3 py-2 text-sm font-bold ${
                  formData.status === "PAUSED"
                    ? "border-amber-400 bg-warning/10 text-warning"
                    : "border-slate-200 text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground"
                }`}
              >
                PAUSED
              </button>
              <button
                type="button"
                onClick={() => handleChange("status", "ACTIVE")}
                className={`rounded-md border px-3 py-2 text-sm font-bold ${
                  formData.status === "ACTIVE"
                    ? "border-emerald-500 bg-success/10 text-success"
                    : "border-slate-200 text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground"
                }`}
              >
                ACTIVE
              </button>
            </div>
            <button
              type="button"
              onClick={handleRequestPublishConfirmation}
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-success px-4 py-3 text-sm font-black text-white hover:bg-success disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {isEn ? "Creating..." : "جاري الإنشاء..."}
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {isEn ? "Review & Publish" : "مراجعة الإرسال"}
                </>
              )}
            </button>
            <div className="mt-3 rounded-md bg-muted p-2 text-xs font-semibold leading-5 text-foreground dark:bg-muted dark:text-muted-foreground">
              {isEn
                ? "The same draft lock and an idempotent publish request will be used."
                : "سيتم استخدام نفس قفل الدرفت وطلب نشر جديد آمن من التكرار."}
            </div>
          </aside>
        </div>
      </div>
      <PublishConfirmationModal controller={controller} />
    </div>
  );
};
