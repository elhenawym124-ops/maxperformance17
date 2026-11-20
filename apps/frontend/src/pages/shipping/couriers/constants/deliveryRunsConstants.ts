export interface StatusConfig {
  label: string;
  color: string;
}

export const STATUS_CONFIG: Record<string, StatusConfig> = {
  DISPATCHED: {
    label: 'في الميدان',
    color: 'bg-emerald-50 text-success dark:bg-success/40 dark:text-success border-success dark:border-success'
  },
  COMPLETED: {
    label: 'اكتمل التوصيل',
    color: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800'
  },
  SETTLED: {
    label: 'تمت التسوية والتوريد',
    color: 'bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border'
  },
  DRAFT: {
    label: 'مسودة',
    color: 'bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning border-warning dark:border-warning'
  },
  CANCELLED: {
    label: 'ملغاة',
    color: 'bg-rose-50 text-destructive dark:bg-destructive/40 dark:text-destructive border-destructive dark:border-destructive'
  }
};
