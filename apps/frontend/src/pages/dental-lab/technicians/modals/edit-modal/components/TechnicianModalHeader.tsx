import { X as XMarkIcon } from "lucide-react";

interface TechnicianModalHeaderProps {
  isEditing: boolean;
  error: string | null;
  onClose: () => void;
}

export function TechnicianModalHeader({ isEditing, error, onClose }: TechnicianModalHeaderProps) {
  return (
    <>
      <div className="flex justify-between items-center mb-4 border-b pb-3 dark:border-border">
        <h3 className="font-semibold text-lg">
          {isEditing ? "تعديل بيانات عضو فريق العمل" : "إضافة فني جديد وحساب المنصة"}
        </h3>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground"
          aria-label="إغلاق"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive rounded-lg text-sm border border-destructive dark:border-destructive">
          {error}
        </div>
      )}
    </>
  );
}
