import {
  BadgePercent,
  Banknote,
  Clock,
  FileSpreadsheet,
  KeyRound,
  Layers,
  Receipt,
  Wallet,
} from "lucide-react";
import type { DentalLabDoctorDetail } from "../../shared";
import { fmtMoney } from "../../shared";
import type { DetailTab } from "../types/doctorDetailTypes";

export interface DoctorDetailKpiCardsProps {
  doctor: DentalLabDoctorDetail;
  activeTab: DetailTab;
  onTabChange: (tab: DetailTab) => void;
}

export function DoctorDetailKpiCards({
  doctor,
  activeTab,
  onTabChange,
}: DoctorDetailKpiCardsProps) {
  const tabs = [
    { id: "cases", label: "حالات الطبيب", icon: Layers, count: doctor.casesCount },
    { id: "invoices", label: "الفواتير والمدفوعات", icon: Receipt, count: doctor.invoicesCount },
    { id: "statement", label: "كشف الحساب", icon: FileSpreadsheet },
    { id: "pricing", label: "التسعير المخصص", icon: BadgePercent },
    { id: "portal", label: "بوابة الطبيب والحساب", icon: KeyRound },
  ];

  return (
    <div className="space-y-4">
      {/* 4 Financial & Operational Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Outstanding Balance */}
        <div className="bg-card rounded-xl border dark:border-border p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              الرصيد المتبقي (المديونية)
            </span>
            <Wallet className="w-4 h-4 text-destructive" />
          </div>
          <p
            className={`text-lg sm:text-2xl font-black mt-1.5 font-mono tabular-nums ${
              (doctor.outstanding ?? 0) > 0 ? "text-red-600 dark:text-destructive" : "text-emerald-600"
            }`}
          >
            {fmtMoney(doctor.outstanding ?? 0)}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </p>
          <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              حد الائتمان: {doctor.creditLimit ? `${fmtMoney(doctor.creditLimit)} ج.م` : "غير محدد"}
            </span>
            {doctor.creditExceeded && (
              <span className="text-red-600 dark:text-destructive font-bold bg-destructive/10 dark:bg-destructive/40 px-1.5 py-0.5 rounded">
                تجاوز الحد!
              </span>
            )}
          </div>
        </div>

        {/* Card 2: Total Invoiced */}
        <div className="bg-card rounded-xl border dark:border-border p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              إجمالي المسحوبات (الفوترة)
            </span>
            <Receipt className="w-4 h-4 text-primary" />
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1.5 text-foreground font-mono tabular-nums">
            {fmtMoney(doctor.totalBilled ?? 0)}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground font-mono tabular-nums">
            {doctor.invoicesCount ?? 0} فواتير مسجلة
          </p>
        </div>

        {/* Card 3: Total Paid */}
        <div className="bg-card rounded-xl border dark:border-border p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              إجمالي المدفوعات (المحصل)
            </span>
            <Banknote className="w-4 h-4 text-success" />
          </div>
          <p className="text-lg sm:text-2xl font-black mt-1.5 text-success dark:text-success font-mono tabular-nums">
            {fmtMoney(doctor.totalPaid ?? 0)}{" "}
            <span className="text-xs font-normal font-sans">ج.م</span>
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground font-mono tabular-nums">
            نسبة التحصيل:{" "}
            {(doctor.totalBilled ?? 0) > 0
              ? `${Math.round(((doctor.totalPaid ?? 0) / (doctor.totalBilled || 1)) * 100)}%`
              : "100%"}
          </p>
        </div>

        {/* Card 4: Cases Status */}
        <div className="bg-card rounded-xl border dark:border-border p-3.5 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground font-medium">
              حالات الطبيب
            </span>
            <Layers className="w-4 h-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2 mt-1.5">
            <span className="text-lg sm:text-2xl font-black text-foreground font-mono tabular-nums">
              {doctor.activeCases ?? 0}
            </span>
            <span className="text-xs text-primary font-semibold">حالة شغالة</span>
            <span className="text-xs text-muted-foreground font-mono tabular-nums">
              / {doctor.casesCount ?? 0} إجمالي
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between text-[11px]">
            <span className="text-emerald-600 font-medium font-mono tabular-nums">
              {doctor.completedCases ?? 0} منتهية
            </span>
            {(doctor.overdueCases ?? 0) > 0 ? (
              <span className="text-red-600 font-bold flex items-center gap-1 font-mono tabular-nums">
                <Clock className="w-3 h-3" />
                {doctor.overdueCases} متأخرة
              </span>
            ) : (
              <span className="text-gray-400">لا يوجد تأخير</span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="border-b dark:border-border">
        <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto no-scrollbar pb-px">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id as DetailTab)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-all touch-manipulation min-h-[44px] ${
                  active
                    ? "border-blue-600 text-primary dark:text-primary bg-primary/50 dark:bg-primary/20"
                    : "border-transparent text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:border-border"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{tab.label}</span>
                {typeof tab.count === "number" && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold font-mono tabular-nums ${
                      active
                        ? "bg-blue-100 dark:bg-primary text-primary dark:text-primary"
                        : "bg-gray-100 dark:bg-muted text-foreground dark:text-muted-foreground"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default DoctorDetailKpiCards;
