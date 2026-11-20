import React, { useMemo, useState } from "react";
import { Plus, Search, Star, Calendar, User, Trash2, Edit, BarChart3 } from "lucide-react";
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

export interface PerformanceReview {
  id: string;
  reviewPeriod: string;
  overallRating: number;
  status: string;
  periodStart: string;
  periodEnd: string;
  employee?: {
    firstName?: string;
    lastName?: string;
    employeeNumber?: string;
  } | null;
  reviewer?: {
    firstName?: string;
    lastName?: string;
  } | null;
}

export interface PolarisPerformanceReviewsViewProps {
  loading: boolean;
  reviews: PerformanceReview[];
  employees: any[];
  loadingEmployees: boolean;
  onNavigateNew: (employeeId?: string) => void;
  onNavigateDetails: (id: string) => void;
  onDelete: (id: string) => void;
  getEmployeeName: (review: PerformanceReview) => string;
  getRatingColor: (rating: number) => string;
}

export const PolarisPerformanceReviewsView: React.FC<PolarisPerformanceReviewsViewProps> = ({
  loading,
  reviews,
  employees,
  loadingEmployees,
  onNavigateNew,
  onNavigateDetails,
  onDelete,
  getEmployeeName,
  getRatingColor,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const tabs = [
    { key: "all", label: "الكل", count: reviews.length },
    {
      key: "COMPLETED",
      label: "مكتمل",
      count: reviews.filter((r) => r.status === "COMPLETED").length,
    },
    {
      key: "IN_PROGRESS",
      label: "قيد المراجعة",
      count: reviews.filter((r) => r.status === "IN_PROGRESS").length,
    },
    {
      key: "DRAFT",
      label: "مسودة",
      count: reviews.filter((r) => r.status === "DRAFT").length,
    },
  ];

  const filteredReviews = useMemo(() => {
    return reviews.filter((r) => {
      const name = getEmployeeName(r).toLowerCase();
      const matchesSearch = !searchTerm || name.includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [reviews, searchTerm, statusFilter, getEmployeeName]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/10 text-success dark:text-success border border-success/20 text-xs">
            مكتمل
          </Badge>
        );
      case "IN_PROGRESS":
        return (
          <Badge className="bg-amber-500/10 text-warning dark:text-warning border border-warning/20 text-xs">
            قيد المراجعة
          </Badge>
        );
      case "DRAFT":
        return (
          <Badge className="bg-muted text-muted-foreground border border-border/70 text-xs">
            مسودة
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-xs">
            {status}
          </Badge>
        );
    }
  };

  return (
    <div
      data-polaris-performance-reviews="true"
      className="polaris-reviews-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="تقييمات الأداء"
        subtitle="تحليل وتطوير الكفاءات البشرية ومتابعة تقارير الأداء الدوري للموظفين"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {reviews.length} تقييم
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => onNavigateNew()}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إنشاء تقييم شامل</span>
            </Button>
          </div>
        }
      />

      {/* Quick Action Ribbon: Quick Employee Assessment */}
      {employees && employees.length > 0 && (
        <div className="p-3 bg-card rounded-xl border border-border/70 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-foreground">بدء تقييم فوري لموظف</p>
            <span className="text-[11px] text-muted-foreground">اختر موظفاً لإطلاق استمارة تقييمه</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {employees.filter((e) => e.hasEmployeeRecord).slice(0, 10).map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => onNavigateNew(emp.id)}
                className="shrink-0 flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/20 hover:bg-muted/50 hover:border-border transition-all active:scale-97 text-right"
              >
                <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                  {emp.firstName?.[0] || "م"}
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-foreground truncate max-w-[90px]">
                    {emp.firstName} {emp.lastName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate max-w-[90px]">
                    {emp.position?.title || "موظف"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

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
                    <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-muted text-muted-foreground font-mono tabular-nums">
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
              placeholder="ابحث بالاسم أو رقم الموظف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Table of Reviews */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              جاري تحميل تقارير الأداء...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <BarChart3 className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">لا توجد تقييمات مطابقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/30">
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الموظف</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">فترة التقييم</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-foreground py-2.5">التقييم العام</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الحالة</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-foreground py-2.5">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {filteredReviews.map((review) => (
                  <TableRow
                    key={review.id}
                    className="hover:bg-muted/40 transition-colors cursor-pointer group"
                    onClick={() => onNavigateDetails(review.id)}
                  >
                    <TableCell className="py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
                          {review.employee?.firstName?.[0] || "م"}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">
                            {getEmployeeName(review)}
                          </p>
                          <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            #{review.employee?.employeeNumber || "---"}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="space-y-0.5">
                        <div className="inline-flex items-center gap-1 text-[11px] font-medium text-foreground">
                          <Calendar className="h-3 w-3 text-muted-foreground" />
                          <span>{review.reviewPeriod}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                          {new Date(review.periodStart).toLocaleDateString("ar-EG")} - {new Date(review.periodEnd).toLocaleDateString("ar-EG")}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 text-center">
                      <div className="inline-flex items-center gap-1">
                        <Star className={`h-3.5 w-3.5 fill-current ${getRatingColor(Number(review.overallRating))}`} />
                        <span className={`text-xs font-bold font-mono tabular-nums ${getRatingColor(Number(review.overallRating))}`}>
                          {Number(review.overallRating).toFixed(1)} / 5
                        </span>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      {getStatusBadge(review.status)}
                    </TableCell>

                    <TableCell className="py-2.5 text-left" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onNavigateDetails(review.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground"
                          title="عرض التفاصيل"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDelete(review.id)}
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
                          title="حذف"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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

export default PolarisPerformanceReviewsView;
