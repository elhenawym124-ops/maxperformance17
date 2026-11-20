import React from "react";
import { Download, RefreshCw, BarChart3, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs } from "@/components/ui/tabs";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  AttendanceReportTab,
  LeavesReportTab,
  PayrollReportTab,
  WarningsReportTab,
  TrainingReportTab,
  PerformanceReportTab,
  KpiReportTab,
  LateAbsenceReportTab,
  OvertimeReportTab,
  TurnoverReportTab,
  EmployeeDemographicsTab,
} from "./hr-reports/index";

export interface PolarisHRReportsViewProps {
  loading: boolean;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  selectedMonth: string;
  setSelectedMonth: (month: string) => void;
  selectedYear: string;
  setSelectedYear: (year: string) => void;
  attendanceReport: any;
  leaveReport: any;
  payrollReport: any;
  warningReport: any;
  trainingReport: any;
  performanceReport: any;
  fetchReport: () => void;
  handleExport: () => void;
}

export const PolarisHRReportsView: React.FC<PolarisHRReportsViewProps> = ({
  loading,
  activeTab,
  setActiveTab,
  selectedMonth,
  setSelectedMonth,
  selectedYear,
  setSelectedYear,
  attendanceReport,
  leaveReport,
  payrollReport,
  warningReport,
  trainingReport,
  performanceReport,
  fetchReport,
  handleExport,
}) => {
  const tabs = [
    { key: "attendance", label: "الحضور والانصراف" },
    { key: "leaves", label: "الإجازات" },
    { key: "payroll", label: "الرواتب والأجور" },
    { key: "warnings", label: "الإنذارات" },
    { key: "training", label: "التدريب" },
    { key: "performance", label: "تقييم الأداء" },
    { key: "kpi", label: "المؤشرات الرئيسية (KPIs)" },
    { key: "late-absence", label: "التأخير والغياب" },
    { key: "overtime", label: "الإضافي" },
    { key: "turnover", label: "معدل الدوران" },
    { key: "demographics", label: "التركيبة الوظيفية" },
  ];

  return (
    <div
      data-polaris-hr-reports-view="true"
      className="polaris-reports-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="تقارير الموارد البشرية والذكاء الإداري"
        subtitle={`التحليلات والمؤشرات الإحصائية الشاملة لقوة العمل (${selectedMonth}/${selectedYear})`}
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {tabs.length} مجالات تقارير
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1.5 bg-card p-1 rounded-lg border border-border/70 shadow-2xs">
              <Select value={selectedMonth} onValueChange={(val) => setSelectedMonth(val || "all")}>
                <SelectTrigger className="w-[105px] h-7 text-xs bg-transparent border-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الشهور</SelectItem>
                  {[
                    "يناير", "فبراير", "مارس", "إبريل", "مايو", "يونيو",
                    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
                  ].map((m, idx) => (
                    <SelectItem key={idx + 1} value={String(idx + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-4 w-px bg-border/70" />

              <Select value={selectedYear} onValueChange={(val) => setSelectedYear(val || "2026")}>
                <SelectTrigger className="w-[85px] h-7 text-xs bg-transparent border-0 shadow-none focus:ring-0 font-mono tabular-nums">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026, 2027].map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={handleExport}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-muted-foreground" />
              <span>تصدير التقرير</span>
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={fetchReport}
              disabled={loading}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">تحديث</span>
            </Button>
          </div>
        }
      />

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Reporting Domain Tabs */}
        <div className="flex items-center border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                }`}
              >
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 3. Report Contents Area */}
        <div className="p-4 sm:p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <AttendanceReportTab
              loading={loading}
              attendanceReport={attendanceReport}
            />
            <LeavesReportTab loading={loading} leaveReport={leaveReport} />
            <PayrollReportTab
              loading={loading}
              payrollReport={payrollReport}
            />
            <WarningsReportTab
              loading={loading}
              warningReport={warningReport}
            />
            <TrainingReportTab
              loading={loading}
              trainingReport={trainingReport}
            />
            <PerformanceReportTab
              loading={loading}
              performanceReport={performanceReport}
            />
            <KpiReportTab />
            <LateAbsenceReportTab />
            <OvertimeReportTab />
            <TurnoverReportTab />
            <EmployeeDemographicsTab />
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PolarisHRReportsView;
