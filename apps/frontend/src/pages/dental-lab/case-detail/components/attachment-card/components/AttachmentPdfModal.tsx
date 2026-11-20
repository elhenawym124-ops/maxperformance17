import { FileText, X as XMarkIcon } from "lucide-react";
import type { DentalCaseAttachment } from "../../../../shared";

interface AttachmentPdfModalProps {
  show: boolean;
  url: string | null;
  attachment: DentalCaseAttachment;
  onClose: () => void;
}

export function AttachmentPdfModal({
  show,
  url,
  attachment,
  onClose,
}: AttachmentPdfModalProps) {
  if (!show || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-border">
          <div className="flex items-center gap-2 min-w-0">
            <FileText className="w-5 h-5 text-destructive flex-shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {attachment.fileName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums font-mono">
              ({((attachment.size || 0) / 1024).toFixed(0)}KB · PDF)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded flex-shrink-0"
            title="إغلاق"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <iframe src={url} title={attachment.fileName} className="flex-1 w-full bg-white" />
        <div className="p-3 border-t dark:border-border bg-muted dark:bg-muted text-xs text-foreground dark:text-muted-foreground flex items-center justify-between">
          <span>الروشتة / الوصفة الطبية</span>
          <a
            href={url}
            download={attachment.fileName}
            className="text-blue-600 dark:text-primary hover:underline"
          >
            تحميل الملف
          </a>
        </div>
      </div>
    </div>
  );
}
