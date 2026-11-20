import React from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_SHIPPING_CLASSES,
  ShippingClassOption,
  normalizeShippingClassKey,
} from "../../../constants/shippingClasses";

interface StoreShippingClassesCardProps {
  shippingClassMode: "max" | "per_item";
  setShippingClassMode: (mode: "max" | "per_item") => void;
  shippingClasses: ShippingClassOption[];
  shippingClassFees: Record<string, number>;
  setShippingClassFees: React.Dispatch<
    React.SetStateAction<Record<string, number>>
  >;
  savingShippingClassFees: boolean;
  newShippingClassLabel: string;
  setNewShippingClassLabel: (label: string) => void;
  newShippingClassKey: string;
  setNewShippingClassKey: (key: string) => void;
  handleAddShippingClass: () => void;
  handleUpdateShippingClassLabel: (key: string, label: string) => void;
  handleRemoveShippingClass: (key: string) => void;
  handleSaveShippingClassFees: () => void;
}

export const StoreShippingClassesCard: React.FC<StoreShippingClassesCardProps> = ({
  shippingClassMode,
  setShippingClassMode,
  shippingClasses,
  shippingClassFees,
  setShippingClassFees,
  savingShippingClassFees,
  newShippingClassLabel,
  setNewShippingClassLabel,
  newShippingClassKey,
  setNewShippingClassKey,
  handleAddShippingClass,
  handleUpdateShippingClassLabel,
  handleRemoveShippingClass,
  handleSaveShippingClassFees,
}) => {
  const { t } = useTranslation();

  return (
    <div className="bg-gray-50/50 dark:bg-muted rounded-xl p-6 border border-border dark:border-border">
      <div>
        <h3 className="text-lg font-semibold text-foreground">
          {t("storeSettings.shippingClassFeesTitle")}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {t("storeSettings.shippingClassFeesDesc")}
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            {t("storeSettings.calculationMethod")}
          </label>
          <select
            value={shippingClassMode}
            onChange={(e) =>
              setShippingClassMode(
                e.target.value === "per_item" ? "per_item" : "max",
              )
            }
            className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="max">{t("storeSettings.maxValue")}</option>
            <option value="per_item">{t("storeSettings.perItem")}</option>
          </select>
        </div>
        <div className="text-sm text-muted-foreground flex items-end">
          {t("storeSettings.maxValueDesc")}
        </div>
      </div>

      <div className="mt-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("storeSettings.className")}
            </label>
            <input
              type="text"
              value={newShippingClassLabel}
              onChange={(e) => setNewShippingClassLabel(e.target.value)}
              placeholder={t("storeSettings.classNamePlaceholder")}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium text-foreground mb-1">
              {t("storeSettings.classIdentifier")}
            </label>
            <input
              type="text"
              value={newShippingClassKey}
              onChange={(e) => setNewShippingClassKey(e.target.value)}
              placeholder={t("storeSettings.classIdentifierPlaceholder")}
              className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
            />
          </div>
          <button
            type="button"
            onClick={handleAddShippingClass}
            className="px-4 py-2 h-11 rounded-md text-sm font-semibold bg-primary text-white hover:bg-primary"
          >
            {t("storeSettings.addClass")}
          </button>
        </div>

        <div className="space-y-3">
          {shippingClasses.map((option) => {
            const isDefaultClass = DEFAULT_SHIPPING_CLASSES.some(
              (defaultOption) =>
                normalizeShippingClassKey(defaultOption.key) ===
                normalizeShippingClassKey(option.key),
            );
            return (
              <div
                key={option.key}
                className="flex flex-col md:flex-row md:items-end gap-3 p-3 bg-white/70 dark:bg-muted border border-border dark:border-border rounded-xl"
              >
                <div className="flex-1">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("storeSettings.name")}
                  </label>
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) =>
                      handleUpdateShippingClassLabel(option.key, e.target.value)
                    }
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <p className="mt-1 text-xs text-muted-foreground font-mono">
                    {t("storeSettings.identifier")}: {option.key}
                  </p>
                </div>
                <div className="w-full md:w-40">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("storeSettings.fees")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={shippingClassFees[option.key] ?? 0}
                    onChange={(e) =>
                      setShippingClassFees((prev) => ({
                        ...prev,
                        [option.key]: Number(e.target.value) || 0,
                      }))
                    }
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono tabular-nums"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={() => handleRemoveShippingClass(option.key)}
                    disabled={isDefaultClass}
                    className={`px-3 py-2 rounded-md text-sm font-semibold ${
                      isDefaultClass
                        ? "bg-gray-200 text-muted-foreground dark:bg-muted dark:text-muted-foreground cursor-not-allowed"
                        : "bg-red-50 text-destructive hover:bg-destructive dark:bg-destructive/20 dark:text-destructive"
                    }`}
                  >
                    {t("storeSettings.delete")}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="button"
          onClick={handleSaveShippingClassFees}
          disabled={savingShippingClassFees}
          className={`px-4 py-2 rounded-md text-sm font-semibold ${
            savingShippingClassFees
              ? "bg-gray-200 text-muted-foreground dark:bg-muted dark:text-muted-foreground cursor-not-allowed"
              : "bg-indigo-600 text-white hover:bg-primary"
          }`}
        >
          {savingShippingClassFees
            ? t("storeSettings.saving")
            : t("storeSettings.saveFees")}
        </button>
      </div>
    </div>
  );
};
