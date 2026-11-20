import React from "react";
import { Briefcase, CheckCircle2, Store, Zap } from "lucide-react";
import { cn } from "../../../../lib/utils";
import type { BusinessSpecialty } from "../types";

interface SpecialtyStatsProps {
  specialties: BusinessSpecialty[];
}

export const SpecialtyStats: React.FC<SpecialtyStatsProps> = ({ specialties }) => {
  const activeCount = specialties.filter((s) => s.isActive).length;
  const autoInstallCount = specialties.filter((s) => s.autoInstallOnSignup).length;
  const totalCompanies = specialties.reduce((sum, s) => sum + (s.companyCount || 0), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 rounded-xl border border-border/80 bg-card/40 divide-y sm:divide-y-0 sm:divide-x divide-border/60 overflow-hidden shadow-xs">
      <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-medium text-[11px]">إجمالي النشاطات</span>
          <span className="size-1.5 rounded-full bg-primary" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
          {specialties.length}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">دليل الأنشطة المعتمد</p>
      </div>

      <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-medium text-[11px]">النشاطات المفعلة</span>
          <span className="size-1.5 rounded-full bg-success" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-success dark:text-success font-mono tabular-nums">
          {activeCount}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">
          {specialties.length ? Math.round((activeCount / specialties.length) * 100) : 0}% مفعّلة في التسجيل
        </p>
      </div>

      <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-medium text-[11px]">تثبيت تلقائي للتطبيقات</span>
          <span className="size-1.5 rounded-full bg-primary" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
          {autoInstallCount}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">تُربط فور إنشاء الشركة</p>
      </div>

      <div className="p-3.5 flex flex-col justify-between hover:bg-muted/10 transition-colors">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
          <span className="font-medium text-[11px]">الشركات المرتبطة</span>
          <span className="size-1.5 rounded-full bg-info" />
        </div>
        <div className="text-2xl font-bold tracking-tight text-foreground font-mono tabular-nums">
          {totalCompanies}
        </div>
        <p className="text-[10px] text-muted-foreground mt-0.5 font-mono">حسابات نشطة بالمنصة</p>
      </div>
    </div>
  );
};
