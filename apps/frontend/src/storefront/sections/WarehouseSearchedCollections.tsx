import React from 'react';
import { Link } from 'react-router-dom';

const TAGS = [
  { label: 'عبايات سوداء ملكية', to: '/shop?category=black-abayas' },
  { label: 'عبايات كلوش واستقبال', to: '/shop?category=colored-abayas' },
  { label: 'فساتين محجبات خروج', to: '/shop?category=modest-dresses' },
  { label: 'شيلان وطرح حرير ليزر', to: '/shop?category=scarves' },
  { label: 'أطقم بشت رسمية', to: '/shop?category=bisht-sets' },
  { label: 'باقات الجملة للأتيلييه', to: '/shop?filter=wholesale' },
];

export const WarehouseSearchedCollections: React.FC = () => {
  return (
    <section className="py-6 bg-white border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-black text-[#1e2d7d] uppercase tracking-wider ms-2">
          الأقسام الأكثر بحثاً:
        </span>
        {TAGS.map((tag) => (
          <Link
            key={tag.label}
            to={tag.to}
            className="bg-[#f8f9fa] hover:bg-neutral-200 text-[#1e2d7d] text-xs font-semibold px-3 py-1 rounded-full border border-[#e1e3e4] transition-colors"
          >
            {tag.label}
          </Link>
        ))}
      </div>
    </section>
  );
};

export default WarehouseSearchedCollections;
