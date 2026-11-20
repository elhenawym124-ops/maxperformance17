import React, { useState, useEffect, useCallback } from 'react';
import {
  Tag,
  Search,
  ShoppingCart,
  RotateCw,
  AlertCircle,
  Package,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { wholesalePortalApi, WholesalePriceItem } from './wholesalePortalApi';
import { WholesaleAccessCheck } from './WholesaleAccessCheck';

export const WholesalePricesPage: React.FC = () => {
  const [items, setItems] = useState<WholesalePriceItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const navigate = useNavigate();

  const fetchPrices = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await wholesalePortalApi.getPriceList();
      setItems(data || []);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.response?.data?.message || err?.message || 'تعذر تحميل قائمة الأسعار';
      const code = err?.response?.data?.code;
      setError(msg);
      setErrorCode(code);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrices();
  }, [fetchPrices]);

  if (errorCode === 'NOT_WHOLESALE_CUSTOMER' || errorCode === 'WHOLESALE_INACTIVE') {
    return <WholesaleAccessCheck error={error} errorCode={errorCode} />;
  }

  const filteredItems = items.filter((item) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.productName.toLowerCase().includes(q) ||
      (item.productSku && item.productSku.toLowerCase().includes(q)) ||
      (item.variantName && item.variantName.toLowerCase().includes(q))
    );
  });

  const handleOrderProduct = (item: WholesalePriceItem) => {
    // Store selected product in session/local storage for the new order page
    try {
      sessionStorage.setItem(
        'ws_preselected_item',
        JSON.stringify({
          productId: item.productId,
          variantId: item.variantId || null,
          quantity: item.minQuantity || 1,
        })
      );
    } catch (_) {}
    navigate('/wholesale-portal/new-order');
  };

  return (
    <div dir="rtl" className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Tag className="text-indigo-600" size={26} />
            قائمة أسعاري ومنتجات الجملة
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            المنتجات والأسعار المعتمدة لحسابك بسعر الجملة الخاص بك مع حدود الكميات الدنيا
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/wholesale-portal/new-order')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            <ShoppingCart size={16} />
            إنشاء طلب جديد
          </button>
          <button
            onClick={fetchPrices}
            disabled={loading}
            className="p-2.5 text-foreground hover:text-foreground bg-muted hover:bg-muted rounded-xl transition-colors disabled:opacity-50"
            title="تحديث الأسعار"
          >
            <RotateCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-border shadow-sm">
        <div className="relative">
          <Search size={18} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الرمز (SKU)..."
            className="w-full pe-10 ps-4 py-2 text-sm border border-border rounded-xl bg-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-border">
          <div className="text-center text-muted-foreground">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary mb-2" />
            <p className="text-sm">جاري تحميل قائمة الأسعار المخصصة...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-destructive/10 text-destructive rounded-xl border border-destructive flex items-center gap-3">
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-xl border border-border">
          <Package className="mx-auto text-muted-foreground mb-3" size={48} />
          <h3 className="text-lg font-bold text-foreground">لا توجد منتجات مطابقة</h3>
          <p className="text-sm text-muted-foreground mt-1">
            لم يتم العثور على أي منتجات في قائمة أسعار الجملة المعتمدة لحسابك.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((item) => {
            const hasDiscount = item.regularPrice > item.wholesalePrice;
            const savingsPercent = hasDiscount
              ? Math.round(((item.regularPrice - item.wholesalePrice) / item.regularPrice) * 100)
              : 0;

            return (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-border shadow-sm hover:border-primary hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
              >
                <div className="p-5 space-y-4">
                  {/* Image & Badges */}
                  <div className="relative aspect-video rounded-xl bg-muted overflow-hidden flex items-center justify-center border border-border">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package size={40} className="text-gray-300" />
                    )}

                    {savingsPercent > 0 && (
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-success text-white text-xs font-bold font-mono">
                        وفر {savingsPercent}%
                      </span>
                    )}

                    {item.minQuantity > 1 && (
                      <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-sm text-white text-xs font-medium">
                        أقل كمية: {item.minQuantity} قطعة
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <h3 className="font-bold text-base text-foreground line-clamp-1">
                      {item.productName}
                    </h3>
                    {item.variantName && (
                      <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md mt-1">
                        النوع: {item.variantName}
                      </span>
                    )}
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      SKU: {item.productSku || '—'}
                    </div>
                  </div>

                  {/* Pricing Box */}
                  <div className="p-3 bg-muted rounded-xl flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">سعر الجملة</span>
                      <div className="text-xl font-bold text-primary font-mono">
                        {item.wholesalePrice.toLocaleString('ar-EG')} <span className="text-xs font-normal">ج.م</span>
                      </div>
                    </div>

                    {hasDiscount && (
                      <div className="text-left">
                        <span className="text-xs text-muted-foreground block">سعر التجزئة</span>
                        <span className="text-sm text-muted-foreground line-through font-mono">
                          {item.regularPrice.toLocaleString('ar-EG')} ج.م
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-muted border-t border-border flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    الحد الأدنى: <strong>{item.minQuantity}</strong>
                  </span>
                  <button
                    onClick={() => handleOrderProduct(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold text-primary bg-primary/10 hover:bg-primary hover:text-white transition-colors"
                  >
                    <ShoppingCart size={14} />
                    إضافة للطلب
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
