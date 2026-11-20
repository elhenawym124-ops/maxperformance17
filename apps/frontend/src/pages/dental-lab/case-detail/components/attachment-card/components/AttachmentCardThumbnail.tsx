import type { MouseEvent } from "react";
import { FileText, Globe, Loader2 } from "lucide-react";
import type { DentalCaseAttachment } from "../../../../shared";

interface AttachmentCardThumbnailProps {
  attachment: DentalCaseAttachment;
  url: string | null;
  failed: boolean;
  is3D: boolean;
  isPdf: boolean;
  isHtml: boolean;
  isImage: boolean;
  onOpen3d: (e: MouseEvent) => void;
  onOpenPdf: (e: MouseEvent) => void;
  onOpenHtml: (e: MouseEvent) => void;
  onOpen: () => void;
}

export function AttachmentCardThumbnail({
  attachment,
  url,
  failed,
  is3D,
  isPdf,
  isHtml,
  isImage,
  onOpen3d,
  onOpenPdf,
  onOpenHtml,
  onOpen,
}: AttachmentCardThumbnailProps) {
  const handleClick = (e: MouseEvent) => {
    if (is3D && url) {
      onOpen3d(e);
    } else if (isPdf && url) {
      onOpenPdf(e);
    } else if (isHtml && url) {
      onOpenHtml(e);
    } else {
      onOpen();
    }
  };

  const getTitle = () => {
    if (is3D) return "اضغط للمعاينة 3D";
    if (isPdf) return "اضغط لمعاينة الـPDF";
    if (isHtml) return "اضغط لمعاينة عارض / تقرير HTML";
    return "اضغط للتحميل";
  };

  return (
    <div
      className="h-28 bg-muted dark:bg-muted flex items-center justify-center cursor-pointer"
      onClick={handleClick}
      title={getTitle()}
    >
      {url && isImage ? (
        <img src={url} alt={attachment.fileName} className="h-full w-full object-cover" />
      ) : isHtml ? (
        <div className="flex flex-col items-center justify-center p-2 text-center text-success dark:text-success">
          <Globe className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-semibold">عارض 3D / تقرير HTML</span>
        </div>
      ) : isPdf ? (
        <div className="flex flex-col items-center justify-center p-2 text-center text-destructive">
          <FileText className="w-8 h-8 mb-1" />
          <span className="text-[10px] font-semibold">ملف PDF</span>
        </div>
      ) : failed ? (
        <FileText className="w-8 h-8 text-muted-foreground" />
      ) : (
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      )}
      {is3D && (
        <div className="absolute top-1 right-1 bg-primary text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
          3D
        </div>
      )}
      {isPdf && (
        <div className="absolute top-1 right-1 bg-destructive text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
          PDF
        </div>
      )}
      {isHtml && (
        <div className="absolute top-1 right-1 bg-success text-white text-[9px] px-1.5 py-0.5 rounded font-bold font-mono">
          HTML 3D
        </div>
      )}
    </div>
  );
}
