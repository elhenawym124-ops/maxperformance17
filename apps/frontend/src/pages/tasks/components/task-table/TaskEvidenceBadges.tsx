import React from "react";
import type { Task } from "../../types";

interface TaskEvidenceBadgesProps {
  task: Task;
}

export const TaskEvidenceBadges: React.FC<TaskEvidenceBadgesProps> = ({ task }) => {
  const normStatus = String(task.status || "").toLowerCase();
  const isReview = normStatus === "in_review";
  const isMissingEvidence = task.missingEvidence || (isReview && !task.hasEvidence);

  let isBlocked48h = false;
  if (isReview && task.submittedForReviewAt) {
    const diffHours =
      (Date.now() - new Date(task.submittedForReviewAt).getTime()) / (1000 * 60 * 60);
    isBlocked48h = diffHours > 48;
  }

  return (
    <div className="inline-flex items-center gap-1 flex-wrap">
      {isMissingEvidence && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-destructive/10 px-2 py-0.5 text-[10px] font-medium text-destructive dark:text-destructive border border-destructive/20"
          title="المهمة في المراجعة بدون مرفقات أو دليل عمل كافٍ"
        >
          ⚠️ بدون دليل
        </span>
      )}
      {isBlocked48h && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning dark:text-warning border border-warning/20"
          title="معلقة في المراجعة لأكثر من 48 ساعة"
        >
          ⏳ مسدودة &gt; 48h
        </span>
      )}
      {task.returnCount && task.returnCount > 0 ? (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-medium text-warning dark:text-warning border border-warning/20"
          title={`أعيدت للتعديل ${task.returnCount} مرات`}
        >
          ↩️ إرجاع ({task.returnCount})
        </span>
      ) : null}
      {task.convertedFromBacklog && (
        <span
          className="inline-flex items-center gap-0.5 rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success dark:text-success border border-success/20"
          title="محوّلة من الباك لوج"
        >
          تحسين
        </span>
      )}
    </div>
  );
};
