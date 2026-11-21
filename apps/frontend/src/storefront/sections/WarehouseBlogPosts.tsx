import React from 'react';
import { Link } from 'react-router-dom';

const ARTICLES = [
  {
    title: 'دليلك الشامل للعناية بأقمشة الكريب الملكي وغسيل العبايات المطرزة',
    excerpt: 'خطوات عملية مجربة للحفاظ على سواد العباية الداكن ولمعان التطريز اليدوي لسنوات طويلة دون بهتان.',
    author: 'خبراء الأتيلييه',
    date: 'موسم 2026',
    img: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'كيف تختارين قصة العباية الأنسب لقوامك (الكلوش، البشت، والمستقيمة)',
    excerpt: 'قواعد تنسيق المقاسات والقصات الهندسية التي تمنحك انسيابية وراحة وأناقة محتشمة في كل المناسبات.',
    author: 'فريق التصميم',
    date: 'موسم 2026',
    img: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=800&auto=format&fit=crop&q=80',
  },
  {
    title: 'أحدث صيحات ألوان شيلان الحرير والكتان وطرق تنسيقها اليومية',
    excerpt: 'أسرار تنسيق درجات ألوان الطرح والشيلان الهادئة مع العباءة السوداء لإطلالة عصرية ومتزنة.',
    author: 'مستشارة الأناقة',
    date: 'موسم 2026',
    img: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=80',
  },
];

export const WarehouseBlogPosts: React.FC = () => {
  return (
    <section className="py-12 bg-[#f8f9fa] border-b border-[#e1e3e4]" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-start">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-[#e1e3e4]">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-[#1e2d7d] tracking-tight">
              مقالات ومدونة الأتيلييه
            </h2>
            <span className="text-xs text-neutral-500">
              نصائح متخصصة في اختيار وتنسيق ورعاية أقمشة العبايات والأزياء المحتشمة
            </span>
          </div>
          <Link to="/blog" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1">
            <span>عرض كل المقالات</span>
            <span className="rtl:rotate-180">←</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {ARTICLES.map((art, idx) => (
            <article
              key={idx}
              className="bg-white border border-[#e1e3e4] rounded-xl overflow-hidden hover:border-[#1e2d7d] hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                <div className="aspect-video overflow-hidden bg-neutral-100">
                  <img
                    src={art.img}
                    alt={art.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 mb-2">
                    <span>{art.author}</span>
                    <span>·</span>
                    <span>{art.date}</span>
                  </div>
                  <h3 className="text-base font-bold text-[#1e2d7d] mb-2 leading-snug hover:text-[#00badb] cursor-pointer">
                    {art.title}
                  </h3>
                  <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">{art.excerpt}</p>
                </div>
              </div>
              <div className="px-5 pb-5 pt-0">
                <Link to="/blog" className="text-xs font-bold text-[#1e2d7d] hover:text-[#00badb] flex items-center gap-1">
                  <span>قراءة المقال</span>
                  <span className="rtl:rotate-180">←</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WarehouseBlogPosts;
