import React from "react";
import { FileText, Save, Loader2 } from "lucide-react";

interface ServiceOrderNotesCardProps {
  notes: string;
  setNotes: (val: string) => void;
  savingNotes: boolean;
  onSaveNotes: () => void;
}

export const ServiceOrderNotesCard: React.FC<ServiceOrderNotesCardProps> = ({
  notes,
  setNotes,
  savingNotes,
  onSaveNotes,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 sm:p-5 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary-600" />
          الملاحظات الداخلية وسجل المتابعة
        </h3>
        <span className="text-[11px] text-muted-foreground">خاصة بفريق العمل</span>
      </div>

      <textarea
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="اكتب ملاحظات داخلية لفريق العمل، شروط خاصة، أو تفاصيل المتابعة..."
        className="w-full p-3 text-xs sm:text-sm rounded-xl border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary-500"
      />

      <div className="flex justify-end">
        <button
          type="button"
          disabled={savingNotes}
          onClick={onSaveNotes}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          {savingNotes ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Save className="w-3.5 h-3.5" />
          )}
          <span>حفظ الملاحظات</span>
        </button>
      </div>
    </div>
  );
};
