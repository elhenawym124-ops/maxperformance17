import React from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface MetaTemplateDeleteDialogProps {
  templateName: string | null;
  onClose: () => void;
  onConfirm: (name: string) => void;
}

export const MetaTemplateDeleteDialog: React.FC<MetaTemplateDeleteDialogProps> = ({
  templateName,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={Boolean(templateName)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:rounded-xl">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-destructive/10 dark:bg-destructive/30">
              <Trash2 className="size-5 text-destructive" />
            </div>
            <div>
              <DialogTitle>حذف القالب</DialogTitle>
              <DialogDescription>
                هل أنت متأكد من حذف القالب <strong>{templateName}</strong>؟
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <div className="rounded-xl border border-destructive bg-destructive/10 p-3 text-xs text-destructive dark:border-destructive dark:bg-destructive/20 dark:text-destructive">
          سيتم حذف جميع ترجمات هذا القالب. هذا الإجراء لا يمكن التراجع عنه.
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            إلغاء
          </Button>
          <Button
            variant="destructive"
            onClick={() => templateName && onConfirm(templateName)}
            className="rounded-full transition-all duration-200 hover:scale-[1.02] active:scale-95"
          >
            حذف
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
