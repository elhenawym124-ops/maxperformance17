import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, Loader2, X, ShieldAlert, Sparkles } from "lucide-react";
import type { TargetingOption } from "../types";
import { facebookAdsService } from "../../../../services/facebookAdsService";

interface DetailedTargetingExclusionsProps {
  excludedInterests: TargetingOption[];
  onAddExcludedInterest: (interest: TargetingOption) => void;
  onRemoveExcludedInterest: (id: string) => void;
}

const getCommonExclusionPresets = (isEn: boolean): TargetingOption[] => [
  {
    id: "6003139266461",
    name: isEn ? "Facebook Page Admins" : "Facebook Page Admins (مسؤولو الصفحات)",
  },
  {
    id: "6003012947811",
    name: isEn ? "Dropshipping" : "Dropshipping (دروب شيبينج)",
  },
  {
    id: "6003180486011",
    name: isEn ? "AliExpress" : "AliExpress (علي إكسبريس)",
  },
  {
    id: "6003264412211",
    name: isEn ? "Shopify stores" : "Shopify (متاجر شوبيفاي)",
  },
];

export const DetailedTargetingExclusions: React.FC<
  DetailedTargetingExclusionsProps
> = ({
  excludedInterests,
  onAddExcludedInterest,
  onRemoveExcludedInterest,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));
  const commonExclusionPresets = React.useMemo(
    () => getCommonExclusionPresets(isEn),
    [isEn],
  );

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TargetingOption[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (!val.trim() || val.length < 2) {
      setResults([]);
      return;
    }
    try {
      setLoading(true);
      const res = (await facebookAdsService.searchTargetingOptions(
        val,
        "adinterest",
      )) as TargetingOption[];
      setResults(res || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (option: TargetingOption) => {
    if (!excludedInterests.some((e) => e.id === option.id)) {
      onAddExcludedInterest(option);
    }
    setQuery("");
    setResults([]);
  };

  return (
    <div className="p-4 bg-destructive/50 dark:bg-destructive/20 border border-destructive/80 dark:border-destructive/40 rounded-xl space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-destructive dark:text-destructive" />
          <h4 className="text-sm font-bold text-foreground">
            {isEn
              ? "Detailed Targeting Exclusions"
              : "استبعاد اهتمامات محددة (Detailed Targeting Exclusions)"}
          </h4>
        </div>
        <span className="text-[11px] font-medium text-destructive dark:text-destructive bg-destructive dark:bg-destructive/60 px-2 py-0.5 rounded-full">
          {excludedInterests.length} {isEn ? "excluded" : "مستبعد"}
        </span>
      </div>

      <p className="text-xs text-foreground dark:text-muted-foreground">
        {isEn
          ? "Exclude specific categories and interests to prevent ads from showing to competitors or other sellers, reserving budget exclusively for genuine buyers."
          : "استبعد فئات واهتمامات معينة لمنع ظهور الإعلان للمنافسين أو البائعين الآخرين وتوفير الميزانية للمشترين الحقيقيين فقط."}
      </p>

      {/* Quick Presets */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-destructive dark:text-destructive" />
          {isEn ? "Common e-commerce exclusions:" : "استبعادات شائعة للتجارة:"}
        </span>
        {commonExclusionPresets.map((preset) => {
          const isSelected = excludedInterests.some((e) => e.id === preset.id);
          return (
            <button
              key={preset.id}
              type="button"
              disabled={isSelected}
              onClick={() => handleSelect(preset)}
              className={`text-[11px] px-2.5 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                isSelected
                  ? "bg-red-100/50 dark:bg-destructive/30 border-destructive dark:border-destructive/40 text-destructive dark:text-destructive cursor-not-allowed"
                  : "bg-card border-destructive dark:border-destructive/50 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30"
              }`}
            >
              {isSelected ? "✓" : "+"} {preset.name}
            </button>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search
          className={`absolute ${isEn ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={
            isEn
              ? "Search interest to exclude (e.g. Dropshipping, E-commerce...)"
              : "ابحث عن اهتمام لاستبعاده (مثال: دروبشيبينج، تجارة إلكترونية...)"
          }
          className={`w-full ${isEn ? "ps-9 pe-4 text-left" : "pe-9 ps-4 text-right"} py-2 border border-destructive dark:border-destructive/50 rounded-lg text-sm bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-destructive`}
        />
        {loading && (
          <Loader2
            className={`absolute ${isEn ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin`}
          />
        )}
      </div>

      {/* Search Dropdown */}
      {results.length > 0 && (
        <div className="border border-destructive dark:border-destructive/50 rounded-lg max-h-44 overflow-y-auto bg-card shadow-sm">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => handleSelect(result)}
              className={`w-full px-3 py-2 ${isEn ? "text-left" : "text-right"} hover:bg-destructive/50 dark:hover:bg-destructive/30 border-b border-border dark:border-border last:border-b-0 flex items-center justify-between text-xs`}
            >
              <span className="font-medium text-foreground dark:text-muted-foreground">{result.name}</span>
              {result.audience_size && (
                <span className="text-muted-foreground/80">
                  {(result.audience_size / 1000000).toFixed(1)}M
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selected Excluded Chips */}
      {excludedInterests.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {excludedInterests.map((interest) => (
            <span
              key={interest.id}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-destructive dark:bg-destructive/60 text-destructive dark:text-destructive rounded-full text-xs font-medium"
            >
              <span>{interest.name}</span>
              <button
                type="button"
                onClick={() => onRemoveExcludedInterest(interest.id)}
                className="p-0.5 hover:bg-destructive dark:hover:bg-destructive/60 rounded-full transition-colors"
                title={isEn ? "Remove exclusion" : "إلغاء الاستبعاد"}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
