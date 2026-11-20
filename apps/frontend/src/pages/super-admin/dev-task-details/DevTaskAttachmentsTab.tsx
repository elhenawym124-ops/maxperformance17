import React from "react";
import {
  CloudArrowDownIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { ConfirmModalState } from "./types";

export interface DevTaskAttachmentsTabProps {
  attachments?: any[];
  isUploading: boolean;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setConfirmModal: React.Dispatch<React.SetStateAction<ConfirmModalState>>;
  handleDeleteAttachment: (id: string) => void;
}

export const DevTaskAttachmentsTab: React.FC<DevTaskAttachmentsTabProps> = ({
  attachments,
  isUploading,
  handleFileUpload,
  setConfirmModal,
  handleDeleteAttachment,
}) => {
  return (
    <div>
      <div className="mb-6">
        <label className="block w-full cursor-pointer bg-gradient-to-br from-primary to-primary dark:from-primary/20 dark:to-primary/20 border-2 border-dashed border-primary dark:border-primary rounded-xl p-8 text-center hover:from-primary hover:to-primary dark:hover:from-primary/30 dark:hover:to-primary/30 transition-all group">
          <input
            type="file"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isUploading}
            multiple
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt"
          />
          <div className="w-16 h-16 bg-card rounded-full shadow-lg flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
            <CloudArrowDownIcon className="h-8 w-8 text-primary" />
          </div>
          <span className="text-foreground font-bold block text-lg mb-1">
            {isUploading ? "جاري الرفع..." : "اضغط لرفع ملفات متعددة"}
          </span>
          <span className="text-sm text-muted-foreground block mb-2">
            يمكنك اختيار أكثر من ملف في نفس الوقت (حتى 10 ملفات)
          </span>
          <span className="text-xs text-muted-foreground/80 block">
            الحد الأقصى: 20 ميجابايت لكل ملف • الصور، PDF، Word، Excel
          </span>
        </label>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {attachments?.map((file) => {
          const isImage = file.fileType?.startsWith("image/");
          return (
            <div
              key={file.id}
              className="border border-border dark:border-border rounded-xl bg-card hover:shadow-md transition-shadow group relative overflow-hidden"
            >
              {isImage ? (
                <div className="relative">
                  <img
                    src={file.fileUrl || `/uploads/dev-tasks/${file.fileName}`}
                    alt={file.originalName || file.fileName}
                    className="w-full h-48 object-cover"
                  />
                  <div className="absolute top-2 left-2 flex gap-1">
                    <a
                      href={
                        file.fileUrl || `/uploads/dev-tasks/${file.fileName}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 bg-white/90 dark:bg-muted hover:bg-white dark:hover:bg-muted rounded-lg text-foreground shadow-sm"
                    >
                      <CloudArrowDownIcon className="h-5 w-5" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          message: "هل أنت متأكد من حذف هذا المرفق؟",
                          onConfirm: () => handleDeleteAttachment(file.id),
                        })
                      }
                      className="p-2 bg-white/90 dark:bg-muted hover:bg-destructive/10 dark:hover:bg-destructive/50 rounded-lg text-foreground hover:text-destructive shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-3 bg-gradient-to-t from-black/50 to-transparent absolute bottom-0 left-0 right-0">
                    <p
                      className="text-sm font-semibold text-white truncate"
                      title={file.originalName || file.fileName}
                    >
                      {file.originalName || file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-mono tabular-nums">
                      {(file.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 p-4">
                  <div className="w-12 h-12 bg-primary/10 dark:bg-primary/30 rounded-lg flex items-center justify-center text-primary">
                    <PaperClipIcon className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm font-semibold text-foreground truncate"
                      title={file.originalName || file.fileName}
                    >
                      {file.originalName || file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span className="font-mono tabular-nums">
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </span>{" "}
                      •{" "}
                      {new Date(file.createdAt).toLocaleDateString("ar-EG")}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <a
                      href={
                        file.fileUrl || `/uploads/dev-tasks/${file.fileName}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
                    >
                      <CloudArrowDownIcon className="h-5 w-5" />
                    </a>
                    <button
                      type="button"
                      onClick={() =>
                        setConfirmModal({
                          open: true,
                          message: "هل أنت متأكد من حذف هذا المرفق؟",
                          onConfirm: () => handleDeleteAttachment(file.id),
                        })
                      }
                      className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {(!attachments || attachments.length === 0) && (
        <div className="text-center py-6 text-muted-foreground bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border mt-4">
          <PaperClipIcon className="h-9 w-9 mx-auto mb-2 text-muted-foreground dark:text-foreground" />
          <p className="text-sm">لا توجد مرفقات</p>
        </div>
      )}
    </div>
  );
};
