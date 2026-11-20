import React from "react";
import { Link } from "react-router-dom";
import {
  Layers,
  ArrowUpRight,
  SlidersHorizontal,
  Users,
  MapPin,
  Loader2,
  Check,
} from "lucide-react";
import { FacebookCampaign } from "../../../../services/facebookAdsService";
import { formatCurrency } from "../../../../utils/facebookAdsHelpers";
import { EGYPT_GOVERNORATES, parseGenders, parseLocationsArray } from "./constants";

export interface CampaignAdSetsTabProps {
  isEn: boolean;
  loadingDetails: boolean;
  activeCampaign: FacebookCampaign;
  selectedAdAccountId: string;
  selectedCurrency: string;
  isCboCampaign: boolean;
  editingAdSetId: string | null;
  adSetName: string;
  setAdSetName: (name: string) => void;
  adSetBudget: number;
  setAdSetBudget: (budget: number) => void;
  adSetAgeMin: number;
  setAdSetAgeMin: (age: number) => void;
  adSetAgeMax: number;
  setAdSetAgeMax: (age: number) => void;
  adSetGenders: string[];
  setAdSetGenders: (genders: string[]) => void;
  adSetLocations: string[];
  savingAdSet: boolean;
  togglingAdSetId: string | null;
  togglingAdId: string | null;
  onStartEditAdSet: (adSet: any) => void;
  onCancelEditAdSet: () => void;
  onSaveAdSetTargeting: (adSetId: string) => void;
  onToggleAdSetStatus: (adSet: any) => void;
  onToggleAdStatus: (ad: any, adSetId: string) => void;
  onToggleLocation: (key: string) => void;
  onSelectAllEgypt: () => void;
  onSelectGreaterCairo: () => void;
  onClearLocations: () => void;
}

