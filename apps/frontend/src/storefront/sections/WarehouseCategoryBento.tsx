import React from 'react';
import { Link } from 'react-router-dom';

export const WarehouseCategoryBento: React.FC = () => {
  return (
    <section className="py-10 bg-[#f3f5f6] border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 text-start">
          
          {/* Big Card 1: Daily Abayas (7 Cols) */}
          <div className="md:col-span-7 relative rounded-xl overflow-hidden bg-[#1e2d7d] text-white min-h-[300px] p-8 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-30 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1000&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="relative z-10 max-w-sm">
              <span className="bg-[#00badb] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-2">
                انسيابية وراحة يومية
              </span>
              <h3 className="text-3xl font-black text-white mb-2">عبايات الكريب والكتان</h3>
              <p className="text-xs text-[#a3afef] mb-4">
                خامات باردة ومسامية مناسبة للعمل والجامعة والمشاوير اليومية مع قصات عملية ومريحة.
              </p>
              <Link
                to="/shop?category=daily-abayas"
                className="text-xs font-extrabold text-[#00badb] hover:text-white flex items-center gap-1"
              >
                <span>تصفحي تشكيلة الدوام</span>
                <span className="rtl:rotate-180">←</span>
              </Link>
            </div>
          </div>

          {/* Big Card 2: Evening / Occasion (5 Cols) */}
          <div className="md:col-span-5 relative rounded-xl overflow-hidden bg-neutral-900 text-white min-h-[300px] p-8 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-35 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="relative z-10">
              <span className="bg-[#ffc220] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-2">
                تفصيل ملكي فاخر
              </span>
              <h3 className="text-2xl font-black text-white mb-1">أزياء السهرة والاستقبال</h3>
              <p className="text-xs text-neutral-300">
                قصات كلوش وبشت ملكية مطرزة بخيوط الحرير وتفاصيل شك يدوي راقية.
              </p>
            </div>
            <Link
              to="/shop?category=evening-abayas"
              className="relative z-10 text-xs font-extrabold text-[#ffc220] hover:text-white flex items-center gap-1"
            >
              <span>تسوقي عبايات المناسبات</span>
              <span className="rtl:rotate-180">←</span>
            </Link>
          </div>

          {/* 3 Lower Tiles (4 Cols each) */}
          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-neutral-800 text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=600&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="relative z-10">
              <h4 className="text-xl font-black text-white mb-1">فساتين محجبات</h4>
              <p className="text-xs text-neutral-300">قصات واسعة مريحة من الكتان والشيفون المبطن.</p>
            </div>
            <Link
              to="/shop?category=modest-dresses"
              className="relative z-10 text-xs font-bold text-white hover:text-[#00badb] flex items-center gap-1"
            >
              <span>تسوقي الفساتين</span>
              <span className="rtl:rotate-180">←</span>
            </Link>
          </div>

          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-neutral-800 text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://images.unsplash.com/photo-1539109136881-3be0616acf4b?w=600&auto=format&fit=crop&q=80')",
              }}
            />
            <div className="relative z-10">
              <h4 className="text-xl font-black text-white mb-1">شيلان وطرح حرير</h4>
              <p className="text-xs text-neutral-300">طرح ليزر ثابتة وشيلان كريب بألوان الموسم.</p>
            </div>
            <Link
              to="/shop?category=scarves"
              className="relative z-10 text-xs font-bold text-white hover:text-[#00badb] flex items-center gap-1"
            >
              <span>تسوقي الطرح</span>
              <span className="rtl:rotate-180">←</span>
            </Link>
          </div>

          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-[#1e2d7d] text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div className="relative z-10">
              <span className="bg-[#ffc220] text-[#16225a] font-black text-[9px] px-2 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-1">
                بوابة المشاغل
              </span>
              <h4 className="text-xl font-black text-white mb-1">باقات الجملة للأتيلييه</h4>
              <p className="text-xs text-[#a3afef]">أسعار توريد مباشرة للمتاجر والمشاغل مع فواتير معتمدة.</p>
            </div>
            <Link
              to="/contact?topic=wholesale"
              className="relative z-10 text-xs font-bold text-[#ffc220] hover:text-white flex items-center gap-1"
            >
              <span>طلب تسعيرة الجملة</span>
              <span className="rtl:rotate-180">←</span>
            </Link>
          </div>

        </div>
      </div>
    </section>
  );
};

export default WarehouseCategoryBento;
