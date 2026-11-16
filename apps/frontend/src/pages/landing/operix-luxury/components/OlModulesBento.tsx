import React from "react";
import { Check, ShoppingCart, Package, Truck, MessageSquare } from "lucide-react";
import { OL_MODULES } from "../data";

const MODULE_ICONS: Record<string, React.ReactNode> = {
  "order-confirmation": <ShoppingCart className="w-5 h-5 text-[#3fffba]" />,
  "live-inventory": <Package className="w-5 h-5 text-[#3fffba]" />,
  "shipping-engine": <Truck className="w-5 h-5 text-[#3fffba]" />,
  "omnichannel-inbox": <MessageSquare className="w-5 h-5 text-[#3fffba]" />,
};

const MODULE_IMAGES: Record<string, string> = {
  "order-confirmation": "/operix-assets/maxp-screens/maxp-orders.webp",
  "live-inventory": "/operix-assets/maxp-screens/maxp-inventory.webp",
  "shipping-engine": "/operix-assets/maxp-screens/maxp-shipping.webp",
  "omnichannel-inbox": "/operix-assets/maxp-screens/maxp-dashboard.webp",
};

export const OlModulesBento: React.FC = () => {
  return (
    <section id="modules" className="py-24 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#013735]/6 border border-[#013735]/10 text-xs font-semibold text-[#013735] mb-4">
            <span>وحدات النظام التنفيذية</span>
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#013735] tracking-tight leading-tight">
            بنية تشغيل متكاملة لنمو متجرك
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#4e6362] leading-relaxed font-normal">
            أربع ركائز رئيسية مترابطة تمنحك السيطرة المطلقة على كل شحنة ومخزن وتحصيل مالي.
          </p>
        </div>

        {/* Asymmetrical Bento Grid with Dense Flow */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 grid-flow-dense">
          {OL_MODULES.map((mod) => (
            <div
              key={mod.id}
              className={`${mod.colSpan} p-6 sm:p-8 rounded-2xl bg-white border border-[#013735]/8 shadow-[0_4px_20px_rgba(1,55,53,0.04)] hover:shadow-[0_12px_32px_rgba(1,55,53,0.08)] hover:border-[#013735]/20 transition-all duration-300 flex flex-col justify-between group`}
            >
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-xl bg-[#013735] flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                    {MODULE_ICONS[mod.id]}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] px-2.5 py-1 rounded-full bg-[#f0f5f3] text-[#013735] font-bold border border-[#013735]/8">
                      {mod.badge}
                    </span>
                    <span className="text-xs font-mono tabular-nums font-bold text-[#02817d] bg-[#3fffba]/20 px-2 py-0.5 rounded-md">
                      {mod.metric}
                    </span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-[#013735] mb-2">
                  {mod.title}
                </h3>

                <p className="text-sm text-[#4e6362] leading-relaxed font-normal mb-4">
                  {mod.description}
                </p>

                <div className="space-y-2 border-t border-[#013735]/8 pt-4 mb-6">
                  {mod.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-[#072524]">
                      <Check className="w-3.5 h-3.5 text-[#22c790] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Module Stage Screenshot */}
              <div className="ol-bento-stage overflow-hidden rounded-xl border border-[#013735]/10 bg-[#f0f5f3]/50">
                <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[#013735]/6 bg-white/70">
                  <span className="w-2 h-2 rounded-full bg-rose-400/80" />
                  <span className="w-2 h-2 rounded-full bg-amber-400/80" />
                  <span className="w-2 h-2 rounded-full bg-emerald-400/80" />
                  <span className="text-[10px] text-[#4e6362] font-mono mr-2">
                    {mod.metricLabel}
                  </span>
                </div>

                <img
                  src={MODULE_IMAGES[mod.id]}
                  alt={mod.title}
                  className="w-full h-44 object-cover object-top transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
