import React from "react";
import {
  GraduationCap,
  Clock,
  BookOpen,
  CheckCircle2,
  Loader2,
  Search,
  X,
  RefreshCw,
} from "lucide-react";
import type { TFunction } from "i18next";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { TrainingStats, trainingStatusConfig } from "./types";

interface MyTrainingHeaderAndStatsProps {
  t: TFunction;
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  loading: boolean;
  stats: TrainingStats;
  onRefresh: () => void;
}

export const MyTrainingHeaderAndStats: React.FC<
  MyTrainingHeaderAndStatsProps
> = ({
  t,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  loading,
  stats,
  onRefresh,
}) => {
  return (
    <>
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {t("employee.training.title")}
          </h1>
          <p className="text-sm text-muted-foreground flex items-center gap-2 mt-0.5">
            <GraduationCap className="h-4 w-4 text-primary" />
            {t("employee.training.subtitle")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-purple-500 transition-colors" />
            <Input
              placeholder={String(t("employee.training.searchPlaceholder"))}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-9 border-primary focus:border-primary focus:ring-primary rounded-xl bg-white/50 backdrop-blur-sm shadow-sm"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                aria-label="مسح البحث"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 p-1 bg-primary/50 rounded-xl border border-primary overflow-x-auto no-scrollbar w-full sm:w-auto">
            {["ALL", "PLANNED", "ONGOING", "COMPLETED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                  statusFilter === status
                    ? "bg-white text-primary shadow-sm"
                    : "text-gray-500 hover:text-primary"
                }`}
              >
                {status === "ALL"
                  ? t("employee.training.all")
                  : t(trainingStatusConfig[status]?.labelKey || status)}
              </button>
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onRefresh}
            className="text-purple-600 hover:bg-primary rounded-xl shrink-0"
            disabled={loading}
            aria-label="تحديث البيانات"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <Card className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden group hover:border-border transition-colors">
          <div className="h-1 w-full bg-primary opacity-50" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {t("employee.training.totalCourses")}
              </p>
              <p className="text-2xl font-black font-mono tabular-nums text-foreground">
                {stats.total}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
              <BookOpen className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md overflow-hidden group hover:shadow-xl transition-all">
          <div className="h-1 w-full bg-success opacity-50" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {t("employee.training.completed")}
              </p>
              <p className="text-2xl font-black font-mono tabular-nums text-success">
                {stats.completed}
              </p>
            </div>
            <div className="p-3 bg-success/10 rounded-xl text-success group-hover:scale-110 transition-transform">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md overflow-hidden group hover:shadow-xl transition-all">
          <div className="h-1 w-full bg-warning opacity-50" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {t("employee.training.inProgress")}
              </p>
              <p className="text-2xl font-black font-mono tabular-nums text-warning">
                {stats.ongoing}
              </p>
            </div>
            <div className="p-3 bg-warning/10 rounded-xl text-warning group-hover:scale-110 transition-transform">
              <Loader2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-lg bg-white/60 backdrop-blur-md overflow-hidden group hover:shadow-xl transition-all">
          <div className="h-1 w-full bg-primary opacity-50" />
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">
                {t("employee.training.totalHours")}
              </p>
              <p className="text-2xl font-black font-mono tabular-nums text-primary">
                {stats.totalHours}
              </p>
            </div>
            <div className="p-3 bg-primary/10 rounded-xl text-primary group-hover:scale-110 transition-transform">
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};
