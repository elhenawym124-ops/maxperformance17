import React from 'react';
import { Link } from 'react-router-dom';

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
    title: 'عبايات كريب ملكية',
    subtitle: 'عروض حصرية على العبايات الكلاسيكية والكلوش. خصم 200 ج.م على كل قطعة.',
    tag: 'عرض لفترة محدودة',
    link: '/shop?category=abayas',
    gradient: 'linear-gradient(135deg, #1e2d7d 0%, #16225a 100%)',
  },
  {
    title: 'فساتين محجبات راقية',
    subtitle: 'قصات محتشمة مريحة من الكتان والشيفون المبطن بتصاميم عصرية.',
    tag: 'خامات طبيعية فاخرة',
    link: '/shop?category=dresses',
    gradient: 'linear-gradient(135deg, #7b1fa2 0%, #4a148c 100%)',
  },
  {
    title: 'طرح وشيلان حرير',
    subtitle: 'تشكيلة شيلان كريب وحرير ليزر ثابتة بألوان الموسم. خصم حتى 25%!',
    tag: 'خصم حتى 25%',
    link: '/shop?category=scarves',
    gradient: 'linear-gradient(135deg, #0097a7 0%, #006064 100%)',
  },
];

export const WarehousePromoMosaic: React.FC<WarehousePromoMosaicProps> = ({ cards = DEFAULT_CARDS }) => {
  return (
    <section className="py-6 bg-[#f3f5f6] border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {cards.map((card, idx) => (
            <Link
              key={idx}
              to={card.link}
              className="relative rounded-xl overflow-hidden p-6 text-white flex flex-col justify-between min-h-[190px] shadow-xs group cursor-pointer transition-transform hover:-translate-y-0.5 text-start"
              style={{ background: card.gradient }}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-white/80 block mb-1">
                  {card.tag}
                </span>
                <h3 className="text-2xl font-black text-white mb-1 tracking-tight">{card.title}</h3>
                <p className="text-xs text-white/90 max-w-[240px] leading-relaxed">{card.subtitle}</p>
              </div>
              <div className="text-xs font-bold text-white flex items-center gap-1 group-hover:translate-x-[-4px] transition-transform pt-4">
                <span>تصفحي {card.title}</span>
                <span className="rtl:rotate-180">←</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WarehousePromoMosaic;
