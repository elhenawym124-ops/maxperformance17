import React from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, ExternalLink } from "lucide-react";

interface ConversionToolHeaderProps {
  toolLabel: string;
  storePreviewUrl: string;
  onBack: () => void;
}

export const ConversionToolHeader: React.FC<ConversionToolHeaderProps> = ({
  toolLabel,
  storePreviewUrl,
  onBack,
}) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 font-bold text-muted-foreground transition-colors hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
        >
          <ArrowRight className="h-4 w-4" />
          {t("storeConversionSettings.backToTools")}
        </button>
        <span className="text-gray-300 dark:text-foreground">/</span>
        <span className="font-black text-foreground">{toolLabel}</span>
      </div>
      {storePreviewUrl ? (
        <a
          href={storePreviewUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-black text-foreground transition-colors hover:border-border hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          {t("storeConversionSettings.viewOnStore")}
        </a>
      ) : null}
    </div>
  );
};
