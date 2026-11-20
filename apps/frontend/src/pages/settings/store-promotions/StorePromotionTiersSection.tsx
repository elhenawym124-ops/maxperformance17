import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Info, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { SettingsSection } from "../components/SettingsPagePrimitives";
import { getTierTypeLabel, PromotionTier, TierType } from "./types";

interface StorePromotionTiersSectionProps {
  tiers: PromotionTier[];
  typeOptions: { value: TierType; label: string }[];
  onAddTier: () => void;
  onRemoveTier: (id: string) => void;
  onUpdateTier: (id: string, updates: Partial<PromotionTier>) => void;
}

export const StorePromotionTiersSection: React.FC<StorePromotionTiersSectionProps> = ({
  tiers,
  typeOptions,
  onAddTier,
  onRemoveTier,
  onUpdateTier,
}) => {
  const { t } = useTranslation();

  return (
    <SettingsSection
      icon={ShoppingCart}
      title={t("storePromotionSettings.discountTiers")}
      description={t("storePromotionSettings.discountTiersDesc")}
      accentClassName="bg-emerald-50 text-success ring-success/70 dark:bg-success/40 dark:text-success dark:ring-success/30"
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-info/80 bg-info/60 p-4 text-info dark:border-info/60 dark:bg-info/30 dark:text-info text-sm leading-relaxed flex items-start gap-3">
          <Info className="h-5 w-5 text-info dark:text-info shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">{t("storePromotionSettings.howItWorksTitle")}</p>
            <p className="text-xs sm:text-sm text-info/90 dark:text-info/90 leading-normal">
              {t("storePromotionSettings.howItWorksDesc")}
            </p>
          </div>
        </div>

        {tiers.map((tier, index) => (
          <div
            key={tier.id}
            className="rounded-xl border border-border bg-muted p-4 space-y-4 dark:border-border dark:bg-muted shadow-xs transition-colors"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="inline-flex size-6 items-center justify-center rounded-md bg-success text-xs font-mono font-bold text-success dark:bg-success/80 dark:text-success ring-1 ring-inset ring-success/30 tabular-nums">
                  {index + 1}
                </span>
                <span className="text-sm font-bold text-foreground dark:text-muted-foreground">
                  {t("storePromotionSettings.tierLevel", { index: index + 1 })}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveTier(tier.id)}
                className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive dark:text-destructive dark:hover:bg-destructive/50"
                aria-label="حذف المستوى"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                  {t("storePromotionSettings.minQuantity")}
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={tier.minQuantity}
                  onChange={(e) =>
                    onUpdateTier(tier.id, {
                      minQuantity: Math.max(1, parseInt(e.target.value, 10) || 1),
                    })
                  }
                  className="bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium font-mono tabular-nums"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                  {t("storePromotionSettings.discountType")}
                </Label>
                <Select
                  value={tier.type}
                  onValueChange={(val: TierType) => onUpdateTier(tier.id, { type: val })}
                >
                  <SelectTrigger className="w-full bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium">
                    <SelectValue>
                      {getTierTypeLabel(tier.type, t)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-950 dark:border-border">
                    {typeOptions.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        className="dark:text-slate-100 dark:focus:bg-muted"
                      >
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                  {t("storePromotionSettings.discountValue")}
                </Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[tier.value]}
                    onValueChange={([val]) => onUpdateTier(tier.id, { value: val })}
                    min={1}
                    max={100}
                    step={5}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono font-bold w-12 text-center text-foreground dark:text-muted-foreground bg-white dark:bg-muted py-1 px-1.5 rounded-md border border-border dark:border-border tabular-nums shadow-xs">
                    {tier.value}%
                  </span>
                </div>
              </div>

              {tier.type === "cheapest_percentage" && (
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                    {t("storePromotionSettings.discountedItems")}
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    value={tier.items}
                    onChange={(e) =>
                      onUpdateTier(tier.id, {
                        items: Math.max(1, parseInt(e.target.value, 10) || 1),
                      })
                    }
                    className="bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border font-medium font-mono tabular-nums"
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-foreground dark:text-muted-foreground">
                {t("storePromotionSettings.customerLabel")}
              </Label>
              <Input
                value={tier.label}
                onChange={(e) => onUpdateTier(tier.id, { label: e.target.value })}
                placeholder={t("storePromotionSettings.customerLabelPlaceholder", { min: tier.minQuantity })}
                className="max-w-md bg-white text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border dark:placeholder:text-slate-500 font-medium"
              />
            </div>
          </div>
        ))}

        <Button
          variant="outline"
          onClick={onAddTier}
          className="w-full border-dashed border-2 border-border dark:border-border bg-white/70 dark:bg-muted text-foreground dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted hover:text-foreground dark:hover:text-white font-semibold py-2.5 transition-colors shadow-xs"
        >
          <Plus className="h-4 w-4 ms-2" /> {t("storePromotionSettings.addTier")}
        </Button>

        {tiers.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-8 text-muted-foreground dark:text-muted-foreground">
            <AlertCircle className="h-8 w-8" />
            <p className="text-sm">{t("storePromotionSettings.noTiers")}</p>
          </div>
        )}
      </div>
    </SettingsSection>
  );
};
