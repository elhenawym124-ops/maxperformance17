import React from "react";
import { useTranslation } from "react-i18next";
import {
  Sparkles,
  Users,
  Search,
  Loader2,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  Target,
  GraduationCap,
  Briefcase,
  Heart,
  Smartphone,
  Globe,
  Building2,
  AlertCircle,
} from "lucide-react";
import type { FormData, TargetingOption } from "../types";
import type {
  FacebookCustomAudience,
  FacebookLookalikeAudience,
} from "../../../../services/facebookAdsService";
import MetaGeoTargetingSelector from "../../../../components/advertising/MetaGeoTargetingSelector";
import CustomerLifecycleStrategySelector from "../../../../components/advertising/CustomerLifecycleStrategySelector";
import { DetailedTargetingExclusions } from "./DetailedTargetingExclusions";
import { NarrowAudienceSelector } from "./NarrowAudienceSelector";
import {
  getCountries,
  getInterestCategories,
  getRelationshipOptions,
  getLanguages,
  DEVICE_PLATFORMS,
  EDUCATION_STATUS_OPTIONS,
} from "../constants";

// Experimental targeting controls flag (disabled until backend targeting schema mapping is finalized)
const SHOW_EXPERIMENTAL_TARGETING_CONTROLS = false;

interface Step3TargetingProps {
  formData: FormData;
  handleChange: (field: keyof FormData, value: any) => void;
  toggleArrayValue: (field: keyof FormData, value: string) => void;
  getError: (field: string) => string;
  showAdvancedTargeting: boolean;
  setShowAdvancedTargeting: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  searchResults: TargetingOption[];
  searchLoading: boolean;
  handleSearchInterests: (query: string) => void;
  selectedInterests: TargetingOption[];
  addInterest: (interest: TargetingOption) => void;
  removeInterest: (id: string) => void;
  relationshipStatuses: number[];
  toggleRelationshipStatus: (val: number) => void;
  selectedLanguages: number[];
  toggleLanguage: (id: number) => void;
  selectedDevices: string[];
  toggleDevice: (val: string) => void;
  loadingAudiences: boolean;
  customAudiences: FacebookCustomAudience[];
  selectedCustomAudiences: string[];
  toggleCustomAudience: (id: string) => void;
  lookalikeAudiences: FacebookLookalikeAudience[];
  selectedLookalikeAudiences: string[];
  toggleLookalikeAudience: (id: string) => void;
  excludedAudiences: string[];
  setExcludedAudiences: React.Dispatch<React.SetStateAction<string[]>>;
}

