import React from 'react';
import { useStorefrontTheme } from '../engine/ThemeProvider';

export interface WarehouseBrandsStripProps {
  section?: {
    id?: string;
    type?: string;
    settings?: {
      title?: string;
      [key: string]: unknown;
    };
  };
  settings?: Record<string, unknown>;
}

export const WarehouseBrandsStrip: React.FC<WarehouseBrandsStripProps> = ({ section, settings: propSettings }) => {
  const { theme } = useStorefrontTheme();
  const cfg = { ...section?.settings, ...propSettings };
  const title = (cfg.title as string) || "أقمشة وخامات الأتيلييه المعتمدة";

  const fabrics = [
    { name: "كريب رويال", tagline: "سواد فاحم كوري" },
    { name: "حرير كريب", tagline: "نعومة وانسيابية" },
    { name: "كتان طبيعي", tagline: "مسامي وبارد 100%" },
    { name: "صالونا ياباني", tagline: "مقاوم للتجعد" },
    { name: "شيفون تركي", tagline: "مبطن وخفيف" },
    { name: "مخمل شتوي", tagline: "تطريز حريري" },
    { name: "دانتيل فرنسي", tagline: "لمسات يدوية" },
    { name: "قطن مصري", tagline: "أعلى درجات الراحة" }
  ];

  return (
    <section
      dir="rtl"
      className="relative bg-white py-8 sm:py-10 border-b border-[#e1e3e4]"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-6">
          <h2 className="text-lg sm:text-xl font-black text-[#1e2d7d] tracking-tight">
            {title}
          </h2>
          <p className="text-xs text-[#677279] mt-1">
            نعتمد على أجود أنسجة وخيوط الأتيلييه المختارة لضمان السواد الثابت ومقاومة الانكماش على المدى الطويل
          </p>
        </div>

        {/* Brand Grid (Exact Warehouse Metal Brands Strip) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {fabrics.map((b) => (
            <div
              key={b.name}
              className="flex flex-col items-center justify-center rounded-lg border border-[#e1e3e4] bg-[#f8f9fa] p-3 text-center transition-all duration-200 hover:border-[#1e2d7d] hover:bg-white"
            >
              <span className="font-sans text-sm font-black tracking-tight text-[#1e2d7d]">
                {b.name}
              </span>
              <span className="text-[10px] text-[#677279] mt-0.5">
                {b.tagline}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default WarehouseBrandsStrip;
