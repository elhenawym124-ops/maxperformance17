import React from "react";
import { X, Check, Zap, Cpu, Layers, ShieldCheck } from "lucide-react";
import { ALLOWED_IMAGE_MODELS } from "./types";

interface CreativeModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const CreativeModelSelectorModal: React.FC<CreativeModelSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedModel,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-muted backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border dark:border-border bg-muted dark:bg-muted">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground dark:text-white">
                معرض نماذج التوليد الإعلاني (AI Models Hub 2026)
              </h2>
              <p className="text-xs text-muted-foreground dark:text-muted-foreground">
                اختر محرك الذكاء الاصطناعي الأنسب لحملتك بحسب متطلبات الواقعية والسرعة
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Model Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {ALLOWED_IMAGE_MODELS.map((model) => {
            const isSelected = selectedModel === model.id;
            return (
              <div
                key={model.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  onSelectModel(model.id);
                  onClose();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectModel(model.id);
                    onClose();
                  }
                }}
                className={`group relative p-4 rounded-xl border text-right transition cursor-pointer flex flex-col gap-2 ${
                  isSelected
                    ? "border-indigo-600 bg-primary/40 dark:bg-primary/20 ring-1 ring-primary"
                    : "border-slate-200 dark:border-border hover:border-border dark:hover:border-border bg-white dark:bg-muted hover:bg-muted dark:hover:bg-muted"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {isSelected ? (
                      <span className="flex items-center gap-1 text-xs font-bold text-primary bg-primary dark:bg-primary px-2.5 py-0.5 rounded-full">
                        <Check className="w-3.5 h-3.5" />
                        النموذج النشط حالياً
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-muted-foreground opacity-0 group-hover:opacity-100 transition">
                        انقر للتبديل لهذا النموذج
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {model.badge && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-warning/10 text-warning dark:text-warning border border-warning/20">
                        {model.badge}
                      </span>
                    )}
                    <h3 className="text-sm font-bold text-foreground dark:text-white">
                      {model.nameAr}
                    </h3>
                  </div>
                </div>

                <p className="text-xs text-foreground dark:text-muted-foreground leading-relaxed">
                  {model.description}
                </p>

                <div className="pt-2 border-t border-border dark:border-border flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    {model.latencyP95 && (
                      <span className="flex items-center gap-1 font-mono">
                        <Zap className="w-3 h-3 text-warning" />
                        الاستجابة: {model.latencyP95}
                      </span>
                    )}
                    {model.resolution && (
                      <span className="flex items-center gap-1 font-mono">
                        <Layers className="w-3 h-3 text-blue-500" />
                        دقة التوليد: {model.resolution}
                      </span>
                    )}
                  </div>

                  <span className="font-mono text-xs text-muted-foreground">
                    {model.id}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-border dark:border-border bg-muted dark:bg-muted flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-success" />
            جميع النماذج متوافقة وتدعم معايير التجارة الإلكترونية والتصدير بدقة 2K
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground font-bold transition cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
