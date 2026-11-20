import React from "react";
import { useTranslation } from "react-i18next";
import { Archive, Download, UploadCloud } from "lucide-react";

export interface BulkOrderFileDropzoneProps {
  dragOver: boolean;
  pendingFile: File | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDownloadTemplate: () => void;
}

export const BulkOrderFileDropzone: React.FC<BulkOrderFileDropzoneProps> = React.memo(
  ({
    dragOver,
    pendingFile,
    fileInputRef,
    onDragOver,
    onDragLeave,
    onDrop,
    onFileSelect,
    onDownloadTemplate,
  }) => {
    const { t } = useTranslation();

    return (
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="block text-xs font-semibold text-foreground">
            {t("orders.bulkUploadFile")}
          </label>
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:underline"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t("orders.bulkDownloadTemplate") || "تحميل النموذج"}</span>
          </button>
        </div>
        <div
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-colors ${
            dragOver
              ? "border-primary bg-primary/5"
              : pendingFile
              ? "border-success/40 bg-success/5"
              : "border-border/70 bg-muted/20 hover:border-primary/40 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            onChange={onFileSelect}
            className="hidden"
          />
          {pendingFile ? (
            <div className="text-center">
              <Archive className="mx-auto mb-2 h-8 w-8 text-success dark:text-success" />
              <p className="text-xs font-semibold text-success dark:text-success">
                {pendingFile.name}
              </p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t("orders.bulkFileWillUploadAfterSave") ||
                  "سيتم رفع الملف بعد الحفظ"}
              </p>
            </div>
          ) : (
            <>
              <UploadCloud className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                {t("orders.bulkUploadHint")}
              </p>
            </>
          )}
        </div>
      </div>
    );
  }
);

BulkOrderFileDropzone.displayName = "BulkOrderFileDropzone";
