import React from 'react';
import { MapPin, Clock, Phone } from 'lucide-react';

export const WarehouseOurStores: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        <div className="pb-4 mb-6 border-b border-[#e1e3e4]">
          <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">
            فروعنا ومعارض الأتيلييه
          </h2>
          <span className="text-xs text-neutral-500">
            تفضلي بزيارة صالات العرض والقياس لمعاينة وتجربة أرقى تصاميم العبايات والأزياء المحتشمة
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store 1 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 bg-[#f8f9fa] flex flex-col justify-between">
            <div>
              <span className="bg-[#1e2d7d] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-3">
                الفرع الرئيسي وصالة العرض
              </span>
              <h3 className="text-lg font-black text-[#1e2d7d] mb-1">
                معرض أتيلييه التجمع الخامس
              </h3>
              <p className="text-xs text-neutral-600 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00badb] shrink-0" />
                <span>شارع التسعين الشمالي، التجمع الخامس، القاهرة الجديدة</span>
              </p>

              <div className="text-xs text-neutral-600 space-y-1 mb-4">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>السبت - الخميس:</strong> 10:00 ص - 10:00 م</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>الجمعة:</strong> 1:00 م - 10:00 م</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>الهاتف:</strong> 01000000000 / 19000</span>
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">● مفتوح اليوم ومتاح غرف قياس</span>
              <a href="#stores" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] underline">
                الاتجاهات على الخريطة ←
              </a>
            </div>
          </div>

          {/* Store 2 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 bg-[#f8f9fa] flex flex-col justify-between">
            <div>
              <span className="bg-[#00badb] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-3">
                فرع الإسكندرية ومركز القياسات
              </span>
              <h3 className="text-lg font-black text-[#1e2d7d] mb-1">
                بوتيك أتيلييه سموحة
              </h3>
              <p className="text-xs text-neutral-600 mb-3 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#00badb] shrink-0" />
                <span>شارع فوزي معاذ، سموحة، الإسكندرية</span>
              </p>

              <div className="text-xs text-neutral-600 space-y-1 mb-4">
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>طوال أيام الأسبوع:</strong> 11:00 ص - 9:00 م</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>الجمعة:</strong> 2:00 م - 9:30 م</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span><strong>الهاتف:</strong> 01200000000</span>
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">● مفتوح اليوم ومتاح غرف قياس</span>
              <a href="#stores" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] underline">
                الاتجاهات على الخريطة ←
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseOurStores;
