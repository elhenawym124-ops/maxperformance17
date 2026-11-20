import React, { useState, useCallback } from "react";
import {
  MagnifyingGlassIcon,
  XMarkIcon,
  SparklesIcon,
  UserGroupIcon,
  NoSymbolIcon,
} from "@heroicons/react/24/outline";
import MetaGeoTargetingSelector from "../MetaGeoTargetingSelector";
import CustomerLifecycleStrategySelector, {
  CustomerLifecycleStrategy,
} from "../CustomerLifecycleStrategySelector";
import {
  facebookAdsService,
  FacebookCustomAudience,
  FacebookLookalikeAudience,
  MetaGeoLocation,
} from "../../../services/facebookAdsService";

interface TargetingInterest {
  id: string;
  name: string;
  audience_size?: number;
}

interface AdSetTargetingStepProps {
  advantageAudience: boolean;
  onAdvantageAudienceChange: (val: boolean) => void;
  customerLifecycleStrategy?: CustomerLifecycleStrategy;
  onCustomerLifecycleStrategyChange?: (val: CustomerLifecycleStrategy) => void;
  // Geotargeting
  selectedLocations: string[];
  onLocationsChange: (locs: string[]) => void;
  selectedRegions: MetaGeoLocation[];
  onRegionsChange: (regions: MetaGeoLocation[]) => void;
  selectedCities: MetaGeoLocation[];
  onCitiesChange: (cities: MetaGeoLocation[]) => void;
  locationTypes: Array<"home" | "recent">;
  onLocationTypesChange: (types: Array<"home" | "recent">) => void;
  // Age & Gender
  ageMin: number;
  onAgeMinChange: (age: number) => void;
  ageMax: number;
  onAgeMaxChange: (age: number) => void;
  genders: string[];
  onGendersChange: (genders: string[]) => void;
  // Interests
  interests: TargetingInterest[];
  onInterestsChange: (interests: TargetingInterest[]) => void;
  // Custom Audiences
  customAudiences: FacebookCustomAudience[];
  lookalikeAudiences: FacebookLookalikeAudience[];
  selectedCustomAudiences: string[];
  onCustomAudiencesChange: (ids: string[]) => void;
  selectedLookalikeAudiences: string[];
  onLookalikeAudiencesChange: (ids: string[]) => void;
  // Exclusions
  excludedAudiences: string[];
  onExcludedAudiencesChange: (ids: string[]) => void;
}

const COUNTRIES = [
  { code: "EG", name: "مصر", flag: "🇪🇬" },
  { code: "SA", name: "المملكة العربية السعودية", flag: "🇸🇦" },
  { code: "AE", name: "الإمارات العربية المتحدة", flag: "🇦🇪" },
  { code: "KW", name: "الكويت", flag: "🇰🇼" },
  { code: "QA", name: "قطر", flag: "🇶🇦" },
  { code: "BH", name: "البحرين", flag: "🇧🇭" },
  { code: "OM", name: "عُمان", flag: "🇴🇲" },
  { code: "JO", name: "الأردن", flag: "🇯🇴" },
];

const QUICK_INTEREST_TAGS = [
  { name: "التسوق الإلكتروني", query: "online shopping" },
  { name: "الأحذية والحقائب", query: "shoes" },
  { name: "الملابس والموضة", query: "clothing" },
  { name: "التسوق والبيع بالتجزئة", query: "shopping and retail" },
  { name: "مستحضرات التجميل", query: "cosmetics" },
  { name: "المشترون المتفاعلون", query: "engaged shoppers" },
  { name: "الصحة واللياقة", query: "physical fitness" },
  { name: "الهواتف الذكية", query: "smartphones" },
];

