import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

interface WorkspaceQueueEmptyStateProps {
  loading?: boolean;
  confirmationDisabled?: boolean;
  activeTab?: string;
  fetchError?: string | null;
  onRetry?: () => void;
  isArabic: boolean;
  riskOnly?: boolean;
  inStream?: boolean;
}

export const WorkspaceQueueEmptyState: React.FC<WorkspaceQueueEmptyStateProps> = ({
  loading,
  confirmationDisabled,
  activeTab,
  fetchError,
  onRetry,
  isArabic,
  riskOnly = false,
  inStream = false,
}) => {
  if (loading) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <ArrowPathIcon className="h-6 w-6 animate-spin text-primary" />
        <p className="mt-2 text-xs font-medium text-muted-foreground dark:dark:text-muted-foreground">
          {isArabic ? 'جارٍ تحميل طلبات الطابور…' : 'Loading workspace orders…'}
        </p>
      </div>
    );
  }

  const isConfirmationTab = activeTab === 'pending' || activeTab === 'all' || activeTab === 'confirmation';

  if (confirmationDisabled && isConfirmationTab) {
    if (inStream) {
      return (
        <div className="m-3 rounded-xl border border-warning/30 bg-warning/10 p-3.5 text-center dark:border-warning/30 dark:bg-warning/20">
          <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-warning/20 text-warning dark:bg-warning/25 dark:text-warning">
            <ExclamationTriangleIcon className="h-5 w-5" />
          </div>
          <h4 className="mt-2 text-xs font-bold text-warning dark:text-warning">
            {isArabic ? 'المركز مقفول من الإعدادات' : 'Confirmation Center Disabled'}
          </h4>
          <p className="mt-1 text-[11px] leading-relaxed text-warning/90 dark:text-warning/80">
            {isArabic
              ? 'تم إيقاف مركز التأكيد من الإعدادات، ولن تظهر أي طلبات في قائمة التأكيد حتى يتم تفعيله.'
              : 'Order confirmation center is disabled in settings. No orders will appear until enabled.'}
          </p>
          <Link
            to="/settings/orders?tab=confirmation"
            className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg bg-warning px-3 py-1.5 text-[11px] font-bold text-white shadow-xs transition-colors hover:bg-warning focus:outline-none focus:ring-2 focus:ring-warning focus:ring-offset-1 dark:bg-warning dark:hover:bg-warning"
          >
            <span>{isArabic ? 'الانتقال لإعدادات التأكيد ←' : 'Go to Settings →'}</span>
          </Link>
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/15 text-warning dark:bg-warning/20 dark:text-warning">
          <ExclamationTriangleIcon className="h-6 w-6" />
        </div>
        <h4 className="mt-3 text-sm font-bold text-foreground dark:dark:text-muted-foreground">
          {isArabic ? 'المركز مقفول من الإعدادات' : 'Confirmation Center Disabled'}
        </h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed max-w-xs dark:dark:text-muted-foreground">
          {isArabic
            ? 'تم إيقاف مركز التأكيد من الإعدادات، ولن تظهر أي طلبات في قائمة التأكيد حتى يتم تفعيله.'
            : 'Order confirmation center is disabled in settings. No orders will appear until enabled.'}
        </p>
        <Link
          to="/settings/orders?tab=confirmation"
          className="mt-3.5 inline-flex items-center gap-1.5 rounded-lg bg-warning px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-warning dark:bg-warning dark:hover:bg-warning"
        >
          <span>{isArabic ? 'الانتقال لإعدادات التأكيد ←' : 'Go to Settings →'}</span>
        </Link>
      </div>
    );
  }

  if (inStream) {
    return (
      <div className="flex h-32 flex-col items-center justify-center p-4 text-center text-muted-foreground dark:dark:text-muted-foreground">
        <p className="text-xs font-medium">
          {riskOnly
            ? isArabic
              ? 'لا توجد طلبات عالية الخطورة'
              : 'No high-risk orders'
            : isArabic
            ? 'لا توجد طلبات مطابقة'
            : 'No matching orders'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center p-6 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/50 text-muted-foreground dark:dark:bg-muted dark:dark:text-muted-foreground">
        {fetchError ? (
          <ExclamationTriangleIcon className="h-6 w-6 text-destructive" />
        ) : (
          <CheckCircleIcon className="h-6 w-6 text-success dark:text-success" />
        )}
      </div>
      <p className="mt-3 text-sm font-semibold text-foreground text-balance dark:dark:text-muted-foreground">
        {fetchError
          ? fetchError
          : activeTab === 'incomplete'
          ? isArabic
            ? 'لا توجد سلات متروكة'
            : 'No abandoned carts'
          : isArabic
          ? 'لا توجد طلبات قيد الانتظار'
          : 'No pending orders'}
      </p>
      {fetchError && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:bg-primary/90"
        >
          {isArabic ? 'إعادة المحاولة' : 'Try again'}
        </button>
      )}
    </div>
  );
};
