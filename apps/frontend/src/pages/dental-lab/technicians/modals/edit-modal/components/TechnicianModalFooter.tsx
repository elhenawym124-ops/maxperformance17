import { useTranslation } from "react-i18next";

interface TechnicianModalFooterProps {
  saving: boolean;
  nameTrimmed: boolean;
  onSave: () => Promise<void>;
  onClose: () => void;
}

export function TechnicianModalFooter({
  saving,
  nameTrimmed,
  onSave,
  onClose,
}: TechnicianModalFooterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex justify-end gap-3 mt-6 border-t pt-3 dark:border-border">
      <button
        onClick={onClose}
        disabled={saving}
        className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50 text-sm"
      >
        {t("dentalLab.common.cancel")}
      </button>
      <button
        onClick={onSave}
        disabled={saving || !nameTrimmed}
        className="px-5 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary disabled:opacity-50 text-sm shadow-sm"
      >
        {saving ? t("dentalLab.common.saving") : t("dentalLab.common.save")}
      </button>
    </div>
  );
}