export const AdSetTargetingStep: React.FC<AdSetTargetingStepProps> = ({
  advantageAudience,
  onAdvantageAudienceChange,
  customerLifecycleStrategy = "ALL_AUDIENCES",
  onCustomerLifecycleStrategyChange,
  selectedLocations,
  onLocationsChange,
  selectedRegions,
  onRegionsChange,
  selectedCities,
  onCitiesChange,
  locationTypes,
  onLocationTypesChange,
  ageMin,
  onAgeMinChange,
  ageMax,
  onAgeMaxChange,
  genders,
  onGendersChange,
  interests,
  onInterestsChange,
  customAudiences,
  lookalikeAudiences,
  selectedCustomAudiences,
  onCustomAudiencesChange,
  selectedLookalikeAudiences,
  onLookalikeAudiencesChange,
  excludedAudiences,
  onExcludedAudiencesChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TargetingInterest[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setIsSearching(true);
      const res = await facebookAdsService.searchTargetingOptions(
        q.trim(),
        "adinterest",
      );
      setSearchResults(res || []);
    } catch (err) {
      console.error("Failed to search interests:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const addInterest = (item: TargetingInterest) => {
    if (!interests.find((i) => i.id === item.id)) {
      onInterestsChange([...interests, item]);
    }
    setSearchQuery("");
    setSearchResults([]);
  };

  const removeInterest = (id: string) => {
    onInterestsChange(interests.filter((i) => i.id !== id));
  };

  const toggleGender = (val: string) => {
    if (genders.includes(val)) {
      onGendersChange(genders.filter((g) => g !== val));
    } else {
      onGendersChange([...genders, val]);
    }
  };

  const toggleCustomAudience = (id: string) => {
    if (selectedCustomAudiences.includes(id)) {
      onCustomAudiencesChange(selectedCustomAudiences.filter((a) => a !== id));
    } else {
      onCustomAudiencesChange([...selectedCustomAudiences, id]);
    }
  };

  const toggleLookalikeAudience = (id: string) => {
    if (selectedLookalikeAudiences.includes(id)) {
      onLookalikeAudiencesChange(
        selectedLookalikeAudiences.filter((a) => a !== id),
      );
    } else {
      onLookalikeAudiencesChange([...selectedLookalikeAudiences, id]);
    }
  };

  const toggleExcludeAudience = (id: string) => {
    if (excludedAudiences.includes(id)) {
      onExcludedAudiencesChange(excludedAudiences.filter((a) => a !== id));
    } else {
      onExcludedAudiencesChange([...excludedAudiences, id]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Advantage+ Audience vs Original Audiences Mode */}
      <div className="p-4 rounded-xl border-2 transition-all bg-gradient-to-r from-primary/70 via-primary/50 to-white dark:from-primary/20 dark:via-primary/20 dark:to-gray-800 border-primary dark:border-primary/60">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <SparklesIcon className="w-5 h-5 text-primary dark:text-primary" />
              <span className="font-bold text-sm text-foreground">
                جمهور Advantage+ الذكي (Meta Advantage+ Audience)
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary dark:bg-primary/60 text-primary dark:text-primary font-bold">
                الأحدث والأفضل
              </span>
            </div>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              تستخدم ميتا خوارزميات الذكاء الاصطناعي لتوسيع الوصول للأشخاص الأكثر استعداداً للشراء، وتعتبر استهدافك (السن والاهتمامات) كاقتراحات استرشادية (Audience Suggestions) للبدء منها ثم التوسع لتحقيق مبيعات أعلى بأقل تكلفة.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={advantageAudience}
              onChange={(e) => onAdvantageAudienceChange(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-muted peer-focus:outline-hidden rounded-full peer dark:bg-muted peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {!advantageAudience && (
          <div className="mt-3 pt-3 border-t border-primary dark:border-primary/40 text-[11px] text-warning dark:text-warning flex items-center gap-1.5">
            <span>ℹ️ أنت الآن في وضع "خيارات الجمهور الأصلية": سيتم تقييد الإعلان بدقة داخل حدود السن والاهتمامات المحددة دون أي توسيع ذكي.</span>
          </div>
        )}
      </div>

      {/* Customer Lifecycle Strategy (Meta v26) */}
      {onCustomerLifecycleStrategyChange && (
        <CustomerLifecycleStrategySelector
          value={customerLifecycleStrategy}
          onChange={onCustomerLifecycleStrategyChange}
        />
      )}

      {/* Geotargeting */}
      <div className="pt-2">
        <label className="block text-sm font-bold text-foreground mb-1.5">
          المواقع الجغرافية (Geographic Locations)
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          حدد الدول، المحافظات، أو المدن التي تريد عرض الإعلان فيها
        </p>

        <MetaGeoTargetingSelector
          countries={COUNTRIES}
          selectedCountries={selectedLocations}
          selectedRegions={selectedRegions}
          selectedCities={selectedCities}
          locationTypes={locationTypes}
          onCountriesChange={onLocationsChange}
          onRegionsChange={onRegionsChange}
          onCitiesChange={onCitiesChange}
          onLocationTypesChange={onLocationTypesChange}
        />
      </div>

      {/* Demographics: Age & Gender */}
      <div className="pt-4 border-t border-border dark:border-border">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Age Range */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              الفئة العمرية {advantageAudience ? "(الحد الأدنى للاقتراح)" : ""}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">من</span>
                <input
                  type="number"
                  min={18}
                  max={65}
                  value={ageMin}
                  onChange={(e) => onAgeMinChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-card border border-border dark:border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block mb-0.5">إلى</span>
                <input
                  type="number"
                  min={18}
                  max={65}
                  value={ageMax}
                  onChange={(e) => onAgeMaxChange(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-card border border-border dark:border-border rounded-xl text-xs font-bold text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Gender */}
          <div>
            <label className="block text-xs font-semibold text-foreground mb-1.5">
              الجنس المستهدف
            </label>
            <div className="flex items-center gap-2">
              {[
                { id: "all", label: "الكل (رجال ونساء)" },
                { id: "male", label: "رجال 👨" },
                { id: "female", label: "نساء 👩" },
              ].map((g) => {
                const isSelected =
                  g.id === "all"
                    ? genders.length === 0
                    : genders.includes(g.id);
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      if (g.id === "all") onGendersChange([]);
                      else toggleGender(g.id);
                    }}
                    className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? "border-cyan-600 bg-info/10 dark:bg-info/40 text-info dark:text-info"
                        : "border-gray-200 dark:border-border text-muted-foreground hover:border-border"
                    }`}
                  >
                    {g.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Targeting: Interests & Behaviors */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5">
          الاستهداف التفصيلي (الاهتمامات والسلوكيات)
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          ابحث عن اهتمامات المشترين وسيقوم النظام بالربط المباشر مع قاعدة بيانات Meta الرسمية
        </p>

        {/* Search Input */}
        <div className="relative mb-3">
          <MagnifyingGlassIcon className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder="ابحث عن اهتمام (مثال: تسوق، أحذية، موضة، رياضة...)"
            className="w-full pe-10 ps-4 py-2.5 bg-card border border-border dark:border-border rounded-xl text-xs sm:text-sm text-foreground focus:ring-2 focus:ring-info"
          />
          {isSearching && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-info border-t-transparent rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Search Results Dropdown */}
        {searchResults.length > 0 && (
          <div className="border border-border dark:border-border rounded-xl max-h-48 overflow-y-auto mb-3 bg-card shadow-md divide-y divide-border dark:divide-border">
            {searchResults.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => addInterest(item)}
                className="w-full px-4 py-2.5 text-right hover:bg-info/50 dark:hover:bg-info/20 flex items-center justify-between transition-colors cursor-pointer text-xs"
              >
                <span className="font-bold text-foreground">
                  {item.name}
                </span>
                {item.audience_size && (
                  <span className="text-[10px] text-muted-foreground font-mono">
                    جمهور مقدر: {(item.audience_size / 1000000).toFixed(1)}M
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Selected Interests Badges */}
        {interests.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {interests.map((item) => (
              <span
                key={item.id}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-info dark:bg-info/60 text-info dark:text-info text-xs font-semibold"
              >
                <span>{item.name}</span>
                <button
                  type="button"
                  onClick={() => removeInterest(item.id)}
                  className="hover:bg-cyan-200 dark:hover:bg-info p-0.5 rounded-full transition-colors cursor-pointer"
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Quick Suggestion Tags */}
        <div>
          <span className="text-[11px] text-muted-foreground block mb-1.5">
            اقتراحات شائعة سريعة للمتاجر:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_INTEREST_TAGS.map((tag) => (
              <button
                key={tag.query}
                type="button"
                onClick={() => {
                  setSearchQuery(tag.query);
                  handleSearch(tag.query);
                }}
                className="px-2.5 py-1 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-[11px] text-foreground hover:border-info transition-colors cursor-pointer"
              >
                + {tag.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom & Lookalike Audiences */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
          <UserGroupIcon className="w-5 h-5 text-info dark:text-info" />
          <span>الجماهير المخصصة والشبيهة (Custom & Lookalike)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-3">
          استهداف زوار موقعك السابقين أو عملاء الشراء المشابهين
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Custom */}
          <div className="p-3 border border-border dark:border-border rounded-xl bg-muted dark:bg-muted">
            <span className="text-xs font-bold text-foreground dark:text-muted-foreground block mb-2">
              الجماهير المخصصة ({customAudiences.length})
            </span>
            {customAudiences.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">لا توجد جماهير مخصصة مسجلة</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {customAudiences.map((ca) => (
                  <label
                    key={ca.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-muted cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCustomAudiences.includes(ca.id)}
                      onChange={() => toggleCustomAudience(ca.id)}
                      className="w-3.5 h-3.5 text-info rounded"
                    />
                    <span className="text-gray-800 dark:text-muted-foreground truncate">
                      {ca.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Lookalike */}
          <div className="p-3 border border-border dark:border-border rounded-xl bg-muted dark:bg-muted">
            <span className="text-xs font-bold text-foreground dark:text-muted-foreground block mb-2">
              الجماهير المشابهة ({lookalikeAudiences.length})
            </span>
            {lookalikeAudiences.length === 0 ? (
              <p className="text-[11px] text-muted-foreground">لا توجد جماهير مشابهة مسجلة</p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {lookalikeAudiences.map((la) => (
                  <label
                    key={la.id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-muted cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedLookalikeAudiences.includes(la.id)}
                      onChange={() => toggleLookalikeAudience(la.id)}
                      className="w-3.5 h-3.5 text-info rounded"
                    />
                    <span className="text-gray-800 dark:text-muted-foreground truncate">
                      {la.name}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audience Exclusion */}
      <div className="pt-4 border-t border-border dark:border-border">
        <label className="block text-sm font-bold text-foreground mb-1.5 flex items-center gap-2">
          <NoSymbolIcon className="w-5 h-5 text-destructive" />
          <span>استبعاد الجماهير (Audience Exclusion)</span>
        </label>
        <p className="text-xs text-muted-foreground mb-2">
          استبعاد فئات معينة لتجنب إهدار الميزانية على أشخاص اشتروا بالفعل
        </p>

        {customAudiences.length === 0 ? (
          <p className="text-xs text-muted-foreground p-2 border border-dashed rounded-lg">
            سيتوفر الاستبعاد بمجرد إنشاء أو ربط جماهير مخصصة (مثل جمهور المشترين خلال 30 يوم).
          </p>
        ) : (
          <div className="space-y-1.5 max-h-36 overflow-y-auto border border-destructive dark:border-destructive/50 rounded-xl p-2.5 bg-destructive/20 dark:bg-destructive/10">
            {customAudiences.map((ca) => (
              <label
                key={`ex-${ca.id}`}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white dark:hover:bg-muted cursor-pointer text-xs"
              >
                <input
                  type="checkbox"
                  checked={excludedAudiences.includes(ca.id)}
                  onChange={() => toggleExcludeAudience(ca.id)}
                  className="w-3.5 h-3.5 text-destructive focus:ring-destructive rounded"
                />
                <span className="text-red-900 dark:text-destructive">
                  استبعاد: {ca.name}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
