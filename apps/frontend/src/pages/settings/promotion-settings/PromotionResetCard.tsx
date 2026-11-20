import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";

export interface PromotionResetCardProps {
  onReset: () => void;
}

export function PromotionResetCard({ onReset }: PromotionResetCardProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-white/80 p-5 shadow-xs sm:flex-row sm:items-center dark:border-border dark:bg-muted">
      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-destructive/10 text-destructive ring-1 ring-inset ring-destructive/70 dark:bg-destructive/40 dark:text-destructive dark:ring-destructive/30">
        <RotateCcw className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold text-foreground dark:text-muted-foreground">
          {t("promotionSettings.resetTitle")}
        </p>
        <p className="text-xs leading-5 text-muted-foreground dark:text-muted-foreground">
          {t("promotionSettings.resetDesc")}
        </p>
      </div>
      <AlertDialog>
        <AlertDialogTrigger
          className={cn(
            buttonVariants({ variant: "outline" }),
            "rounded-xl border-destructive text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-destructive/60 dark:text-destructive dark:hover:bg-destructive/50",
          )}
        >
          <RotateCcw className="size-4" />
          {t("promotionSettings.resetAction")}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("promotionSettings.resetModalTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("promotionSettings.resetModalBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t("promotionSettings.resetModalCancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={onReset}
              className="bg-rose-700 text-white hover:bg-destructive"
            >
              {t("promotionSettings.resetModalConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
