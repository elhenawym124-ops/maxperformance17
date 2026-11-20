import React from "react";
import {
  BuildingOfficeIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  VideoCameraIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Interview } from "./types";
import {
  getInterviewStatusBadge,
  getInterviewTypeText,
  normalizeInterviewersList,
} from "./helpers";

interface InterviewsGridProps {
  interviews: Interview[];
  loading: boolean;
  onOpenScheduleModal: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const renderTypeIcon = (type: string) => {
  switch (type) {
    case "VIDEO":
      return <VideoCameraIcon className="w-5 h-5 text-primary" />;
    case "PHONE":
      return <PhoneIcon className="w-5 h-5 text-success" />;
    case "IN_PERSON":
      return <BuildingOfficeIcon className="w-5 h-5 text-primary" />;
    default:
      return <ClockIcon className="w-5 h-5" />;
  }
};

export const InterviewsGrid: React.FC<InterviewsGridProps> = ({
  interviews,
  loading,
  onOpenScheduleModal,
  onUpdateStatus,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 relative z-10">
        {interviews.map((interview, index) => {
          const statusBadge = getInterviewStatusBadge(interview.status);
          const interviewersList = normalizeInterviewersList(
            interview.interviewers,
          );

          return (
            <motion.div
              key={interview.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="group relative bg-white/70 dark:bg-muted backdrop-blur-xl rounded-[2rem] p-6 border border-white/40 dark:border-border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 dark:hover:bg-muted"
            >
              <div className="absolute inset-0 hidden" />

              <div className="relative">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-white dark:from-primary/50 dark:to-gray-800 flex items-center justify-center shadow-inner border border-white/50 dark:border-border">
                      <UserIcon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-foreground dark:text-white leading-tight">
                        {interview.applicantName}
                      </h3>
                      <p className="text-xs text-muted-foreground font-medium bg-muted dark:bg-muted px-2 py-0.5 rounded-full inline-block mt-1">
                        {interview.jobTitle}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-xs font-bold border ${statusBadge.bg} shadow-sm`}
                  >
                    {statusBadge.text}
                  </div>
                </div>

                {/* Date & Time Strip */}
                <div className="flex items-center gap-4 bg-muted dark:bg-muted rounded-xl p-3 mb-4 border border-border dark:border-border">
                  <div className="flex items-center gap-2 text-foreground">
                    <CalendarDaysIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold font-mono tabular-nums">
                      {format(new Date(interview.date), "dd MMM", {
                        locale: ar,
                      })}
                    </span>
                  </div>
                  <div className="w-px h-4 bg-muted dark:bg-muted" />
                  <div className="flex items-center gap-2 text-foreground">
                    <ClockIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold font-mono tabular-nums">
                      {interview.time}
                    </span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{renderTypeIcon(interview.type)}</div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">
                        طريقة المقابلة
                      </p>
                      <p className="text-sm font-medium text-foreground dark:text-muted-foreground">
                        {getInterviewTypeText(interview.type)}
                      </p>
                      {interview.location && (
                        <p className="text-xs text-primary mt-0.5 truncate max-w-[200px]">
                          {interview.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {interviewersList.length > 0 && (
                    <div className="flex items-center gap-2 pt-2 border-t border-border dark:border-border">
                      <div className="flex -space-x-2 space-x-reverse overflow-hidden">
                        {interviewersList.slice(0, 3).map((interviewer, idx) => (
                          <div
                            key={idx}
                            className="w-8 h-8 rounded-full bg-gradient-to-tr from-gray-200 to-white dark:from-gray-700 dark:to-gray-600 border-2 border-white dark:border-border flex items-center justify-center text-xs font-bold text-muted-foreground"
                            title={interviewer}
                          >
                            {interviewer.charAt(0)}
                          </div>
                        ))}
                        {interviewersList.length > 3 && (
                          <div className="w-8 h-8 rounded-full bg-muted border-2 border-white dark:border-border flex items-center justify-center text-xs font-bold text-muted-foreground font-mono tabular-nums">
                            +{interviewersList.length - 3}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-muted-foreground">
                        لجنة المقابلة
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions - Only show for Scheduled */}
                {interview.status === "SCHEDULED" && (
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-border dark:border-border">
                    <button
                      onClick={() => onUpdateStatus(interview.id, "COMPLETED")}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg bg-success/10 dark:bg-success/20 text-success dark:text-success hover:bg-success dark:hover:bg-success/30 transition-colors text-sm font-bold"
                    >
                      <CheckCircleIcon className="w-4 h-4" />
                      تمت
                    </button>
                    <button
                      onClick={() => onUpdateStatus(interview.id, "CANCELLED")}
                      className="flex items-center justify-center gap-1 py-2 rounded-lg bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive hover:bg-destructive dark:hover:bg-destructive/30 transition-colors text-sm font-bold"
                    >
                      <XCircleIcon className="w-4 h-4" />
                      إلغاء
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {interviews.length === 0 && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center relative z-10"
        >
          <div className="w-32 h-32 bg-gradient-to-br from-primary to-primary dark:from-gray-800 dark:to-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CalendarDaysIcon className="w-16 h-16 text-primary dark:text-foreground" />
          </div>
          <h3 className="text-2xl font-bold text-foreground dark:text-white mb-2">
            لا توجد مقابلات مجدولة
          </h3>
          <p className="text-gray-500 max-w-md mx-auto mb-8">
            ابدأ بتنظيم جدول أعمالك ومقابلات المرشحين بسهولة من هنا.
          </p>
          <button
            onClick={onOpenScheduleModal}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-xl shadow-xs font-medium"
          >
            جدولة أول مقابلة
          </button>
        </motion.div>
      )}

      {loading && (
        <div className="flex justify-center items-center py-32">
          <div className="relative">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
            <div className="absolute inset-0 flex items-center justify-center">
              
            </div>
          </div>
        </div>
      )}
    </>
  );
};
