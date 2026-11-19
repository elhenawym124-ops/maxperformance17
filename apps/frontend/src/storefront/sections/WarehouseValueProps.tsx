import React from 'react';

export const WarehouseValueProps: React.FC = () => {
  return (
    <section className="py-6 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Offer 1 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 flex items-center gap-5 bg-gradient-to-r from-neutral-50 to-white hover:border-[#1e2d7d] transition-all cursor-pointer shadow-2xs">
            <img
              src="https://warehouse-theme-metal.myshopify.com/cdn/shop/files/offer-1_2x_6ba50f80-1d2d-4361-a867-05ca0f32413c.jpg?width=300"
              alt="JBL Offers"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block mb-1">
                SPECIAL PROMOTION
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1e2d7d] mb-1">
                Exclusive offers on JBL products
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We offer you steep discounts on all our JBL portable speakers, including JBL Clip 3, JBL Flip 4, and JBL Link 20!
              </p>
            </div>
          </div>

          {/* Offer 2 */}
          <div className="border border-[#e1e3e4] rounded-xl p-6 flex items-center gap-5 bg-gradient-to-r from-neutral-50 to-white hover:border-[#1e2d7d] transition-all cursor-pointer shadow-2xs">
            <img
              src="https://warehouse-theme-metal.myshopify.com/cdn/shop/files/offer-2_2x_26b533cd-d17a-43fe-97c8-8d0af50a398c.jpg?width=300"
              alt="Free shipping"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain shrink-0"
            />
            <div>
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">
                EXPEDITED FULFILLMENT
              </span>
              <h3 className="text-base sm:text-lg font-black text-[#1e2d7d] mb-1">
                Free shipping for all orders over $80
              </h3>
              <p className="text-xs text-neutral-500 leading-relaxed">
                We got you covered! We deliver your goods using UPS expedited shipping within 48 hours nationwide.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseValueProps;
