import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { MessageSquare, Star, TrendingUp, Award } from "lucide-react";
import { FeedbackStats, FeedbackItem } from "./types";

interface FeedbackStatsGridProps {
  stats: FeedbackStats | null;
  feedback: FeedbackItem[];
}

export const FeedbackStatsGrid: React.FC<FeedbackStatsGridProps> = ({
  stats,
  feedback,
}) => {
  const positiveCount = feedback.filter((f) => (f.rating || 0) >= 4).length;
  const participationRate = Math.round(((stats?.total || 0) / 50) * 100);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="border-none bg-gradient-to-br from-primary to-white dark:from-primary/20 dark:to-slate-900 shadow-md hover:shadow-lg transition-all duration-300 border border-transparent dark:border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <MessageSquare className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <span className="text-sm font-medium text-primary bg-primary/10 dark:bg-primary/30 dark:text-primary px-2 py-1 rounded-full">
              الإجمالي
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-mono tabular-nums">
              {stats?.total || 0}
            </h3>
            <p className="text-sm text-muted-foreground">تم تلقيها مؤخراً</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-br from-warning to-white dark:from-warning/20 dark:to-slate-900 shadow-md hover:shadow-lg transition-all duration-300 border border-transparent dark:border-warning/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-warning/10 rounded-xl">
              <Star className="h-6 w-6 text-warning dark:text-warning fill-warning dark:fill-warning" />
            </div>
            <span className="text-sm font-medium text-warning bg-warning/10 dark:bg-warning/30 dark:text-warning px-2 py-1 rounded-full">
              التقييم
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-mono tabular-nums">
              {stats?.averageRating ? stats.averageRating.toFixed(1) : "0.0"}
            </h3>
            <p className="text-sm text-muted-foreground">متوسط الرضا العام</p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-br from-primary to-white dark:from-primary/20 dark:to-slate-900 shadow-md hover:shadow-lg transition-all duration-300 border border-transparent dark:border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <TrendingUp className="h-6 w-6 text-primary dark:text-primary" />
            </div>
            <span className="text-sm font-medium text-primary bg-primary/10 dark:bg-primary/30 dark:text-primary px-2 py-1 rounded-full">
              النشاط
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-mono tabular-nums">
              %{participationRate}
            </h3>
            <p className="text-sm text-muted-foreground">
              معدل المشاركة الشهري
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none bg-gradient-to-br from-success to-white dark:from-success/20 dark:to-slate-900 shadow-md hover:shadow-lg transition-all duration-300 border border-transparent dark:border-success/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-success/10 rounded-xl">
              <Award className="h-6 w-6 text-success dark:text-success" />
            </div>
            <span className="text-sm font-medium text-success bg-success/10 dark:bg-success/30 dark:text-success px-2 py-1 rounded-full">
              التميز
            </span>
          </div>
          <div className="space-y-1">
            <h3 className="text-3xl font-bold font-mono tabular-nums">
              {positiveCount}
            </h3>
            <p className="text-sm text-muted-foreground">
              تقييمات إيجابية (4-5)
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
