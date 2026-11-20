import React, { useState, useMemo } from "react";
import {
  ArrowRight,
  Save,
  AlertTriangle,
  Search,
  Filter,
  DollarSign,
  History,
  Building2,
  CheckCircle,
} from "lucide-react";
import { ShopifyPageHeader } from "../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import { SalaryHistoryTable } from "./SalaryHistoryTable";

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  employeeNumber: string;
  baseSalary: string;
  department: { name: string } | null;
  position: { title: string } | null;
  contractType: string;
  status: string;
}

interface PolarisSalaryUpdatesViewProps {
  employees: Employee[];
  departments: any[];
  updates: Record<string, string>;
  reasons: Record<string, string>;
  saving: boolean;
  historyLoading: boolean;
  salaryHistory: any[];
  onSalaryChange: (id: string, value: string) => void;
  onReasonChange: (id: string, value: string) => void;
  onSave: () => void;
  onBackToPayroll: () => void;
  isSameSalary: (a: unknown, b: unknown) => boolean;
}

export const PolarisSalaryUpdatesView: React.FC<PolarisSalaryUpdatesViewProps> = ({
  employees,
  departments,
  updates,
  reasons,
  saving,
  historyLoading,
  salaryHistory,
  onSalaryChange,
  onReasonChange,
  onSave,
  onBackToPayroll,
  isSameSalary,
}) => {
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [selectedTab, setSelectedTab] = useState<"all" | "changed" | "unchanged" | "history">("all");

  const changedEmployees = useMemo(() => {
    return employees.filter(
      (e) => updates[e.id] !== undefined && !isSameSalary(updates[e.id], e.baseSalary)
    );
  }, [employees, updates, isSameSalary]);

  const changedCount = changedEmployees.length;
  const hasChanges = changedCount > 0;

  const filteredEmployees = useMemo(() => {
    let result = [...employees];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (e) =>
          (e.firstName || "").toLowerCase().includes(q) ||
          (e.lastName || "").toLowerCase().includes(q) ||
          (e.employeeNumber || "").includes(q)
      );
    }

    if (departmentFilter !== "all") {
      result = result.filter((e) => e.department?.name === departmentFilter);
    }

    if (selectedTab === "changed") {
      result = result.filter(
        (e) => updates[e.id] !== undefined && !isSameSalary(updates[e.id], e.baseSalary)
      );
    } else if (selectedTab === "unchanged") {
      result = result.filter(
        (e) => updates[e.id] === undefined || isSameSalary(updates[e.id], e.baseSalary)
      );
    }

    return result;
  }, [employees, search, departmentFilter, selectedTab, updates, isSameSalary]);

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="تعديل الرواتب الأساسية للموظفين"
        subtitle="التعديل الجماعي السريع لسلّم الرواتب الأساسية مع توثيق أسباب التعديل وتتبع الأرشيف التاريخي"
        badges={[
          { label: `${employees.length} موظف نشط`, variant: "default" },
          ...(hasChanges
            ? [{ label: `${changedCount} تعديل بانتظار الحفظ`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onBackToPayroll}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <ArrowRight className="h-3.5 w-3.5" />
              الرجوع للرواتب
            </Button>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!hasChanges || saving}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs disabled:opacity-50"
            >
              <Save className={`h-3.5 w-3.5 ${saving ? "animate-spin" : ""}`} />
              <span>{saving ? "جاري الحفظ..." : "حفظ التعديلات"}</span>
            </Button>
          </div>
        }
      />

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Status Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            <button
              onClick={() => setSelectedTab("all")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "all"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span>كافة الموظفين</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {employees.length}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab("changed")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "changed"
                  ? "bg-background text-amber-600 shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-amber-600 hover:bg-background/50"
              }`}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>التعديلات الجارية</span>
              {changedCount > 0 && (
                <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-500/10 text-amber-600 font-bold">
                  {changedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setSelectedTab("unchanged")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "unchanged"
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-background/50"
              }`}
            >
              <span>الرواتب الثابتة</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {employees.length - changedCount}
              </span>
            </button>
            <button
              onClick={() => setSelectedTab("history")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                selectedTab === "history"
                  ? "bg-background text-primary shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-primary hover:bg-background/50"
              }`}
            >
              <History className="h-3.5 w-3.5" />
              <span>سجل التعديلات السابقة</span>
              <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                {salaryHistory.length}
              </span>
            </button>
          </div>
        </div>

        {selectedTab !== "history" ? (
          <>
            {/* Filter and Search Bar */}
            <div className="p-3 border-b border-border/70 bg-card flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="البحث بالاسم أو الرقم الوظيفي..."
                  className="pr-9 h-9 text-xs rounded-xl bg-background border-border/70"
                />
              </div>

              <div className="flex items-center gap-2">
                <div className="w-48">
                  <Select
                    value={departmentFilter}
                    onValueChange={(val) => setDepartmentFilter(val || "all")}
                  >
                    <SelectTrigger className="h-9 text-xs rounded-xl border-border/70 bg-background">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Filter className="h-3.5 w-3.5" />
                        <SelectValue placeholder="كافة الأقسام" />
                      </div>
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="all">كافة الأقسام</SelectItem>
                      {departments.map((d: any) => (
                        <SelectItem key={d.id} value={d.name}>
                          {d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Table Section */}
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className="border-b border-border/70 bg-muted/30 text-muted-foreground font-medium">
                      <th className="py-2.5 px-4 font-medium">الموظف</th>
                      <th className="py-2.5 px-4 font-medium">القسم والمنصب</th>
                      <th className="py-2.5 px-4 font-medium">نوع العقد</th>
                      <th className="py-2.5 px-4 font-medium">الحالة</th>
                      <th className="py-2.5 px-4 font-medium w-48">الراتب الأساسي (ج.م)</th>
                      <th className="py-2.5 px-4 font-medium w-64">سبب التعديل</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {filteredEmployees.map((employee) => {
                      const currentSalary =
                        updates[employee.id] !== undefined
                          ? updates[employee.id]
                          : employee.baseSalary || "";
                      const isChanged =
                        updates[employee.id] !== undefined &&
                        !isSameSalary(updates[employee.id], employee.baseSalary);

                      return (
                        <tr
                          key={employee.id}
                          className={`hover:bg-muted/30 transition-colors ${
                            isChanged ? "bg-amber-500/[0.04]" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="font-medium text-foreground">
                              {employee.firstName} {employee.lastName}
                            </div>
                            <span className="text-[11px] font-mono text-muted-foreground">
                              {employee.employeeNumber}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-muted-foreground">
                            <div>{employee.department?.name || "-"}</div>
                            <div className="text-[11px] text-muted-foreground/80">
                              {employee.position?.title || ""}
                            </div>
                          </td>

                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-[11px] bg-muted/40 font-mono">
                              {employee.contractType || "-"}
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <Badge
                              variant="outline"
                              className="text-[11px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            >
                              نشط
                            </Badge>
                          </td>

                          <td className="py-3 px-4">
                            <Input
                              type="number"
                              value={currentSalary}
                              onChange={(e) => onSalaryChange(employee.id, e.target.value)}
                              className={`h-8 text-xs font-mono tabular-nums rounded-lg ${
                                isChanged
                                  ? "border-amber-500 bg-amber-500/10 font-bold text-foreground"
                                  : "border-border/70 bg-background"
                              }`}
                            />
                          </td>

                          <td className="py-3 px-4">
                            <Input
                              type="text"
                              placeholder={isChanged ? "اكتب سبب التعديل..." : "-"}
                              value={reasons[employee.id] || ""}
                              onChange={(e) => onReasonChange(employee.id, e.target.value)}
                              disabled={!isChanged}
                              className={`h-8 text-xs rounded-lg ${
                                isChanged &&
                                (!reasons[employee.id] || reasons[employee.id].trim() === "")
                                  ? "border-amber-500 bg-amber-500/10"
                                  : "border-border/70 bg-background"
                              } disabled:opacity-40 disabled:bg-muted/20`}
                            />
                          </td>
                        </tr>
                      );
                    })}
                    {filteredEmployees.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-muted-foreground">
                          لا يوجد موظفون مطابقون لشروط البحث
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </>
        ) : (
          <CardContent className="p-4 sm:p-6 [&>div.rounded-md]:border-0 [&>div.rounded-md]:p-0">
            <SalaryHistoryTable
              salaryHistory={salaryHistory}
              historyLoading={historyLoading}
            />
          </CardContent>
        )}
      </Card>
    </div>
  );
};
