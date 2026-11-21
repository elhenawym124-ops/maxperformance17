import React from "react";
import { cn } from "@/lib/utils";

export interface MessageCorrectionEditorProps {
  isEditing: boolean;
  isAI: boolean;
  isFromMe: boolean;
  correctionText: string;
  setCorrectionText: (text: string) => void;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

export const MessageCorrectionEditor: React.FC<MessageCorrectionEditorProps> = ({
  isEditing,
  isAI,
  isFromMe,
  correctionText,
  setCorrectionText,
  saving,
  onCancel,
  onSubmit,
}) => {
  if (!isEditing || !isAI) return null;

  return (
    <div
      className={cn(
        "mt-1 w-full px-1.5",
        isFromMe ? "flex justify-end" : "flex justify-start"
      )}
    >
      <div className="w-[75%] rounded-xl border border-primary/50 bg-[var(--whatsapp-surface)] p-2.5 shadow-sm dark:border-primary/30">
        <p className="mb-1.5 text-[11px] font-semibold text-primary dark:text-primary">
          تصحيح رد الوكيل:
        </p>
        <textarea
          value={correctionText}
          onChange={(e) => setCorrectionText(e.target.value)}
          className="w-full min-h-[3.5rem] resize-none rounded-lg border border-border/70 bg-[var(--whatsapp-surface-muted)] p-2 text-sm text-foreground outline-none focus:border-primary dark:focus:border-primary"
          placeholder="اكتب الرد الصحيح للعميل هنا..."
        />
        <div className="mt-1.5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-3 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-[var(--whatsapp-surface-hover)]"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={saving || !correctionText.trim()}
            className="rounded-lg bg-primary px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-primary disabled:opacity-50 dark:bg-primary dark:hover:bg-primary"
          >
            {saving ? "جارٍ الحفظ..." : "حفظ وتصحيح"}
          </button>
        </div>
      </div>
    </div>
  );
};
