import React from 'react';

export const WarehouseOurStores: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="pb-4 mb-6 border-b border-[#e1e3e4]">
          <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">Our stores</h2>
          <span className="text-xs text-neutral-500">Visit our certified regional showrooms and listening depots</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Store 1 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 bg-[#f8f9fa] flex flex-col justify-between">
            <div>
              <span className="bg-[#1e2d7d] text-white text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-3">
                MAIN REGIONAL HUB
              </span>
              <h3 className="text-lg font-black text-[#1e2d7d] mb-1">HiDEF Lifestyle Home Theater Store</h3>
              <p className="text-xs text-neutral-600 mb-3">6195 Allentown Blvd, Harrisburg, PA 17112, USA</p>

              <div className="text-xs text-neutral-600 space-y-1 mb-4">
                <p>
                  <strong>Monday - Friday:</strong> 9AM - 7PM
                </p>
                <p>
                  <strong>Saturday:</strong> 9AM - 5PM
                </p>
                <p>
                  <strong>Sunday:</strong> Closed
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">● Open today</span>
              <a href="#stores" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] underline">
                Get directions →
              </a>
            </div>
          </div>

          {/* Store 2 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 bg-[#f8f9fa] flex flex-col justify-between">
            <div>
              <span className="bg-[#00badb] text-[#16225a] font-black text-[10px] px-2 py-0.5 rounded uppercase tracking-wider inline-block mb-3">
                SHOWROOM & LAB
              </span>
              <h3 className="text-lg font-black text-[#1e2d7d] mb-1">HiDEF Acoustic Showroom</h3>
              <p className="text-xs text-neutral-600 mb-3">Allentown Blvd, Pennsylvania, USA</p>

              <div className="text-xs text-neutral-600 space-y-1 mb-4">
                <p>
                  <strong>Monday - Friday:</strong> 10AM - 9PM
                </p>
                <p>
                  <strong>Saturday:</strong> 10AM - 6PM
                </p>
                <p>
                  <strong>Sunday:</strong> 11AM - 5PM
                </p>
              </div>
            </div>
            <div className="pt-3 border-t border-[#e1e3e4] flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-700">● Open today</span>
              <a href="#stores" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] underline">
                Get directions →
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseOurStores;
