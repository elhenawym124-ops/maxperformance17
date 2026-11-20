import React from 'react';
import { Package, Search, ChevronDown, ChevronUp, AlertCircle, ArrowUpDown, ChevronRight, Eye } from 'lucide-react';
import { useCurrency } from '../../../hooks/useCurrency';
import { ProductDeliveryReturnsItem, HealthStatus, BottleneckCategory } from './productDeliveryReturns.types';

interface Props {
  products: ProductDeliveryReturnsItem[];
  search: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
  onSelectProduct: (product: ProductDeliveryReturnsItem) => void;
}

const renderBottleneckBadge = (cat: BottleneckCategory) => {
  switch (cat) {
    case 'QUALITY_CATALOG':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-primary/10 dark:bg-primary/40 text-primary dark:text-primary border border-primary dark:border-primary">
          مقاس / جودة
        </span>
      );
    case 'LOGISTICS':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-warning/10 dark:bg-warning/40 text-warning dark:text-warning border border-warning dark:border-warning">
          تأخر شحن
        </span>
      );
    case 'CUSTOMER_SALES':
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
          عميل / تأكيد
        </span>
      );
    default:
      return (
        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted dark:bg-muted text-muted-foreground border border-border dark:border-border">
          طبيعي
        </span>
      );
  }
};

export const ProductDeliveryReturnsTable: React.FC<Props> = ({
  products,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
  onSelectProduct
}) => {
  const { formatPrice } = useCurrency();

  const getSortIcon = (col: string) => {
    if (sortBy !== col) return <ArrowUpDown className="h-3 w-3 text-muted-foreground" />;
    return sortOrder === 'asc' ? <ChevronUp className="h-3 w-3 text-foreground dark:text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-foreground dark:text-muted-foreground" />;
  };

  return (
    <div className="bg-white dark:bg-muted border border-border dark:border-border rounded-xl overflow-hidden">
      {/* Controls Bar */}
      <div className="p-3 sm:p-4 border-b border-border dark:border-border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث باسم المنتج أو كود SKU..."
            className="w-full pe-9 ps-3 py-1.5 text-xs bg-muted dark:bg-muted border border-border dark:border-border rounded-lg text-foreground dark:text-muted-foreground placeholder-muted focus:outline-hidden focus:ring-1 focus:ring-border"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'كافة المنتجات' },
            { id: 'CRITICAL', label: 'حرجة' },
            { id: 'WARNING', label: 'ملاحظة' },
            { id: 'HEALTHY', label: 'سليمة' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-zinc-900 text-white dark:bg-muted dark:text-foreground'
                  : 'text-zinc-600 dark:text-muted-foreground hover:bg-muted dark:hover:bg-muted'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-zinc-50 dark:bg-muted border-b border-border dark:border-border text-muted-foreground dark:text-muted-foreground">
            <tr>
              <th className="py-3 px-4 font-semibold">المنتج</th>
              <th
                onClick={() => onSortChange('totalShipped')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground dark:hover:text-muted-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>المشحون</span>
                  {getSortIcon('totalShipped')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('deliveryRate')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground dark:hover:text-muted-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>نسبة التسليم</span>
                  {getSortIcon('deliveryRate')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('collectionRate')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground dark:hover:text-muted-foreground"
              >
                <div className="flex items-center gap-1">
                  <span>نسبة ومبلغ التحصيل</span>
                  {getSortIcon('collectionRate')}
                </div>
              </th>
              <th
                onClick={() => onSortChange('returnRate')}
                className="py-3 px-3 font-semibold cursor-pointer hover:text-foreground dark:hover:text-muted-foreground text-destructive dark:text-destructive"
              >
                <div className="flex items-center gap-1">
                  <span>المرتجع وقيمته</span>
                  {getSortIcon('returnRate')}
                </div>
              </th>
              <th className="py-3 px-3 font-semibold text-warning dark:text-warning">شحن مهدر</th>
              <th className="py-3 px-3 font-semibold">العائق التشغيلي</th>
              <th className="py-3 px-4 font-semibold text-center">أسباب المرتجع</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {products.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-muted-foreground">
                  <Package className="h-10 w-10 mx-auto text-muted-foreground dark:text-foreground mb-2" />
                  <p className="text-xs font-medium">لا توجد منتجات تطابق الفلاتر المحددة</p>
                </td>
              </tr>
            ) : (
              products.map((item) => (
                <tr
                  key={item.productId || item.productName}
                  className="hover:bg-zinc-50/80 dark:hover:bg-muted transition-colors"
                >
                  {/* المنتج */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5 max-w-[240px]">
                      {item.productImage ? (
                        <img
                          src={item.productImage}
                          alt={item.productName}
                          className="h-9 w-9 rounded-lg object-cover shrink-0 border border-border dark:border-border"
                        />
                      ) : (
                        <div className="h-9 w-9 rounded-lg bg-muted dark:bg-muted flex items-center justify-center shrink-0 text-muted-foreground">
                          <Package className="h-4 w-4" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-foreground dark:text-muted-foreground truncate" title={item.productName}>
                          {item.productName}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                          {item.productSku && <span className="font-mono">{item.productSku}</span>}
                          {item.categoryName && <span>• {item.categoryName}</span>}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* المشحون */}
                  <td className="py-3 px-3 font-mono tabular-nums text-foreground dark:text-muted-foreground">
                    <span className="font-bold text-sm">{item.shippedQuantity.toLocaleString()}</span>
                    <span className="text-[10px] text-muted-foreground block">{item.totalOrders} أوردر</span>
                  </td>

                  {/* نسبة التسليم */}
                  <td className="py-3 px-3 font-mono tabular-nums">
                    <div className="flex items-center gap-1.5">
                      <span className={`font-bold text-sm ${
                        item.deliveryRate >= 75 ? 'text-emerald-600 dark:text-success' : item.deliveryRate >= 60 ? 'text-amber-600 dark:text-warning' : 'text-rose-600 dark:text-destructive'
                      }`}>
                        {item.deliveryRate}%
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">{item.deliveredQuantity} مسلّم</span>
                  </td>

                  {/* التحصيل */}
                  <td className="py-3 px-3 font-mono tabular-nums">
                    <span className="font-bold text-foreground dark:text-muted-foreground block">
                      {formatPrice(item.collectedRevenue)}
                    </span>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
                      نسبة التحصيل: {item.collectionRate}%
                    </span>
                  </td>

                  {/* المرتجع وقيمته */}
                  <td className="py-3 px-3 font-mono tabular-nums text-destructive dark:text-destructive">
                    <span className="font-bold text-sm block">
                      {item.returnRate}% ({item.returnedQuantity} ق)
                    </span>
                    <span className="text-[10px] text-muted-foreground dark:text-muted-foreground block">
                      خسارة: {formatPrice(item.lostRevenue)}
                    </span>
                  </td>

                  {/* شحن مهدر */}
                  <td className="py-3 px-3 font-mono tabular-nums text-warning dark:text-warning font-medium">
                    {formatPrice(item.lostShippingCost)}
                  </td>

                  {/* العائق التشغيلي */}
                  <td className="py-3 px-3">
                    {renderBottleneckBadge(item.primaryBottleneck)}
                  </td>

                  {/* تفاصيل المرتجع Drawer Trigger */}
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => onSelectProduct(item)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-foreground dark:text-muted-foreground bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted rounded-lg transition-colors"
                    >
                      <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>الأسباب ({item.returnReasons.length})</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
