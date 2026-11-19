import React from 'react';

export const WarehouseNewTVs: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Editorial Promo Card (4 Cols) */}
          <div className="lg:col-span-4 bg-[#1e2d7d] text-white rounded-xl p-8 flex flex-col justify-between shadow-xs relative overflow-hidden">
            <div className="absolute -right-8 -bottom-8 w-48 h-48 bg-[#00badb]/10 rounded-full blur-2xl" />
            <div>
              <span className="bg-[#00badb] text-[#16225a] font-black text-xs px-2.5 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-3">
                EXPERT SELECTION
              </span>
              <h2 className="text-3xl font-black text-white mb-3 tracking-tight">New TVs</h2>
              <p className="text-sm text-[#a3afef] leading-relaxed mb-6">
                Here is our selection of new TVs on the market, handpicked and calibrated by our Warehouse video engineers.
              </p>
            </div>
            <a
              href="/shop?category=tvs"
              className="bg-[#00badb] hover:bg-[#00a0bd] text-[#16225a] font-extrabold text-xs px-6 py-3 rounded-md text-center shadow-xs transition-all self-start"
            >
              Shop All TVs →
            </a>
          </div>

          {/* Right 3-TV Product Cards (8 Cols) */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* TV 1 */}
            <div className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] transition-all">
              <div>
                <div className="relative aspect-video rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-2">
                  <img
                    src="https://warehouse-theme-metal.myshopify.com/cdn/shop/products/sonyxbr55front_f72cc8ff-fcd6-4141-b9cc-e1320f867785.jpg?width=600"
                    alt="Sony XBR-950G"
                    className="max-h-full object-contain"
                  />
                  <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                    Save $800
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">SONY</span>
                <h3 className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-1">
                  Sony XBR-950G BRAVIA 4K HDR
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-black text-[#1e2d7d] tabular-nums">$1,398.00</span>
                  <span className="text-[11px] text-neutral-400 line-through tabular-nums">$2,198.00</span>
                </div>
              </div>
              <button className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2 rounded-md transition-colors">
                Add to Cart
              </button>
            </div>

            {/* TV 2 */}
            <div className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] transition-all">
              <div>
                <div className="relative aspect-video rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-2">
                  <img
                    src="https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16194_250__1_cee96397-0276-4480-9361-6640fdb80b54.jpg?width=600"
                    alt="Sony XBR-65A1E"
                    className="max-h-full object-contain"
                  />
                  <span className="absolute top-2 left-2 bg-[#1e2d7d] text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                    OLED
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">SONY</span>
                <h3 className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-1">
                  Sony XBR-65A1E 65" 4K Smart OLED
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-black text-[#1e2d7d] tabular-nums">$2,498.00</span>
                  <span className="text-[11px] text-neutral-400 line-through tabular-nums">$2,998.00</span>
                </div>
              </div>
              <button className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2 rounded-md transition-colors">
                Add to Cart
              </button>
            </div>

            {/* TV 3 */}
            <div className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] transition-all">
              <div>
                <div className="relative aspect-video rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-2">
                  <img
                    src="https://warehouse-theme-metal.myshopify.com/cdn/shop/products/16187_668__1_689b6c81-9210-43af-b9a7-722d4054370f.jpg?width=600"
                    alt="Sony KD55X720E"
                    className="max-h-full object-contain"
                  />
                  <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded">
                    HOT
                  </span>
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">SONY</span>
                <h3 className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-1">
                  Sony KD55X720E 55" Smart 4K
                </h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-sm font-black text-[#1e2d7d] tabular-nums">$698.00</span>
                  <span className="text-[11px] text-neutral-400 line-through tabular-nums">$898.00</span>
                </div>
              </div>
              <button className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2 rounded-md transition-colors">
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseNewTVs;