export const CampaignAdSetsTab: React.FC<CampaignAdSetsTabProps> = ({
  isEn,
  loadingDetails,
  activeCampaign,
  selectedAdAccountId,
  selectedCurrency,
  isCboCampaign,
  editingAdSetId,
  adSetName,
  setAdSetName,
  adSetBudget,
  setAdSetBudget,
  adSetAgeMin,
  setAdSetAgeMin,
  adSetAgeMax,
  setAdSetAgeMax,
  adSetGenders,
  setAdSetGenders,
  adSetLocations,
  savingAdSet,
  togglingAdSetId,
  togglingAdId,
  onStartEditAdSet,
  onCancelEditAdSet,
  onSaveAdSetTargeting,
  onToggleAdSetStatus,
  onToggleAdStatus,
  onToggleLocation,
  onSelectAllEgypt,
  onSelectGreaterCairo,
  onClearLocations,
}) => {
  if (loadingDetails) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="mt-2 text-xs">
          {isEn ? "Loading ad sets structure..." : "جاري تحميل تفاصيل المجموعات الإعلانية..."}
        </span>
      </div>
    );
  }

  if (!activeCampaign.adSets || activeCampaign.adSets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border p-8 text-center dark:border-border">
        <Layers className="h-8 w-8 text-muted-foreground" />
        <h4 className="mt-2 text-sm font-bold text-foreground dark:text-white">
          {isEn ? "No Ad Sets in this Campaign" : "لا توجد مجموعات إعلانية في هذه الحملة"}
        </h4>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          {isEn
            ? "A campaign requires at least one active Ad Set and Ad creative to start delivering impressions on Meta."
            : "تحتاج الحملة إلى مجموعة إعلانية واحدة وإعلان نشط على الأقل لتبدأ بالظهور والتسليم الفعلي."}
        </p>
        <Link
          to={`/advertising/facebook-ads/campaigns/${activeCampaign.id}/adsets/create${
            selectedAdAccountId ? `?adAccountId=${encodeURIComponent(selectedAdAccountId)}` : ""
          }`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary"
        >
          <span>{isEn ? "Create First Ad Set" : "إنشاء أول مجموعة إعلانية"}</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {activeCampaign.adSets.map((adSet, idx) => {
        const isEditingThisAdSet = editingAdSetId === adSet.id;
        const parsedLocations = parseLocationsArray(adSet.locations || adSet.targeting?.geo_locations);
        const parsedGenderList = parseGenders(adSet.genders);

        return (
          <div
            key={adSet.id || idx}
            className={`rounded-xl border transition-all ${
              isEditingThisAdSet
                ? "border-blue-500 bg-primary/20 shadow-md ring-1 ring-primary/20 dark:border-primary dark:bg-primary/20"
                : "border-slate-200/90 bg-white p-3.5 shadow-2xs dark:border-border dark:bg-muted"
            }`}
          >
            {/* Regular Display Mode */}
            {!isEditingThisAdSet && (
              <div>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={togglingAdSetId === adSet.id}
                        onClick={() => onToggleAdSetStatus(adSet)}
                        title={
                          adSet.status === "ACTIVE"
                            ? isEn ? "Pause ad set" : "إيقاف المجموعة الإعلانية"
                            : isEn ? "Activate ad set" : "تفعيل المجموعة الإعلانية"
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-1 focus:ring-primary/20 active:scale-[0.97] disabled:opacity-50 ${
                          adSet.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300 dark:bg-muted"
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            adSet.status === "ACTIVE"
                              ? isEn ? "translate-x-4" : "-translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span className="text-xs font-black text-foreground dark:text-white">
                        {adSet.name}
                      </span>
                      <span
                        className={`rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                          adSet.status === "ACTIVE"
                            ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
                            : "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                        }`}
                      >
                        {adSet.status === "ACTIVE" ? (isEn ? "Active" : "نشط") : (isEn ? "Paused" : "متوقف")}
                      </span>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                      {adSet.budgetAmount > 0 && (
                        <span className="font-semibold tabular-nums" dir="ltr">
                          {formatCurrency(adSet.budgetAmount, selectedCurrency)} ({adSet.budgetType})
                        </span>
                      )}
                      {adSet.ads && (
                        <>
                          <span>•</span>
                          <span>
                            {adSet.ads.length} {isEn ? "creatives" : "إعلانات"}
                          </span>
                        </>
                      )}
                      {adSet.facebookAdSetId && (
                        <>
                          <span>•</span>
                          <span className="text-[10px] font-semibold tabular-nums text-muted-foreground" dir="ltr">
                            ID: {adSet.facebookAdSetId}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Edit Targeting Trigger Button */}
                  <button
                    type="button"
                    onClick={() => onStartEditAdSet(adSet)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-bold text-foreground hover:border-primary hover:bg-primary/10 hover:text-primary dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-primary dark:hover:bg-primary/40 dark:hover:text-primary transition-all active:scale-[0.97]"
                  >
                    <SlidersHorizontal className="h-3 w-3 text-primary dark:text-primary" />
                    <span>{isEn ? "Edit Targeting & Data" : "تعديل الاستهداف والمجموعة"}</span>
                  </button>
                </div>

                {/* Targeting Overview Strip */}
                <div className="mt-3 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-muted p-2.5 text-xs dark:border-border dark:bg-muted">
                  {/* Demographics Pill */}
                  <div className="flex items-center gap-1 text-foreground dark:text-muted-foreground">
                    <Users className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="font-bold">
                      {parsedGenderList.length === 2
                        ? isEn ? "All Genders" : "الجميع (رجال ونساء)"
                        : parsedGenderList.includes("1")
                        ? isEn ? "Men only" : "رجال فقط"
                        : isEn ? "Women only" : "نساء فقط"}
                    </span>
                    <span className="tabular-nums">
                      ({adSet.ageMin || 18} - {adSet.ageMax || 65} {isEn ? "yo" : "سنة"})
                    </span>
                  </div>

                  <span className="text-slate-300 dark:text-foreground">•</span>

                  {/* Geographic Locations Summary */}
                  <div className="flex flex-wrap items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-[11px] text-muted-foreground">
                      {isEn ? "Targeting:" : "المحافظات:"}
                    </span>
                    {parsedLocations.length === 0 ? (
                      <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground dark:bg-muted dark:text-muted-foreground">
                        {isEn ? "All Egypt (Broad)" : "كافة محافظات مصر (استهداف عام)"}
                      </span>
                    ) : (
                      <>
                        {parsedLocations.slice(0, 4).map((locKey, lIdx) => (
                          <span
                            key={lIdx}
                            className="rounded-md bg-primary/70 px-1.5 py-0.5 text-[10px] font-bold text-primary dark:bg-primary/50 dark:text-primary"
                          >
                            {EGYPT_GOVERNORATES.find((g) => g.key === locKey)?.name || locKey}
                          </span>
                        ))}
                        {parsedLocations.length > 4 && (
                          <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-bold text-foreground dark:bg-muted dark:text-muted-foreground">
                            +{parsedLocations.length - 4} {isEn ? "more" : "أخرى"}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Creatives / Ads nested in Ad Set */}
                {adSet.ads && adSet.ads.length > 0 && (
                  <div className="mt-2.5 border-t border-border pt-2 dark:border-border">
                    <span className="block text-[11px] font-bold text-muted-foreground mb-1.5">
                      {isEn
                        ? `Creatives inside Ad Set (${adSet.ads.length}):`
                        : `الإعلانات داخل المجموعة (${adSet.ads.length}):`}
                    </span>
                    <div className="space-y-1.5">
                      {adSet.ads.map((ad: any, aIdx: number) => (
                        <div
                          key={ad.id || aIdx}
                          className="flex items-center justify-between gap-2 rounded-lg border border-border bg-muted p-2 text-xs dark:border-border dark:bg-muted"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <button
                              type="button"
                              disabled={togglingAdId === ad.id}
                              onClick={() => onToggleAdStatus(ad, adSet.id)}
                              title={
                                ad.status === "ACTIVE"
                                  ? isEn ? "Pause ad creative" : "إيقاف الإعلان"
                                  : isEn ? "Activate ad creative" : "تفعيل الإعلان"
                              }
                              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none active:scale-[0.96] disabled:opacity-50 ${
                                ad.status === "ACTIVE" ? "bg-emerald-500" : "bg-slate-300 dark:bg-muted"
                              }`}
                            >
                              <span
                                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                  ad.status === "ACTIVE"
                                    ? isEn ? "translate-x-3" : "-translate-x-3"
                                    : "translate-x-0"
                                }`}
                              />
                            </button>
                            <span className="font-bold text-foreground dark:text-white truncate">
                              {ad.name}
                            </span>
                            {ad.primaryText && (
                              <span className="text-[11px] text-muted-foreground truncate max-w-xs hidden sm:inline">
                                "{ad.primaryText}"
                              </span>
                            )}
                          </div>
                          <span
                            className={`shrink-0 rounded-md px-1.5 py-0.2 text-[10px] font-bold ${
                              ad.status === "ACTIVE"
                                ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
                                : "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                            }`}
                          >
                            {ad.status === "ACTIVE" ? (isEn ? "Active" : "نشط") : (isEn ? "Paused" : "متوقف")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Active Inline Targeting Editor */}
            {isEditingThisAdSet && (
              <div className="p-3.5 sm:p-4 space-y-4">
                {/* Editor Header */}
                <div className="flex items-center justify-between border-b border-primary/85 pb-2.5 dark:border-primary/50">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-4 w-4 text-primary dark:text-primary" />
                    <h4 className="text-xs font-black text-foreground dark:text-white">
                      {isEn ? "Edit Ad Set & Audience Targeting" : "تعديل إعدادات واستهداف المجموعة"}
                    </h4>
                  </div>
                  <button
                    type="button"
                    onClick={onCancelEditAdSet}
                    className="text-xs font-bold text-muted-foreground hover:text-foreground dark:hover:text-white"
                  >
                    {isEn ? "Cancel" : "إلغاء"}
                  </button>
                </div>

                {/* Name & Budget Row */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-foreground dark:text-muted-foreground">
                      {isEn ? "Ad Set Name" : "اسم المجموعة الإعلانية"}
                    </label>
                    <input
                      type="text"
                      value={adSetName}
                      onChange={(e) => setAdSetName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground shadow-2xs outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-border dark:bg-muted dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="mb-1 block text-[11px] font-bold text-foreground dark:text-muted-foreground">
                      {isEn ? `Ad Set Budget (${selectedCurrency})` : `ميزانية المجموعة (${selectedCurrency})`}
                    </label>
                    {isCboCampaign ? (
                      <div className="rounded-lg border border-primary/80 bg-primary/50 px-3 py-1.5 text-xs font-semibold text-primary dark:border-primary/60 dark:bg-primary/40 dark:text-primary">
                        {isEn ? "Managed dynamically by Campaign CBO" : "تدار تلقائياً من ميزانية الحملة (CBO)"}
                      </div>
                    ) : (
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={adSetBudget}
                        onChange={(e) => setAdSetBudget(Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-border bg-white px-3 py-1.5 text-xs font-bold tabular-nums text-foreground shadow-2xs outline-none focus:border-primary focus:ring-1 focus:ring-primary dark:border-border dark:bg-muted dark:text-white"
                        placeholder={isEn ? "Set budget" : "تحديد الميزانية"}
                      />
                    )}
                  </div>
                </div>

                {/* Demographics: Age & Gender */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 rounded-xl border border-border bg-white p-3 dark:border-border dark:bg-muted">
                  {/* Age Range */}
                  <div>
                    <label className="mb-1.5 flex items-center justify-between text-[11px] font-bold text-foreground dark:text-muted-foreground">
                      <span>{isEn ? "Target Age Range" : "الفئة العمرية المستهدفة"}</span>
                      <span className="tabular-nums font-black text-primary dark:text-primary">
                        {adSetAgeMin} - {adSetAgeMax} {isEn ? "years" : "سنة"}
                      </span>
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <span className="mb-0.5 block text-[10px] text-muted-foreground">{isEn ? "Min Age" : "من عمر"}</span>
                        <input
                          type="number"
                          min="18"
                          max="65"
                          value={adSetAgeMin}
                          onChange={(e) => setAdSetAgeMin(Number(e.target.value) || 18)}
                          className="w-full rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-foreground outline-none focus:border-primary dark:border-border dark:bg-muted dark:text-white"
                        />
                      </div>
                      <span className="mt-4 text-muted-foreground">-</span>
                      <div className="flex-1">
                        <span className="mb-0.5 block text-[10px] text-muted-foreground">{isEn ? "Max Age" : "إلى عمر"}</span>
                        <input
                          type="number"
                          min="18"
                          max="65"
                          value={adSetAgeMax}
                          onChange={(e) => setAdSetAgeMax(Number(e.target.value) || 65)}
                          className="w-full rounded-lg border border-border bg-white px-2.5 py-1 text-xs font-bold tabular-nums text-foreground outline-none focus:border-primary dark:border-border dark:bg-muted dark:text-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gender Segmented Switch */}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold text-foreground dark:text-muted-foreground">
                      {isEn ? "Target Gender" : "الجنس المستهدف"}
                    </label>
                    <div className="inline-flex w-full rounded-lg border border-border bg-muted p-0.5 text-xs font-bold dark:border-border dark:bg-muted">
                      <button
                        type="button"
                        onClick={() => setAdSetGenders(["1", "2"])}
                        className={`flex-1 rounded-md py-1.5 transition-all ${
                          adSetGenders.length === 2
                            ? "bg-blue-600 text-white shadow-2xs font-black"
                            : "text-slate-600 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
                        }`}
                      >
                        {isEn ? "All" : "الجميع"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdSetGenders(["1"])}
                        className={`flex-1 rounded-md py-1.5 transition-all ${
                          adSetGenders.length === 1 && adSetGenders[0] === "1"
                            ? "bg-blue-600 text-white shadow-2xs font-black"
                            : "text-slate-600 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
                        }`}
                      >
                        {isEn ? "Men" : "رجال"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdSetGenders(["2"])}
                        className={`flex-1 rounded-md py-1.5 transition-all ${
                          adSetGenders.length === 1 && adSetGenders[0] === "2"
                            ? "bg-blue-600 text-white shadow-2xs font-black"
                            : "text-slate-600 hover:text-foreground dark:text-muted-foreground dark:hover:text-white"
                        }`}
                      >
                        {isEn ? "Women" : "نساء"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Geographic Locations Picker */}
                <div className="space-y-2 rounded-xl border border-border bg-white p-3 dark:border-border dark:bg-muted">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-primary dark:text-primary" />
                      <span className="text-[11px] font-bold text-foreground dark:text-muted-foreground">
                        {isEn ? "Target Locations (Governorates)" : "المحافظات المستهدفة (مصر)"}
                      </span>
                      <span className="rounded-md bg-primary px-1.5 py-0.2 text-[10px] font-black text-primary dark:bg-primary/60 dark:text-primary">
                        {adSetLocations.length === 0
                          ? isEn ? "All Egypt" : "كافة مصر"
                          : `${adSetLocations.length} ${isEn ? "selected" : "محددة"}`}
                      </span>
                    </div>

                    {/* Quick selection pills */}
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={onSelectAllEgypt}
                        className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
                      >
                        {isEn ? "All Egypt (20)" : "كل المحافظات"}
                      </button>
                      <button
                        type="button"
                        onClick={onSelectGreaterCairo}
                        className="rounded-md border border-border bg-muted px-2 py-0.5 text-[10px] font-bold text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
                      >
                        {isEn ? "Greater Cairo" : "القاهرة الكبرى"}
                      </button>
                      {adSetLocations.length > 0 && (
                        <button
                          type="button"
                          onClick={onClearLocations}
                          className="rounded-md border border-destructive bg-destructive/10 px-2 py-0.5 text-[10px] font-bold text-destructive hover:bg-destructive dark:border-destructive/60 dark:bg-destructive/40 dark:text-destructive"
                        >
                          {isEn ? "Clear All" : "مسح الكل"}
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-[10px] text-muted-foreground">
                    {isEn
                      ? "Click governorates to include or exclude. Leaving empty targets all of Egypt."
                      : "اضغط على اسم المحافظة لتحديدها أو استبعادها. تركها فارغة يستهدف كافة أنحاء مصر تلقائياً."}
                  </p>

                  {/* Clickable governorates grid */}
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 rounded-lg border border-border bg-muted dark:border-border dark:bg-muted">
                    {EGYPT_GOVERNORATES.map((gov) => {
                      const isSelected = adSetLocations.includes(gov.key);
                      return (
                        <button
                          key={gov.key}
                          type="button"
                          onClick={() => onToggleLocation(gov.key)}
                          className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all active:scale-[0.96] ${
                            isSelected
                              ? "bg-blue-600 text-white shadow-2xs font-bold ring-1 ring-primary"
                              : "border border-border bg-white text-foreground hover:border-border dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border"
                          }`}
                        >
                          {gov.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Ad Set Action Buttons */}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={onCancelEditAdSet}
                    disabled={savingAdSet}
                    className="rounded-xl border border-border bg-white px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground"
                  >
                    {isEn ? "Cancel" : "إلغاء"}
                  </button>

                  <button
                    type="button"
                    onClick={() => onSaveAdSetTargeting(adSet.id)}
                    disabled={savingAdSet}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-primary active:scale-[0.97] disabled:opacity-50 transition-all"
                  >
                    {savingAdSet ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        <span>{isEn ? "Syncing with Meta..." : "مزامنة الاستهداف مع Meta..."}</span>
                      </>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>{isEn ? "Save Ad Set Targeting" : "حفظ استهداف المجموعة"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
