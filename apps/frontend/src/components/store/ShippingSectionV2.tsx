import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  TruckIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ClockIcon,
  CurrencyDollarIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { ShippingZone, CanonicalGovernorate } from "../../services/storeSettingsService";
import { EGYPT_GOVERNORATES } from "../../constants/egyptGovernorates";
import { ShippingMethodsModal } from "./ShippingMethodsModal";
import { ShippingClassOption } from "../../constants/shippingClasses";

interface ShippingSectionV2Props {
  zones: ShippingZone[];
  canonicalGovernorates?: CanonicalGovernorate[];
  onAdd: () => void;
  onEdit: (zone: ShippingZone) => void;
  onDelete: (id: string) => void;
  shippingClasses?: ShippingClassOption[];
  promotionSettings?: PromotionSettingsState;
  onUpdatePromotionSettings?: (data: PromotionSettingsState) => void;
}

type PromotionSettingsState = {
  flatShippingEnabled?: boolean;
  flatShippingFee?: number;
} & Record<string, unknown>;

const GOVERNORATE_CODE_ALIASES: Record<string, string> = {
  october: "6th-october",
  "6-october": "6th-october",
  zayed: "sheikh-zayed",
  "new-cairo-city": "new-cairo",
  may15: "15th-may",
  assiut: "asyut",
  cairo: "cairo",
  giza: "giza",
  qalyubia: "qalyubia",
  alexandria: "alexandria",
  beheira: "beheira",
  gharbia: "gharbia",
  sharqia: "sharqia",
  monufia: "monufia",
  dakahlia: "dakahlia",
  "port-said": "port-said",
  ismailia: "ismailia",
  suez: "suez",
  fayoum: "fayoum",
  "beni-suef": "beni-suef",
  minya: "minya",
  asyut: "asyut",
  sohag: "sohag",
  qena: "qena",
  luxor: "luxor",
  aswan: "aswan",
  "red-sea": "red-sea",
  "new-valley": "new-valley",
  matrouh: "matrouh",
  "north-sinai": "north-sinai",
  "south-sinai": "south-sinai",
  "6th-october": "6th-october",
  "sheikh-zayed": "sheikh-zayed",
  "new-cairo": "new-cairo",
  helwan: "helwan",
  "15th-may": "15th-may",
};

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

