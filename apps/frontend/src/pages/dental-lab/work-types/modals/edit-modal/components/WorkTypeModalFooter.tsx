import React from "react";
import { useTranslation } from "react-i18next";

interface WorkTypeModalFooterProps {
  saving: boolean;
  canSave: boolean;
  onClose: () => void;
  onSave: () => void;
}

export const WorkTypeModalFooter: React.FC<WorkTypeModalFooterProps> = ({
  saving,
  canSave,
  onClose,
  onSave,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end gap-3 p-4 border-t dark:border-border bg-muted dark:bg-muted shrink-0">
      <button
        type="button"
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted disabled:opacity-50 text-sm"
      >
        {t("dentalLab.common.cancel")}
      </button>
      <button
        type="button"
        onClick={onSave}
        disabled={saving || !canSave}
        className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary disabled:opacity-50 text-sm shadow-xs"
      >
        {saving ? t("dentalLab.common.saving") : t("dentalLab.common.save")}
      </button>
    </div>
  );
};

export default WorkTypeModalFooter;
