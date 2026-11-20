import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { MODAL_INPUT_CLS } from "../../../../shared";

export interface DentalCaseEditFooterProps {
  notes: string;
  setNotes: (n: string) => void;
  saving: boolean;
  onClose: () => void;
  onSave: () => void;
}

const labelCls = "block text-xs font-semibold text-foreground mb-1";

export const DentalCaseEditFooter: React.FC<DentalCaseEditFooterProps> = ({
  notes,
  setNotes,
  saving,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <div>
        <label htmlFor="edit-case-notes" className={labelCls}>
          ملاحظات وتعليمات الشغل
        </label>
        <textarea
          id="edit-case-notes"
          className={`${MODAL_INPUT_CLS} min-h-[70px] resize-y`}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="إرشادات التحضير، تفاصيل خاصة..."
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-border">
        <button
          type="button"
          onClick={onClose}
          disabled={saving}
          className="px-5 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50 transition-colors"
        >
          {t("dentalLab.common.cancel")}
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-5 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2 font-semibold shadow-sm transition-colors"
        >
          {saving && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("dentalLab.common.save")}
        </button>
      </div>
    </>
  );
};