// Helper function to parse JSON fields
const parseJsonField = (field: unknown): string[] => {
  if (isStringArray(field)) return field;
  if (Array.isArray(field)) return field.map((item) => String(item));
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return isStringArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

export const ShippingSectionV2: React.FC<ShippingSectionV2Props> = ({
  zones,
  canonicalGovernorates = [],
  onAdd,
  onEdit,
  onDelete,
  shippingClasses,
  promotionSettings = {},
  onUpdatePromotionSettings,
}) => {
  const { t } = useTranslation();
  const normalizeGovernorateCode = useCallback((value: string) => {
    const raw = String(value || '').trim();
    return GOVERNORATE_CODE_ALIASES[raw] || raw;
  }, []);

  const resolveZoneGovernorateIds = useCallback(
    (zone: ShippingZone): string[] => {
      const ids = new Set<string>();
      const governorateNameToId = new Map(
        EGYPT_GOVERNORATES.map((gov) => [gov.nameAr, gov.id]),
      );

      (zone.governorateIds || []).forEach((id) => {
        const normalizedId = normalizeGovernorateCode(id);
        if (normalizedId) ids.add(normalizedId);
      });

      (zone.canonicalGovernorates || []).forEach((gov) => {
        const normalizedCode = normalizeGovernorateCode(gov?.code || '');
        if (normalizedCode) ids.add(normalizedCode);
      });

      const zoneGovernorates = Array.isArray(zone.governorates)
        ? zone.governorates
        : [];
      zoneGovernorates.forEach((name) => {
        const normalized = String(name || '').trim();
        if (!normalized) return;

        const directUiId = governorateNameToId.get(normalized);
        if (directUiId) {
          ids.add(directUiId);
        }

        const canonical = canonicalGovernorates.find((gov) => {
          const normalizedCode = normalizeGovernorateCode(gov.code);
          if (
            gov.nameAr === normalized ||
            gov.nameEn === normalized ||
            normalizedCode === normalized ||
            gov.code === normalized
          ) {
            return true;
          }

          return (gov.aliases || []).some((alias) => alias.alias === normalized);
        });

        if (canonical?.code) {
          ids.add(normalizeGovernorateCode(canonical.code));
        }
      });

      return [...ids];
    },
    [canonicalGovernorates, normalizeGovernorateCode],
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showMethodsModal, setShowMethodsModal] = useState(false);
  const [selectedZone, setSelectedZone] = useState<ShippingZone | null>(null);

  const availableGovernorates = useMemo(() => {
    if (canonicalGovernorates.length > 0) {
      return canonicalGovernorates.map((gov) => ({
        id: gov.code,
        nameAr: gov.nameAr,
        nameEn: gov.nameEn || gov.code,
      }));
    }

    return EGYPT_GOVERNORATES.map((gov) => ({
      id: gov.id,
      nameAr: gov.nameAr,
      nameEn: gov.nameEn,
    }));
  }, [canonicalGovernorates]);

  // Analytics
  const analytics = useMemo(() => {
    const totalGovernorates = availableGovernorates.length;
    const coveredGovIds = new Set<string>();
    const duplicates = new Set<string>();

    zones.forEach((zone) => {
      if (zone.isActive) {
        const govIds = resolveZoneGovernorateIds(zone);
        govIds.forEach((id) => {
          if (coveredGovIds.has(id)) {
            duplicates.add(id);
          }
          coveredGovIds.add(id);
        });
      }
    });

    const uncoveredGovs = availableGovernorates.filter(
      (gov) => !coveredGovIds.has(gov.id),
    );

    return {
      totalZones: zones.length,
      activeZones: zones.filter((z) => z.isActive).length,
      coveredCount: coveredGovIds.size,
      totalGovernorates,
      coveragePercent: totalGovernorates > 0 ? Math.round(
        (coveredGovIds.size / totalGovernorates) * 100,
      ) : 0,
      uncoveredGovs,
      duplicates: Array.from(duplicates),
    };
  }, [availableGovernorates, resolveZoneGovernorateIds, zones]);

  // Filter zones
  const filteredZones = useMemo(() => {
    return zones.filter((zone) => {
      const governorates = parseJsonField(zone.governorates);
      const matchesSearch =
        zone.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        governorates.some((g) =>
          g.toLowerCase().includes(searchTerm.toLowerCase()),
        );
      const matchesStatus =
        filterStatus === "all" ||
        (filterStatus === "active" && zone.isActive) ||
        (filterStatus === "inactive" && !zone.isActive);
      return matchesSearch && matchesStatus;
    });
  }, [zones, searchTerm, filterStatus]);

  const handleOpenMethods = (zone: ShippingZone) => {
    setSelectedZone(zone);
    setShowMethodsModal(true);
  };

  const handleCloseMethods = () => {
    setShowMethodsModal(false);
    setSelectedZone(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            {t("storeShipping.shippingZonesTitle")}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            {t("storeShipping.shippingZonesSubtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAnalytics(!showAnalytics)}
            className={`px-4 py-2 rounded-md flex items-center gap-2 transition-colors ${showAnalytics
              ? "bg-indigo-600 text-white"
              : "bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
              }`}
          >
            <ChartBarIcon className="h-5 w-5" />
            {t("storeShipping.coverageAnalysis")}
          </button>
          <button
            onClick={onAdd}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary flex items-center gap-2"
          >
            <PlusIcon className="h-5 w-5" />
            {t("storeShipping.addZone")}
          </button>
        </div>
      </div>

      {/* Shipping Strategy Card */}
      <div className="mb-6 p-5 bg-card border border-border dark:border-border rounded-lg shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <TruckIcon className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-foreground">
            استراتيجية تسعير الشحن
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() =>
              onUpdatePromotionSettings?.({
                ...promotionSettings,
                flatShippingEnabled: false,
              })
            }
            className={`p-4 rounded-xl border-2 text-right transition-all ${!promotionSettings.flatShippingEnabled
                ? "border-indigo-600 bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-border hover:border-border"
              }`}
          >
            <div className="font-bold text-foreground mb-1 text-base">
              تسعير مخصص حسب المناطق
            </div>
            <div className="text-sm text-muted-foreground">
              يتم استخدام الأسعار المحددة لكل منطقة أدناه. يتيح لك تحديد تكلفة
              مختلفة لكل محافظة.
            </div>
          </button>

          <button
            onClick={() =>
              onUpdatePromotionSettings?.({
                ...promotionSettings,
                flatShippingEnabled: true,
              })
            }
            className={`p-4 rounded-xl border-2 text-right transition-all ${promotionSettings.flatShippingEnabled
                ? "border-indigo-600 bg-primary/10 dark:bg-primary/20"
                : "border-gray-200 dark:border-border hover:border-border"
              }`}
          >
            <div className="font-bold text-foreground mb-1 text-base">
              سعر شحن موحد لجميع المحافظات
            </div>
            <div className="text-sm text-muted-foreground">
              سيتم تجاهل أسعار المناطق واستخدام سعر ثابت لجميع العملاء في جميع أنحاء
              الجمهورية.
            </div>
          </button>
        </div>

        {promotionSettings.flatShippingEnabled && (
          <div className="mt-4 flex items-center gap-4 p-4 bg-muted dark:bg-muted rounded-lg border border-border dark:border-border">
            <div className="flex-1">
              <label className="block text-sm font-medium text-foreground mb-1">
                قيمة الشحن الموحد (ج.م)
              </label>
              <input
                type="number"
                value={promotionSettings.flatShippingFee || 0}
                onChange={(e) =>
                  onUpdatePromotionSettings?.({
                    ...promotionSettings,
                    flatShippingFee: parseFloat(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="text-sm text-muted-foreground mt-6 md:block hidden">
              سيظهر هذا السعر لجميع العملاء عند إتمام الطلب.
            </div>
          </div>
        )}
      </div>

      {/* Analytics Panel */}
      {showAnalytics && (
        <div className="mb-6 p-6 bg-gradient-to-br from-primary to-blue-50 dark:from-primary/20 dark:to-blue-900/20 border border-primary dark:border-primary rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ChartBarIcon className="h-5 w-5 text-primary" />
            {t("storeShipping.coverageAnalysis")}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-card p-4 rounded-lg border border-border dark:border-border">
              <div className="text-2xl font-bold text-primary">
                {analytics.totalZones}
              </div>
              <div className="text-sm text-foreground dark:text-muted-foreground">
                {t("storeShipping.zonesCount")}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border dark:border-border">
              <div className="text-2xl font-bold text-success dark:text-success">
                {analytics.activeZones}
              </div>
              <div className="text-sm text-foreground dark:text-muted-foreground">
                {t("storeShipping.activeZones")}
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border dark:border-border">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {analytics.coveragePercent}%
              </div>
              <div className="text-sm text-foreground dark:text-muted-foreground">
                نسبة التغطية
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg border border-border dark:border-border">
              <div className="text-2xl font-bold text-warning dark:text-warning">
                {analytics.uncoveredGovs.length}
              </div>
              <div className="text-sm text-foreground dark:text-muted-foreground">
                محافظات غير مغطاة
              </div>
            </div>
          </div>

          {/* Warnings */}
          {(analytics.duplicates.length > 0 ||
            analytics.uncoveredGovs.length > 0) && (
              <div className="space-y-3">
                {analytics.duplicates.length > 0 && (
                  <div className="bg-yellow-50 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-warning dark:text-warning flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-warning dark:text-warning">
                          تحذير: محافظات مكررة في أكثر من منطقة (
                          {analytics.duplicates.length})
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {analytics.duplicates.slice(0, 5).map((id) => {
                            const gov = availableGovernorates.find(
                              (g) => g.id === id,
                            );
                            return gov ? (
                              <span
                                key={id}
                                className="px-2 py-1 bg-warning dark:bg-warning/40 text-warning dark:text-warning text-xs rounded"
                              >
                                {gov.nameAr}
                              </span>
                            ) : null;
                          })}
                          {analytics.duplicates.length > 5 && (
                            <span className="px-2 py-1 bg-warning dark:bg-warning/60 text-warning dark:text-warning text-xs rounded font-medium">
                              +{analytics.duplicates.length - 5}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {analytics.uncoveredGovs.length > 0 && (
                  <div className="bg-red-50 dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <ExclamationTriangleIcon className="h-5 w-5 text-destructive dark:text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-destructive dark:text-destructive">
                          محافظات غير مغطاة ({analytics.uncoveredGovs.length})
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {analytics.uncoveredGovs.slice(0, 8).map((gov) => (
                            <span
                              key={gov.id}
                              className="px-2 py-1 bg-destructive dark:bg-destructive/40 text-destructive dark:text-destructive text-xs rounded"
                            >
                              {gov.nameAr}
                            </span>
                          ))}
                          {analytics.uncoveredGovs.length > 8 && (
                            <span className="px-2 py-1 bg-destructive dark:bg-destructive/60 text-destructive dark:text-destructive text-xs rounded font-medium">
                              +{analytics.uncoveredGovs.length - 8}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
        </div>
      )}

      {/* Search and Filter */}
      <div className="mb-4 flex gap-3">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ابحث عن منطقة أو محافظة..."
            className="w-full pe-10 ps-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-2">
          <FunnelIcon className="h-5 w-5 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) =>
              setFilterStatus(
                e.target.value as "all" | "active" | "inactive",
              )
            }
            className="px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">{t("storeShipping.allZones")}</option>
            <option value="active">{t("storeShipping.activeOnly")}</option>
            <option value="inactive">{t("storeShipping.inactiveOnly")}</option>
          </select>
        </div>
      </div>

      {/* Info Note */}
      <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>ملاحظة:</strong> سيتم استخدام هذه المناطق بواسطة الذكاء
          الصناعي لحساب تكلفة الشحن تلقائياً بناءً على محافظة العميل.
        </p>
      </div>

      {/* Zones List */}
      {filteredZones.length === 0 ? (
        <div className="text-center py-12 bg-muted dark:bg-muted rounded-lg border border-transparent dark:border-border">
          <TruckIcon className="h-12 w-12 text-muted-foreground/80 mx-auto mb-4" />
          <p className="text-muted-foreground">
            {searchTerm || filterStatus !== "all"
              ? t("storeShipping.noZones")
              : t("storeShipping.noZonesDesc")}
          </p>
          <button
            onClick={onAdd}
            className="mt-4 text-primary hover:text-primary dark:hover:text-primary font-medium"
          >
            {t("storeShipping.addZone")}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredZones.map((zone) => {
            const governoratesArray = parseJsonField(zone.governorates);
            const governorateIds = parseJsonField(zone.governorateIds);

            const canonicalNames = (zone.canonicalGovernorates || []).map((gov) => gov.nameAr).filter(Boolean);

            const governorateNames = governorateIds
              .map((id) => {
                const gov = availableGovernorates.find((g) => g.id === id);
                return gov?.nameAr;
              })
              .filter(Boolean);

            // Fallback to governorates array if no IDs
            // Remove duplicates and variations by keeping only unique base names
            let displayNames =
              canonicalNames.length > 0
                ? canonicalNames
                : governorateNames.length > 0
                  ? governorateNames
                  : governoratesArray;

            // If using governorates array (old data), remove duplicates
            if (governorateNames.length === 0 && governoratesArray.length > 0) {
              const uniqueNames = new Set<string>();
              governoratesArray.forEach((name) => {
                // Normalize: remove "ال" prefix and standardize ة/ه endings
                const normalized = name.replace(/^ال/, "").replace(/ه$/, "ة");
                // Keep the first occurrence (usually the most common form)
                if (
                  !Array.from(uniqueNames).some(
                    (existing) =>
                      existing.replace(/^ال/, "").replace(/ه$/, "ة") ===
                      normalized,
                  )
                ) {
                  uniqueNames.add(name);
                }
              });
              displayNames = Array.from(uniqueNames);
            }

            return (
              <div
                key={zone.id}
                className="bg-card border border-border dark:border-border rounded-lg p-5 hover:shadow-lg transition-all"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="text-lg font-semibold text-foreground">
                        {zone.name || t("storeShipping.zoneName")}
                      </div>
                      <span
                        className={`px-2.5 py-1 text-xs font-medium rounded-full ${zone.isActive
                          ? "bg-green-100 dark:bg-success/30 text-success dark:text-success"
                          : "bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive"
                          }`}
                      >
                        {zone.isActive ? t("storeShipping.active") : t("storeShipping.inactive")}
                      </span>
                      {zone.pricingType === "tiered" && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-primary dark:bg-primary/30 text-primary dark:text-primary">
                          {t("storeShipping.tieredPricing")}
                        </span>
                      )}
                      {zone.freeShippingThreshold && (
                        <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-warning dark:bg-warning/30 text-warning dark:text-warning">
                          {t("storeShipping.freeShippingTag")} {zone.freeShippingThreshold} ج.م
                        </span>
                      )}
                    </div>

                    {/* Governorates */}
                    {displayNames.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {displayNames.slice(0, 8).map((name, idx) => (
                          <span
                            key={idx}
                            className="px-2.5 py-1 bg-muted text-foreground text-xs rounded-md"
                          >
                            {name}
                          </span>
                        ))}
                        {displayNames.length > 8 && (
                          <span className="px-2.5 py-1 bg-muted dark:bg-muted text-foreground dark:text-muted-foreground text-xs rounded-md font-medium">
                            +{displayNames.length - 8}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="text-left me-4">
                    {zone.pricingType === "flat" ? (
                      <div className="flex items-center text-xl font-bold text-primary">
                        <CurrencyDollarIcon className="h-6 w-6 ms-1" />
                        {zone.price} ج.م
                      </div>
                    ) : (
                      <div className="text-sm text-primary font-medium">
                        {zone.pricingTiers?.length || 0}
                      </div>
                    )}
                    <div className="flex items-center text-sm text-foreground dark:text-muted-foreground mt-1">
                      <ClockIcon className="h-4 w-4 ms-1" />
                      {zone.deliveryTime}
                    </div>
                  </div>
                </div>

                {/* Pricing Tiers Preview */}
                {zone.pricingType === "tiered" &&
                  zone.pricingTiers &&
                  zone.pricingTiers.length > 0 && (
                    <div className="mb-4 p-3 bg-muted dark:bg-muted rounded-lg">
                      <div className="text-xs font-medium text-foreground mb-2">
                        {t("storeShipping.tieredPricing")}:
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {zone.pricingTiers.slice(0, 3).map((tier, idx) => (
                          <div
                            key={idx}
                            className="text-xs bg-card p-2 rounded border border-border dark:border-border"
                          >
                            <div className="text-gray-600 dark:text-muted-foreground">
                              {tier.minWeight || 0} - {tier.maxWeight || "∞"}{" "}
                              كجم
                            </div>
                            <div className="font-bold text-primary">
                              {tier.price} ج.م
                            </div>
                          </div>
                        ))}
                        {zone.pricingTiers.length > 3 && (
                          <div className="text-xs bg-muted p-2 rounded flex items-center justify-center text-foreground dark:text-muted-foreground">
                            +{zone.pricingTiers.length - 3}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                {/* Actions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    onClick={() => handleOpenMethods(zone)}
                    className="px-3 py-2 bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary rounded-md hover:bg-primary dark:hover:bg-primary/40 flex items-center justify-center transition-colors gap-1"
                  >
                    <TruckIcon className="h-4 w-4" />
                    {t("storeShipping.shippingMethodsTitle")}
                  </button>
                  <button
                    onClick={() => onEdit(zone)}
                    className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted flex items-center justify-center transition-colors gap-1"
                  >
                    <PencilIcon className="h-4 w-4" />
                    {t("storeShipping.edit")}
                  </button>
                  <button
                    onClick={() => onDelete(zone.id)}
                    className="px-3 py-2 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive rounded-md hover:bg-destructive dark:hover:bg-destructive/30 flex items-center justify-center transition-colors gap-1"
                  >
                    <TrashIcon className="h-4 w-4" />
                    {t("storeShipping.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showMethodsModal && selectedZone && (
        <ShippingMethodsModal
          zone={selectedZone}
          shippingClasses={shippingClasses}
          onClose={handleCloseMethods}
        />
      )}
    </div>
  );
};
