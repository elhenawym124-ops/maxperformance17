import React from "react";
import { AlertCircle } from "lucide-react";
import { Button } from "../../../../components/ui/button";

interface HRUnsavedDialogProps {
  open: boolean;
  onCancel: () => void;
  onSaveFirst: () => void;
  onConfirmWithoutSave: () => void;
}

export const HRUnsavedDialog: React.FC<HRUnsavedDialogProps> = ({
  open,
  onCancel,
  onSaveFirst,
  onConfirmWithoutSave,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in-95">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 bg-warning dark:bg-warning/30 rounded-full flex items-center justify-center">
            <AlertCircle className="h-5 w-5 text-warning dark:text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground mb-2">
              تغييرات غير محفوظة
            </h3>
            <p className="text-sm text-foreground dark:text-muted-foreground mb-4">
              لديك تغييرات غير محفوظة. هل تريد المتابعة دون حفظ؟
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={onCancel}
              >
                إلغاء
              </Button>
              <Button
                size="sm"
                onClick={onSaveFirst}
              >
                حفظ أولاً
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onConfirmWithoutSave}
              >
                متابعة دون حفظ
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
