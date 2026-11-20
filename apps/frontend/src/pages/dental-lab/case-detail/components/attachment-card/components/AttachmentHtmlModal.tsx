import { ExternalLink, Globe, X as XMarkIcon } from "lucide-react";
import type { DentalCaseAttachment } from "../../../../shared";

interface AttachmentHtmlModalProps {
  show: boolean;
  url: string | null;
  attachment: DentalCaseAttachment;
  onClose: () => void;
}

export function AttachmentHtmlModal({
  show,
  url,
  attachment,
  onClose,
}: AttachmentHtmlModalProps) {
  if (!show || !url) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-card rounded-xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b dark:border-border">
          <div className="flex items-center gap-2 min-w-0">
            <Globe className="w-5 h-5 text-success flex-shrink-0" />
            <span className="font-semibold text-foreground truncate">
              {attachment.fileName}
            </span>
            <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums font-mono">
              ({((attachment.size || 0) / 1024 / 1024).toFixed(1)}MB · HTML)
            </span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <a
              href={url}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 text-xs bg-success/10 hover:bg-success text-success dark:bg-success/30 dark:text-success dark:hover:bg-success/50 rounded font-medium flex items-center gap-1"
            >
              <span>فتح في نافذة كاملة</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={onClose}
              className="p-1 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded"
              title="إغلاق"
              aria-label="Close"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-white dark:bg-muted relative">
          <iframe
            src={url}
            title={attachment.fileName}
            className="w-full h-full border-0 rounded-b-xl"
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        </div>
      </div>
    </div>
  );
}
