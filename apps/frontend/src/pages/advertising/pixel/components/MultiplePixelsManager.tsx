import React, { useState } from "react";
import {
  PlusIcon,
  StarIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckIcon,
  ClipboardDocumentIcon,
  SignalIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import { PixelConfig } from "../types";

interface MultiplePixelsManagerProps {
  pixels: PixelConfig[];
  onOpenAddModal: () => void;
  onOpenCreateModal: () => void;
  onSetPrimary: (pixelId: string) => Promise<void>;
  onDeletePixel: (pixelId: string) => Promise<void>;
  onTestPixelById: (pixelId: string) => Promise<void>;
  testingPixelId: string | null;
}

export const MultiplePixelsManager: React.FC<MultiplePixelsManagerProps> = ({
  pixels,
  onOpenAddModal,
  onOpenCreateModal,
  onSetPrimary,
  onDeletePixel,
  onTestPixelById,
  testingPixelId,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="border border-border dark:border-border bg-white dark:bg-muted rounded-xl overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-3.5 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
            <span>البيكسلات المتعددة (Multiple Pixels)</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary font-mono">
              {pixels.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            مشاركة بيانات التتبع والتحويلات مع حسابات تسويقية إضافية أو شركاء
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted dark:bg-white text-white dark:text-foreground hover:opacity-90 transition-all active:scale-[0.97] min-h-[36px]"
          >
            <PlusIcon className="w-3.5 h-3.5" />
            <span>إضافة Pixel</span>
          </button>
          <button
            type="button"
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/40 hover:bg-success dark:hover:bg-success/50 border border-success/60 dark:border-success/60 transition-all active:scale-[0.97] min-h-[36px]"
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            <span>إنشاء بيكسل جديد</span>
          </button>
        </div>
      </div>

      {/* Pixels List or Empty state */}
      {pixels.length > 0 ? (
        <div className="divide-y divide-border dark:divide-border">
          {pixels.map((pixel) => (
            <div
              key={pixel.id}
              className={`p-3.5 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors ${
                pixel.isPrimary
                  ? "bg-indigo-50/20 dark:bg-primary/10"
                  : "hover:bg-gray-50/50 dark:hover:bg-muted"
              }`}
            >
              <div className="flex items-start sm:items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    pixel.isPrimary
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 dark:bg-muted text-foreground dark:text-muted-foreground"
                  }`}
                >
                  <SignalIcon className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-foreground text-xs sm:text-sm">
                      {pixel.pixelName}
                    </span>
                    {pixel.isPrimary && (
                      <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-primary dark:bg-primary/50 text-primary dark:text-primary font-semibold">
                        <StarSolidIcon className="w-3 h-3 text-primary" />
                        <span>أساسي (Primary)</span>
                      </span>
                    )}
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        pixel.isActive
                          ? "bg-emerald-50 text-success dark:bg-success/40 dark:text-success border border-success/60 dark:border-success/60"
                          : "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                      }`}
                    >
                      {pixel.isActive ? "نشط" : "غير مفعل"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <span
                      dir="ltr"
                      className="font-mono tabular-nums text-foreground bg-muted dark:bg-muted px-1.5 py-0.5 rounded"
                    >
                      {pixel.pixelId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopy(pixel.pixelId)}
                      className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground transition-colors p-0.5"
                      title="نسخ المعرف"
                      aria-label="نسخ المعرف"
                    >
                      {copiedId === pixel.pixelId ? (
                        <CheckIcon className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <ClipboardDocumentIcon className="w-3.5 h-3.5" />
                      )}
                    </button>
                    {pixel.totalEventsSent > 0 && (
                      <span className="text-[11px] font-mono">
                        • {pixel.totalEventsSent} أحداث مرسلة
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 self-end sm:self-center">
                {!pixel.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onSetPrimary(pixel.id)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-foreground hover:bg-muted dark:hover:bg-muted border border-border dark:border-border transition-all active:scale-[0.97] min-h-[34px] flex items-center gap-1"
                    title="تعيين كأساسي للمتجر"
                  >
                    <StarIcon className="w-3.5 h-3.5 text-warning" />
                    <span>تعيين كأساسي</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => onTestPixelById(pixel.id)}
                  disabled={testingPixelId === pixel.id}
                  className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 hover:bg-primary dark:hover:bg-primary/50 border border-primary/60 dark:border-primary/60 transition-all active:scale-[0.97] disabled:opacity-40 min-h-[34px] flex items-center gap-1"
                >
                  {testingPixelId === pixel.id ? (
                    <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>اختبار</span>
                  )}
                </button>

                {!pixel.isPrimary && (
                  <button
                    type="button"
                    onClick={() => onDeletePixel(pixel.id)}
                    className="p-1.5 text-muted-foreground hover:text-destructive dark:hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg transition-colors min-h-[34px] min-w-[34px] flex items-center justify-center"
                    title="حذف البيكسل"
                    aria-label="حذف البيكسل"
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-8 text-center">
          <p className="text-xs text-muted-foreground">
            لم يتم ربط بيكسلات إضافية. يمكنك ربط أكثر من بيكسل لمشاركة بيانات الحملات مع شركاء التسويق.
          </p>
        </div>
      )}
    </section>
  );
};
