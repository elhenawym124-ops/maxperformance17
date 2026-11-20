import React from 'react';
import { Truck, CheckCircle2, DollarSign, AlertTriangle, AlertCircle, TrendingDown } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';
import { ProductDeliveryReturnsSummary } from './productDeliveryReturns.types';

interface Props {
  summary: ProductDeliveryReturnsSummary;
  onFilterCritical?: () => void;
}

export const ProductDeliveryReturnsKpis: React.FC<Props> = ({ summary, onFilterCritical }) => {
  const { formatPrice } = useCurrency();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {/* 1. نسبة التسليم الإجمالية */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            نسبة التسليم الإجمالية
          </span>
          <div className="h-8 w-8 rounded-lg bg-success/10 dark:bg-success/40 text-success dark:text-success flex items-center justify-center">
            <CheckCircle2 className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground">
            {summary.overallDeliveryRate}%
          </span>
          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
            (من الشحنات المنتهية)
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>تم تسليمه: <strong className="font-mono text-foreground dark:text-muted-foreground">{summary.totalDeliveredQuantity.toLocaleString()}</strong> ق</span>
          <span>مشحون: <strong className="font-mono text-foreground dark:text-muted-foreground">{summary.totalShippedQuantity.toLocaleString()}</strong> ق</span>
        </div>
      </div>

      {/* 2. نسبة ومبلغ التحصيل الفعلي */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            معدل ومبالغ التحصيل (COD)
          </span>
          <div className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground">
            {summary.overallCollectionRate}%
          </span>
          <span className="text-xs text-success dark:text-success font-medium">
            محصل فعلي
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>المحصل: <strong className="font-mono text-success dark:text-success">{formatPrice(summary.totalCollectedRevenue)}</strong></span>
          <span>المتوقع: <strong className="font-mono text-foreground dark:text-muted-foreground">{formatPrice(summary.totalExpectedRevenue)}</strong></span>
        </div>
      </div>

      {/* 3. خسائر المرتجعات والشحن المهدر */}
      <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 transition-all">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            خسائر المرتجعات والشحن
          </span>
          <div className="h-8 w-8 rounded-lg bg-destructive/10 dark:bg-destructive/40 text-destructive dark:text-destructive flex items-center justify-center">
            <TrendingDown className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-destructive dark:text-destructive">
            {formatPrice(summary.totalLostRevenue)}
          </span>
          <span className="text-xs text-muted-foreground dark:text-muted-foreground">
            قيمة المرتجع
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>شحن مهدر: <strong className="font-mono text-warning dark:text-warning">{formatPrice(summary.totalLostShipping)}</strong></span>
          <span>قطع مرتجعة: <strong className="font-mono text-foreground dark:text-muted-foreground">{summary.totalReturnedQuantity.toLocaleString()}</strong></span>
        </div>
      </div>

      {/* 4. المنتجات التي تحتاج تدخل تشغيلي */}
      <div 
        onClick={onFilterCritical}
        className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-4 transition-all hover:border-destructive dark:hover:border-destructive cursor-pointer"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground dark:text-muted-foreground">
            منتجات تتطلب تدخلاً عاجلاً
          </span>
          <div className="h-8 w-8 rounded-lg bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning flex items-center justify-center">
            <AlertTriangle className="h-4 w-4" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tabular-nums text-destructive dark:text-destructive">
            {summary.criticalCount}
          </span>
          <span className="text-xs text-warning dark:text-warning">
            حرجة ({summary.warningCount} تحت التحذير)
          </span>
        </div>
        <div className="mt-2.5 pt-2.5 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground">
          <span>نسبة المرتجع العام: <strong className="font-mono text-foreground dark:text-muted-foreground">{summary.overallReturnRate}%</strong></span>
          <span className="text-blue-600 dark:text-blue-400 hover:underline">فلترة الحرجة ←</span>
        </div>
      </div>
    </div>
  );
};
