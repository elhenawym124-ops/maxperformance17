import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Receipt,
  MessageCircle,
  Trash2,
} from "lucide-react";
import { STATUS_MAP } from "./types";

interface ServiceOrderHeaderProps {
  order: any;
  shortId: string;
  currentStatus: { label: string; color: string; badge: string };
  currentPaymentStatus: { label: string; color: string; badge: string };
  updateStatus: (status: string) => void;
  onOpenInvoice: () => void;
  onOpenWhatsApp: () => void;
  onDelete: () => void;
}

export const ServiceOrderHeader: React.FC<ServiceOrderHeaderProps> = ({
  order,
  shortId,
  currentStatus,
  currentPaymentStatus,
  updateStatus,
  onOpenInvoice,
  onOpenWhatsApp,
  onDelete,
}) => {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border dark:border-border">
      <div className="flex items-center gap-2.5">
        <Link
          to="/admin/service-orders"
          className="p-2 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-white bg-card border border-border dark:border-border rounded-xl transition-colors shadow-xs"
          title="العودة لقائمة الطلبات"
        >
          <ArrowRight className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              طلب خدمة {shortId}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentStatus.color}`}
            >
              <span className={`w-2 h-2 rounded-full ${currentStatus.badge}`}></span>
              {currentStatus.label}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${currentPaymentStatus.color}`}
            >
              <span
                className={`w-2 h-2 rounded-full ${currentPaymentStatus.badge}`}
              ></span>
              {currentPaymentStatus.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />
            تم التقديم:{" "}
            {new Date(order.createdAt).toLocaleString("ar-EG", {
              dateStyle: "long",
              timeStyle: "short",
            })}
          </p>
        </div>
      </div>

      {/* Top Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={order.status}
          onChange={(e) => updateStatus(e.target.value)}
          className="px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border border-border bg-card text-foreground dark:text-muted-foreground shadow-xs focus:ring-2 focus:ring-primary-500 outline-hidden transition-all"
        >
          {Object.entries(STATUS_MAP).map(([key, val]) => (
            <option key={key} value={key}>
              تغيير الحالة: {val.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onOpenInvoice}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary dark:text-primary bg-primary/10 dark:bg-primary/40 hover:bg-primary rounded-xl transition-colors shadow-xs"
          title="عرض وطباعة الفاتورة"
        >
          <Receipt className="w-4 h-4" />
          <span>الفاتورة</span>
        </button>

        <button
          type="button"
          onClick={onOpenWhatsApp}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-success dark:text-success bg-success/10 dark:bg-success/40 hover:bg-success rounded-xl transition-colors shadow-xs"
          title="مراسلة واتساب من النظام"
        >
          <MessageCircle className="w-4 h-4" />
          <span>واتساب النظام</span>
        </button>

        <button
          type="button"
          onClick={onDelete}
          className="p-2 text-destructive hover:text-destructive bg-destructive/10 hover:bg-destructive dark:bg-destructive/40 dark:text-destructive rounded-xl transition-colors shadow-xs"
          title="حذف الطلب"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
