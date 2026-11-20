import React from "react";
import { SYSTEM_FIELD_OPTIONS } from "../catalog";
import { BuilderBadge } from "./WorkReportFormHeaderAndMeta";

interface WorkReportBuilderSidebarProps {
  totalFields: number;
  visibleCounts: {
    SYSTEM: number;
    MANUAL: number;
    CALCULATED: number;
  };
}

export const WorkReportBuilderSidebar: React.FC<
  WorkReportBuilderSidebarProps
> = ({ totalFields, visibleCounts }) => {
  return (
    <aside className="space-y-4">
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <h2 className="mb-4 text-lg font-semibold">ملخص سريع</h2>
        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 dark:bg-muted">
            <span className="text-slate-500 dark:text-muted-foreground">
              إجمالي الحقول
            </span>
            <strong className="font-mono tabular-nums">{totalFields}</strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 dark:bg-muted">
            <span className="text-slate-500 dark:text-muted-foreground">
              من النظام
            </span>
            <strong className="font-mono tabular-nums">
              {visibleCounts.SYSTEM}
            </strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 dark:bg-muted">
            <span className="text-slate-500 dark:text-muted-foreground">يدوي</span>
            <strong className="font-mono tabular-nums">
              {visibleCounts.MANUAL}
            </strong>
          </div>
          <div className="flex items-center justify-between rounded-xl bg-muted px-4 py-3 dark:bg-muted">
            <span className="text-slate-500 dark:text-muted-foreground">حسابي</span>
            <strong className="font-mono tabular-nums">
              {visibleCounts.CALCULATED}
            </strong>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <h2 className="mb-4 text-lg font-semibold">مصادر جاهزة من النظام</h2>
        <div className="space-y-3">
          {SYSTEM_FIELD_OPTIONS.map((option) => (
            <div
              key={option.key}
              className="rounded-xl bg-muted p-4 dark:bg-muted"
            >
              <div className="mb-1 flex items-center justify-between gap-2">
                <strong className="text-sm">{option.label}</strong>
                <BuilderBadge label={option.dataType} />
              </div>
              <p className="text-xs leading-6 text-muted-foreground dark:text-muted-foreground">
                {option.description}
              </p>
              <p className="mt-2 text-[11px] font-mono text-muted-foreground dark:text-muted-foreground">
                {option.key}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <h2 className="mb-3 text-lg font-semibold">ملاحظات مهمة</h2>
        <ul className="space-y-2 text-sm leading-7 text-foreground dark:text-muted-foreground">
          <li>
            الحقول المخفية يمكن استخدامها في التحليل حتى لو لم تظهر للموظف.
          </li>
          <li>المعادلات الحسابية تعتمد على مفاتيح الحقول وليس على العنوان.</li>
          <li>الحقول الرقمية أسهل بكثير في التحليل وعرض الرسوم لاحقًا.</li>
        </ul>
      </div>
    </aside>
  );
};
