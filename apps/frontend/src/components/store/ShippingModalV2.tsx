import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  XMarkIcon,
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
} from "@heroicons/react/24/outline";
import { ShippingZone, PricingTier, CanonicalGovernorate } from "../../services/storeSettingsService";
import { GovernoratesSelector } from "./GovernorateSelector";
import { EGYPT_GOVERNORATES } from "../../constants/egyptGovernorates";

interface ShippingModalV2Props {
  zone: Partial<ShippingZone>;
  isEditing: boolean;
  canonicalGovernorates?: CanonicalGovernorate[];
  onClose: () => void;
  onSave: () => void;
  onChange: (zone: Partial<ShippingZone>) => void;
}

const DELIVERY_TIME_OPTIONS = [
  {
    value: "same-day",
    label: "نفس اليوم",
    description: "التوصيل في نفس يوم الطلب",
  },
  { value: "1-2", label: "1-2 يوم", description: "التوصيل خلال يوم إلى يومين" },
  { value: "3-5", label: "3-5 أيام", description: "التوصيل خلال 3 إلى 5 أيام" },
  { value: "5-7", label: "5-7 أيام", description: "التوصيل خلال 5 إلى 7 أيام" },
  { value: "custom", label: "مخصص", description: "أدخل مدة مخصصة" },
];

