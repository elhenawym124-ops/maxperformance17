import React from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { MODAL_CONTENT_CLS } from "../shared";
import { ActionKind } from "./types";
import { ACTION_META } from "./constants";

interface RadiologyConfirmActionModalProps {
  confirmAction: { id: string; kind: ActionKind } | null;
  onClose: () => void;
  onConfirm: (studyId: string, kind: ActionKind) => void;
  busy: boolean;
}

export const RadiologyConfirmActionModal: React.FC<RadiologyConfirmActionModalProps> = ({
  confirmAction,
  onClose,
  onConfirm,
  busy,
}) => {
  const { t } = useTranslation();

  if (!confirmAction) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center"
      onClick={onClose}
    >
      <div className={MODAL_CONTENT_CLS} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-4">{t("radiology.reports.confirmAction")}</h3>
        <p className="text-sm text-muted-foreground mb-6">
          {t(ACTION_META[confirmAction.kind].messageKey)}
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted cursor-pointer"
          >
            {t("radiology.cancel")}
          </button>
          <button
            onClick={() => onConfirm(confirmAction.id, confirmAction.kind)}
            disabled={busy}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2 cursor-pointer"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            {t("radiology.confirm")}
          </button>
        </div>
      </div>
    </div>
  );
};
