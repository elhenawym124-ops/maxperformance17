import React from "react";
import {
  TrashIcon,
  EyeIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { ApplicationForm, FormResponse, ResponseFilter } from "./types";
import {
  getApplicantStatusBadgeClasses,
  getApplicantStatusLabel,
} from "./helpers";

interface ApplicationFormResponsesModalProps {
  open: boolean;
  selectedForm: ApplicationForm | null;
  responses: FormResponse[];
  visibleResponses: FormResponse[];
  responseFilter: ResponseFilter;
  onResponseFilterChange: (filter: ResponseFilter) => void;
  contactedResponsesCount: number;
  notContactedResponsesCount: number;
  convertingResponseId: string | null;
  updatingResponseId: string | null;
  onConvertResponseToApplicant: (responseId: string) => void;
  onToggleContactStatus: (responseId: string, isContacted: boolean) => void;
  onViewResponseDetail: (response: FormResponse) => void;
  onDeleteResponse: (responseId: string) => void;
  onClose: () => void;
}

export const ApplicationFormResponsesModal: React.FC<
  ApplicationFormResponsesModalProps
> = ({
  open,
  selectedForm,
  responses,
  visibleResponses,
  responseFilter,
  onResponseFilterChange,
  contactedResponsesCount,
  notContactedResponsesCount,
  convertingResponseId,
  updatingResponseId,
  onConvertResponseToApplicant,
  onToggleContactStatus,
  onViewResponseDetail,
  onDeleteResponse,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && selectedForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-card rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground dark:text-white">
                  ردود: {selectedForm.title}
                </h2>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  <button
                    onClick={() => onResponseFilterChange("all")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      responseFilter === "all"
                        ? "bg-purple-100 text-primary dark:bg-primary/30 dark:text-primary"
                        : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                    }`}
                  >
                    الكل (
                    <span className="font-mono tabular-nums">
                      {responses.length}
                    </span>
                    )
                  </button>
                  <button
                    onClick={() => onResponseFilterChange("contacted")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      responseFilter === "contacted"
                        ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                        : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                    }`}
                  >
                    تم التواصل (
                    <span className="font-mono tabular-nums">
                      {contactedResponsesCount}
                    </span>
                    )
                  </button>
                  <button
                    onClick={() => onResponseFilterChange("notContacted")}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                      responseFilter === "notContacted"
                        ? "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning"
                        : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                    }`}
                  >
                    لم يتم التواصل (
                    <span className="font-mono tabular-nums">
                      {notContactedResponsesCount}
                    </span>
                    )
                  </button>
                </div>
              </div>
            </div>

            {responses.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  لا توجد ردود بعد
                </h3>
                <p className="text-muted-foreground">
                  شارك رابط الاستبيان مع المتقدمين
                </p>
              </div>
            ) : visibleResponses.length === 0 ? (
              <div className="text-center py-12">
                <ClipboardDocumentListIcon className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-bold text-foreground mb-2">
                  لا توجد ردود في هذا التصنيف
                </h3>
                <p className="text-muted-foreground">
                  جرّب تغيير فلتر حالة التواصل
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {visibleResponses.map((response) => {
                  const responseCanJoinPipeline = Boolean(
                    selectedForm.jobId || response.form?.jobId
                  );

                  return (
                    <div
                      key={response.id}
                      className={`flex flex-col gap-4 p-4 rounded-xl border transition-all md:flex-row md:items-center md:justify-between ${
                        response.isContacted
                          ? "bg-green-50 border-success dark:bg-success/10 dark:border-success/60"
                          : "bg-amber-50 border-warning dark:bg-warning/10 dark:border-warning/60"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            response.isContacted
                              ? "bg-gradient-to-br from-success to-success"
                              : "bg-gradient-to-br from-warning to-warning"
                          }`}
                        >
                          {response.respondentName.charAt(0)}
                        </div>
                        <div>
                          <h4 className="font-medium text-foreground dark:text-white">
                            {response.respondentName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {response.respondentEmail}
                          </p>
                          {response.respondentPhone && (
                            <p className="text-sm text-muted-foreground font-mono tabular-nums">
                              {response.respondentPhone}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-2 mt-2">
                            <span
                              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                                response.isContacted
                                  ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                                  : "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning"
                              }`}
                            >
                              {response.isContacted ? (
                                <CheckCircleIcon className="w-4 h-4" />
                              ) : (
                                <XCircleIcon className="w-4 h-4" />
                              )}
                              {response.isContacted
                                ? "تم التواصل"
                                : "لم يتم التواصل"}
                            </span>
                            {response.applicant ? (
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${getApplicantStatusBadgeClasses(
                                  response.applicant.status
                                )}`}
                              >
                                <UserGroupIcon className="w-4 h-4" />
                                داخل المسار:{" "}
                                {getApplicantStatusLabel(
                                  response.applicant.status
                                )}
                              </span>
                            ) : responseCanJoinPipeline ? (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                                <UserGroupIcon className="w-4 h-4" />
                                لم يدخل المسار بعد
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                                <UserGroupIcon className="w-4 h-4" />
                                الاستبيان غير مربوط بوظيفة
                              </span>
                            )}
                            {response.isContacted && response.contactedAt && (
                              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                                آخر تواصل:{" "}
                                {format(
                                  new Date(response.contactedAt),
                                  "dd MMM yyyy - HH:mm",
                                  { locale: ar }
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 md:items-end">
                        <span className="text-sm text-muted-foreground font-mono tabular-nums">
                          {format(
                            new Date(response.submittedAt),
                            "dd MMM yyyy - HH:mm",
                            { locale: ar }
                          )}
                        </span>
                        <div className="flex flex-wrap gap-2 md:justify-end">
                          {!response.applicant && (
                            <button
                              onClick={() =>
                                onConvertResponseToApplicant(response.id)
                              }
                              disabled={
                                !responseCanJoinPipeline ||
                                convertingResponseId === response.id
                              }
                              className="px-3 py-2 rounded-lg transition-all text-sm flex items-center gap-1 bg-primary text-primary hover:bg-primary dark:bg-primary/30 dark:text-primary dark:hover:bg-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title={
                                responseCanJoinPipeline
                                  ? "إضافة الرد إلى مسار التوظيف"
                                  : "يجب ربط الاستبيان بوظيفة أولاً"
                              }
                            >
                              <UserGroupIcon className="w-4 h-4" />
                              {convertingResponseId === response.id
                                ? "جاري الإضافة..."
                                : responseCanJoinPipeline
                                  ? "إضافة للمسار"
                                  : "بدون وظيفة"}
                            </button>
                          )}
                          <button
                            onClick={() =>
                              onToggleContactStatus(
                                response.id,
                                !response.isContacted
                              )
                            }
                            disabled={updatingResponseId === response.id}
                            className={`px-3 py-2 rounded-lg transition-all text-sm flex items-center gap-1 ${
                              response.isContacted
                                ? "bg-amber-100 text-warning hover:bg-warning dark:bg-warning/30 dark:text-warning dark:hover:bg-warning/50"
                                : "bg-green-100 text-success hover:bg-success dark:bg-success/30 dark:text-success dark:hover:bg-success/50"
                            } disabled:opacity-60 disabled:cursor-not-allowed`}
                            title={
                              response.isContacted
                                ? "تحديد كـ لم يتم التواصل"
                                : "تحديد كـ تم التواصل"
                            }
                          >
                            {response.isContacted ? (
                              <XCircleIcon className="w-4 h-4" />
                            ) : (
                              <CheckCircleIcon className="w-4 h-4" />
                            )}
                            {updatingResponseId === response.id
                              ? "جاري الحفظ..."
                              : response.isContacted
                                ? "تراجع"
                                : "تم التواصل"}
                          </button>
                          <button
                            onClick={() => onViewResponseDetail(response)}
                            className="p-2 bg-primary dark:bg-primary/30 text-primary rounded-lg hover:bg-primary dark:hover:bg-primary/50"
                            title="عرض التفاصيل"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onDeleteResponse(response.id)}
                            className="p-2 bg-destructive dark:bg-destructive/30 text-destructive rounded-lg hover:bg-destructive dark:hover:bg-destructive/50"
                            title="حذف"
                          >
                            <TrashIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end mt-6 pt-4 border-t border-border dark:border-border">
              <button
                onClick={onClose}
                className="px-6 py-3 bg-muted text-foreground rounded-xl hover:bg-muted dark:hover:bg-muted transition-all"
              >
                إغلاق
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
