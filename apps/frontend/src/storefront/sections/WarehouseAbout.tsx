import React from 'react';

export const WarehouseAbout: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4] text-center">
      <div className="max-w-4xl mx-auto px-4">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#00badb] block mb-2">
          WHO WE ARE
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#1e2d7d] tracking-tight mb-4">
          About Warehouse
        </h2>
        <p className="text-sm text-neutral-600 leading-relaxed max-w-2xl mx-auto">
          Warehouse Metal is a dedicated high-volume consumer hardware depot connecting audiophiles, home cinema enthusiasts, and commercial venues directly with Tier-1 brand manufacturing pipelines. We bypass intermediary markups to deliver authentic electronics with ironclad warranties.
        </p>
      </div>
    </section>
  );
};

export default WarehouseAbout;
