import React from "react";
import { User, MessageCircle, Send, ExternalLink, Phone } from "lucide-react";

interface ServiceOrderCustomerCardProps {
  order: any;
  waDetection: any;
  onOpenWhatsAppModal: () => void;
  onOpenInternalChat: () => void;
  onOpenExternalWhatsApp: () => void;
}

export const ServiceOrderCustomerCard: React.FC<ServiceOrderCustomerCardProps> = ({
  order,
  waDetection,
  onOpenWhatsAppModal,
  onOpenInternalChat,
  onOpenExternalWhatsApp,
}) => {
  return (
    <div className="bg-card rounded-xl border border-border dark:border-border p-4 sm:p-5 shadow-xs space-y-4">
      <h3 className="text-sm font-bold text-foreground flex items-center gap-2 pb-2 border-b border-border dark:border-border">
        <User className="w-4 h-4 text-primary-600" />
        العميل والتواصل الذكي
      </h3>

      <div className="space-y-2">
        <div>
          <span className="text-[11px] text-muted-foreground block">اسم العميل</span>
          <p className="text-sm font-bold text-foreground">
            {order.customerName}
          </p>
        </div>

        <div>
          <span className="text-[11px] text-muted-foreground block">رقم الهاتف</span>
          <p
            className="text-sm font-semibold text-foreground dark:text-muted-foreground tabular-nums"
            dir="ltr"
          >
            {order.phone}
          </p>
        </div>

        {/* Detected WhatsApp Session Indicator */}
        <div className="p-2.5 rounded-xl bg-success/70 dark:bg-success/30 border border-success dark:border-success/40 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-success dark:text-success font-bold">
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              جلسة الواتساب المتصلة:
            </span>
            {waDetection?.isPreviousChat ? (
              <span className="px-1.5 py-0.5 bg-success/60 dark:bg-success/60 text-success dark:text-success rounded text-[10px]">
                محادثة سابقة للعميل
              </span>
            ) : (
              <span className="text-muted-foreground text-[10px]">
                الجلسة الافتراضية
              </span>
            )}
          </div>
          <p className="text-emerald-700 dark:text-success truncate">
            {waDetection?.session?.name || "واتساب الشركة"} (
            {waDetection?.session?.phoneNumber || "متصل"})
          </p>
        </div>
      </div>

      {/* Quick Contact Actions */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={onOpenWhatsAppModal}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-success hover:bg-success text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
        >
          <Send className="w-4 h-4" />
          <span>إرسال واتساب من النظام</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenInternalChat}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground text-xs font-semibold rounded-xl transition-colors"
            title="فتح محادثة العميل في شات الواتساب الداخلي للمنصة"
          >
            <MessageCircle className="w-3.5 h-3.5 text-success" />
            <span>شات المنصة</span>
          </button>

          <button
            type="button"
            onClick={onOpenExternalWhatsApp}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground text-xs font-semibold rounded-xl transition-colors"
            title="فتح محادثة واتساب عبر wa.me"
          >
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            <span>wa.me مباشر</span>
          </button>
        </div>

        <a
          href={`tel:${order.phone}`}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground text-xs font-semibold rounded-xl transition-colors border border-border dark:border-border"
        >
          <Phone className="w-3.5 h-3.5" />
          <span>اتصال هاتفي</span>
        </a>
      </div>
    </div>
  );
};
