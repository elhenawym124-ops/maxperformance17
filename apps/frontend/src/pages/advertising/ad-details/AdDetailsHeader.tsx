import React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  BoltIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { FacebookAdDetailResponse } from "../../../services/facebookAdsService";
import { getStatusBadge, getStatusLabel, getVerdictClass } from "./helpers";
import { DateInput } from '../../../components/ui/DateInput';

interface AdDetailsHeaderProps {
  details: FacebookAdDetailResponse;
  dateRange: { startDate: string; endDate: string };
  setDateRange: React.Dispatch<
    React.SetStateAction<{ startDate: string; endDate: string }>
  >;
  isEn: boolean;
  refreshing: boolean;
  syncing: boolean;
  previewLoading: boolean;
  performanceSourceLabel: string;
  performanceSourceClass: string;
  dashboardUrl: string;
  onRefresh: () => void;
  onSync: () => void;
  onPreview: () => void;
}

export const AdDetailsHeader: React.FC<AdDetailsHeaderProps> = ({
  details,
  dateRange,
  setDateRange,
  isEn,
  refreshing,
  syncing,
  previewLoading,
  performanceSourceLabel,
  performanceSourceClass,
  dashboardUrl,
  onRefresh,
  onSync,
  onPreview,
}) => {
  const navigate = useNavigate();

  return (
    <div className="rounded-lg border border-border bg-white p-3 shadow-sm">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <button
            onClick={() => navigate(dashboardUrl)}
            className="mt-0.5 rounded-lg border border-border p-1.5 text-foreground hover:bg-muted transition-colors"
            title={isEn ? "Back" : "رجوع"}
            aria-label={isEn ? "Back" : "رجوع"}
          >
            <ArrowLeftIcon className={`h-4 w-4 ${isEn ? "" : "rotate-180"}`} />
          </button>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-lg font-black text-foreground">
                {details.ad.name}
              </h1>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getStatusBadge(
                  details.ad.effectiveStatus || details.ad.status,
                )}`}
              >
                {getStatusLabel(details.ad.effectiveStatus || details.ad.status, isEn)}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${getVerdictClass(
                  details.verdict.tone,
                )}`}
              >
                {details.verdict.label}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-bold ${performanceSourceClass}`}
                title={details.meta?.metaInsightError || undefined}
              >
                {performanceSourceLabel}
              </span>
            </div>
            <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-foreground">
              {details.campaign.name} · {details.adSet.name}
            </p>
            <p className="mt-0.5 line-clamp-1 text-xs font-semibold text-muted-foreground">
              {details.verdict.reason}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DateInput
            aria-label={isEn ? "Start Date" : "تاريخ البدء"}
            value={dateRange.startDate}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                startDate: event.target.value,
              }))
            }
            className="h-9 rounded-lg border border-border px-3 text-sm font-semibold tabular-nums"
          />
          <DateInput
            aria-label={isEn ? "End Date" : "تاريخ الانتهاء"}
            value={dateRange.endDate}
            onChange={(event) =>
              setDateRange((current) => ({
                ...current,
                endDate: event.target.value,
              }))
            }
            className="h-9 rounded-lg border border-border px-3 text-sm font-semibold tabular-nums"
          />
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-bold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
          >
            <ArrowPathIcon
              className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            {isEn ? "Refresh" : "تحديث"}
          </button>
          <button
            onClick={onSync}
            disabled={syncing || !details.ad.facebookAdId}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-bold text-white hover:bg-primary disabled:opacity-50 transition-colors"
          >
            <BoltIcon className={`h-4 w-4 ${syncing ? "animate-pulse" : ""}`} />
            {isEn ? "Sync" : "مزامنة"}
          </button>
          <button
            onClick={onPreview}
            disabled={previewLoading || !details.ad.facebookAdId}
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-primary bg-primary/10 px-3 text-sm font-bold text-primary hover:bg-primary disabled:opacity-50 transition-colors"
          >
            <EyeIcon className="h-4 w-4" />
            {isEn ? "Preview" : "معاينة"}
          </button>
        </div>
      </div>
    </div>
  );
};
