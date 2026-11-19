import React from 'react';

const TOP_RATED = [
  {
    vendor: 'SONY',
    title: 'Sony XB-950B1 Extra Bass Wireless',
    price: '$128.00',
    originalPrice: '$178.00',
    badge: 'Save $50.00',
    reviews: '1 review',
    img: 'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/13261_147__1_2e3211f9-de49-4919-9e67-006800a5c5a0.jpg?width=600',
  },
  {
    vendor: 'YAMAHA',
    title: 'Yamaha WX-030 MusicCast Wireless Speaker',
    price: '$179.95',
    originalPrice: null,
    badge: null,
    reviews: '3 reviews',
    img: 'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/A1Cet8zvhXL._SL1500.jpg?width=600',
  },
  {
    vendor: 'JBL',
    title: 'JBL E55BT Quincy Edition Wireless',
    price: '$159.95',
    originalPrice: '$199.95',
    badge: 'Save $40.00',
    reviews: '1 review',
    img: 'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/E55BT_Quincy_Rose_Hero.jpg?width=600',
  },
  {
    vendor: 'AUDIO-TECHNICA',
    title: 'Audio-Technica ATH-M50x Studio',
    price: '$149.00',
    originalPrice: null,
    badge: null,
    reviews: '12 reviews',
    img: 'https://warehouse-theme-metal.myshopify.com/cdn/shop/products/12678_869__1_1500x_b9a505f9-8986-45bf-a73b-5950c9008349.jpg?width=600',
  },
];

export const WarehouseTopRated: React.FC = () => {
  return (
    <section className="py-12 bg-white border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4]">
          <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">Top-rated products</h2>
          <a href="/shop" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb]">
            View all →
          </a>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {TOP_RATED.map((item, idx) => (
            <div
              key={idx}
              className="border border-[#e1e3e4] rounded-lg p-4 bg-white flex flex-col justify-between hover:border-[#1e2d7d] transition-all"
            >
              <div>
                <div className="relative aspect-square rounded-md overflow-hidden bg-[#f8f9fa] mb-3 flex items-center justify-center p-3">
                  <img src={item.img} alt={item.title} className="max-h-full object-contain" />
                  {item.badge && (
                    <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold text-neutral-500 uppercase block mb-1">
                  {item.vendor}
                </span>
                <h3 className="text-xs font-semibold text-[#1e2d7d] line-clamp-2 mb-1">{item.title}</h3>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-sm font-black text-[#1e2d7d] tabular-nums">{item.price}</span>
                  {item.originalPrice && (
                    <span className="text-xs text-neutral-400 line-through tabular-nums">
                      {item.originalPrice}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[#ffc220] text-xs mb-3">
                  <span>★★★★★</span>
                  <span className="text-[11px] text-neutral-500 font-medium">({item.reviews})</span>
                </div>
              </div>
              <button className="w-full bg-[#1e2d7d] hover:bg-[#16225a] text-white text-xs font-bold py-2 rounded-md transition-colors">
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WarehouseTopRated;
