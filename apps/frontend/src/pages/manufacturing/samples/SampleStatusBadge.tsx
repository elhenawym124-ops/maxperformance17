import React from 'react';
import { SampleOrderStatus, SampleMaterialSource } from '../manufacturingApi';

interface SampleStatusBadgeProps {
  status: SampleOrderStatus;
  className?: string;
}

export const SampleStatusBadge: React.FC<SampleStatusBadgeProps> = ({ status, className = '' }) => {
  const configs: Record<SampleOrderStatus, { label: string; bg: string; text: string; border: string }> = {
    DRAFT: {
      label: 'مسودة',
      bg: 'bg-zinc-100 dark:bg-muted',
      text: 'text-zinc-700 dark:text-muted-foreground',
      border: 'border-zinc-200 dark:border-border',
    },
    IN_PROGRESS: {
      label: 'قيد التنفيذ',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
    },
    APPROVED: {
      label: 'معتمدة',
      bg: 'bg-emerald-50 dark:bg-success/40',
      text: 'text-emerald-700 dark:text-success',
      border: 'border-emerald-200 dark:border-success',
    },
    REJECTED: {
      label: 'مرفوضة',
      bg: 'bg-rose-50 dark:bg-destructive/40',
      text: 'text-rose-700 dark:text-destructive',
      border: 'border-rose-200 dark:border-destructive',
    },
    CONVERTED: {
      label: 'تم التحويل لأمر تشغيل',
      bg: 'bg-purple-50 dark:bg-primary/40',
      text: 'text-purple-700 dark:text-primary',
      border: 'border-purple-200 dark:border-primary',
    },
  };

  const config = configs[status] || configs.DRAFT;

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current me-1.5 opacity-80" />
      {config.label}
    </span>
  );
};

export const MaterialSourceBadge: React.FC<{ source: SampleMaterialSource; className?: string }> = ({
  source,
  className = '',
}) => {
  const isCustomer = source === 'CUSTOMER';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
        isCustomer
          ? 'bg-amber-50 dark:bg-warning/40 text-warning dark:text-warning border-warning dark:border-warning'
          : 'bg-indigo-50 dark:bg-primary/40 text-primary dark:text-primary border-primary dark:border-primary'
      } ${className}`}
    >
      {isCustomer ? 'خامة العميل' : 'خامة من عندنا'}
    </span>
  );
};
