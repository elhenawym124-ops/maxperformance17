import React from 'react';

const TAGS = [
  { label: 'Headphones', to: '/shop?category=headphones' },
  { label: 'Speakers', to: '/shop?category=speakers' },
  { label: 'TVs', to: '/shop?category=tvs' },
  { label: 'Turntables', to: '/shop?category=turntables' },
  { label: 'Subwoofers', to: '/shop?category=subwoofers' },
  { label: 'Projectors', to: '/shop?category=projectors' },
];

export const WarehouseSearchedCollections: React.FC = () => {
  return (
    <section className="py-6 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-black text-[#1e2d7d] uppercase tracking-wider mr-2">
          Most searched collections:
        </span>
        {TAGS.map((tag) => (
          <a
            key={tag.label}
            href={tag.to}
            className="bg-[#f8f9fa] hover:bg-neutral-200 text-[#1e2d7d] text-xs font-semibold px-3 py-1 rounded-full border border-[#e1e3e4] transition-colors"
          >
            {tag.label}
          </a>
        ))}
      </div>
    </section>
  );
};

export default WarehouseSearchedCollections;
