import React, { useEffect, useCallback } from "react";
import { Loader2, CheckCircle, X } from "lucide-react";
import type { useCreateAdWizardController } from "./useCreateAdWizardController";

interface PublishConfirmationModalProps {
  controller: ReturnType<typeof useCreateAdWizardController>;
}

export const PublishConfirmationModal: React.FC<
  PublishConfirmationModalProps
> = ({ controller }) => {
  const {
    showPublishConfirm,
    closePublishConfirmation,
    loading,
    isEn,
    publishDialogRef,
    restorePublishFocusRef,
    selectedBusinessName,
    selectedAdAccountName,
    selectedAdAccountId,
    selectedFacebookPage,
    selectedFacebookPixel,
    formData,
    selectedObjectiveLabel,
    formatSelectedAdAccountCurrency,
    selectedAttributionWindowLabel,
    selectedGeoSummary,
    selectedTargetingSignalCount,
    selectedCreativeSummary,
    selectedRemoteAdAccount,
    selectedAccountHealthLabel,
    publishAccountConfirmed,
    setPublishAccountConfirmed,
    activePublishConfirmed,
    setActivePublishConfirmed,
    publishConfirmDisabled,
    handleSubmit,
  } = controller;

  const getPublishDialogFocusableElements = useCallback(() => {
    const dialog = publishDialogRef.current;
    if (!dialog) return [];

    return Array.from(
      dialog.querySelectorAll<HTMLElement>(
        [
          "button:not([disabled])",
          "input:not([disabled])",
          "select:not([disabled])",
          "textarea:not([disabled])",
          "a[href]",
          '[tabindex]:not([tabindex="-1"])',
        ].join(", ")
      )
    ).filter((element) => element.offsetParent !== null);
  }, [publishDialogRef]);

  useEffect(() => {
    if (!showPublishConfirm) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      const [firstElement] = getPublishDialogFocusableElements();
      firstElement?.focus();
    }, 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) {
        event.preventDefault();
        closePublishConfirmation();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableElements = getPublishDialogFocusableElements();
      if (focusableElements.length === 0) {
        event.preventDefault();
        publishDialogRef.current?.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      if (!firstElement || !lastElement) return;

      if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
        return;
      }

      if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      restorePublishFocusRef.current?.focus?.();
    };
  }, [
    closePublishConfirmation,
    getPublishDialogFocusableElements,
    loading,
    publishDialogRef,
    restorePublishFocusRef,
    showPublishConfirm,
  ]);

  if (!showPublishConfirm) {
    return null;
  }

  const confirmationRows = [
    ["Business", selectedBusinessName],
    [
      isEn ? "Ad Account" : "الحساب الإعلاني",
      `${selectedAdAccountName} / act_${selectedAdAccountId}`,
    ],
    [
      isEn ? "Page" : "الصفحة",
      selectedFacebookPage?.name || (isEn ? "Unspecified" : "غير محددة"),
    ],
    [
      "Pixel",
      selectedFacebookPixel
        ? `${selectedFacebookPixel.name} / ${selectedFacebookPixel.id}`
        : isEn
          ? "Unspecified"
          : "غير محدد",
    ],
    [isEn ? "Campaign" : "الحملة", formData.campaignName],
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
    [isEn ? "Attribution" : "نافذة الإسناد", selectedAttributionWindowLabel],
    [
      isEn ? "Audience" : "الجمهور",
      selectedGeoSummary ||
        (isEn
          ? "No geographic scope specified"
          : "لم يتم تحديد نطاق جغرافي واضح"),
    ],
    [
      isEn ? "Targeting signals" : "إشارات الاستهداف",
      `${selectedTargetingSignalCount} ${isEn ? "selected" : "اختيار"}`,
    ],
    [isEn ? "Creative" : "الكرياتيف", selectedCreativeSummary],
    [
      isEn ? "Status" : "الحالة",
      formData.status === "PAUSED"
        ? isEn
          ? "PAUSED - Safe"
          : "PAUSED - آمن"
        : isEn
          ? "ACTIVE - Starts immediately"
          : "ACTIVE - يبدأ فورا",
    ],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-muted p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-confirm-title"
      dir={isEn ? "ltr" : "rtl"}
    >
      <div
        ref={publishDialogRef}
        tabIndex={-1}
        className="max-h-[90vh] w-full max-w-3xl overflow-y-auto overscroll-contain rounded-xl bg-white dark:bg-muted shadow-2xl border border-border dark:border-border"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border dark:border-border px-6 py-5">
          <div>
            <p className="text-sm font-semibold text-primary dark:text-primary">
              {isEn ? "Pre-Publish Meta Review" : "مراجعة قبل الإرسال إلى Meta"}
            </p>
            <h3
              id="publish-confirm-title"
              className="mt-1 text-2xl font-bold text-foreground dark:text-white"
            >
              {isEn
                ? "Confirm Real Ad Publishing"
                : "تأكيد إنشاء الإعلان الحقيقي"}
            </h3>
            <p className="mt-2 text-sm leading-6 text-foreground dark:text-muted-foreground">
              {isEn
                ? "This step will create and send the Campaign, Ad Set, and Ad directly to Meta Ads Manager. Review the account, budget, and status before confirming."
                : "هذه الخطوة سترسل Campaign وAd Set وAd إلى Ads Manager. راجع الحساب والميزانية والحالة قبل التأكيد."}
            </p>
          </div>
          <button
            type="button"
            onClick={closePublishConfirmation}
            disabled={loading}
            aria-label={
              isEn ? "Close publish confirmation" : "إغلاق شاشة تأكيد النشر"
            }
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div className="space-y-5 px-6 py-5">
          <div className="grid gap-3 md:grid-cols-2">
            {confirmationRows.map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border border-border bg-muted dark:border-border dark:bg-muted px-4 py-3"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground dark:text-muted-foreground">
                  {label}
                </div>
                <div className="mt-1 break-words text-sm font-semibold text-foreground dark:text-white">
                  {value}
                </div>
              </div>
            ))}
          </div>

          {formData.status === "ACTIVE" ? (
            <div className="rounded-xl border border-destructive bg-destructive/10 dark:border-destructive/60 dark:bg-destructive/40 px-4 py-3 text-sm leading-6 text-destructive dark:text-destructive">
              {isEn
                ? "Ad status is set to ACTIVE, which means spending may start immediately upon Meta approval. For a new test, PAUSED is recommended so you can review in Ads Manager first."
                : "الإعلان مضبوط على ACTIVE، يعني ممكن يبدأ الصرف بعد موافقة Meta. الأفضل لأول تجربة إنتاج يكون PAUSED ثم يتم تفعيله من Ads Manager بعد المراجعة."}
            </div>
          ) : (
            <div className="rounded-xl border border-success bg-success/10 dark:border-success/60 dark:bg-success/40 px-4 py-3 text-sm leading-6 text-success dark:text-success">
              {isEn
                ? "Current status is PAUSED (recommended safe mode): The ad will be created without spending immediately."
                : "الوضع الحالي PAUSED، وده الاختيار الآمن: سيتم إنشاء الإعلان بدون تشغيل الصرف مباشرة."}
            </div>
          )}

          {selectedRemoteAdAccount?.billingHealth?.isAccountUsable === false && (
            <div className="rounded-xl border border-warning bg-warning/10 dark:border-warning/60 dark:bg-warning/40 px-4 py-3 text-sm leading-6 text-warning dark:text-warning">
              {isEn
                ? "Meta indicates that the account might not be fully usable: "
                : "Meta يشير أن الحساب قد لا يكون جاهزا بالكامل: "}
              {selectedRemoteAdAccount.billingHealth.disableReason ||
                selectedAccountHealthLabel}
            </div>
          )}

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-white dark:border-border dark:bg-muted px-4 py-3 text-sm leading-6 text-foreground dark:text-muted-foreground">
            <input
              type="checkbox"
              name="confirmAdAccount"
              checked={publishAccountConfirmed}
              onChange={(event) =>
                setPublishAccountConfirmed(event.target.checked)
              }
              className="mt-1 h-4 w-4 rounded border-border dark:border-border text-primary focus-visible:ring-blue-500"
            />
            <span>
              {isEn
                ? "I confirm that the selected ad account is the intended account for this ad: "
                : "أؤكد أن الحساب المختار هو الحساب المقصود لإنشاء الإعلان: "}
              <strong className="mx-1 text-foreground dark:text-white">
                {selectedAdAccountName}
              </strong>
              <span translate="no">act_{selectedAdAccountId}</span>.
            </span>
          </label>

          {formData.status === "ACTIVE" && (
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-destructive bg-destructive/10 dark:border-destructive/60 dark:bg-destructive/40 px-4 py-3 text-sm leading-6 text-destructive dark:text-destructive">
              <input
                type="checkbox"
                name="confirmActivePublish"
                checked={activePublishConfirmed}
                onChange={(event) =>
                  setActivePublishConfirmed(event.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-destructive dark:border-destructive text-destructive focus-visible:ring-red-500"
              />
              <span>
                {isEn
                  ? "I confirm that I want to run the ad as ACTIVE, and spending may start once approved by Meta."
                  : "أؤكد أني أريد تشغيل الإعلان كـACTIVE وقد يبدأ الصرف بعد موافقة Meta."}
              </span>
            </label>
          )}
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-border bg-muted dark:border-border dark:bg-muted px-6 py-5 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={closePublishConfirmation}
            disabled={loading}
            className="rounded-xl border border-border bg-white dark:border-border dark:bg-muted px-5 py-3 text-sm font-semibold text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isEn ? "Back to Review" : "رجوع للمراجعة"}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={publishConfirmDisabled}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-success px-6 py-3 text-sm font-semibold text-white hover:bg-success focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                {isEn ? "Submitting to Meta..." : "جاري الإرسال إلى Meta..."}
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" aria-hidden="true" />
                {isEn ? "Confirm & Create Ad" : "تأكيد وإنشاء الإعلان"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
