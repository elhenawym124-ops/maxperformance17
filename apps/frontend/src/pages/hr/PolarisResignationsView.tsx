import React, { useMemo, useState } from "react";
import { Plus, Search, Calendar, Calculator, CheckCircle2, XCircle, Clock, FileText, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";

export interface Resignation {
  id: string;
  resignationDate: string;
  lastWorkingDay: string;
  reason?: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    employeeNumber: string;
    position?: { title: string };
    department?: { name: string };
  };
}

export interface PolarisResignationsViewProps {
  loading: boolean;
  resignations: Resignation[];
  onOpenSettlement: (id: string) => void;
  onNavigateNew: () => void;
  onNavigateDecision: (id: string) => void;
}

export const PolarisResignationsView: React.FC<PolarisResignationsViewProps> = ({
  loading,
  resignations,
  onOpenSettlement,
  onNavigateNew,
  onNavigateDecision,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tabs = [
    { key: "all", label: "الكل", count: resignations.length },
    {
      key: "PENDING",
      label: "معلق",
      count: resignations.filter((r) => r.status === "PENDING").length,
    },
    {
      key: "APPROVED",
      label: "موافق عليه",
      count: resignations.filter((r) => r.status === "APPROVED").length,
    },
    {
      key: "COMPLETED",
      label: "مكتمل التصفية",
      count: resignations.filter((r) => r.status === "COMPLETED").length,
    },
    {
      key: "REJECTED",
      label: "مرفوض",
      count: resignations.filter((r) => r.status === "REJECTED").length,
    },
  ];

  const filteredResignations = useMemo(() => {
    return resignations.filter((r) => {
      const fullName = `${r.employee?.firstName || ""} ${r.employee?.lastName || ""}`.toLowerCase();
      const matchesSearch =
        !searchTerm ||
        fullName.includes(searchTerm.toLowerCase()) ||
        (r.employee?.employeeNumber && r.employee.employeeNumber.includes(searchTerm));
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [resignations, searchTerm, statusFilter]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 tabular-nums">
            <Clock className="h-3 w-3" />
            معلق
          </span>
        );
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 tabular-nums">
            <CheckCircle2 className="h-3 w-3" />
            موافق عليه
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20 tabular-nums">
            <CheckCircle2 className="h-3 w-3" />
            مكتمل التصفية
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 tabular-nums">
            <XCircle className="h-3 w-3" />
            مرفوض
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground border border-border/70 tabular-nums">
            {status}
          </span>
        );
    }
  };

  return (
    <div
      data-polaris-resignations-view="true"
      className="polaris-resignations-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="طلبات الاستقالة وإنهاء الخدمة"
        subtitle="متابعة طلبات الاستقالة، فترات الإخطار وإجراءات التصفية ومخالصة نهاية الخدمة"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {resignations.length} طلب
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNavigateNew}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>تقديم طلب استقالة</span>
            </Button>
          </div>
        }
      />

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = statusFilter === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusFilter(tab.key)}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? "border-[var(--petrol,#013735)] dark:border-[#3ec8b7] text-foreground font-semibold"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-border/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {typeof tab.count === "number" && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        tab.key === "PENDING" && tab.count > 0
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 font-bold"
                          : "bg-muted text-muted-foreground"
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

        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث باسم الموظف أو الرقم الوظيفي..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Resignations Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              جاري تحميل طلبات الاستقالة...
            </div>
          ) : filteredResignations.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">لا توجد طلبات استقالة مطابقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/30">
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الموظف</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">تاريخ التقديم</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">آخر يوم عمل</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">السبب</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الحالة</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-foreground py-2.5">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {filteredResignations.map((r) => (
                  <TableRow key={r.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {r.employee?.firstName?.[0] || "م"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground">
                            {r.employee?.firstName} {r.employee?.lastName}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            #{r.employee?.employeeNumber || "---"} • {r.employee?.position?.title || "موظف"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 text-xs font-mono tabular-nums text-muted-foreground">
                      {new Date(r.resignationDate).toLocaleDateString("ar-EG")}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs font-mono tabular-nums text-foreground font-medium">
                      {new Date(r.lastWorkingDay).toLocaleDateString("ar-EG")}
                    </TableCell>

                    <TableCell className="py-2.5 text-xs text-muted-foreground max-w-[160px] truncate">
                      {r.reason || "---"}
                    </TableCell>

                    <TableCell className="py-2.5">
                      {getStatusBadge(r.status)}
                    </TableCell>

                    <TableCell className="py-2.5 text-left">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenSettlement(r.id)}
                          className="h-7 px-2 text-[11px] gap-1 rounded-md border-border/80 shadow-2xs font-medium"
                          title="حساب التسوية والمخالصة"
                        >
                          <Calculator className="h-3 w-3 text-muted-foreground" />
                          <span>التسوية</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateDecision(r.id)}
                          className="h-7 px-2 text-[11px] text-primary hover:text-primary rounded-md"
                          title="تفاصيل القرار"
                        >
                          <span>القرار</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default PolarisResignationsView;
