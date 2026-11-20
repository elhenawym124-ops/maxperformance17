import React from "react";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

export const TurboTicketEmptyState: React.FC = () => {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted dark:bg-muted relative">
      <div className="max-w-md w-full space-y-4">
        <div className="size-12 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs text-foreground mx-auto flex items-center justify-center">
          <DocumentTextIcon className="size-6 text-muted-foreground" />
        </div>
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono border border-success/20 bg-success/10 text-success dark:text-success mb-2">
            <span className="size-1.5 rounded-full bg-success" />
            <span>Turbo Sync Connected</span>
          </div>
          <h3 className="text-base font-bold text-foreground dark:text-muted-foreground">
            مركز تذاكر ومحادثات الشحن
          </h3>
          <p className="text-xs text-muted-foreground dark:text-muted-foreground leading-relaxed mt-1">
            اختر تذكرة من القائمة الجانبية لمتابعة تفاصيل الشحنة والمحادثة الحية مع عمليات شركة تربو، أو اضغط لفتح تذكرة جديدة.
          </p>
        </div>

        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          <span className="font-mono text-[11px] px-2 py-1 rounded border border-border dark:border-border bg-white dark:bg-muted text-muted-foreground shadow-2xs">
            شكاوى الشحنات
          </span>
          <span className="font-mono text-[11px] px-2 py-1 rounded border border-border dark:border-border bg-white dark:bg-muted text-muted-foreground shadow-2xs">
            المعاملات المالية
          </span>
          <span className="font-mono text-[11px] px-2 py-1 rounded border border-border dark:border-border bg-white dark:bg-muted text-muted-foreground shadow-2xs">
            استفسارات عامة
          </span>
        </div>
      </div>
    </main>
  );
};
