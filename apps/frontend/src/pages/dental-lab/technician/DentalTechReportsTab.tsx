import React, { useState, useMemo } from "react";
import { BarChart3, Printer, CheckCircle2, Zap, AlertTriangle, Layers } from "lucide-react";
import { MyCase, MyWage, fmtDate, fmtMoney } from "../shared";

interface DentalTechReportsTabProps {
  wage: MyWage | null;
  overdueCases: MyCase[];
}

export const DentalTechReportsTab: React.FC<DentalTechReportsTabProps> = ({
  wage,
  overdueCases,
}) => {
  const [reportPeriod, setReportPeriod] = useState<"TODAY" | "7DAYS" | "MONTH" | "ALL">("MONTH");

  const safeStages = useMemo(
    () => (Array.isArray(wage?.recentStages) ? wage.recentStages : []),
    [wage?.recentStages]
  );
  const safeOverdue = useMemo(
    () => (Array.isArray(overdueCases) ? overdueCases : []),
    [overdueCases]
  );

  const reportFilteredStages = useMemo(() => {
    if (reportPeriod === "ALL") return safeStages;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return safeStages.filter((st) => {
      const t = st.completedAt ? new Date(st.completedAt).getTime() : 0;
      if (reportPeriod === "TODAY") return t >= todayStart;
      if (reportPeriod === "7DAYS") return t >= sevenDaysAgo;
      if (reportPeriod === "MONTH") return t >= monthStart;
      return true;
    });
  }, [safeStages, reportPeriod]);

  const reportStats = useMemo(() => {
    const totalEarned = reportFilteredStages.reduce((sum, s) => sum + (s.wageAmount || 0), 0);
    const uniqueCases = new Set(reportFilteredStages.map((s) => s.caseId)).size;
    return {
      stagesCount: reportFilteredStages.length,
      casesCount: uniqueCases,
      totalEarned,
      overdueCount: safeOverdue.length,
    };
  }, [reportFilteredStages, safeOverdue]);

  return (
    <div className="space-y-4">
      {/* Report Header & Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-border dark:border-border">
        <div>
          <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <span>تقرير الإنتاجية والأداء الفني</span>
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            كشف تحليلي بالمراحل المنجزة، الحالات المنتجة، والأجور المستحقة عن الفترة
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period selector */}
          <div className="flex items-center gap-1 bg-muted dark:bg-muted p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setReportPeriod("TODAY")}
              className={`px-2.5 py-1 rounded-lg transition ${
                reportPeriod === "TODAY"
                  ? "bg-card text-primary shadow-xs"
                  : "text-gray-600 dark:text-muted-foreground"
              }`}
            >
              اليوم
            </button>
            <button
              onClick={() => setReportPeriod("7DAYS")}
              className={`px-2.5 py-1 rounded-lg transition ${
                reportPeriod === "7DAYS"
                  ? "bg-card text-primary shadow-xs"
                  : "text-gray-600 dark:text-muted-foreground"
              }`}
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => setReportPeriod("MONTH")}
              className={`px-2.5 py-1 rounded-lg transition ${
                reportPeriod === "MONTH"
                  ? "bg-card text-primary shadow-xs"
                  : "text-gray-600 dark:text-muted-foreground"
              }`}
            >
              هذا الشهر
            </button>
            <button
              onClick={() => setReportPeriod("ALL")}
              className={`px-2.5 py-1 rounded-lg transition ${
                reportPeriod === "ALL"
                  ? "bg-card text-primary shadow-xs"
                  : "text-gray-600 dark:text-muted-foreground"
              }`}
            >
              الكل
            </button>
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            className="p-2 rounded-xl border border-border dark:border-border bg-card text-muted-foreground hover:bg-muted text-xs flex items-center gap-1 shadow-xs"
            title="طباعة التقرير"
          >
            <Printer className="w-4 h-4" />
            <span className="hidden sm:inline">طباعة</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Report */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-xs text-muted-foreground">المراحل المنفذة للفترة</span>
          <p className="text-xl font-bold text-foreground mt-1">{reportStats.stagesCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-xs text-muted-foreground">عدد الحالات المشمولة</span>
          <p className="text-xl font-bold text-foreground mt-1">{reportStats.casesCount}</p>
        </div>
        <div className="p-3.5 rounded-xl border border-success dark:border-success bg-success/50 dark:bg-success/20">
          <span className="text-xs text-success dark:text-success font-semibold">أجر الإنتاج للفترة</span>
          <p className="text-xl font-black text-success dark:text-success mt-1">
            +{fmtMoney(reportStats.totalEarned)} <span className="text-xs">ج.م</span>
          </p>
        </div>
        <div className="p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted">
          <span className="text-xs text-muted-foreground">المتأخرات الحالية</span>
          <p
            className={`text-xl font-bold mt-1 ${
              reportStats.overdueCount > 0 ? "text-rose-600 font-black" : "text-foreground"
            }`}
          >
            {reportStats.overdueCount}
          </p>
        </div>
      </div>

      {/* Detailed List */}
      <div className="border border-border dark:border-border rounded-xl overflow-hidden bg-white dark:bg-muted shadow-xs">
        <div className="p-3.5 bg-muted dark:bg-muted border-b border-border dark:border-border flex items-center justify-between text-xs">
          <span className="font-bold text-foreground dark:text-muted-foreground">بيان تفصيلي ببنود الإنتاج المنفذة</span>
          <span className="text-gray-500">عدد البنود: {reportFilteredStages.length}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="text-gray-500 border-b border-border dark:border-border bg-muted dark:bg-muted">
              <tr>
                <th className="py-2.5 px-3">التاريخ</th>
                <th className="py-2.5 px-3">رقم الحالة</th>
                <th className="py-2.5 px-3">المرحلة</th>
                <th className="py-2.5 px-3">نوع الشغل</th>
                <th className="py-2.5 px-3">الطبيب</th>
                <th className="py-2.5 px-3 text-left">الأجر المستحق</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {reportFilteredStages.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-muted-foreground">
                    لا توجد بنود عمل مسجلة في الفترة المحددة
                  </td>
                </tr>
              ) : (
                reportFilteredStages.map((st) => (
                  <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                    <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(st.completedAt)}</td>
                    <td className="py-2.5 px-3 font-mono font-bold">#{st.caseNumber}</td>
                    <td className="py-2.5 px-3 font-semibold text-foreground">{st.stageName}</td>
                    <td className="py-2.5 px-3 text-foreground dark:text-muted-foreground">{st.workTypeName || "—"}</td>
                    <td className="py-2.5 px-3 text-foreground dark:text-muted-foreground">{st.doctorName || "—"}</td>
                    <td className="py-2.5 px-3 text-left font-bold text-success dark:text-success">
                      +{fmtMoney(st.wageAmount)} ج.م
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DentalTechReportsTab;
