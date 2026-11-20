import React, { useState } from "react";
import { Plus, Search, BarChart3, GraduationCap, Calendar, Clock, Award, DollarSign } from "lucide-react";
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

export interface TrainingItem {
  id: string;
  trainingName: string;
  provider?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  status: string;
  cost?: number;
  duration?: number;
  score?: number;
  employee?: {
    id: string;
    firstName: string;
    lastName: string;
    employeeNumber?: string;
  } | null;
}

export interface PolarisTrainingViewProps {
  loading: boolean;
  trainings: TrainingItem[];
  filteredTrainings: TrainingItem[];
  selectedStatus: string;
  setSelectedStatus: (s: string) => void;
  searchQuery: string;
  setSearchQuery: (s: string) => void;
  stats: {
    total: number;
    ongoing: number;
    completed: number;
    totalCost: number;
    avgScore: number;
  };
  onNavigateNew: () => void;
}

export const PolarisTrainingView: React.FC<PolarisTrainingViewProps> = ({
  loading,
  filteredTrainings,
  selectedStatus,
  setSelectedStatus,
  searchQuery,
  setSearchQuery,
  stats,
  onNavigateNew,
}) => {
  const [showStats, setShowStats] = useState(false);

  const tabs = [
    { key: "ALL", label: "الكل", count: stats.total },
    { key: "ONGOING", label: "قيد التنفيذ", count: stats.ongoing },
    { key: "COMPLETED", label: "مكتمل", count: stats.completed },
    { key: "PLANNED", label: "مخطط" },
    { key: "CANCELLED", label: "ملغي" },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ONGOING":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-xs">
            قيد التنفيذ
          </Badge>
        );
      case "COMPLETED":
        return (
          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs">
            مكتمل
          </Badge>
        );
      case "PLANNED":
        return (
          <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-xs">
            مخطط
          </Badge>
        );
      case "CANCELLED":
        return (
          <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs">
            ملغي
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
      data-polaris-training-view="true"
      className="polaris-training-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="البرامج والدورات التدريبية"
        subtitle="تطوير مهارات الفريق، تتبع البرامج التدريبية ومعدلات الإنجاز وتقييمات المتدربين"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {stats.total} دورة تدريبية
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowStats(!showStats)}
              className={`gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 transition-all active:scale-95 shadow-2xs ${
                showStats ? "bg-primary/10 border-primary text-primary" : "bg-card text-foreground"
              }`}
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>الإحصائيات</span>
            </Button>

            <Button
              size="sm"
              onClick={onNavigateNew}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة برنامج تدريبي</span>
            </Button>
          </div>
        }
      />

      {/* Collapsible Telemetry Row */}
      {showStats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 motion-safe:animate-fade-in">
          <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs">
            <p className="text-xs text-muted-foreground">قيد التنفيذ</p>
            <p className="text-lg font-bold font-mono tabular-nums text-blue-600 mt-1">{stats.ongoing}</p>
          </div>
          <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs">
            <p className="text-xs text-muted-foreground">مكتمل</p>
            <p className="text-lg font-bold font-mono tabular-nums text-emerald-600 mt-1">{stats.completed}</p>
          </div>
          <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs">
            <p className="text-xs text-muted-foreground">التكلفة الإجمالية</p>
            <p className="text-lg font-bold font-mono tabular-nums text-foreground mt-1">
              {stats.totalCost.toLocaleString()} ج.م
            </p>
          </div>
          <div className="p-3 rounded-xl border border-border/70 bg-card shadow-xs">
            <p className="text-xs text-muted-foreground">متوسط التقييم</p>
            <p className="text-lg font-bold font-mono tabular-nums text-amber-600 mt-1">{stats.avgScore}%</p>
          </div>
        </div>
      )}

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Segmented Status Tabs */}
        <div className="flex items-center justify-between border-b border-border/70 px-3 overflow-x-auto scrollbar-none bg-card">
          <div className="flex items-center">
            {tabs.map((tab) => {
              const isActive = selectedStatus === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setSelectedStatus(tab.key)}
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
              placeholder="ابحث باسم الدورة، المدرب، أو الموظف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Training Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              جاري تحميل البرامج التدريبية...
            </div>
          ) : filteredTrainings.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">لا توجد دورات تدريبية مطابقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b border-border/70 bg-muted/30">
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الدورة التدريبية</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الموظف</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-foreground py-2.5">الفترة</TableHead>
                  <TableHead className="text-center text-xs font-semibold text-foreground py-2.5">الحالة</TableHead>
                  <TableHead className="text-left text-xs font-semibold text-foreground py-2.5">التكلفة / النتيجة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border/60">
                {filteredTrainings.map((t) => (
                  <TableRow key={t.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="py-2.5">
                      <div>
                        <p className="text-xs font-semibold text-foreground">{t.trainingName}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {t.provider || "داخلي"} {t.type ? `• ${t.type}` : ""}
                        </p>
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5">
                      {t.employee ? (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-[10px]">
                            {t.employee.firstName?.[0] || "م"}
                          </div>
                          <div>
                            <p className="text-xs font-medium text-foreground">
                              {t.employee.firstName} {t.employee.lastName}
                            </p>
                            <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                              #{t.employee.employeeNumber || "---"}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">عام لعدة موظفين</span>
                      )}
                    </TableCell>

                    <TableCell className="py-2.5">
                      <div className="text-xs font-mono tabular-nums text-muted-foreground">
                        {new Date(t.startDate).toLocaleDateString("ar-EG")}
                        {t.duration ? ` (${t.duration} ساعة)` : ""}
                      </div>
                    </TableCell>

                    <TableCell className="py-2.5 text-center">
                      {getStatusBadge(t.status)}
                    </TableCell>

                    <TableCell className="py-2.5 text-left">
                      <div className="text-xs font-mono tabular-nums">
                        {t.cost ? (
                          <span className="text-foreground font-medium">{t.cost.toLocaleString()} ج.م</span>
                        ) : (
                          <span className="text-muted-foreground">مجاني</span>
                        )}
                        {t.score !== undefined && t.score !== null && (
                          <span className="block text-[10px] text-amber-600 font-bold">{t.score}%</span>
                        )}
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

export default PolarisTrainingView;
