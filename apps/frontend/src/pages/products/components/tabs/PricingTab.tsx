import React from "react";
import { ProductFormData, FieldErrors } from "../../types";

interface PricingTabProps {
  formData: ProductFormData;
  fieldErrors: FieldErrors;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getInputClassName: (fieldName: keyof FieldErrors) => string;
  displayCurrency: string;
  t: any;
}

export const PricingTab: React.FC<PricingTabProps> = ({
  formData,
  fieldErrors,
  handleInputChange,
  getInputClassName,
  displayCurrency,
  t,
}) => {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* Sale Price */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("products.pricing.salePrice", { currency: displayCurrency })}
            <span className="text-red-500 me-1">*</span>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price === 0 ? "" : formData.price}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={getInputClassName("price")}
            placeholder="0.00"
            required
            aria-invalid={Boolean(fieldErrors.price)}
          />
          {fieldErrors.price && (
            <p className="mt-2 text-xs text-destructive dark:text-destructive">
              {fieldErrors.price}
            </p>
          )}
        </div>

        {/* Compare Price */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("products.pricing.comparePrice", { currency: displayCurrency })}
          </label>
          <input
            type="number"
            name="comparePrice"
            value={formData.comparePrice || ""}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className={getInputClassName("comparePrice")}
            placeholder="0.00"
            aria-invalid={Boolean(fieldErrors.comparePrice)}
          />
          {fieldErrors.comparePrice && (
            <p className="mt-2 text-xs text-destructive dark:text-destructive">
              {fieldErrors.comparePrice}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("products.pricing.comparePriceHint")}
          </p>
        </div>

        {/* Cost Price */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("products.pricing.costPrice", { currency: displayCurrency })}
          </label>
          <input
            type="number"
            name="cost"
            value={formData.cost || ""}
            onChange={handleInputChange}
            min="0"
            step="0.01"
            className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground"
            placeholder="0.00"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("products.pricing.costPriceHint")}
          </p>
        </div>
      </div>

      <div className="border-t border-border dark:border-border pt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Sale Start Date */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("products.pricing.saleStartDate")}
          </label>
          <input
            type="datetime-local"
            name="saleStartDate"
            value={formData.saleStartDate}
            onChange={handleInputChange}
            className="mt-1 block w-full border-border rounded-md shadow-sm focus:ring-primary focus:border-primary bg-card text-foreground"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            {t("products.pricing.saleStartDateHint")}
          </p>
        </div>

        {/* Sale End Date */}
        <div>
          <label className="block text-sm font-medium text-foreground">
            {t("products.pricing.saleEndDate")}
          </label>
          <input
            type="datetime-local"
            name="saleEndDate"
            value={formData.saleEndDate}
            onChange={handleInputChange}
            className={getInputClassName("saleEndDate")}
            aria-invalid={Boolean(fieldErrors.saleEndDate)}
          />
          {fieldErrors.saleEndDate && (
            <p className="mt-2 text-xs text-destructive dark:text-destructive">
              {fieldErrors.saleEndDate}
            </p>
          )}
          <p className="mt-1 text-xs text-muted-foreground">
            {t("products.pricing.saleEndDateHint")}
          </p>
        </div>
      </div>

      {formData.saleStartDate &&
        formData.saleEndDate &&
        new Date(formData.saleStartDate) >= new Date(formData.saleEndDate) && (
          <p className="mt-2 text-sm text-destructive dark:text-destructive">
            {t("products.pricing.endDateBeforeStart")}
          </p>
        )}
    </div>
  );
};
