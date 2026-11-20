import React, { useState } from "react";
import {
  Briefcase,
  Users,
  Calendar,
  CheckCircle2,
  Clock,
  Plus,
  BarChart3,
  GitBranch,
  FileText,
  RotateCcw,
} from "lucide-react";
import { ShopifyPageHeader } from "../../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import JobPostingsSection from "./sections/JobPostingsSection";
import ApplicantsSection from "./sections/ApplicantsSection";
import InterviewsSection from "./sections/InterviewsSection";
import HiringPipelineSection from "./sections/HiringPipelineSection";
import ApplicationFormsSection from "./sections/ApplicationFormsSection";

export interface RecruitmentStats {
  activeJobs: number;
  totalApplicants: number;
  scheduledInterviews: number;
  pendingReviews: number;
  hiredThisMonth: number;
  averageTimeToHire: number;
}

interface PolarisRecruitmentViewProps {
  activeTab: "overview" | "jobs" | "applicants" | "interviews" | "pipeline" | "forms";
  setActiveTab: (tab: "overview" | "jobs" | "applicants" | "interviews" | "pipeline" | "forms") => void;
  stats: RecruitmentStats;
  loading: boolean;
  onRefresh: () => void;
  onNewJob: () => void;
}

export const PolarisRecruitmentView: React.FC<PolarisRecruitmentViewProps> = ({
  activeTab,
  setActiveTab,
  stats,
  loading,
  onRefresh,
  onNewJob,
}) => {
  const [showStats, setShowStats] = useState(true);

  const tabs: {
    id: "overview" | "jobs" | "applicants" | "interviews" | "pipeline" | "forms";
    label: string;
    icon: React.ElementType;
    count?: number;
  }[] = [
    { id: "overview", label: "نظرة عامة", icon: BarChart3 },
    { id: "jobs", label: "الوظائف المعلنة", icon: Briefcase, count: stats.activeJobs },
    { id: "applicants", label: "المتقدمون", icon: Users, count: stats.totalApplicants },
    { id: "interviews", label: "المقابلات المجدولة", icon: Calendar, count: stats.scheduledInterviews },
    { id: "pipeline", label: "مسار التوظيف (Pipeline)", icon: GitBranch },
    { id: "forms", label: "نماذج التقديم", icon: FileText },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="إدارة التوظيف واستقطاب الكفاءات"
        subtitle="متابعة الوظائف المعلنة، فحص السير الذاتية، جدولة المقابلات، ومسار مراحل قبول الموظفين"
        badges={[
          { label: `${stats.activeJobs} وظيفة معلنة`, variant: "default" },
          { label: `${stats.totalApplicants} متقدم`, variant: "secondary" },
          ...(stats.pendingReviews > 0
            ? [{ label: `${stats.pendingReviews} بانتظار المراجعة`, variant: "destructive" as const }]
            : []),
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowStats(!showStats)}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <BarChart3 className="h-3.5 w-3.5" />
              <span>{showStats ? "إخفاء المؤشرات" : "عرض المؤشرات"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={loading}
              className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              تحديث
            </Button>
            <Button
              size="sm"
              onClick={onNewJob}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              نشر إعلان وظيفة
            </Button>
          </div>
        }
      />

      {/* KPI Stats Strip */}
      {showStats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">الوظائف المفتوحة</span>
              <Briefcase className="h-3.5 w-3.5 text-primary" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.activeJobs}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">إجمالي المتقدمين</span>
              <Users className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.totalApplicants}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">المقابلات المجدولة</span>
              <Calendar className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.scheduledInterviews}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">بانتظار المراجعة</span>
              <Clock className="h-3.5 w-3.5 text-amber-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-amber-600">
              {stats.pendingReviews}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">تم توظيفهم هذا الشهر</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-emerald-600">
              {stats.hiredThisMonth}
            </div>
          </Card>

          <Card className="rounded-2xl border border-border/70 bg-card p-3 shadow-xs">
            <div className="flex items-center justify-between text-muted-foreground mb-1">
              <span className="text-[11px] font-medium">متوسط فترة التوظيف</span>
              <BarChart3 className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-bold font-mono tabular-nums text-foreground">
              {stats.averageTimeToHire} <span className="text-xs font-normal text-muted-foreground">يوم</span>
            </div>
          </Card>
        </div>
      )}

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Navigation Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <CardContent className="p-4 sm:p-6 [&>div.rounded-xl]:border-0 [&>div.rounded-xl]:shadow-none [&>div.rounded-xl]:p-0">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Quick Actions Shortcuts */}
              <div>
                <h3 className="text-xs font-semibold text-foreground mb-3">إجراءات التوظيف السريعة</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab("jobs")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0 text-primary">
                      <Plus className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-foreground block">إضافة وظيفة</span>
                      <span className="text-[11px] text-muted-foreground">نشر إعلان وظيفي جديد</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("applicants")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0 text-primary">
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-foreground block">سجل المتقدمين</span>
                      <span className="text-[11px] text-muted-foreground">فحص السير الذاتية والطلبات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("interviews")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0 text-primary">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-foreground block">جدولة مقابلة</span>
                      <span className="text-[11px] text-muted-foreground">تحديد مواعيد المقابلات</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveTab("pipeline")}
                    className="flex items-center gap-3 p-3.5 rounded-xl border border-border/70 bg-muted/10 hover:bg-muted/20 hover:border-primary/40 transition-colors text-right"
                  >
                    <div className="p-2 rounded-lg bg-background border border-border/60 shrink-0 text-primary">
                      <GitBranch className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-xs text-foreground block">مسار التوظيف</span>
                      <span className="text-[11px] text-muted-foreground">متابعة مراحل ومحطات القبول</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Embed Jobs Section in Overview */}
              <div className="pt-2 border-t border-border/70">
                <JobPostingsSection onNewJob={onNewJob} />
              </div>
            </div>
          )}

          {activeTab === "jobs" && <JobPostingsSection onNewJob={onNewJob} />}
          {activeTab === "applicants" && <ApplicantsSection />}
          {activeTab === "interviews" && <InterviewsSection />}
          {activeTab === "pipeline" && <HiringPipelineSection />}
          {activeTab === "forms" && <ApplicationFormsSection />}
        </CardContent>
      </Card>
    </div>
  );
};
