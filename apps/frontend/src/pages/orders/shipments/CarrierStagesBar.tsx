import React from "react";
import {
  PlusCircleIcon,
  ArrowPathIcon,
  Squares2X2Icon,
  ClockIcon,
  TruckIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowUturnLeftIcon,
  TrashIcon,
  QuestionMarkCircleIcon,
  ArrowPathRoundedSquareIcon,
  BanknotesIcon,
  InboxArrowDownIcon,
  XCircleIcon,
  DocumentMinusIcon,
} from "@heroicons/react/24/outline";

export interface StageDefinition {
  key: string;
  label: string;
  countKey?: string;
  inactiveStyle: string;
  badgeStyle: string;
  activeStyle: string;
  icon: React.ElementType;
}

// Complete 14 Operational Stages matching Turbo Express & Multi-Carrier Operations
export const ALL_OPERATIONAL_STAGES: StageDefinition[] = [
  {
    key: "ALL",
    label: "كل الشحنات",
    countKey: "all",
    inactiveStyle: "border-border dark:dark:border-border bg-white dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground hover:hover:bg-muted dark:hover:dark:hover:bg-muted",
    badgeStyle: "bg-muted text-foreground dark:dark:bg-muted dark:dark:text-muted-foreground",
    activeStyle: "border-border dark:border-white bg-muted dark:bg-white text-white dark:dark:text-foreground ring-2 /30/30ring-border shadow-sm",
    icon: Squares2X2Icon,
  },
  {
    key: "incomplete",
    label: "غير مكتملة",
    countKey: "incomplete",
    inactiveStyle: "border-warning dark:border-warning/80 bg-warning/80 dark:bg-warning/30 text-warning dark:text-warning hover:bg-warning/70",
    badgeStyle: "bg-warning/80 text-warning dark:bg-warning/70 dark:text-warning",
    activeStyle: "border-warning bg-warning text-white ring-2 ring-warning/40 shadow-sm",
    icon: DocumentMinusIcon,
  },
  {
    key: "turbo_sent",
    label: "قيد الإنتظار",
    countKey: "turbo_sent",
    inactiveStyle: "border-primary dark:border-primary/80 bg-primary/80 dark:bg-primary/30 text-primary dark:text-primary hover:bg-primary/70",
    badgeStyle: "bg-primary/80 text-primary dark:bg-primary/70 dark:text-primary",
    activeStyle: "border-primary bg-primary text-white ring-2 ring-primary/40 shadow-sm",
    icon: ClockIcon,
  },
  {
    key: "processing",
    label: "قيد التنفيذ",
    countKey: "processing",
    inactiveStyle: "border-primary dark:border-primary/80 bg-primary/80 dark:bg-primary/30 text-primary dark:text-primary hover:bg-primary/70",
    badgeStyle: "bg-primary/80 text-primary dark:bg-primary/70 dark:text-primary",
    activeStyle: "border-primary bg-primary text-white ring-2 ring-primary/40 shadow-sm",
    icon: ArrowPathIcon,
  },
  {
    key: "out_for_delivery",
    label: "مسلمة للمندوب",
    countKey: "out_for_delivery",
    inactiveStyle: "border-primary dark:border-primary/80 bg-primary/80 dark:bg-primary/30 text-primary dark:text-primary hover:bg-primary/70",
    badgeStyle: "bg-primary/80 text-primary dark:bg-primary/70 dark:text-primary",
    activeStyle: "border-primary bg-primary text-white ring-2 ring-primary/40 shadow-sm",
    icon: TruckIcon,
  },
  {
    key: "delayed",
    label: "مؤجلة مع المندوب",
    countKey: "delayed",
    inactiveStyle: "border-warning dark:border-warning bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning hover:bg-warning/80 font-bold",
    badgeStyle: "bg-warning text-warning dark:bg-warning/80 dark:text-warning",
    activeStyle: "border-warning bg-warning text-foreground ring-2 ring-warning/40 shadow-sm",
    icon: ExclamationTriangleIcon,
  },
  {
    key: "delivered",
    label: "تم التسليم",
    countKey: "delivered",
    inactiveStyle: "border-success dark:border-success/80 bg-success/80 dark:bg-success/30 text-success dark:text-success hover:bg-success/70 font-semibold",
    badgeStyle: "bg-success/80 text-success dark:bg-success/70 dark:text-success",
    activeStyle: "border-success bg-success text-white ring-2 ring-success/40 shadow-sm",
    icon: CheckCircleIcon,
  },
  {
    key: "returned_to_company",
    label: "مرتجعات في الشركة",
    countKey: "returned_to_company",
    inactiveStyle: "border-destructive dark:border-destructive/80 bg-destructive/80 dark:bg-destructive/30 text-destructive dark:text-destructive hover:bg-destructive/70 font-semibold",
    badgeStyle: "bg-destructive/80 text-destructive dark:bg-destructive/70 dark:text-destructive",
    activeStyle: "border-destructive bg-destructive text-white ring-2 ring-destructive/40 shadow-sm",
    icon: ArrowUturnLeftIcon,
  },
  {
    key: "returned_destroyed",
    label: "مرتجعات معدومة",
    countKey: "returned_destroyed",
    inactiveStyle: "border-destructive dark:border-destructive/80 bg-destructive/80 dark:bg-destructive/30 text-destructive dark:text-destructive hover:bg-destructive/70",
    badgeStyle: "bg-destructive/80 text-destructive dark:bg-destructive/70 dark:text-destructive",
    activeStyle: "border-destructive bg-destructive text-white ring-2 ring-destructive/40 shadow-sm",
    icon: TrashIcon,
  },
  {
    key: "returned_missing",
    label: "مرتجعات مفقودة",
    countKey: "returned_missing",
    inactiveStyle: "border-warning dark:border-warning/80 bg-warning/80 dark:bg-warning/30 text-warning dark:text-warning hover:bg-warning/70",
    badgeStyle: "bg-warning/80 text-warning dark:bg-warning/70 dark:text-warning",
    activeStyle: "border-warning bg-warning text-white ring-2 ring-warning/40 shadow-sm",
    icon: QuestionMarkCircleIcon,
  },
  {
    key: "returned_resent",
    label: "معاد ارسالها",
    countKey: "returned_resent",
    inactiveStyle: "border-info dark:border-info/80 bg-info/80 dark:bg-info/30 text-info dark:text-info hover:bg-info/70",
    badgeStyle: "bg-info/80 text-info dark:bg-info/70 dark:text-info",
    activeStyle: "border-info bg-info text-white ring-2 ring-info/40 shadow-sm",
    icon: ArrowPathRoundedSquareIcon,
  },
  {
    key: "remitted",
    label: "تم التوريد",
    countKey: "remitted",
    inactiveStyle: "border-success dark:border-success/80 bg-success/80 dark:bg-success/50 text-success dark:text-success hover:bg-success/80 font-bold",
    badgeStyle: "bg-success/80 text-success dark:bg-success/80 dark:text-success",
    activeStyle: "border-success bg-success text-white ring-2 ring-success/40 shadow-sm",
    icon: BanknotesIcon,
  },
  {
    key: "returned_received",
    label: "مرتجعات وصلتني",
    countKey: "returned_received",
    inactiveStyle: "border-primary dark:border-primary/80 bg-primary/80 dark:bg-primary/30 text-primary dark:text-primary hover:bg-primary/70 font-semibold",
    badgeStyle: "bg-primary/80 text-primary dark:bg-primary/70 dark:text-primary",
    activeStyle: "border-primary bg-primary text-white ring-2 ring-primary/40 shadow-sm",
    icon: InboxArrowDownIcon,
  },
  {
    key: "cancelled",
    label: "ملغي",
    countKey: "cancelled",
    inactiveStyle: "border-border dark:dark:border-border /80/80bg-muted dark:dark:bg-muted text-foreground dark:dark:text-muted-foreground hover:hover:bg-muted",
    badgeStyle: "bg-muted text-foreground dark:dark:bg-muted dark:dark:text-muted-foreground",
    activeStyle: "border-border bg-muted text-white ring-2 /40/40ring-border shadow-sm",
    icon: XCircleIcon,
  },
];

