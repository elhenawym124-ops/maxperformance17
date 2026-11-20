import React from "react";
import {
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { FormResponse } from "./types";
import {
  getApplicantStatusBadgeClasses,
  getApplicantStatusLabel,
} from "./helpers";

interface ApplicationFormResponseDetailModalProps {
  open: boolean;
  selectedResponse: FormResponse | null;
  selectedResponseCanJoinPipeline: boolean;
  convertingResponseId: string | null;
  updatingResponseId: string | null;
  onConvertResponseToApplicant: (responseId: string) => void;
  onToggleContactStatus: (responseId: string, isContacted: boolean) => void;
  onClose: () => void;
}

export const ApplicationFormResponseDetailModal: React.FC<
  ApplicationFormResponseDetailModalProps
> = ({
  open,
  selectedResponse,
  selectedResponseCanJoinPipeline,
  convertingResponseId,
  updatingResponseId,
  onConvertResponseToApplicant,
  onToggleContactStatus,
  onClose,
}) => {
  return (
    <AnimatePresence>
      {open && selectedResponse && (
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
            className="bg-card rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-foreground dark:text-white mb-6">
              تفاصيل الرد
            </h2>

            <div className="p-4 bg-gradient-to-r from-blue-50 to-primary dark:from-blue-900/20 dark:to-primary/20 rounded-xl mb-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-primary rounded-full flex items-center justify-center text-white text-xl font-bold">
                  {selectedResponse.respondentName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground dark:text-white">
                    {selectedResponse.respondentName}
                  </h3>
                  <p className="text-gray-600 dark:text-muted-foreground">
                    {selectedResponse.respondentEmail}
                  </p>
                  {selectedResponse.respondentPhone && (
                    <p className="text-gray-500 dark:text-muted-foreground text-sm font-mono tabular-nums">
                      {selectedResponse.respondentPhone}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                        selectedResponse.isContacted
                          ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                          : "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning"
                      }`}
                    >
                      {selectedResponse.isContacted ? (
                        <CheckCircleIcon className="w-4 h-4" />
                      ) : (
                        <XCircleIcon className="w-4 h-4" />
                      )}
                      {selectedResponse.isContacted
                        ? "تم التواصل"
                        : "لم يتم التواصل"}
                    </span>
                    {selectedResponse.isContacted &&
                      selectedResponse.contactedAt && (
                        <span className="text-sm text-muted-foreground font-mono tabular-nums">
                          تم التحديث في{" "}
                          {format(
                            new Date(selectedResponse.contactedAt),
                            "dd MMM yyyy - HH:mm",
                            { locale: ar }
                          )}
                        </span>
                      )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    {selectedResponse.applicant ? (
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getApplicantStatusBadgeClasses(
                          selectedResponse.applicant.status
                        )}`}
                      >
                        <UserGroupIcon className="w-4 h-4" />
                        داخل المسار:{" "}
                        {getApplicantStatusLabel(
                          selectedResponse.applicant.status
                        )}
                      </span>
                    ) : selectedResponseCanJoinPipeline ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        <UserGroupIcon className="w-4 h-4" />
                        لم يدخل مسار التوظيف بعد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        <UserGroupIcon className="w-4 h-4" />
                        الاستبيان غير مربوط بوظيفة
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex flex-wrap items-center gap-2">
                  {!selectedResponse.applicant && (
                    <button
                      onClick={() =>
                        onConvertResponseToApplicant(selectedResponse.id)
                      }
                      disabled={
                        !selectedResponseCanJoinPipeline ||
                        convertingResponseId === selectedResponse.id
                      }
                      className="px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 bg-primary text-primary hover:bg-primary dark:bg-primary/30 dark:text-primary dark:hover:bg-primary/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <UserGroupIcon className="w-4 h-4" />
                      {convertingResponseId === selectedResponse.id
                        ? "جاري الإضافة..."
                        : selectedResponseCanJoinPipeline
                          ? "إضافة إلى مسار التوظيف"
                          : "اربط الاستبيان بوظيفة أولاً"}
                    </button>
                  )}
                  <button
                    onClick={() =>
                      onToggleContactStatus(
                        selectedResponse.id,
                        !selectedResponse.isContacted
                      )
                    }
                    disabled={updatingResponseId === selectedResponse.id}
                    className={`px-4 py-2 rounded-lg transition-all text-sm font-medium flex items-center gap-2 ${
                      selectedResponse.isContacted
                        ? "bg-amber-100 text-warning hover:bg-warning dark:bg-warning/30 dark:text-warning dark:hover:bg-warning/50"
                        : "bg-green-100 text-success hover:bg-success dark:bg-success/30 dark:text-success dark:hover:bg-success/50"
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {selectedResponse.isContacted ? (
                      <XCircleIcon className="w-4 h-4" />
                    ) : (
                      <CheckCircleIcon className="w-4 h-4" />
                    )}
                    {updatingResponseId === selectedResponse.id
                      ? "جاري الحفظ..."
                      : selectedResponse.isContacted
                        ? "تحديد كـ لم يتم التواصل"
                        : "تحديد كـ تم التواصل"}
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              {selectedResponse.answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="p-4 bg-muted dark:bg-muted rounded-xl"
                >
                  <p className="font-medium text-foreground dark:text-white mb-2">
                    <span className="font-mono tabular-nums">{index + 1}</span>.{" "}
                    {answer.question.questionText}
                  </p>
                  <p className="text-muted-foreground bg-white dark:bg-muted p-3 rounded-lg">
                    {answer.answerText ||
                      (answer.answerFile ? (
                        <a
                          href={answer.answerFile}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          عرض الملف المرفق
                        </a>
                      ) : (
                        <span className="text-gray-400 italic">
                          لم يتم الإجابة
                        </span>
                      ))}
                  </p>
                </div>
              ))}
            </div>

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
