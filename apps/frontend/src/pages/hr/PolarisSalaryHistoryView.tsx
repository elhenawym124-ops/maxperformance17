import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  RotateCcw,
  Calendar,
  User,
  ArrowRight,
  DollarSign,
  Percent,
  Search,
  Filter,
} from "lucide-react";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";

export interface SalaryHistoryItem {
  id: string;
  userId?: string;
  previousSalary: number;
  newSalary: number;
  changeType: string;
  changePercentage?: number;
  effectiveDate: string;
  reason?: string;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string | null;
  } | null;
}

interface PolarisSalaryHistoryViewProps {
  history: SalaryHistoryItem[];
  employeeId?: string;
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
}

export const PolarisSalaryHistoryView: React.FC<PolarisSalaryHistoryViewProps> = ({
  history,
  employeeId,
  loading,
  onRefresh,
  onBack,
}) => {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [search, setSearch] = useState("");

  const getChangeTypeBadge = (type: string) => {
    switch (type) {
      case "promotion":
        return <Badge variant="outline" className="bg-purple-500/10 text-primary border-primary/20 text-xs">ترقية استثنائية</Badge>;
      case "annual_increase":
        return <Badge variant="outline" className="bg-emerald-500/10 text-success border-success/20 text-xs">زيادة سنوية</Badge>;
      case "adjustment":
        return <Badge variant="outline" className="bg-blue-500/10 text-primary border-primary/20 text-xs">تعديل إداري</Badge>;
      case "demotion":
        return <Badge variant="outline" className="bg-rose-500/10 text-destructive border-destructive/20 text-xs">تخفيض درجة</Badge>;
      default:
        return <Badge variant="outline" className="bg-muted text-muted-foreground text-xs">{type}</Badge>;
    }
  };

  const stats = useMemo(() => {
    const total = history.length;
    const increases = history.filter(
      (h) => (h.changePercentage && h.changePercentage > 0) || h.newSalary > h.previousSalary
    ).length;
    const decreases = history.filter(
      (h) => (h.changePercentage && h.changePercentage < 0) || h.newSalary < h.previousSalary
    ).length;
    const latest = history[0]?.newSalary || 0;
    return { total, increases, decreases, latest };
  }, [history]);

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesType = selectedType === "ALL" || item.changeType === selectedType;
      const empName = item.employee
        ? `${item.employee.firstName} ${item.employee.lastName}`.toLowerCase()
        : "";
      const empNum = item.employee?.employeeNumber?.toLowerCase() || "";
      const reason = item.reason?.toLowerCase() || "";
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        empName.includes(q) ||
        empNum.includes(q) ||
        reason.includes(q);

      return matchesType && matchesSearch;
    });
  }, [history, selectedType, search]);

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="سجل تعديلات الرواتب التاريخي"
        subtitle={
          employeeId
            ? "تاريخ التغييرات والترقيات المالية التفصيلية للموظف المحدد"
            : "الأرشيف المركزي لقرارات تعديل الرواتب والترقيات المالية والتسويات الإدارية"
        }
        badges={[
          { label: `${history.length} حركة مسجلة`, variant: "default" },
          { label: `${stats.increases} زيادة مالية`, variant: "secondary" },
          ...(stats.decreases > 0
            ? [{ label: `${stats.decreases} تسوية بالإنزال`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            {employeeId && (
              <Button
                variant="outline"
                size="sm"
                onClick={onBack}
                className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
              >
                <ArrowRight className="h-3.5 w-3.5" />
                رجوع
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              تحديث
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">إجمالي الحركات</span>
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.total}
            </span>
            <span className="text-[11px] text-muted-foreground">تعديل مدقق</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">زيادات وترقيات</span>
            <ArrowUpRight className="h-4 w-4 text-success" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-success">
              {stats.increases}
            </span>
            <span className="text-[11px] text-muted-foreground">حركة</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">تخفيضات وتسويات</span>
            <ArrowDownRight className="h-4 w-4 text-destructive" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-destructive">
              {stats.decreases}
            </span>
            <span className="text-[11px] text-muted-foreground">حركة</span>
          </div>
        </Card>

        <Card className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground mb-1.5">
            <span className="text-xs font-medium">آخر راتب مسجل</span>
            <DollarSign className="h-4 w-4 text-warning" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.latest.toLocaleString()}
            </span>
            <span className="text-[11px] text-muted-foreground">ج.م</span>
          </div>
        </Card>
      </div>

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Status Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {[
              { id: "ALL", label: "كافة الحركات", count: history.length },
              { id: "promotion", label: "الترقيات الاستثنائية" },
              { id: "annual_increase", label: "الزيادات السنوية" },
              { id: "adjustment", label: "التعديلات الإدارية" },
              { id: "demotion", label: "التسويات والتخفيض" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  selectedType === tab.id
                    ? "bg-background text-foreground shadow-xs font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-border/70 bg-card">
          <div className="relative max-w-sm">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="البحث باسم الموظف أو سبب التعديل..."
              className="pe-9 h-9 text-xs rounded-xl bg-background border-border/70"
            />
          </div>
        </div>

        {/* IndexTable */}
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-medium">
                  <th className="py-2.5 px-4 font-medium">الموظف</th>
                  <th className="py-2.5 px-4 font-medium">الراتب السابق</th>
                  <th className="py-2.5 px-4 font-medium">الراتب الجديد</th>
                  <th className="py-2.5 px-4 font-medium">نسبة التغيير</th>
                  <th className="py-2.5 px-4 font-medium">نوع الحركة</th>
                  <th className="py-2.5 px-4 font-medium">تاريخ السريان</th>
                  <th className="py-2.5 px-4 font-medium">سبب التعديل</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredHistory.map((item) => {
                  const diff = item.newSalary - item.previousSalary;
                  const isPositive = diff > 0;
                  const isNegative = diff < 0;

                  return (
                    <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium text-foreground">
                          {item.employee
                            ? `${item.employee.firstName} ${item.employee.lastName}`
                            : "-"}
                        </div>
                        {item.employee?.employeeNumber && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            {item.employee.employeeNumber}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground">
                        {item.previousSalary.toLocaleString()} ج.م
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums font-semibold text-foreground">
                        {item.newSalary.toLocaleString()} ج.م
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums">
                        {isPositive && (
                          <span className="inline-flex items-center gap-0.5 text-success font-semibold">
                            <ArrowUpRight className="h-3.5 w-3.5" />
                            +{item.changePercentage ? item.changePercentage.toFixed(1) : ((diff / (item.previousSalary || 1)) * 100).toFixed(1)}%
                          </span>
                        )}
                        {isNegative && (
                          <span className="inline-flex items-center gap-0.5 text-destructive font-semibold">
                            <ArrowDownRight className="h-3.5 w-3.5" />
                            {item.changePercentage ? item.changePercentage.toFixed(1) : ((diff / (item.previousSalary || 1)) * 100).toFixed(1)}%
                          </span>
                        )}
                        {!isPositive && !isNegative && (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        {getChangeTypeBadge(item.changeType)}
                      </td>

                      <td className="py-3 px-4 font-mono tabular-nums text-muted-foreground text-[11px]">
                        {new Date(item.effectiveDate).toLocaleDateString("ar-EG")}
                      </td>

                      <td className="py-3 px-4 text-muted-foreground max-w-xs truncate">
                        {item.reason || "-"}
                      </td>
                    </tr>
                  );
                })}
                {filteredHistory.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      لا توجد حركات رواتب مسجلة
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
