import React from "react";
import {
  PauseIcon,
  PlayIcon,
  PlusIcon,
  ShoppingBagIcon,
  DocumentDuplicateIcon,
  PencilSquareIcon,
  CheckIcon,
  XMarkIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import {
  FacebookAdSet,
  FacebookAd,
} from "../../../services/facebookAdsService";
import {
  getStatusBadge,
  getStatusLabel,
  formatCurrency,
  parseLocations,
} from "./types";
import { AdCard } from "./AdCard";

interface AdSetRowProps {
  adSet: FacebookAdSet;
  campaignCurrency: string;
  isEn: boolean;
  editingBudgetAdSetId: string | null;
  editBudgetValue: string;
  setEditBudgetValue: (val: string) => void;
  savingBudgetId: string | null;
  duplicatingAdSetId: string | null;
  togglingAdSetId: string | null;
  togglingAdId: string | null;
  onStartEditBudget: (adSet: FacebookAdSet) => void;
  onCancelEditBudget: () => void;
  onSaveBudget: (adSet: FacebookAdSet) => void;
  onDuplicateAdSet: (adSet: FacebookAdSet) => void;
  onToggleAdSetStatus: (adSet: FacebookAdSet) => void;
  onToggleAdStatus: (ad: FacebookAd) => void;
  onCreateNewAd: (adSetId: string) => void;
  onCreateDynamicAd: (adSetId: string) => void;
  onOpenAdAnalysis: (adId: string) => void;
}

export const AdSetRow: React.FC<AdSetRowProps> = ({
  adSet,
  campaignCurrency,
  isEn,
  editingBudgetAdSetId,
  editBudgetValue,
  setEditBudgetValue,
  savingBudgetId,
  duplicatingAdSetId,
  togglingAdSetId,
  togglingAdId,
  onStartEditBudget,
  onCancelEditBudget,
  onSaveBudget,
  onDuplicateAdSet,
  onToggleAdSetStatus,
  onToggleAdStatus,
  onCreateNewAd,
  onCreateDynamicAd,
  onOpenAdAnalysis,
}) => {
  const ads = adSet.ads || [];
  const isAdSetActive =
    (adSet.effectiveStatus || adSet.status) === "ACTIVE";

  const formatTargetingSummary = (adSetObj: FacebookAdSet) => {
    const parts: string[] = [];
    const locSummary = parseLocations(
      adSetObj.locations || (adSetObj.targeting as any)?.geo_locations,
      isEn,
    );
    if (locSummary) {
      parts.push(locSummary);
    }
    if (adSetObj.ageMin || adSetObj.ageMax) {
      parts.push(
        `${adSetObj.ageMin || 18}-${adSetObj.ageMax || 65}+ ${isEn ? "yo" : "سنة"}`,
      );
    }
    if (adSetObj.genders) {
      const g = Array.isArray(adSetObj.genders)
        ? adSetObj.genders.join(", ")
        : String(adSetObj.genders);
      if (g.includes("1") && g.includes("2")) {
        parts.push(isEn ? "All" : "الجميع");
      } else if (g.includes("2")) {
        parts.push(isEn ? "Women" : "نساء");
      } else if (g.includes("1")) {
        parts.push(isEn ? "Men" : "رجال");
      }
    }
    return parts;
  };

  const targetingParts = formatTargetingSummary(adSet);

  return (
    <div className="px-4 py-3 hover:bg-muted transition-colors">
      <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-black text-foreground">
              {adSet.name}
            </h3>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(
                adSet.status,
              )}`}
            >
              {getStatusLabel(adSet.effectiveStatus || adSet.status, isEn)}
            </span>
            {adSet.facebookAdSetId && (
              <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-mono text-muted-foreground">
                ID: {adSet.facebookAdSetId}
              </span>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-muted-foreground">
            {editingBudgetAdSetId === adSet.id ? (
              <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary px-2 py-1 rounded-lg">
                <input
                  type="number"
                  value={editBudgetValue}
                  onChange={(e) => setEditBudgetValue(e.target.value)}
                  className="w-20 rounded border border-primary bg-white px-1.5 py-0.5 text-xs font-bold text-foreground"
                  placeholder="الميزانية"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => onSaveBudget(adSet)}
                  disabled={savingBudgetId === adSet.id}
                  className="p-1 rounded bg-primary text-white hover:bg-primary transition-colors"
                  title={isEn ? "Save" : "حفظ"}
                >
                  <CheckIcon className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onCancelEditBudget}
                  className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                  title={isEn ? "Cancel" : "إلغاء"}
                >
                  <XMarkIcon className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <span
                onClick={() => onStartEditBudget(adSet)}
                className="inline-flex items-center gap-1 cursor-pointer hover:text-primary hover:underline bg-muted px-2 py-0.5 rounded border border-border"
                title={
                  isEn
                    ? "Click to edit budget quickly"
                    : "اضغط لتعديل الميزانية سريعاً"
                }
              >
                <span className="tabular-nums">
                  {formatCurrency(adSet.budgetAmount, campaignCurrency, isEn)}
                  {adSet.budgetType === "DAILY"
                    ? isEn
                      ? " / day"
                      : " / يوم"
                    : ""}
                </span>
                <PencilSquareIcon className="h-3 w-3 text-muted-foreground hover:text-primary" />
              </span>
            )}
            <span className="tabular-nums">
              {ads.length} {isEn ? "ads" : "إعلان"}
            </span>
            {adSet.optimizationGoal && (
              <span className="rounded bg-muted px-2 py-0.5 text-foreground">
                {adSet.optimizationGoal}
              </span>
            )}
            {targetingParts.map((part, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 text-foreground"
              >
                {idx === 0 && <MapPinIcon className="h-3 w-3 text-muted-foreground" />}
                <span>{part}</span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button
            onClick={() => onDuplicateAdSet(adSet)}
            disabled={duplicatingAdSetId === adSet.id}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs font-bold text-foreground hover:bg-muted hover:border-border transition disabled:opacity-50"
            title={
              isEn
                ? "Duplicate Ad Set (1-Click)"
                : "تكرار المجموعة الإعلانية بنقرة واحدة"
            }
          >
            <DocumentDuplicateIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span>
              {duplicatingAdSetId === adSet.id
                ? isEn
                  ? "..."
                  : "جاري التكرار..."
                : isEn
                  ? "Duplicate"
                  : "تكرار"}
            </span>
          </button>

          <button
            onClick={() => onToggleAdSetStatus(adSet)}
            disabled={togglingAdSetId === adSet.id}
            className={`inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-bold transition disabled:opacity-50 ${
              isAdSetActive
                ? "border-amber-200 bg-warning/10 text-warning hover:bg-warning"
                : "border-emerald-200 bg-success/10 text-success hover:bg-success"
            }`}
            title={
              isEn
                ? "Toggle Ad Set status"
                : "تبديل حالة المجموعة الإعلانية"
            }
          >
            {isAdSetActive ? (
              <>
                <PauseIcon className="h-3.5 w-3.5" />
                <span>
                  {togglingAdSetId === adSet.id
                    ? "..."
                    : isEn
                      ? "Pause"
                      : "إيقاف"}
                </span>
              </>
            ) : (
              <>
                <PlayIcon className="h-3.5 w-3.5" />
                <span>
                  {togglingAdSetId === adSet.id
                    ? "..."
                    : isEn
                      ? "Resume"
                      : "تشغيل"}
                </span>
              </>
            )}
          </button>
          <button
            onClick={() => onCreateNewAd(adSet.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary transition-colors"
            title={isEn ? "Create New Ad" : "إنشاء إعلان جديد"}
          >
            <PlusIcon className="h-4 w-4" />
            {isEn ? "New Ad" : "إعلان جديد"}
          </button>
          <button
            onClick={() => onCreateDynamicAd(adSet.id)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary transition-colors"
            title={isEn ? "Create Dynamic Ad" : "إنشاء Dynamic Ad"}
          >
            <ShoppingBagIcon className="h-4 w-4" />
            {isEn ? "Dynamic" : "Dynamic"}
          </button>
        </div>
      </div>

      {ads.length > 0 && (
        <div className="mt-3 grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {ads.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              isEn={isEn}
              togglingAdId={togglingAdId}
              onToggleStatus={onToggleAdStatus}
              onOpenAnalysis={onOpenAdAnalysis}
            />
          ))}
        </div>
      )}
    </div>
  );
};
