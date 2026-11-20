import React from "react";
import {
  Layers,
  Plus,
  Save,
  Loader2,
  FileText,
  Music,
  Download,
  Video,
  Image as ImageIcon,
} from "lucide-react";
import { MediaUploadZone, ServiceMediaFile } from "../../../components/services/MediaUploadZone";

interface ServiceOrderMediaCardProps {
  files: ServiceMediaFile[];
  audioFiles: ServiceMediaFile[];
  videoFiles: ServiceMediaFile[];
  imageFiles: ServiceMediaFile[];
  otherFiles: ServiceMediaFile[];
  showAddFiles: boolean;
  setShowAddFiles: (val: boolean) => void;
  additionalFiles: ServiceMediaFile[];
  setAdditionalFiles: (files: ServiceMediaFile[]) => void;
  savingFiles: boolean;
  handleSaveAdditionalFiles: () => void;
  setSelectedImage: (url: string | null) => void;
  formatFileSize: (bytes?: number) => string;
}

export const ServiceOrderMediaCard: React.FC<ServiceOrderMediaCardProps> = ({
  files,
  audioFiles,
  videoFiles,
  imageFiles,
  otherFiles,
  showAddFiles,
  setShowAddFiles,
  additionalFiles,
  setAdditionalFiles,
  savingFiles,
  handleSaveAdditionalFiles,
  setSelectedImage,
  formatFileSize,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap pb-3 border-b border-border dark:border-border">
        <div>
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-600" />
            المرفقات والوسائط ({files.length})
          </h2>
          <p className="text-xs text-muted-foreground">
            الموسيقى، الفيديوهات، التصاميم، وتسليمات العمل النهائية
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddFiles(!showAddFiles)}
          className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 rounded-xl transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          {showAddFiles ? "إلغاء الإضافة" : "إضافة ملفات أو تسليمات"}
        </button>
      </div>

      {showAddFiles && (
        <div className="p-3 bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border space-y-3">
          <MediaUploadZone
            files={additionalFiles}
            onChange={setAdditionalFiles}
            label="رفع مرفقات جديدة أو تسليمات للطلب"
            helperText="يمكنك رفع موسيقى، فيديوهات، أو ملفات لتسليمها للعميل أو الاحتفاظ بها في سجل الطلب."
          />
          {additionalFiles.length > 0 && (
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                disabled={savingFiles}
                onClick={handleSaveAdditionalFiles}
                className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all"
              >
                {savingFiles ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>حفظ الملفات في الطلب</span>
              </button>
            </div>
          )}
        </div>
      )}

      {files.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground space-y-2">
          <FileText className="w-8 h-8 mx-auto opacity-40" />
          <p className="text-xs">لا توجد مرفقات مع هذا الطلب حتى الآن.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Audio */}
          {audioFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-primary dark:text-primary flex items-center gap-1.5">
                <Music className="w-4 h-4" />
                الموسيقى والملفات الصوتية ({audioFiles.length})
              </h4>
              <div className="space-y-2">
                {audioFiles.map((file, i) => (
                  <div
                    key={i}
                    className="p-3 bg-primary/50 dark:bg-primary/20 rounded-xl border border-primary dark:border-primary/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Music className="w-4 h-4 text-primary shrink-0" />
                        <span className="text-xs font-semibold text-foreground dark:text-muted-foreground truncate">
                          {file.originalName}
                        </span>
                        {file.size && (
                          <span className="text-[10px] text-muted-foreground shrink-0">
                            ({formatFileSize(file.size)})
                          </span>
                        )}
                      </div>
                      <a
                        href={file.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-primary hover:text-primary rounded-md"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                    <audio
                      controls
                      preload="none"
                      src={file.url}
                      className="w-full h-8 rounded-lg outline-hidden"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video */}
          {videoFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-destructive dark:text-destructive flex items-center gap-1.5">
                <Video className="w-4 h-4" />
                مقاطع الفيديو ({videoFiles.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {videoFiles.map((file, i) => (
                  <div
                    key={i}
                    className="p-2.5 bg-destructive/50 dark:bg-destructive/20 rounded-xl border border-destructive dark:border-destructive/40 space-y-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-foreground dark:text-muted-foreground truncate">
                        {file.originalName}
                      </span>
                      <a
                        href={file.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 text-destructive hover:text-destructive rounded-md"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                    </div>
                    <video
                      controls
                      preload="metadata"
                      src={file.url}
                      className="w-full rounded-lg max-h-48 bg-black/90 object-contain"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Images */}
          {imageFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4" />
                الصور والتصاميم ({imageFiles.length})
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {imageFiles.map((file, i) => (
                  <div
                    key={i}
                    className="group relative rounded-xl overflow-hidden border border-border dark:border-border aspect-square cursor-pointer"
                    onClick={() => setSelectedImage(file.url)}
                  >
                    <img
                      src={file.url}
                      alt={file.originalName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <a
                        href={file.url}
                        download
                        onClick={(e) => e.stopPropagation()}
                        className="p-1.5 bg-white/90 text-foreground rounded-full"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Docs */}
          {otherFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                المستندات والملفات الأخرى ({otherFiles.length})
              </h4>
              <div className="space-y-1.5">
                {otherFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 bg-muted dark:bg-muted rounded-xl border border-border dark:border-border"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                      <span className="text-xs font-medium text-foreground dark:text-muted-foreground truncate">
                        {file.originalName}
                      </span>
                      {file.size && (
                        <span className="text-[10px] text-muted-foreground">
                          ({formatFileSize(file.size)})
                        </span>
                      )}
                    </div>
                    <a
                      href={file.url}
                      download
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary-600 hover:underline px-2 py-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>تحميل</span>
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
