import React from "react";
import { FileText, X as XMarkIcon } from "lucide-react";

interface WorkTypeModalHeaderProps {
  isEdit: boolean;
  saving: boolean;
  onClose: () => void;
}

export const WorkTypeModalHeader: React.FC<WorkTypeModalHeaderProps> = ({
  isEdit,
  saving,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between p-4 sm:p-5 border-b dark:border-border shrink-0">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-bold">
          {isEdit ? "تعديل نوع الشغل" : "إضافة نوع شغل جديد (2026 Ready)"}
        </h3>
      </div>
      <button
        type="button"
        onClick={() => !saving && onClose()}
        className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground"
        aria-label="إغلاق"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default WorkTypeModalHeader;
