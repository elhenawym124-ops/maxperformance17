import React from 'react';
import { Truck, RotateCcw, Headphones, ShieldCheck } from 'lucide-react';

export const WarehouseStaticTrust: React.FC = () => {
  return (
    <section className="py-8 bg-[#f8f9fa] border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[#1e2d7d]">
          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <Truck className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">شحن مجاني لجميع المحافظات</h4>
              <p className="text-[11px] text-neutral-500">للطلبات فوق 500 ج.م مع معاينة قبل الاستلام</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">ضمان الاستبدال السلس</h4>
              <p className="text-[11px] text-neutral-500">استبدال فوري للمقاس خلال 14 يوماً</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <Headphones className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">دعم واستشارات القياسات</h4>
              <p className="text-[11px] text-neutral-500">تواصل مباشر هاتفياً وعبر واتساب 19000</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#00badb]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">طرق دفع مرنة وآمنة</h4>
              <p className="text-[11px] text-neutral-500">كاش عند الاستلام، إنستاباي، ميزة، وفيزا</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseStaticTrust;
