import React from 'react';

interface PromoCard {
  title: string;
  subtitle: string;
  tag: string;
  link: string;
  gradient: string;
}

interface WarehousePromoMosaicProps {
  cards?: PromoCard[];
}

const DEFAULT_CARDS: PromoCard[] = [
  {
    title: 'OLED TVs',
    subtitle: 'Exclusive offers on TVs until Dec 31. $100 off on every purchase',
    tag: 'LIMITED TIME OFFER',
    link: '/shop?category=tvs',
    gradient: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
  },
  {
    title: 'Speakers',
    subtitle: 'Explore our range of high-quality speakers & subwoofers.',
    tag: 'ACOUSTIC MASTERY',
    link: '/shop?category=speakers',
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)',
  },
  {
    title: 'Headphones',
    subtitle: 'Discover our new noise-cancelling headphones. Up to 25% Off!',
    tag: 'UP TO 25% OFF',
    link: '/shop?category=headphones',
    gradient: 'linear-gradient(135deg, #0097a7 0%, #006064 100%)',
  },
];

export const WarehousePromoMosaic: React.FC<WarehousePromoMosaicProps> = ({ cards = DEFAULT_CARDS }) => {
  return (
    <section className="py-6 bg-[#f3f5f6] border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, idx) => (
            <div
              key={idx}
              className="relative rounded-xl overflow-hidden p-6 text-white flex flex-col justify-between min-h-[190px] shadow-xs group cursor-pointer transition-transform hover:-translate-y-0.5"
              style={{ background: card.gradient }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 block mb-1">
                  {card.tag}
                </span>
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{card.title}</h3>
                <p className="text-xs text-white/90 max-w-[220px] leading-relaxed">{card.subtitle}</p>
              </div>
              <a
                href={card.link}
                className="text-xs font-bold text-white flex items-center gap-1 group-hover:translate-x-1 transition-transform pt-4"
              >
                <span>Shop {card.title}</span>
                <span>→</span>
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WarehousePromoMosaic;
