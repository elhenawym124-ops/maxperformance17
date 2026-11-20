import React from 'react';
import { WorkspaceOrder } from '../../types';

interface WorkspaceInspectorDispositionsProps {
  order: WorkspaceOrder;
  isBusy: boolean;
  onLogCall: (order: WorkspaceOrder, result: string) => void;
  isArabic: boolean;
}

export const WorkspaceInspectorDispositions: React.FC<WorkspaceInspectorDispositionsProps> = ({
  order,
  isBusy,
  onLogCall,
  isArabic,
}) => {
  const dispositions = [
    {
      key: 'unreached',
      label: isArabic ? 'لم يرد' : 'Unreached',
      color: 'hover:bg-warning/10 hover:text-warning dark:hover:bg-warning/30 dark:hover:text-warning',
    },
    {
      key: 'busy',
      label: isArabic ? 'مشغول / مغلق' : 'Busy',
      color: 'hover:bg-destructive/10 hover:text-destructive dark:hover:bg-destructive/30 dark:hover:text-destructive',
    },
    {
      key: 'callback',
      label: isArabic ? 'إعادة اتصال' : 'Callback',
      color: 'hover:bg-primary/10 hover:text-primary dark:hover:bg-primary/30 dark:hover:text-primary',
    },
    {
      key: 'wrong_number',
      label: isArabic ? 'رقم خاطئ' : 'Wrong No.',
      color: 'hover:hover:bg-muted hover:hover:text-foreground dark:hover:dark:hover:bg-muted dark:hover:dark:hover:text-muted-foreground',
    },
    {
      key: 'reached',
      label: isArabic ? 'تم الرد' : 'Answered',
      color: 'hover:bg-success/10 hover:text-success dark:hover:bg-success/30 dark:hover:text-success',
    },
  ];

  return (
    <section className="border-b border-border/30 pb-3 dark:dark:border-border">
      <div className="flex flex-wrap gap-1.5">
        {dispositions.map((disp) => (
          <button
            key={disp.key}
            type="button"
            disabled={isBusy}
            onClick={() => onLogCall(order, disp.key)}
            className={`rounded-md border border-border/40 bg-background px-2.5 py-1 text-xs font-semibold text-foreground transition-all active:scale-[0.98] disabled:opacity-50 dark:dark:border-border dark:dark:bg-muted dark:dark:text-muted-foreground ${disp.color}`}
          >
            {disp.label}
          </button>
        ))}
      </div>
    </section>
  );
};
