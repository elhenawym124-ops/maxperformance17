import React from 'react';
import { X, AlertTriangle, AlertCircle, CheckCircle, Package, ArrowUpRight, TrendingDown, ShieldAlert, Sparkles, Truck, Ruler, PhoneCall } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';
import { ProductDeliveryReturnsItem, BottleneckCategory } from './productDeliveryReturns.types';

interface Props {
  product: ProductDeliveryReturnsItem | null;
  onClose: () => void;
}

const getCategoryBadge = (category: BottleneckCategory) => {
  switch (category) {
    case 'QUALITY_CATALOG':
      return {
        label: 'جودة ومواصفات',
        icon: Ruler,
        bg: 'bg-purple-50 dark:bg-primary/40 text-primary dark:text-primary border-primary dark:border-primary'
      };
    case 'LOGISTICS':
      return {
        label: 'شحن ومندوبين',
        icon: Truck,
        bg: 'bg-amber-50 dark:bg-warning/40 text-warning dark:text-warning border-warning dark:border-warning'
      };
    case 'CUSTOMER_SALES':
      return {
        label: 'عميل وتأكيد',
        icon: PhoneCall,
        bg: 'bg-blue-50 dark:bg-primary/40 text-primary dark:text-primary border-primary dark:border-primary'
      };
    default:
      return {
        label: 'أخرى',
        icon: AlertCircle,
        bg: 'bg-zinc-100 dark:bg-muted text-foreground dark:text-muted-foreground border-border dark:border-border'
      };
  }
};

export const ProductReturnReasonsDrawer: React.FC<Props> = ({ product, onClose }) => {
  const { formatPrice } = useCurrency();

  if (!product) return null;

  const totalReturnReasonsCount = product.returnReasons.reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/50 backdrop-blur-xs flex justify-end transition-opacity">
      <div 
        className="w-full max-w-xl bg-white dark:bg-muted h-full shadow-2xl flex flex-col border-r border-border dark:border-border animate-in slide-in-from-right duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-border dark:border-border flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            {product.productImage ? (
              <img
                src={product.productImage}
                alt={product.productName}
                className="h-12 w-12 rounded-lg object-cover shrink-0 border border-border dark:border-border"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-muted dark:bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                <Package className="h-6 w-6" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground dark:text-muted-foreground truncate">
                {product.productName}
              </h2>
              <div className="flex items-center gap-2 mt-1">
                {product.productSku && (
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted dark:bg-muted px-1.5 py-0.5 rounded">
                    SKU: {product.productSku}
                  </span>
                )}
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${
                  product.healthStatus === 'CRITICAL'
                    ? 'bg-rose-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive'
                    : product.healthStatus === 'WARNING'
                    ? 'bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning'
                    : 'bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success'
                }`}>
                  {product.healthStatus === 'CRITICAL' ? 'حالة حرجة' : product.healthStatus === 'WARNING' ? 'تحت الملاحظة' : 'أداء ممتاز'}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="bg-zinc-50 dark:bg-muted border border-border dark:border-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-muted-foreground block mb-1">نسبة التسليم</span>
              <span className={`text-lg font-bold font-mono tabular-nums ${
                product.deliveryRate >= 75 ? 'text-emerald-600 dark:text-success' : 'text-rose-600 dark:text-destructive'
              }`}>
                {product.deliveryRate}%
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-muted border border-border dark:border-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-muted-foreground block mb-1">نسبة التحصيل</span>
              <span className="text-lg font-bold font-mono tabular-nums text-primary dark:text-primary">
                {product.collectionRate}%
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-muted border border-border dark:border-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-muted-foreground block mb-1">الكاش المحصل</span>
              <span className="text-sm font-bold font-mono tabular-nums text-foreground dark:text-muted-foreground block truncate">
                {formatPrice(product.collectedRevenue)}
              </span>
            </div>
            <div className="bg-zinc-50 dark:bg-muted border border-border dark:border-border rounded-lg p-3 text-center">
              <span className="text-[11px] text-muted-foreground block mb-1">قيمة المرتجعات</span>
              <span className="text-sm font-bold font-mono tabular-nums text-destructive dark:text-destructive block truncate">
                {formatPrice(product.lostRevenue)}
              </span>
            </div>
          </div>

          {/* Operational Recommendation Card */}
          <div className="bg-gradient-to-br from-warning/5 via-zinc-50 to-zinc-50 dark:from-warning/20 dark:via-zinc-900 dark:to-zinc-900 border border-warning/80 dark:border-warning/60 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2 text-warning dark:text-warning">
              <Sparkles className="h-4 w-4 shrink-0" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                التشخيص التشغيلي وتوصية المعالجة
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-foreground dark:text-muted-foreground">
              {product.operationalRecommendation}
            </p>
            {product.lostShippingCost > 0 && (
              <div className="mt-3 pt-3 border-t border-warning/60 dark:border-warning/40 flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground">
                <span>مصاريف شحن مهدرة على هذا المنتج:</span>
                <span className="font-mono font-bold text-destructive dark:text-destructive">
                  {formatPrice(product.lostShippingCost)}
                </span>
              </div>
            )}
          </div>

          {/* Breakdown of Return Reasons */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-foreground dark:text-muted-foreground">
                تفصيل أسباب الارتجاع ({product.returnReasons.length} سبب مسجل)
              </h3>
              <span className="text-xs text-muted-foreground">
                إجمالي المرتجعات: <strong className="font-mono text-foreground dark:text-muted-foreground">{product.returnedQuantity}</strong> قطعة
              </span>
            </div>

            {product.returnReasons.length === 0 ? (
              <div className="py-8 text-center bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border text-muted-foreground">
                <CheckCircle className="h-8 w-8 mx-auto text-success mb-2 opacity-80" />
                <p className="text-xs font-medium">لا توجد مرتجعات مسجلة لهذا المنتج في هذه الفترة</p>
              </div>
            ) : (
              <div className="space-y-3">
                {product.returnReasons.map((item, idx) => {
                  const cat = getCategoryBadge(item.category);
                  const Icon = cat.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl p-3.5 space-y-2 hover:border-border dark:hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-5 w-5 rounded-full bg-muted dark:bg-muted text-muted-foreground flex items-center justify-center text-[10px] font-mono shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-foreground dark:text-muted-foreground break-words">
                            {item.reason}
                          </span>
                        </div>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 ${cat.bg}`}>
                          <Icon className="h-3 w-3" />
                          {cat.label}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-muted dark:bg-muted h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            item.percentage > 30 ? 'bg-rose-500' : item.percentage > 15 ? 'bg-amber-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(5, item.percentage))}%` }}
                        />
                      </div>

                      {/* Stat values */}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground dark:text-muted-foreground font-mono">
                        <span>
                          التكرار: <strong className="text-zinc-900 dark:text-muted-foreground font-bold">{item.count}</strong> ({item.percentage}%)
                        </span>
                        <span>
                          الخسارة: <strong className="text-rose-600 dark:text-destructive font-bold">{formatPrice(item.lostValue)}</strong>
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border dark:border-border bg-muted dark:bg-muted flex items-center justify-between gap-3">
          {product.productId ? (
            <a
              href={`/products`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground dark:text-muted-foreground bg-white dark:bg-muted border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              <span>إدارة المنتج في الكتالوج</span>
              <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground" />
            </a>
          ) : <div />}
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-foreground dark:text-muted-foreground bg-white dark:bg-muted border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