interface CarrierStagesBarProps {
  carrierType?: string;
  selectedStage: string;
  onSelectStage: (stageKey: string) => void;
  stageCounts?: Record<string, number>;
  onOpenCreateShipment: () => void;
  onLiveSync?: () => void;
  isLiveSyncing?: boolean;
}

export const CarrierStagesBar: React.FC<CarrierStagesBarProps> = ({
  selectedStage,
  onSelectStage,
  stageCounts = {},
  onOpenCreateShipment,
  onLiveSync,
  isLiveSyncing = false,
}) => {
  return (
    <div className="w-full space-y-2.5 pb-1">
      {/* Top Controls: Quick Actions + Status Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Squares2X2Icon className="h-4 w-4 text-primary" />
            <span>حالات ومراحل الشحنات التشغيلية</span>
          </span>
          <span className="text-[11px] text-muted-foreground/80 hidden sm:inline">
            (تصفية فورية حسب مرحلة التوصيل في شركة الشحن)
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Quick Action: Live Sync */}
          {onLiveSync && (
            <button
              type="button"
              onClick={onLiveSync}
              disabled={isLiveSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-primary hover:bg-primary text-white shadow-xs transition active:scale-95 disabled:opacity-50"
              title="تحديث ومزامنة الحالات الحية لجميع الشحنات من شركة الشحن"
            >
              <ArrowPathIcon className={`h-3.5 w-3.5 ${isLiveSyncing ? "animate-spin" : ""}`} />
              <span>{isLiveSyncing ? "جاري التحديث..." : "مزامنة سريعة"}</span>
            </button>
          )}

          {/* Quick Action: Add Shipment */}
          <button
            type="button"
            onClick={onOpenCreateShipment}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-success hover:bg-success text-white shadow-xs transition active:scale-95"
            title="إضافة وتوجيه شحنة لشركة الشحن"
          >
            <PlusCircleIcon className="h-3.5 w-3.5" />
            <span>إضافة شحنة</span>
          </button>
        </div>
      </div>

      {/* Complete Stages Ribbon (Wrapped, High-Visibility, Color-Coded) */}
      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
        {ALL_OPERATIONAL_STAGES.map((stage) => {
          const isSelected = selectedStage === stage.key;
          const count = stage.countKey ? stageCounts[stage.countKey] : stageCounts[stage.key];
          const displayCount = count !== undefined ? count : 0;
          const IconComp = stage.icon;

          return (
            <button
              key={stage.key}
              type="button"
              onClick={() => onSelectStage(stage.key)}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5 border active:scale-95 ${
                isSelected
                  ? stage.activeStyle
                  : `${stage.inactiveStyle} border`
              }`}
            >
              <IconComp className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-white dark:dark:text-foreground" : "opacity-80"}`} />
              <span className="font-semibold whitespace-nowrap">{stage.label}</span>

              {/* High-visibility Counter Badge */}
              <span
                className={`font-mono text-[11px] tabular-nums px-1.5 py-0.2 rounded-full font-bold ${
                  isSelected
                    ? "bg-white/25 text-white dark:bg-black/20 dark:dark:text-foreground"
                    : stage.badgeStyle
                }`}
              >
                {displayCount}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
