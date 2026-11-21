import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Truck } from 'lucide-react';

export const WarehouseValueProps: React.FC = () => {
  return (
    <section className="py-6 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Offer 1 */}
          <Link
            to="/shop?filter=bundles"
            className="border border-[#e1e3e4] rounded-xl p-6 flex items-center gap-5 bg-gradient-to-l from-neutral-50 to-white hover:border-[#1e2d7d] transition-all cursor-pointer shadow-2xs text-start group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-[#1e2d7d]/10 flex items-center justify-center shrink-0 text-[#1e2d7d] group-hover:scale-105 transition-transform">
              <Sparkles className="w-10 h-10 text-[#00badb]" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                عرض الأتيلييه المتكامل
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1e2d7d] mb-1">
                باقة الأناقة الكاملة (عباية + فستان + شيلة)
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                احصلي على خصم فوري 20% عند تنسيق طقم الأتيلييه المكتمل مع شيلة ليزر مطابقة وخياطة متقنة.
              </p>
            </div>
          </Link>

          {/* Offer 2 */}
          <Link
            to="/shop"
            className="border border-[#e1e3e4] rounded-xl p-6 flex items-center gap-5 bg-gradient-to-l from-neutral-50 to-white hover:border-[#1e2d7d] transition-all cursor-pointer shadow-2xs text-start group"
          >
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600 group-hover:scale-105 transition-transform">
              <Truck className="w-10 h-10 text-emerald-600" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                شحن سريع ومجاني
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1e2d7d] mb-1">
                شحن مجاني لجميع المحافظات فوق 500 ج.م
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                معاينة القطعة والمقاس عند الاستلام قبل السداد، مع إمكانية الاستبدال الفوري خلال 14 يوماً بكل سهولة.
              </p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default WarehouseValueProps;
