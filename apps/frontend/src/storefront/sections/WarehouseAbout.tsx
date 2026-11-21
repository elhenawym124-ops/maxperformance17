import React from 'react';

export const WarehouseAbout: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4] text-center" dir="rtl">
      <div className="max-w-4xl mx-auto px-4">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00badb] block mb-2">
          من نحن
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1e2d7d] tracking-tight mb-4">
          أتيلييه ويرهاوس — أصالة التصميم ودقة التفصيل الملكي
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
          أتيلييه ويرهاوس هو المركز المتخصص في تصميم وإنتاج أرقى العبايات والأزياء المحتشمة بأسعار المشغل المباشرة. نعتمد على أجود أقمشة الكريب والحرير والكتان الطبيعي بتطريز متقن وتفصيل دقيق، مع توفير باقات مخصصة للأفراد والمشاغل والمتاجر في كافة المحافظات مع ضمان الاستبدال والمعاينة.
        </p>
      </div>
    </section>
  );
};

export default WarehouseAbout;
