import React from "react";
import { useTranslation } from "react-i18next";
import { ClipboardList } from "lucide-react";

export const PreparationOrdersEmptyState: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-muted px-6 py-10 text-center dark:dark:border-border dark:dark:bg-muted">
      <ClipboardList className="h-12 w-12 text-muted-foreground dark:dark:text-foreground" />
      <h3 className="mt-4 text-lg font-semibold text-foreground">
        {t("preparation.emptyState.title")}
      </h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
        {t("preparation.emptyState.desc")}
      </p>
    </div>
  );
});

PreparationOrdersEmptyState.displayName = "PreparationOrdersEmptyState";
