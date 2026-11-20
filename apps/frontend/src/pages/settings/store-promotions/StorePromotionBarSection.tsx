import React from "react";
import { useTranslation } from "react-i18next";
import { PanelTop } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SettingsSection } from "../components/SettingsPagePrimitives";
import { StorePromotion } from "./types";

interface StorePromotionBarSectionProps {
  promotion: StorePromotion;
  onChange: (updates: Partial<StorePromotion>) => void;
}

export const StorePromotionBarSection: React.FC<StorePromotionBarSectionProps> = ({
  promotion,
  onChange,
}) => {
  const { t } = useTranslation();

  return (
    <SettingsSection
      icon={PanelTop}
      title={t("storePromotionSettings.barSettings")}
      description={t("storePromotionSettings.barSettingsDesc")}
      accentClassName="bg-amber-50 text-warning ring-warning/70 dark:bg-warning/40 dark:text-warning dark:ring-warning/30"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.showBar")}
            </Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.showBarDesc")}
            </p>
          </div>
          <Switch
            checked={promotion.barVisible}
            onCheckedChange={(checked) => onChange({ barVisible: checked })}
          />
        </div>

        <Separator className="dark:bg-slate-800" />

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.stickyBar")}
            </Label>
            <p className="text-sm text-muted-foreground dark:text-muted-foreground">
              {t("storePromotionSettings.stickyBarDesc")}
            </p>
          </div>
          <Switch
            checked={promotion.barSticky}
            onCheckedChange={(checked) => onChange({ barSticky: checked })}
          />
        </div>

        <Separator className="dark:bg-slate-800" />

        <div className="space-y-2">
          <Label className="text-sm font-semibold text-foreground dark:text-muted-foreground">
            {t("storePromotionSettings.barPages")}
          </Label>
          <p className="text-sm text-muted-foreground dark:text-muted-foreground">
            {t("storePromotionSettings.barPagesDesc")}
          </p>
          <Select
            value={promotion.barPages}
            onValueChange={(val) => onChange({ barPages: val })}
          >
            <SelectTrigger className="max-w-xs bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium">
              <SelectValue>
                {promotion.barPages === "shop"
                  ? t("storePromotionSettings.shopOnly")
                  : promotion.barPages === "product"
                    ? t("storePromotionSettings.productOnly")
                    : promotion.barPages === "checkout"
                      ? t("storePromotionSettings.checkoutOnly")
                      : t("storePromotionSettings.allPages")}
              </SelectValue>
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-950 dark:border-border">
              <SelectItem value="all" className="dark:text-slate-100 dark:focus:bg-muted">
                {t("storePromotionSettings.allPages")}
              </SelectItem>
              <SelectItem value="shop" className="dark:text-slate-100 dark:focus:bg-muted">
                {t("storePromotionSettings.shopOnly")}
              </SelectItem>
              <SelectItem value="product" className="dark:text-slate-100 dark:focus:bg-muted">
                {t("storePromotionSettings.productOnly")}
              </SelectItem>
              <SelectItem value="checkout" className="dark:text-slate-100 dark:focus:bg-muted">
                {t("storePromotionSettings.checkoutOnly")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </SettingsSection>
  );
};
