import React from 'react';

export const WarehouseStaticTrust: React.FC = () => {
  return (
    <section className="py-8 bg-[#f8f9fa] border-b border-[#e1e3e4]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-[#1e2d7d]">
          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#00badb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">Free delivery for $80+ orders</h4>
              <p className="text-[11px] text-neutral-500">We deliver in 48 hours max!</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#00badb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 15v-1a4 4 0 00-4-4H8m0 0l3 3m-3-3l3-3m9 14V5a2 2 0 00-2-2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">Satisfied or refunded</h4>
              <p className="text-[11px] text-neutral-500">Free returns within 14 days</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#00badb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">We are available 24/7</h4>
              <p className="text-[11px] text-neutral-500">Contact us by chat, mail, phone</p>
            </div>
          </div>

          <div className="flex items-center gap-3.5 bg-white p-4 rounded-xl border border-[#e1e3e4] shadow-2xs">
            <div className="w-10 h-10 rounded-lg bg-[#1e2d7d]/5 text-[#1e2d7d] flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-[#00badb]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#1e2d7d]">100% Secure payments</h4>
              <p className="text-[11px] text-neutral-500">Visa, Mastercard, Amex, PayPal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WarehouseStaticTrust;
