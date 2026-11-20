import React from "react";
import {
  Affiliate,
  AffiliateDocumentVersion,
  AffiliateReviewLog,
} from "./types";
import { getDocumentSourceLabel } from "./helpers";

interface AffiliateReviewHistoryModalProps {
  isDark: boolean;
  affiliate: Affiliate | null;
  loadingReviewHistory: boolean;
  reviewHistory: AffiliateReviewLog[];
  documentHistory: AffiliateDocumentVersion[];
  onClose: () => void;
}

export const AffiliateReviewHistoryModal: React.FC<
  AffiliateReviewHistoryModalProps
> = ({
  isDark,
  affiliate,
  loadingReviewHistory,
  reviewHistory,
  documentHistory,
  onClose,
}) => {
  if (!affiliate) {
    return null;
  }

  const currentVersion = documentHistory.find((version) => version.isCurrent);
  const previousVersions = documentHistory.filter((version) => !version.isCurrent);
  const currentUploadDate =
    currentVersion?.uploadedAt || affiliate.identityDocumentUploadedAt;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4">
      <div
        className={`w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl shadow-xl ${
          isDark
            ? "bg-gray-800 border border-border"
            : "bg-white border border-border"
        }`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-6 dark:border-border">
          <div>
            <h2
              className={`text-xl font-bold ${
                isDark ? "text-white" : "text-gray-900"
              }`}
            >
              سجل مراجعات المسوق
            </h2>
            <p
              className={`mt-2 text-sm ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {affiliate.user.firstName} {affiliate.user.lastName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              isDark
                ? "bg-gray-700 text-muted-foreground hover:bg-muted"
                : "bg-gray-100 text-foreground hover:bg-muted"
            }`}
          >
            إغلاق
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-6">
          {loadingReviewHistory ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              جارٍ تحميل السجل...
            </div>
          ) : (
            <div className="space-y-6">
              <div
                className={`rounded-xl border p-4 ${
                  isDark
                    ? "border-gray-700 bg-muted"
                    : "border-gray-200 bg-muted"
                }`}
              >
                <h3
                  className={`text-sm font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  مقارنة المستندات
                </h3>
                {documentHistory.length > 0 || affiliate.identityDocumentUrl ? (
                  <div className="mt-4 space-y-3">
                    <div
                      className={`rounded-xl border p-4 ${
                        isDark
                          ? "border-gray-700 bg-muted"
                          : "border-gray-200 bg-white"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p
                            className={`font-medium ${
                              isDark ? "text-white" : "text-gray-900"
                            }`}
                          >
                            المستند الحالي
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                            {currentUploadDate
                              ? new Date(currentUploadDate).toLocaleString(
                                  "ar-EG",
                                )
                              : "بدون تاريخ رفع"}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {getDocumentSourceLabel(currentVersion?.source)}
                          </p>
                        </div>
                        {affiliate.identityDocumentUrl && (
                          <a
                            href={affiliate.identityDocumentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="rounded-lg bg-primary px-3 py-1.5 text-xs text-white hover:bg-primary transition"
                          >
                            فتح المستند الحالي
                          </a>
                        )}
                      </div>
                      {affiliate.identityDocumentReviewNote && (
                        <p
                          className={`mt-3 text-sm ${
                            isDark ? "text-gray-300" : "text-gray-700"
                          }`}
                        >
                          {affiliate.identityDocumentReviewNote}
                        </p>
                      )}
                    </div>

                    {previousVersions.length > 0 ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        {previousVersions.map((version) => (
                          <div
                            key={version.id}
                            className={`rounded-xl border p-4 ${
                              isDark
                                ? "border-gray-700 bg-muted"
                                : "border-gray-200 bg-white"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p
                                  className={`font-medium ${
                                    isDark ? "text-white" : "text-gray-900"
                                  }`}
                                >
                                  نسخة سابقة
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                                  {new Date(version.uploadedAt).toLocaleString(
                                    "ar-EG",
                                  )}
                                </p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                  {getDocumentSourceLabel(version.source)}
                                </p>
                              </div>
                              <a
                                href={version.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="rounded-lg border border-primary px-3 py-1.5 text-xs text-primary hover:bg-primary/10 transition"
                              >
                                فتح النسخة
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        لا توجد نسخ أقدم محفوظة بعد لهذا المستند.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">
                    لا يوجد مستند اعتماد مرفوع لهذا المسوق.
                  </p>
                )}
              </div>

              <div>
                <h3
                  className={`mb-3 text-sm font-semibold ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  سجل القرارات والمراجعات
                </h3>
                {reviewHistory.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    لا يوجد سجل مراجعات بعد لهذا المسوق.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reviewHistory.map((log) => (
                      <div
                        key={log.id}
                        className={`rounded-xl border p-4 ${
                          isDark
                            ? "border-gray-700 bg-muted"
                            : "border-gray-200 bg-muted"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p
                              className={`font-semibold ${
                                isDark ? "text-white" : "text-gray-900"
                              }`}
                            >
                              {log.title}
                            </p>
                            <p className="mt-1 text-xs text-muted-foreground tabular-nums">
                              {new Date(log.createdAt).toLocaleString("ar-EG")}
                            </p>
                          </div>
                          {log.actor && (
                            <div className="text-left text-xs text-muted-foreground">
                              <div>{log.actor.name || "إدارة النظام"}</div>
                              {log.actor.email && <div>{log.actor.email}</div>}
                            </div>
                          )}
                        </div>

                        {log.note && (
                          <p
                            className={`mt-3 text-sm leading-6 ${
                              isDark ? "text-gray-300" : "text-gray-700"
                            }`}
                          >
                            {log.note}
                          </p>
                        )}

                        {(log.previousStatus ||
                          log.nextStatus ||
                          log.previousDocumentStatus ||
                          log.nextDocumentStatus) && (
                          <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                            {log.previousStatus && log.nextStatus && (
                              <span
                                className={`rounded-full px-2 py-1 ${
                                  isDark
                                    ? "bg-gray-800 text-muted-foreground"
                                    : "bg-white text-foreground"
                                }`}
                              >
                                حالة الحساب: {log.previousStatus} ←{" "}
                                {log.nextStatus}
                              </span>
                            )}
                            {log.previousDocumentStatus &&
                              log.nextDocumentStatus && (
                                <span
                                  className={`rounded-full px-2 py-1 ${
                                    isDark
                                      ? "bg-gray-800 text-muted-foreground"
                                      : "bg-white text-foreground"
                                  }`}
                                >
                                  حالة المستند: {log.previousDocumentStatus} ←{" "}
                                  {log.nextDocumentStatus}
                                </span>
                              )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
