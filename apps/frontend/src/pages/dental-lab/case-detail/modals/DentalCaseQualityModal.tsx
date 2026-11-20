import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Loader2, X as XMarkIcon } from "lucide-react";
import { recordQualityCheck, MODAL_CONTENT_CLS, MODAL_INPUT_CLS } from "../../shared";
import type { QualityCheckModalProps } from "../types/dentalCaseDetailTypes";

export function DentalCaseQualityModal({
  caseId,
  onClose,
  onSaved,
}: QualityCheckModalProps) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [passed, setPassed] = useState(true);
  const [notes, setNotes] = useState("");

  const save = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await recordQualityCheck(caseId, {
        passed,
        notes: notes.trim() || undefined,
      });
      toast.success(t("dentalLab.detail.qualityAdded"));
      onSaved();
    } catch (e) {
      toast.error(
        e instanceof Error ? e.message : t("dentalLab.common.noData"),
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={() => !saving && onClose()}
    >
      <div className={MODAL_CONTENT_CLS} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold">
            {t("dentalLab.detail.qualityTitleModal")}
          </h3>
          <button
            type="button"
            onClick={() => !saving && onClose()}
            className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("dentalLab.detail.qualityResult")}
            </label>
            <select
              className={MODAL_INPUT_CLS}
              value={passed ? "PASS" : "FAIL"}
              onChange={(e) => setPassed(e.target.value === "PASS")}
            >
              <option value="PASS">
                {t("dentalLab.detail.qualityPassed")}
              </option>
              <option value="FAIL">
                {t("dentalLab.detail.qualityFailed")}
              </option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("dentalLab.common.notes")}
            </label>
            <textarea
              className={`${MODAL_INPUT_CLS} min-h-[80px] resize-y`}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50"
          >
            {t("dentalLab.common.cancel")}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("dentalLab.common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}


export default DentalCaseQualityModal;
