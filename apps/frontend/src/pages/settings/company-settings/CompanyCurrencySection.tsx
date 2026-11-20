import React from "react";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import {
  SUPPORTED_CURRENCIES,
  formatCurrency,
  getCurrencyByCode,
} from "../../../utils/currency";

interface CompanyCurrencySectionProps {
  selectedCurrency: string;
  savingCurrency: boolean;
  handleCurrencyChange: (code: string) => void;
}

export const CompanyCurrencySection: React.FC<CompanyCurrencySectionProps> = ({
  selectedCurrency,
  savingCurrency,
  handleCurrencyChange,
}) => {
  return (
    <div className="bg-card shadow rounded-lg p-6 mb-8">
      <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center">
        <CurrencyDollarIcon className="h-6 w-6 text-success dark:text-success me-2" />
        إعدادات العملة
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label
            htmlFor="company-currency"
            className="block text-sm font-medium text-foreground mb-2"
          >
            العملة الافتراضية للموقع
          </label>
          <select
            id="company-currency"
            name="currency"
            autoComplete="off"
            value={selectedCurrency}
            onChange={(e) => handleCurrencyChange(e.target.value)}
            disabled={savingCurrency}
            className="w-full px-3 py-2 border border-border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary disabled:bg-muted disabled:cursor-not-allowed bg-card text-foreground"
          >
            {SUPPORTED_CURRENCIES.map((currency) => (
              <option key={currency.code} value={currency.code}>
                {currency.nameAr} ({currency.symbol}) - {currency.code}
              </option>
            ))}
          </select>
          {savingCurrency && (
            <div className="mt-2 text-sm text-primary flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary me-2"></div>
              جاري حفظ التغييرات...
            </div>
          )}
        </div>
        <div>
          <span className="block text-sm font-medium text-foreground mb-2">
            معاينة العملة
          </span>
          <div className="bg-gray-50 dark:bg-muted border border-border rounded-md p-3">
            <p className="text-sm text-muted-foreground mb-1">
              مثال على عرض السعر:
            </p>
            <p className="text-lg font-semibold text-foreground font-mono tabular-nums">
              {formatCurrency(1250, selectedCurrency)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              العملة المختارة: {getCurrencyByCode(selectedCurrency)?.nameAr}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
