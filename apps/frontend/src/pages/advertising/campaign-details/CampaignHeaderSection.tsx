import React from "react";
import {
  ArrowLeftIcon,
  PauseIcon,
  PlayIcon,
  TrashIcon,
  ArrowPathIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";
import {
  type CampaignWithCurrency,
  getStatusBadge,
  getStatusLabel,
  getObjectiveLabel,
  formatCurrency,
} from "./types";

interface CampaignHeaderSectionProps {
  campaign: CampaignWithCurrency;
  isEn: boolean;
  dashboardUrl: string;
  onNavigateBack: () => void;
  syncing: boolean;
  refreshing: boolean;
  onSyncMeta: () => void;
  onRefresh: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  campaignCurrency: string;
  activeAdSets: number;
  totalAdSets: number;
  activeAds: number;
  totalAds: number;
  dateRangeLabel: string;
}

export const CampaignHeaderSection: React.FC<CampaignHeaderSectionProps> = ({
  campaign,
  isEn,
  onNavigateBack,
  syncing,
  refreshing,
  onSyncMeta,
  onRefresh,
  onPause,
  onResume,
  onDelete,
  campaignCurrency,
  activeAdSets,
  totalAdSets,
  activeAds,
  totalAds,
  dateRangeLabel,
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <button
          onClick={onNavigateBack}
          className="mt-0.5 rounded-lg border border-border p-2 text-foreground hover:bg-muted transition-colors"
          aria-label={isEn ? "Back to Campaigns" : "العودة لقائمة الحملات"}
          title={isEn ? "Back" : "رجوع"}
        >
          <ArrowLeftIcon className={`h-4 w-4 ${isEn ? "" : "rotate-180"}`} />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="max-w-3xl truncate text-xl font-black text-foreground">
              {campaign.name}
            </h1>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-bold ${getStatusBadge(
                campaign.status,
              )}`}
            >
              {getStatusLabel(campaign.status, isEn)}
            </span>
            {campaign.deliveryReadiness?.label && (
              <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
                {campaign.deliveryReadiness.label}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold text-foreground">
            <span className="rounded-lg bg-muted px-2.5 py-1">
              {isEn ? "Objective:" : "الهدف:"}{" "}
              {getObjectiveLabel(campaign.objective)}
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1">
              {isEn ? "Budget:" : "الميزانية:"}{" "}
              <span className="tabular-nums">
                {formatCurrency(campaign.budgetAmount, campaignCurrency, isEn)}
              </span>
              {campaign.budgetType === "DAILY"
                ? isEn
                  ? " / day"
                  : " / يوم"
                : ""}
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1">
              {isEn ? "Ad Sets:" : "المجموعات:"}{" "}
              <span className="tabular-nums">
                {activeAdSets}/{totalAdSets}
              </span>
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1">
              {isEn ? "Ads:" : "الإعلانات:"}{" "}
              <span className="tabular-nums">
                {activeAds}/{totalAds}
              </span>
            </span>
            <span className="rounded-lg bg-muted px-2.5 py-1">
              {isEn ? "Period:" : "الفترة:"} {dateRangeLabel}
            </span>
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          onClick={onSyncMeta}
          disabled={syncing || refreshing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-primary bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary disabled:opacity-50 transition-colors"
          title={
            isEn
              ? "Sync structure & latest data directly from Meta"
              : "مزامنة الهيكل وأحدث البيانات مباشرة من Meta"
          }
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${syncing ? "animate-spin text-primary" : ""}`}
          />
          {syncing
            ? isEn
              ? "Syncing Meta..."
              : "جاري المزامنة..."
            : isEn
              ? "Sync Meta"
              : "مزامنة Meta"}
        </button>

        {campaign.facebookCampaignId && (
          <a
            href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=${campaign.facebookCampaignId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted transition-colors"
            title={
              isEn ? "Open in Facebook Ads Manager" : "فتح في مدير إعلانات فيسبوك"
            }
          >
            <ArrowTopRightOnSquareIcon className="h-4 w-4 text-muted-foreground" />
            {isEn ? "Ads Manager" : "مدير الإعلانات"}
          </a>
        )}

        <button
          onClick={onRefresh}
          disabled={refreshing || syncing}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-white px-3 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50 transition-colors"
        >
          <ArrowPathIcon
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          {isEn ? "Refresh" : "تحديث"}
        </button>

        {campaign.status === "ACTIVE" ? (
          <button
            onClick={onPause}
            className="inline-flex items-center gap-1.5 rounded-lg border border-warning bg-warning/10 px-3 py-2 text-xs font-bold text-warning hover:bg-warning transition-colors"
          >
            <PauseIcon className="h-4 w-4" />
            {isEn ? "Pause" : "إيقاف"}
          </button>
        ) : campaign.status === "PAUSED" ? (
          <button
            onClick={onResume}
            className="inline-flex items-center gap-1.5 rounded-lg border border-success bg-success/10 px-3 py-2 text-xs font-bold text-success hover:bg-success transition-colors"
          >
            <PlayIcon className="h-4 w-4" />
            {isEn ? "Resume" : "تشغيل"}
          </button>
        ) : null}

        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive bg-white px-3 py-2 text-xs font-bold text-destructive hover:bg-destructive/10 transition-colors"
        >
          <TrashIcon className="h-4 w-4" />
          {isEn ? "Delete" : "حذف"}
        </button>
      </div>
    </div>
  );
};
