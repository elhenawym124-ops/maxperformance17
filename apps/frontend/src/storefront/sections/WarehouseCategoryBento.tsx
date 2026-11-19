import React from 'react';

export const WarehouseCategoryBento: React.FC = () => {
  return (
    <section className="py-10 bg-[#f3f5f6] border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
          {/* Big Card 1: Bluetooth Audio (7 Cols) */}
          <div className="md:col-span-7 relative rounded-xl overflow-hidden bg-[#1e2d7d] text-white min-h-[300px] p-8 flex flex-col justify-between group shadow-xs">
            <img
              src="https://warehouse-theme-metal.myshopify.com/cdn/shop/files/bluetooth-red_f7adb5c3-0506-4481-b8ee-aa20422d1d2f.png?width=800"
              alt="Bluetooth"
              className="absolute right-0 bottom-0 h-full w-2/3 object-contain object-right-bottom group-hover:scale-105 transition-transform duration-500 pointer-events-none"
            />
            <div className="relative z-10 max-w-xs">
              <span className="bg-[#00badb] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-2">
                WIRELESS FREEDOM
              </span>
              <h3 className="text-3xl font-black text-white mb-2">Bluetooth Audio</h3>
              <p className="text-xs text-[#a3afef] mb-4">Waterproof party speakers and ultra-compact pocket sound systems.</p>
              <a href="/shop?category=bluetooth" className="text-xs font-extrabold text-[#00badb] hover:text-white flex items-center gap-1">
                <span>Explore Bluetooth →</span>
              </a>
            </div>
          </div>

          {/* Big Card 2: Professional Audio (5 Cols) */}
          <div className="md:col-span-5 relative rounded-xl overflow-hidden bg-neutral-900 text-white min-h-[300px] p-8 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://warehouse-theme-metal.myshopify.com/cdn/shop/files/mosaic-audio_04cd57f4-2a11-47e3-bd88-0231bc0618f0.jpg?width=800')",
              }}
            />
            <div className="relative z-10">
              <span className="bg-[#ffc220] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded-xs uppercase tracking-wider inline-block mb-2">
                STUDIO GRADE
              </span>
              <h3 className="text-2xl font-black text-white mb-1">Professional Audio</h3>
              <p className="text-xs text-neutral-300">Mixers, studio monitors, DAC converters & master microphones.</p>
            </div>
            <a href="/shop?category=pro-audio" className="relative z-10 text-xs font-extrabold text-[#ffc220] hover:text-white flex items-center gap-1">
              <span>Shop Pro Audio →</span>
            </a>
          </div>

          {/* 3 Lower Tiles (4 Cols each) */}
          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-neutral-800 text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div
              className="absolute inset-0 bg-cover bg-center opacity-45 group-hover:scale-105 transition-transform duration-500"
              style={{
                backgroundImage:
                  "url('https://warehouse-theme-metal.myshopify.com/cdn/shop/files/mosaic-headphones.jpg?width=1100')",
              }}
            />
            <div className="relative z-10">
              <h4 className="text-xl font-black text-white mb-1">Headphones</h4>
              <p className="text-xs text-neutral-300">Over-ear & in-ear audiophile acoustic drivers.</p>
            </div>
            <a href="/shop?category=headphones" className="relative z-10 text-xs font-bold text-[#00badb]">
              View Selection →
            </a>
          </div>

          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1e2d7d] to-[#16225a] text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div className="relative z-10">
              <span className="text-[10px] text-[#00badb] font-bold uppercase tracking-wider block mb-1">
                ESSENTIAL GEAR
              </span>
              <h4 className="text-xl font-black text-white mb-1">Audio Accessories</h4>
              <p className="text-xs text-[#a3afef]">Gold-plated cables, optical connectors & wall mounts.</p>
            </div>
            <a href="/shop?category=accessories" className="relative z-10 text-xs font-bold text-white">
              Browse Accessories →
            </a>
          </div>

          <div className="md:col-span-4 relative rounded-xl overflow-hidden bg-neutral-900 text-white min-h-[220px] p-6 flex flex-col justify-between group shadow-xs">
            <div className="relative z-10">
              <span className="text-[10px] text-[#ffc220] font-bold uppercase tracking-wider block mb-1">
                HOME CINEMA
              </span>
              <h4 className="text-xl font-black text-white mb-1">4K Projectors</h4>
              <p className="text-xs text-neutral-300">Laser ultra-short-throw 150" cinema projectors.</p>
            </div>
            <a href="/shop?category=projectors" className="relative z-10 text-xs font-bold text-[#ffc220]">
              Shop Projectors →
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseCategoryBento;