export const ShippingModalV2: React.FC<ShippingModalV2Props> = ({
  zone,
  isEditing,
  canonicalGovernorates = [],
  onClose,
  onSave,
  onChange,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"basic" | "advanced">(
    "basic",
  );

  const handleGovernorateChange = (ids: string[]) => {
    const names = ids
      .map((id) => {
        const canonical = canonicalGovernorates.find((g) => g.code === id);
        if (canonical?.nameAr) return canonical.nameAr;
        const gov = EGYPT_GOVERNORATES.find((g) => g.id === id);
        return gov?.nameAr || "";
      })
      .filter(Boolean);

    onChange({
      ...zone,
      governorateIds: ids,
      governorates: names,
      name: names.length > 0 ? names.join("، ") : "",
    });
  };

  const handlePricingTypeChange = (type: "flat" | "tiered") => {
    if (type === "tiered" && !zone.pricingTiers) {
      onChange({
        ...zone,
        pricingType: type,
        pricingTiers: [{ minWeight: 0, maxWeight: 5, price: 0 }],
      });
    } else {
      onChange({ ...zone, pricingType: type });
    }
  };

  const addPricingTier = () => {
    const tiers = zone.pricingTiers || [];
    const lastTier = tiers[tiers.length - 1];
    const newTier: PricingTier = {
      minWeight: lastTier?.maxWeight || 0,
      maxWeight: (lastTier?.maxWeight || 0) + 5,
      price: 0,
    };
    onChange({
      ...zone,
      pricingTiers: [...tiers, newTier],
    });
  };

  const updatePricingTier = (index: number, tier: PricingTier) => {
    const tiers = [...(zone.pricingTiers || [])];
    tiers[index] = tier;
    onChange({ ...zone, pricingTiers: tiers });
  };

  const removePricingTier = (index: number) => {
    const tiers = zone.pricingTiers?.filter((_, i) => i !== index) || [];
    onChange({ ...zone, pricingTiers: tiers });
  };

  const handleDeliveryTimeTypeChange = (type: string) => {
    const option = DELIVERY_TIME_OPTIONS.find((opt) => opt.value === type);
    onChange({
      ...zone,
      deliveryTimeType: type as any,
      deliveryTime:
        type === "custom" ? zone.deliveryTime || "" : option?.label || "",
    });
  };

  const isValid = () => {
    if (!zone.governorateIds?.length) return false;
    if (zone.pricingType === "flat" && (!zone.price || zone.price <= 0))
      return false;
    if (
      zone.pricingType === "tiered" &&
      (!zone.pricingTiers?.length ||
        zone.pricingTiers.some((t) => !t.price || t.price <= 0))
    )
      return false;
    if (!zone.deliveryTime?.trim()) return false;
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border border-transparent dark:border-border shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border dark:border-border">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-foreground">
              {isEditing ? t("storeShipping.modalEditTitle") : t("storeShipping.modalAddTitle")}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setActiveTab("basic")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "basic"
                ? "bg-indigo-600 text-white"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
                }`}
            >
              {t("storeShipping.basicInfo")}
            </button>
            <button
              onClick={() => setActiveTab("advanced")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${activeTab === "advanced"
                ? "bg-indigo-600 text-white"
                : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
                }`}
            >
              {t("storeShipping.advancedSettings")}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === "basic" && (
            <div className="space-y-6">

              {/* Governorates Selector */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("storeShipping.governorates")} <span className="text-red-500">*</span>
                </label>
                <GovernoratesSelector
                  selectedIds={zone.governorateIds || []}
                  onChange={handleGovernorateChange}
                  governorates={canonicalGovernorates}
                />
              </div>

              {/* Delivery Time */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("storeShipping.deliveryTime")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {DELIVERY_TIME_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleDeliveryTimeTypeChange(option.value)}
                      className={`p-3 rounded-lg border-2 text-right transition-all ${zone.deliveryTimeType === option.value
                        ? "border-indigo-600 bg-primary/10 dark:bg-primary/30"
                        : "border-gray-200 dark:border-border hover:border-border"
                        }`}
                    >
                      <div className="font-medium text-foreground">
                        {option.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </div>
                    </button>
                  ))}
                </div>

                {zone.deliveryTimeType === "custom" && (
                  <input
                    type="text"
                    value={zone.deliveryTime || ""}
                    onChange={(e) =>
                      onChange({ ...zone, deliveryTime: e.target.value })
                    }
                    className="mt-3 w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("storeShipping.deliveryTimePlaceholder")}
                  />
                )}
              </div>

              <hr className="border-gray-200 dark:border-border my-6" />

              {/* Pricing Type */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  {t("storeShipping.pricingType")} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    onClick={() => handlePricingTypeChange("flat")}
                    className={`p-4 rounded-lg border-2 text-right transition-all ${zone.pricingType === "flat"
                      ? "border-indigo-600 bg-primary/10 dark:bg-primary/30"
                      : "border-gray-200 dark:border-border hover:border-border"
                      }`}
                  >
                    <div className="font-semibold text-foreground mb-1">
                      {t("storeShipping.flatRate")}
                    </div>
                    <div className="text-sm text-foreground dark:text-muted-foreground">
                      سعر واحد لجميع الطلبات بغض النظر عن الوزن أو القيمة
                    </div>
                  </button>

                  <button
                    onClick={() => handlePricingTypeChange("tiered")}
                    className={`p-4 rounded-lg border-2 text-right transition-all ${zone.pricingType === "tiered"
                      ? "border-indigo-600 bg-primary/10 dark:bg-primary/30"
                      : "border-gray-200 dark:border-border hover:border-border"
                      }`}
                  >
                    <div className="font-semibold text-foreground mb-1">
                      {t("storeShipping.tieredPricing")}
                    </div>
                    <div className="text-sm text-foreground dark:text-muted-foreground">
                      أسعار مختلفة حسب الوزن أو قيمة الطلب
                    </div>
                  </button>
                </div>
              </div>

              {/* Flat Pricing */}
              {zone.pricingType === "flat" && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    {t("storeShipping.price")} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={zone.price || ""}
                    onChange={(e) =>
                      onChange({
                        ...zone,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={t("storeShipping.price")}
                  />
                </div>
              )}

              {/* Tiered Pricing */}
              {zone.pricingType === "tiered" && (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-sm font-medium text-foreground">
                      {t("storeShipping.tieredPricing")} <span className="text-red-500">*</span>
                    </label>
                    <button
                      onClick={addPricingTier}
                      className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary flex items-center gap-1"
                    >
                      <PlusIcon className="h-4 w-4" />
                      {t("storeShipping.addTier")}
                    </button>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
                    <div className="flex items-start gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800 dark:text-blue-300">
                        يمكنك تحديد أسعار مختلفة حسب الوزن أو قيمة الطلب. سيتم
                        اختيار السعر المناسب تلقائياً عند الطلب.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {zone.pricingTiers?.map((tier, index) => (
                      <div
                        key={index}
                        className="p-4 bg-muted dark:bg-muted border border-border dark:border-border rounded-lg"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <span className="text-sm font-medium text-foreground">
                            {t("storeShipping.addTier")} {index + 1}
                          </span>
                          {zone.pricingTiers &&
                            zone.pricingTiers.length > 1 && (
                              <button
                                onClick={() => removePricingTier(index)}
                                className="text-red-600 dark:text-destructive hover:text-destructive dark:hover:text-destructive"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-foreground dark:text-muted-foreground mb-1">
                              {t("storeShipping.tierFrom")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={tier.minWeight || ""}
                              onChange={(e) =>
                                updatePricingTier(index, {
                                  ...tier,
                                  minWeight: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-foreground dark:text-muted-foreground mb-1">
                              {t("storeShipping.tierTo")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.1"
                              value={tier.maxWeight || ""}
                              onChange={(e) =>
                                updatePricingTier(index, {
                                  ...tier,
                                  maxWeight: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-foreground dark:text-muted-foreground mb-1">
                              {t("storeShipping.tierPrice")}{" "}
                              <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.price || ""}
                              onChange={(e) =>
                                updatePricingTier(index, {
                                  ...tier,
                                  price: parseFloat(e.target.value) || 0,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <div>
                            <label className="block text-xs text-foreground dark:text-muted-foreground mb-1">
                              {t("storeShipping.tierFrom")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.minOrderValue || ""}
                              onChange={(e) =>
                                updatePricingTier(index, {
                                  ...tier,
                                  minOrderValue:
                                    parseFloat(e.target.value) || undefined,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="اختياري"
                            />
                          </div>

                          <div>
                            <label className="block text-xs text-foreground dark:text-muted-foreground mb-1">
                              {t("storeShipping.tierTo")}
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={tier.maxOrderValue || ""}
                              onChange={(e) =>
                                updatePricingTier(index, {
                                  ...tier,
                                  maxOrderValue:
                                    parseFloat(e.target.value) || undefined,
                                })
                              }
                              className="w-full px-2 py-1.5 text-sm bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                              placeholder="اختياري"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "advanced" && (
            <div className="space-y-6">
              {/* Free Shipping Threshold */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  {t("storeShipping.freeShippingTag")}
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={zone.freeShippingThreshold || ""}
                  onChange={(e) =>
                    onChange({
                      ...zone,
                      freeShippingThreshold:
                        parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="500"
                />
                <p className="mt-1 text-xs text-muted-foreground">
                  إذا كانت قيمة الطلب أكبر من هذا المبلغ، سيكون الشحن مجاني.
                  اتركه فارغاً لتعطيل الشحن المجاني.
                </p>
              </div>

              {/* Active Status */}
              <div className="flex items-center gap-3 p-4 bg-muted dark:bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="zoneActive"
                  checked={zone.isActive !== false}
                  onChange={(e) =>
                    onChange({ ...zone, isActive: e.target.checked })
                  }
                  className="h-5 w-5 text-primary focus:ring-primary border-border rounded bg-card"
                />
                <div>
                  <label
                    htmlFor="zoneActive"
                    className="text-sm font-medium text-foreground cursor-pointer"
                  >
                    {t("storeShipping.active")}
                  </label>
                  <p className="text-xs text-muted-foreground">
                    عند التعطيل، لن تظهر هذه المنطقة للعملاء
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border dark:border-border bg-muted dark:bg-muted">
          <div className="flex justify-between items-center">
            <div className="text-sm text-foreground dark:text-muted-foreground">
              {!isValid() && (
                <span className="text-red-600 dark:text-destructive">
                  ⚠️ {t("storeShipping.nameRequired")}
                </span>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted transition-colors font-medium"
              >
                {t("storeShipping.cancel")}
              </button>
              <button
                onClick={onSave}
                disabled={!isValid()}
                className={`px-6 py-2.5 rounded-md transition-colors font-medium shadow-lg ${isValid()
                  ? "bg-indigo-600 text-white hover:bg-primary"
                  : "bg-gray-300 dark:bg-muted text-muted-foreground dark:text-muted-foreground cursor-not-allowed"
                  }`}
              >
                {isEditing ? t("storeShipping.save") : t("storeShipping.addZone")}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
