import React, { useState } from 'react';

const IMAGES = [
  'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16047_417__1_dcd9694a-a473-46e8-9368-d0aaadbce069.jpg?width=800',
  'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16047_950__3_a18a25dd-5fce-4ca3-95ca-377426c84175.jpg?width=800',
  'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16047_177__4_8b5dec2f-32d6-441d-ac14-c259debeb4b6.jpg?width=800',
  'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16047_212__2_b04238d0-08da-4319-8cdd-893df4bc15ef.jpg?width=800',
];

const COLORS = [
  { name: 'Black', hex: '#111827' },
  { name: 'Camo Green', hex: '#4d5d53' },
  { name: 'Grey', hex: '#9ca3af' },
  { name: 'Pink', hex: '#f472b6' },
  { name: 'Red', hex: '#dc2626' },
  { name: 'Sand', hex: '#d6c4a5' },
  { name: 'Teal', hex: '#0d9488' },
  { name: 'White', hex: '#f8fafc' },
  { name: 'Yellow', hex: '#eab308' },
];

export const WarehouseFeaturedProduct: React.FC = () => {
  const [activeImg, setActiveImg] = useState(IMAGES[0]);
  const [selectedColor, setSelectedColor] = useState('Black');
  const [qty, setQty] = useState(1);

  return (
    <section className="py-14 bg-[#f8f9fa] border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-3 mb-6 border-b border-[#e1e3e4]">
          <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">Featured product</h2>
          <a href="/shop" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb]">
            View details →
          </a>
        </div>

        <div className="bg-white border border-[#e1e3e4] rounded-2xl p-6 sm:p-10 shadow-2xs grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left: Image Gallery (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col sm:flex-row-reverse gap-4">
            <div className="flex-1 aspect-square rounded-xl bg-[#f8f9fa] border border-[#e1e3e4] overflow-hidden flex items-center justify-center p-6 relative">
              <img
                src={activeImg}
                alt="JBL Clip 3"
                className="max-h-full max-w-full object-contain transition-transform duration-300 hover:scale-105"
              />
              <span className="absolute top-3 left-3 bg-red-600 text-white text-xs font-black px-2.5 py-1 rounded shadow-2xs">
                Save $20.00
              </span>
            </div>

            <div className="flex sm:flex-col gap-2 shrink-0">
              {IMAGES.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(img)}
                  className={`w-16 h-16 rounded-lg p-1 flex items-center justify-center cursor-pointer transition-all ${
                    activeImg === img
                      ? 'border-2 border-[#1e2d7d] bg-white'
                      : 'border border-[#e1e3e4] bg-[#f8f9fa] hover:border-[#1e2d7d]'
                  }`}
                >
                  <img src={img} alt={`thumb-${idx}`} className="max-h-full object-contain" />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Purchasing Panel (6 Cols) */}
          <div className="lg:col-span-6 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-neutral-500 uppercase tracking-widest">JBL</span>
                <span className="text-xs text-neutral-400">·</span>
                <span className="text-xs text-neutral-500 font-mono">SKU: JBL-580619-CLI-BL</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black text-[#1e2d7d] leading-tight mb-2 tracking-tight">
                JBL Clip 3 Portable Waterproof Wireless Bluetooth Speaker
              </h1>

              <div className="flex items-center gap-2 text-[#ffc220] text-sm mb-4">
                <span>★★★★★</span>
                <span className="text-xs text-neutral-500 font-medium">3 reviews</span>
                <span className="text-neutral-300">|</span>
                <span className="text-xs text-[#00badb] font-bold cursor-pointer">Write a review</span>
              </div>

              <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-[#e1e3e4]">
                <span className="text-2xl sm:text-3xl font-black text-[#1e2d7d] tabular-nums">$39.95</span>
                <span className="text-sm text-neutral-400 line-through tabular-nums">$59.95</span>
                <span className="bg-red-100 text-red-700 text-xs font-black px-2 py-0.5 rounded">SAVE 33%</span>
              </div>

              {/* Color Swatch Selector */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-xs font-bold text-neutral-700 mb-2">
                  <span>
                    Color: <span className="text-[#1e2d7d]">{selectedColor}</span>
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {COLORS.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setSelectedColor(col.name)}
                      className={`w-6 h-6 rounded-full transition-all cursor-pointer ${
                        selectedColor === col.name
                          ? 'ring-2 ring-[#1e2d7d] ring-offset-2 scale-110'
                          : 'ring-1 ring-neutral-300'
                      }`}
                      style={{ backgroundColor: col.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Inventory Indicator */}
              <div className="space-y-1.5 mb-5 p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <div className="flex items-center justify-between text-xs font-bold text-emerald-800">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse" />
                    In stock, 34 units remaining
                  </span>
                  <span className="font-mono text-[11px]">Depot Ready</span>
                </div>
                <div className="w-full bg-emerald-200/50 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-emerald-600 h-full rounded-full" style={{ width: '45%' }} />
                </div>
              </div>

              {/* Quantity & Dual CTAs */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
                <div className="flex items-center border border-[#e1e3e4] rounded-lg bg-neutral-50 px-2 py-1 shrink-0">
                  <button
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 flex items-center justify-center font-black text-neutral-600 hover:text-black cursor-pointer"
                  >
                    -
                  </button>
                  <span className="w-8 text-center text-xs font-black tabular-nums">{qty}</span>
                  <button
                    onClick={() => setQty((q) => q + 1)}
                    className="w-8 h-8 flex items-center justify-center font-black text-neutral-600 hover:text-black cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <button className="flex-1 bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-extrabold py-3.5 px-6 rounded-lg shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer">
                  <span>Add to Cart</span>
                </button>

                <button className="flex-1 bg-[#00badb] hover:bg-[#00a0bd] text-[#16225a] text-xs font-black py-3.5 px-6 rounded-lg shadow-xs transition-all flex items-center justify-center cursor-pointer">
                  <span>Buy it now</span>
                </button>
              </div>
            </div>

            {/* Bottom Micro-Trust */}
            <div className="pt-4 border-t border-[#e1e3e4] flex items-center justify-between text-xs text-neutral-500">
              <span className="flex items-center gap-1.5 font-medium">
                <span className="text-emerald-600 font-bold">✓</span> Free 48h UPS delivery
              </span>
              <div className="flex items-center gap-3 text-neutral-400">
                <span className="text-[11px]">Share:</span>
                <span className="hover:text-[#1e2d7d] cursor-pointer">Facebook</span>
                <span className="hover:text-[#1e2d7d] cursor-pointer">Twitter</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseFeaturedProduct;
