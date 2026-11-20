import { Box, X as XMarkIcon } from "lucide-react";
import DentalModelViewer from "../../../../DentalModelViewer";
import type { DentalCaseAttachment } from "../../../../shared";

interface Attachment3DModalProps {
  show: boolean;
  url: string | null;
  fileExt: string;
  attachment: DentalCaseAttachment;
  onClose: () => void;
}

export function Attachment3DModal({
  show,
  url,
  fileExt,
  attachment,
  onClose,
}: Attachment3DModalProps) {
  if (!show || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Box className="w-5 h-5 text-primary flex-shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {attachment.fileName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums font-mono">
              ({((attachment.size || 0) / 1024 / 1024).toFixed(1)}MB · {fileExt.toUpperCase()})
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
        <div className="flex-1 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative min-h-[500px]">
          {fileExt === "dcm" ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
              ملف DICOM (DCM) لا يُعاين هنا — حمّله وافتحه في عارض DICOM المتخصص.
            </div>
          ) : url ? (
            <DentalModelViewer url={url} ext={fileExt} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
              جاري تحميل النموذج 3D...
            </div>
          )}
        </div>
        <div className="p-3 border-t dark:border-border bg-muted dark:bg-muted text-xs text-foreground dark:text-muted-foreground flex items-center justify-between">
          <span>اسحب لتدوير · عجلة للتقريب · نقرة مزدوجة للإعادة</span>
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
