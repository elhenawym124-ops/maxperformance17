import React from "react";
import {
  UserGroupIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EyeIcon,
  StarIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Applicant } from "./types";
import { getStatusBadge } from "./helpers";

interface ApplicantsGridProps {
  filteredApplicants: Applicant[];
  loading: boolean;
  deletingApplicantId: string | null;
  onViewDetails: (applicant: Applicant) => void;
  onUpdateStatus: (applicantId: string, status: string) => void;
  onDeleteApplicant: (applicant: Applicant) => void;
}

export const ApplicantsGrid: React.FC<ApplicantsGridProps> = ({
  filteredApplicants,
  loading,
  deletingApplicantId,
  onViewDetails,
  onUpdateStatus,
  onDeleteApplicant,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 gap-6">
        <AnimatePresence>
          {filteredApplicants.map((applicant, index) => {
            const statusBadge = getStatusBadge(applicant.status);
            return (
              <motion.div
                key={applicant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.1 }}
                className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-6 shadow-lg border-2 border-border dark:border-border hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-5">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary flex items-center justify-center text-white font-bold text-xl shadow-lg">
                      {applicant.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {applicant.name}
                      </h3>
                      <p className="text-sm text-foreground dark:text-muted-foreground font-medium flex items-center gap-1">
                        <DocumentTextIcon className="w-4 h-4" />
                        {applicant.jobTitle}
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-4 py-2 rounded-xl text-xs font-bold border-2 shadow-sm ${statusBadge.bg}`}
                  >
                    {statusBadge.text}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-3 mb-5">
                  <div className="flex items-center gap-3 p-3 bg-primary/10 dark:bg-primary/20 rounded-xl border border-primary dark:border-primary">
                    <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                      <EnvelopeIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground font-medium truncate">
                      {applicant.email}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-success/10 dark:bg-success/20 rounded-xl border border-success dark:border-success">
                    <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                      <PhoneIcon className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground font-medium font-mono tabular-nums">
                      {applicant.phone}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-4 bg-gradient-to-br from-primary to-primary dark:from-primary/30 dark:to-primary/20 rounded-xl border border-primary dark:border-primary">
                    <div className="text-xs text-primary dark:text-primary font-semibold mb-1">
                      الخبرة
                    </div>
                    <div className="text-2xl font-bold text-primary dark:text-primary font-mono tabular-nums">
                      {applicant.experience}
                    </div>
                    <div className="text-xs text-primary dark:text-primary">
                      سنوات
                    </div>
                  </div>
                  <div className="p-4 bg-gradient-to-br from-primary to-primary dark:from-primary/30 dark:to-primary/20 rounded-xl border border-primary dark:border-primary">
                    <div className="text-xs text-primary font-semibold mb-1">
                      التعليم
                    </div>
                    <div className="text-sm font-bold text-primary dark:text-primary truncate">
                      {applicant.education || "غير محدد"}
                    </div>
                  </div>
                  {applicant.rating && (
                    <div className="col-span-2 p-3 bg-gradient-to-r from-warning to-warning dark:from-warning/20 dark:to-warning/20 rounded-xl border border-warning dark:border-warning">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-warning dark:text-warning font-semibold">
                          التقييم
                        </span>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <StarIcon
                              key={i}
                              className={`w-5 h-5 ${
                                i < applicant.rating!
                                  ? "text-yellow-500 fill-warning"
                                  : "text-gray-300 dark:text-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-5">
                  <div className="text-xs font-bold text-foreground dark:text-muted-foreground mb-2 flex items-center gap-1">
                    <span className="w-2 h-2 bg-primary rounded-full" />
                    المهارات
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {applicant.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary text-white text-xs font-semibold rounded-lg shadow-sm"
                      >
                        {skill}
                      </span>
                    ))}
                    {applicant.skills.length === 0 && (
                      <span className="px-3 py-1.5 bg-muted text-muted-foreground text-xs font-semibold rounded-lg">
                        لا توجد مهارات مسجلة
                      </span>
                    )}
                    {applicant.skills.length > 4 && (
                      <span className="px-3 py-1.5 bg-muted dark:bg-muted text-foreground text-xs font-bold rounded-lg font-mono tabular-nums">
                        +{applicant.skills.length - 4}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-5 border-t-2 border-border dark:border-border">
                  <button
                    onClick={() => onViewDetails(applicant)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-primary to-primary text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all font-semibold"
                  >
                    <EyeIcon className="w-5 h-5" />
                    عرض التفاصيل
                  </button>
                  {applicant.status === "NEW" && (
                    <button
                      onClick={() => onUpdateStatus(applicant.id, "REVIEWING")}
                      aria-label="تحويل إلى قيد المراجعة"
                      className="px-4 py-2 bg-warning/10 dark:bg-warning/20 text-warning rounded-lg hover:bg-warning transition-all"
                    >
                      <ClockIcon className="w-5 h-5" />
                    </button>
                  )}
                  {applicant.status === "REVIEWING" && (
                    <>
                      <button
                        onClick={() =>
                          onUpdateStatus(applicant.id, "INTERVIEW_SCHEDULED")
                        }
                        aria-label="جدولة مقابلة"
                        className="px-4 py-2 bg-success/10 dark:bg-success/20 text-success rounded-lg hover:bg-success transition-all"
                      >
                        <CheckCircleIcon className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => onUpdateStatus(applicant.id, "REJECTED")}
                        aria-label="رفض المتقدم"
                        className="px-4 py-2 bg-destructive/10 dark:bg-destructive/20 text-destructive rounded-lg hover:bg-destructive transition-all"
                      >
                        <XCircleIcon className="w-5 h-5" />
                      </button>
                    </>
                  )}
                  <button
                    type="button"
                    onClick={() => onDeleteApplicant(applicant)}
                    disabled={deletingApplicantId === applicant.id}
                    className="px-4 py-2 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive rounded-lg hover:bg-destructive dark:hover:bg-destructive/30 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    title="حذف المتقدم"
                    aria-label={`حذف ${applicant.name}`}
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredApplicants.length === 0 && !loading && (
        <div className="text-center py-12 bg-card rounded-xl border-2 border-border dark:border-border">
          <UserGroupIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-gray-600 dark:text-muted-foreground text-lg">
            لا يوجد متقدمين
          </p>
        </div>
      )}
    </>
  );
};
