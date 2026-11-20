import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Calendar, Gift, ShoppingCart, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SettingsSection } from "../components/SettingsPagePrimitives";
import { StorePromotion } from "./types";

interface StorePromotionGeneralSectionProps {
  promotion: StorePromotion;
  onChange: (updates: Partial<StorePromotion>) => void;
}

export const StorePromotionGeneralSection: React.FC<StorePromotionGeneralSectionProps> = ({
  promotion,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <SettingsSection
        icon={Gift}
        title={t("storePromotionSettings.enablePromo")}
        description={t("storePromotionSettings.enablePromoDesc")}
        accentClassName="bg-amber-50 text-warning ring-warning/70 dark:bg-warning/40 dark:text-warning dark:ring-warning/30"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.enablePromo")}
            </Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.enablePromoDesc")}
            </p>
          </div>
          <Switch
            checked={promotion.isActive}
            onCheckedChange={(checked) => onChange({ isActive: checked })}
          />
        </div>
      </SettingsSection>

      <SettingsSection
        icon={ShoppingCart}
        title={t("storePromotionSettings.disableOtherDiscounts")}
        description={t("storePromotionSettings.disableOtherDiscountsDesc")}
        accentClassName="bg-rose-50 text-destructive ring-destructive/70 dark:bg-destructive/40 dark:text-destructive dark:ring-destructive/30"
      >
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.disableOtherDiscounts")}
            </Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.disableOtherDiscountsDesc")}
            </p>
          </div>
          <Switch
            checked={promotion.disableOtherDiscounts}
            onCheckedChange={(checked) => onChange({ disableOtherDiscounts: checked })}
          />
        </div>

        {promotion.disableOtherDiscounts && (
          <div className="mt-3 rounded-lg border border-warning/80 bg-warning/80 p-3 text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning text-xs sm:text-sm flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 text-warning dark:text-warning shrink-0 mt-0.5" />
            <p>{t("storePromotionSettings.disableOtherDiscountsAlert")}</p>
          </div>
        )}
      </SettingsSection>

      <SettingsSection
        icon={Tag}
        title={t("storePromotionSettings.promoTitle")}
        description={t("storePromotionSettings.promoTitleDesc")}
        accentClassName="bg-sky-50 text-info ring-info/70 dark:bg-info/40 dark:text-info dark:ring-info/30"
      >
        <Input
          value={promotion.title}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder={t("storePromotionSettings.promoTitlePlaceholder")}
          className="max-w-md bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border dark:placeholder:text-slate-500 font-medium"
        />
      </SettingsSection>

      <SettingsSection
        icon={Calendar}
        title={t("storePromotionSettings.promoDate")}
        description={t("storePromotionSettings.promoDateDesc")}
        accentClassName="bg-violet-50 text-primary ring-primary/70 dark:bg-primary/40 dark:text-primary dark:ring-primary/30"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.from")}
            </Label>
            <Input
              type="datetime-local"
              value={promotion.startDate}
              onChange={(e) => onChange({ startDate: e.target.value })}
              className="bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium dark:[color-scheme:dark]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.to")}
            </Label>
            <Input
              type="datetime-local"
              value={promotion.endDate}
              onChange={(e) => onChange({ endDate: e.target.value })}
              className="bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium dark:[color-scheme:dark]"
            />
          </div>
        </div>
      </SettingsSection>
    </>
  );
};