export const Step3Targeting: React.FC<Step3TargetingProps> = ({
  formData,
  handleChange,
  toggleArrayValue,
  getError,
  showAdvancedTargeting,
  setShowAdvancedTargeting,
  searchQuery,
  setSearchQuery,
  searchResults,
  searchLoading,
  handleSearchInterests,
  selectedInterests,
  addInterest,
  removeInterest,
  relationshipStatuses,
  toggleRelationshipStatus,
  selectedLanguages,
  toggleLanguage,
  selectedDevices,
  toggleDevice,
  loadingAudiences,
  customAudiences,
  selectedCustomAudiences,
  toggleCustomAudience,
  lookalikeAudiences,
  selectedLookalikeAudiences,
  toggleLookalikeAudience,
  excludedAudiences,
  setExcludedAudiences,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const countries = React.useMemo(() => getCountries(isEn), [isEn]);
  const interestCategories = React.useMemo(
    () => getInterestCategories(isEn),
    [isEn],
  );
  const relationshipOptions = React.useMemo(
    () => getRelationshipOptions(isEn),
    [isEn],
  );
  const languages = React.useMemo(() => getLanguages(isEn), [isEn]);

  return (
    <div className="space-y-6">
      {/* Advantage+ Audience (v26) */}
      <div className="bg-gradient-to-r from-primary via-primary/60 to-primary dark:from-primary/30 dark:via-primary/20 dark:to-primary/30 p-4 rounded-xl border border-primary dark:border-primary/40">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-foreground flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary dark:text-primary" />
                Advantage+ Audience (Meta v26)
              </h4>
              <span className="rounded-full bg-primary dark:bg-primary/60 px-2 py-0.5 text-[10px] font-bold text-primary dark:text-primary">
                {isEn ? "Smart Gen" : "الجيل الذكي"}
              </span>
            </div>
            <p className="text-xs text-foreground dark:text-muted-foreground mt-1 max-w-xl leading-relaxed">
              {isEn
                ? "In v26, Meta AI algorithms use your selected interests and lookalikes as initial seeds (Audience Suggestions), automatically expanding to find buyers at the lowest cost while strictly adhering to country, region, and age controls."
                : "في إصدار v26، تستخدم خوارزميات الذكاء الاصطناعي اهتماماتك وجماهيرك كنقطة انطلاق أولية (Audience Suggestions)، ثم تتوسع ذاتياً لجلب أفضل المشترين بأقل تكلفة ممكنة مع احترام قيود الدولة والسن الصارمة."}
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={formData.advantageAudience}
              onChange={(e) =>
                handleChange("advantageAudience", e.target.checked)
              }
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted dark:bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 dark:after:border-gray-600 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-3 border-t border-primary/80 dark:border-primary/40">
          <div className="flex items-center gap-1.5 text-foreground dark:text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success shrink-0" />
            <span>
              {isEn ? (
                <><strong>Strict Controls:</strong> Country, Region, and Minimum Age (Meta adheres 100%).</>
              ) : (
                <><strong>قيود صارمة (Controls):</strong> الدولة، المحافظة، والحد الأدنى للعمر (تلتزم بها Meta 100%).</>
              )}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground dark:text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
            <span>
              {isEn ? (
                <><strong>Smart Suggestions:</strong> Interests and Lookalikes (expansion seeds).</>
              ) : (
                <><strong>مقترحات ذكية (Suggestions):</strong> الاهتمامات والجمهور المشابه (بذور للتوسع الذكي).</>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Lifecycle Strategy (Meta v26) */}
      <CustomerLifecycleStrategySelector
        value={formData.customerLifecycleStrategy || "ALL_AUDIENCES"}
        onChange={(strategy) => handleChange("customerLifecycleStrategy", strategy)}
      />

      {/* Age Range */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {isEn ? "Age Range" : "الفئة العمرية"}
        </label>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              {isEn ? "From" : "من"}
            </label>
            <select
              value={formData.ageMin}
              onChange={(e) => handleChange("ageMin", parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 53 }, (_, i) => i + 13).map((age) => (
                <option key={age} value={age}>
                  {age}
                </option>
              ))}
            </select>
          </div>
          <span className="text-muted-foreground/80 mt-6">—</span>
          <div className="flex-1">
            <label className="block text-xs text-muted-foreground mb-1">
              {isEn ? "To" : "إلى"}
            </label>
            <select
              value={formData.ageMax}
              onChange={(e) => handleChange("ageMax", parseInt(e.target.value))}
              className="w-full px-4 py-3 border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 53 }, (_, i) => i + 13).map((age) => (
                <option key={age} value={age}>
                  {age}+
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Gender */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          {isEn ? "Gender" : "الجنس"}
        </label>
        <div className="flex gap-4">
          {[
            { value: "", label: isEn ? "All" : "الكل" },
            { value: "1", label: isEn ? "Men" : "ذكور" },
            { value: "2", label: isEn ? "Women" : "إناث" },
          ].map((gender) => (
            <button
              key={gender.value}
              type="button"
              onClick={() =>
                handleChange("genders", gender.value ? [gender.value] : [])
              }
              className={`flex-1 py-3 px-4 border-2 rounded-xl font-medium transition-all ${
                (formData.genders.length === 0 && gender.value === "") ||
                (formData.genders.includes(gender.value) && gender.value !== "")
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                  : "border-gray-200 dark:border-border hover:border-border bg-card text-foreground"
              }`}
            >
              {gender.label}
            </button>
          ))}
        </div>
      </div>

      <MetaGeoTargetingSelector
        countries={countries}
        selectedCountries={formData.locations}
        selectedRegions={formData.regions}
        selectedCities={formData.cities}
        locationTypes={formData.locationTypes}
        error={getError("locations")}
        onCountriesChange={(locations) => handleChange("locations", locations)}
        onRegionsChange={(regions) => handleChange("regions", regions)}
        onCitiesChange={(cities) => handleChange("cities", cities)}
        onLocationTypesChange={(locationTypes) =>
          handleChange("locationTypes", locationTypes)
        }
      />

      {/* Advanced Targeting Toggle */}
      <div className="border-t border-border dark:border-border pt-4">
        <button
          type="button"
          onClick={() => setShowAdvancedTargeting(!showAdvancedTargeting)}
          className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
        >
          <Heart className="w-4 h-4" />
          {showAdvancedTargeting
            ? isEn
              ? "Hide Advanced Targeting"
              : "إخفاء الاستهداف المتقدم"
            : isEn
              ? "Show Advanced Targeting (Interests, Languages, Devices...)"
              : "إظهار الاستهداف المتقدم (الاهتمامات، اللغات، الأجهزة...)"}
        </button>
      </div>

      {/* Advanced Targeting Options */}
      {showAdvancedTargeting && (
        <div className="space-y-6 bg-muted dark:bg-muted p-4 rounded-xl border border-border dark:border-border">
          <p className="rounded-lg border border-blue-100 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 text-xs font-medium leading-5 text-blue-800 dark:text-blue-200">
            {isEn
              ? "Interests from Meta search, custom/lookalike audiences, exclusions, languages, devices, and relationship status are sent."
              : "يتم إرسال الاهتمامات من بحث Meta، الجماهير المخصصة/المشابهة، الاستبعادات، اللغات، الأجهزة، والحالة الاجتماعية فقط."}
          </p>

          {/* Interests Search */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Heart className="w-4 h-4 text-primary" />
              {isEn ? "Interests" : "الاهتمامات"}
            </label>
            <div className="relative">
              <Search
                className={`absolute ${isEn ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearchInterests(e.target.value);
                }}
                placeholder={
                  isEn
                    ? "Search for an interest (e.g. Shopping, Fashion, Tech...)"
                    : "ابحث عن اهتمام (مثال: تسوق، موضة، تقنية...)"
                }
                className={`w-full ${isEn ? "ps-10 pe-4 text-left" : "pe-10 ps-4 text-right"} py-3 border border-border rounded-lg bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-blue-500`}
              />
              {searchLoading && (
                <Loader2
                  className={`absolute ${isEn ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground animate-spin`}
                />
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border dark:border-border rounded-lg max-h-48 overflow-y-auto bg-card">
                {searchResults.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    onClick={() => addInterest(result)}
                    className={`w-full px-4 py-2 ${isEn ? "text-left" : "text-right"} hover:bg-muted/50/60 border-b border-border dark:border-border last:border-b-0 flex items-center justify-between text-foreground`}
                  >
                    <span className="text-sm">{result.name}</span>
                    {result.audience_size && (
                      <span className="text-xs text-muted-foreground">
                        {(result.audience_size / 1000000).toFixed(1)}M
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}

            {/* Selected Interests */}
            {selectedInterests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedInterests.map((interest) => (
                  <span
                    key={interest.id}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary dark:bg-primary/60 text-primary dark:text-primary rounded-full text-sm"
                  >
                    {interest.name}
                    <button
                      type="button"
                      onClick={() => removeInterest(interest.id)}
                      className="p-0.5 hover:bg-primary dark:hover:bg-primary/60 rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Quick Categories */}
            <div className="mt-3 flex flex-wrap gap-2">
              {interestCategories.map((cat) => (
                <button
                  key={cat.query}
                  type="button"
                  onClick={() => {
                    setSearchQuery(cat.query);
                    handleSearchInterests(cat.query);
                  }}
                  className="px-3 py-1.5 bg-card border border-border dark:border-border hover:border-border rounded-lg text-sm text-foreground flex items-center gap-1"
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Detailed Targeting Exclusions */}
            <div className="mt-4">
              <DetailedTargetingExclusions
                excludedInterests={formData.excludedInterests || []}
                onAddExcludedInterest={(interest) => {
                  const current = formData.excludedInterests || [];
                  if (!current.some((e) => e.id === interest.id)) {
                    handleChange("excludedInterests", [...current, interest]);
                  }
                }}
                onRemoveExcludedInterest={(id) => {
                  const current = formData.excludedInterests || [];
                  handleChange(
                    "excludedInterests",
                    current.filter((e) => e.id !== id),
                  );
                }}
              />
            </div>

            {/* Narrow Audience (AND logic) */}
            <div className="mt-3">
              <NarrowAudienceSelector
                narrowInterests={formData.narrowInterests || []}
                onAddNarrowInterest={(interest) => {
                  const current = formData.narrowInterests || [];
                  if (!current.some((n) => n.id === interest.id)) {
                    handleChange("narrowInterests", [...current, interest]);
                  }
                }}
                onRemoveNarrowInterest={(id) => {
                  const current = formData.narrowInterests || [];
                  handleChange(
                    "narrowInterests",
                    current.filter((n) => n.id !== id),
                  );
                }}
              />
            </div>
          </div>

          {/* Relationship Status */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              {isEn ? "Relationship Status" : "الحالة الاجتماعية"}
            </label>
            <div className="flex flex-wrap gap-2">
              {relationshipOptions.map((status) => (
                <button
                  key={status.value}
                  type="button"
                  onClick={() => toggleRelationshipStatus(status.value)}
                  className={`px-4 py-2 rounded-full border text-sm transition-colors ${
                    relationshipStatuses.includes(status.value)
                      ? "border-blue-500 bg-blue-500 text-white"
                      : "border-gray-200 dark:border-border hover:border-border bg-card text-foreground"
                  }`}
                >
                  {status.label}
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Globe className="w-4 h-4 text-blue-500" />
              {isEn ? "Languages" : "اللغات"}
            </label>
            <div className="flex flex-wrap gap-2">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  type="button"
                  onClick={() => toggleLanguage(lang.id)}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    selectedLanguages.includes(lang.id)
                      ? "border-blue-500 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300"
                      : "border-gray-200 dark:border-border hover:border-border bg-card text-foreground"
                  }`}
                >
                  {lang.name}
                </button>
              ))}
            </div>
          </div>

          {/* Devices */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-success" />
              {isEn ? "Operating System" : "نظام التشغيل"}
            </label>
            <div className="flex gap-3">
              {DEVICE_PLATFORMS.map((platform) => (
                <button
                  key={platform.value}
                  type="button"
                  onClick={() => toggleDevice(platform.value)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 transition-colors ${
                    selectedDevices.includes(platform.value)
                      ? "border-green-500 bg-success/10 dark:bg-success/40 text-success dark:text-success"
                      : "border-gray-200 dark:border-border hover:border-border bg-card text-foreground"
                  }`}
                >
                  <span className={`text-xl ${isEn ? "me-2" : "ms-2"}`}>{platform.icon}</span>
                  {platform.label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {selectedDevices.length === 0
                ? isEn ? "All (Default)" : "الكل (افتراضي)"
                : isEn ? `Selected: ${selectedDevices.join(", ")}` : `محدد: ${selectedDevices.join(", ")}`}
            </p>
          </div>

          {/* Custom & Lookalike Audiences */}
          <div className="border-t border-border dark:border-border pt-4 mt-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              {isEn ? "Custom & Lookalike Audiences" : "الجماهير المخصصة والمشابهة"}
            </h4>

            {loadingAudiences ? (
              <div className="text-center py-6">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">
                  {isEn ? "Loading audiences..." : "جاري تحميل الجماهير..."}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Custom Audiences */}
                {customAudiences.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {isEn
                        ? `Custom Audiences (${customAudiences.length})`
                        : `الجماهير المخصصة (${customAudiences.length})`}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border dark:border-border rounded-lg p-3 bg-card">
                      {customAudiences.map((audience) => (
                        <label
                          key={audience.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCustomAudiences.includes(
                              audience.id,
                            )}
                            onChange={() => toggleCustomAudience(audience.id)}
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {audience.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {audience.audienceSize?.toLocaleString() || 0} {isEn ? "people" : "شخص"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* Lookalike Audiences */}
                {lookalikeAudiences.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      {isEn
                        ? `Lookalike Audiences (${lookalikeAudiences.length})`
                        : `الجماهير المشابهة (${lookalikeAudiences.length})`}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto border border-border dark:border-border rounded-lg p-3 bg-card">
                      {lookalikeAudiences.map((audience) => (
                        <label
                          key={audience.id}
                          className="flex items-center gap-3 p-2 hover:bg-muted/50/50 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedLookalikeAudiences.includes(
                              audience.id,
                            )}
                            onChange={() =>
                              toggleLookalikeAudience(audience.id)
                            }
                            className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {audience.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {audience.audienceSize?.toLocaleString() || 0} {isEn ? "people" : "شخص"}
                              {" "}• {audience.ratio}% {isEn ? "similarity" : "تشابه"}
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {customAudiences.length === 0 &&
                  lookalikeAudiences.length === 0 && (
                    <div className="text-center py-6 bg-muted dark:bg-muted rounded-lg">
                      <Users className="w-12 h-12 mx-auto text-muted-foreground dark:text-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">
                        {isEn ? "No audiences available" : "لا توجد جماهير متاحة"}
                      </p>
                      <p className="text-xs text-muted-foreground/80 mt-1">
                        {isEn ? "You can create custom audiences from the Audiences page" : "يمكنك إنشاء جماهير مخصصة من صفحة الجماهير"}
                      </p>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Exclude Audiences */}
          <div className="border-t border-border dark:border-border pt-4 mt-4">
            <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              {isEn ? "Exclude Audiences" : "استبعاد جماهير"}
            </h4>
            <p className="text-sm text-foreground dark:text-muted-foreground mb-3">
              {isEn
                ? "Exclude specific people from seeing your ad (e.g. existing customers, subscribers)"
                : "استبعد أشخاصاً معينين من رؤية إعلانك (مثل: العملاء الحاليين، المشتركين)"}
            </p>

            {customAudiences.length > 0 || lookalikeAudiences.length > 0 ? (
              <div className="space-y-3">
                <div className="max-h-48 overflow-y-auto border border-border dark:border-border rounded-lg p-3 bg-card">
                  {[...customAudiences, ...lookalikeAudiences].map(
                    (audience) => (
                      <label
                        key={`exclude-${audience.id}`}
                        className="flex items-center gap-3 p-2 hover:bg-muted/50/50 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={excludedAudiences.includes(audience.id)}
                          onChange={() => {
                            setExcludedAudiences((prev) =>
                              prev.includes(audience.id)
                                ? prev.filter((id) => id !== audience.id)
                                : [...prev, audience.id],
                            );
                          }}
                          className="w-4 h-4 text-destructive border-border rounded focus:ring-destructive"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {audience.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {audience.audienceSize?.toLocaleString() || 0} {isEn ? "people" : "شخص"}
                          </p>
                        </div>
                        <span className="text-xs text-destructive dark:text-destructive font-medium">
                          {isEn ? "Exclude" : "استبعاد"}
                        </span>
                      </label>
                    ),
                  )}
                </div>
                {excludedAudiences.length > 0 && (
                  <div className="bg-red-50 dark:bg-destructive/30 border border-destructive dark:border-destructive/50 rounded-lg p-3">
                    <p className="text-sm text-destructive dark:text-destructive">
                      {isEn
                        ? `✓ ${excludedAudiences.length} audience(s) will be excluded from this ad`
                        : `✓ سيتم استبعاد ${excludedAudiences.length} جمهور من رؤية هذا الإعلان`}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 bg-muted dark:bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {isEn ? "No audiences available for exclusion" : "لا توجد جماهير متاحة للاستبعاد"}
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
