import React from "react";
import { formatCurrency } from "../../../utils/currency";
import { formatShortDate } from "../../../utils/dateFormat";
import { ProcurementTemplateProps } from "./types";

export const ModernMinimalTemplate: React.FC<ProcurementTemplateProps> = ({
  data,
  isRtl = true,
}) => {
  const isInvoice = data.documentType === "PI";
  const docTitleAr = isInvoice ? "فاتورة مشتريات" : "أمر شراء";
  const docTitleEn = isInvoice ? "PURCHASE INVOICE" : "PURCHASE ORDER";
  const locale = isRtl ? "ar" : "en";

  return (
    <div className="printable-commercial-sheet relative text-foreground bg-white p-6 sm:p-8 min-w-[700px] w-full max-w-[210mm] mx-auto font-sans" dir={isRtl ? "rtl" : "ltr"}>
      {/* Sleek Modern Header */}
      <div className="pb-4 mb-4 border-b border-border flex justify-between items-end">
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-primary font-mono block mb-1">
            {docTitleEn}
          </span>
          <h1 className="text-2xl font-extrabold text-foreground tracking-tight">
            {data.companyName}
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            {isInvoice ? "فاتورة توريد معتمدة" : "أمر توريد وشراء مباشر"}
          </p>
        </div>

        <div className="text-end">
          <div className="text-2xl font-black text-foreground font-mono tracking-tight">
            {data.documentNumber}
          </div>
          <div className="text-xs text-muted-foreground font-mono mt-0.5">
            {formatShortDate(data.documentDate, locale)}
          </div>
        </div>
      </div>

      {/* Metadata Pill Grid */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
        <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">المورّد</div>
          <div className="font-bold text-foreground truncate">{data.supplier.name}</div>
          {data.supplier.phone && (
            <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{data.supplier.phone}</div>
          )}
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">حالة المستند</div>
          <div className="font-bold text-foreground">{data.statusLabel}</div>
          <div className="text-[10px] text-muted-foreground font-mono mt-0.5">{data.status}</div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">
            {data.dueDate ? "تاريخ الاستحقاق" : "تاريخ التسليم"}
          </div>
          <div className="font-bold text-foreground font-mono">
            {formatShortDate(data.dueDate || data.expectedDelivery || data.documentDate, locale)}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {data.dueDate ? "أجل السداد" : "الموعد المحدد"}
          </div>
        </div>

        <div className="bg-slate-50 p-2.5 rounded-lg border border-border">
          <div className="text-[10px] font-medium text-muted-foreground mb-0.5">المرجع المالي</div>
          <div className="font-bold text-foreground font-mono">
            {data.linkedReference ? data.linkedReference.number : "مباشر"}
          </div>
          <div className="text-[10px] text-muted-foreground mt-0.5">
            {data.linkedReference ? "مرتبط بأمر شراء" : "قيد مستقل"}
          </div>
        </div>
      </div>

      {/* Minimal Items Table */}
      <div className="mb-4">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b-2 border-border text-foreground font-bold text-start">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-2 text-start">الصنف والمواصفات</th>
              <th className="py-2 px-2 text-center w-20">SKU</th>
              <th className="py-2 px-2 text-center w-16">الكمية</th>
              <th className="py-2 px-2 text-center w-24">سعر الوحدة</th>
              <th className="py-2 px-2 text-center w-16">الضريبة</th>
              <th className="py-2 px-2 text-end w-24">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {data.items.map((item, idx) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="py-2 px-2 text-center font-mono text-muted-foreground">{idx + 1}</td>
                <td className="py-2 px-2 text-start">
                  <div className="font-semibold text-foreground">{item.productName || "صنف بدون اسم"}</div>
                  {item.description && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">{item.description}</div>
                  )}
                </td>
                <td className="py-2 px-2 text-center font-mono text-[11px] text-muted-foreground">
                  {item.sku || "—"}
                </td>
                <td className="py-2 px-2 text-center font-mono font-bold text-foreground">
                  {item.quantity}
                </td>
                <td className="py-2 px-2 text-center font-mono tabular-nums text-foreground">
                  {formatCurrency(item.unitPrice, { locale })}
                </td>
                <td className="py-2 px-2 text-center font-mono text-muted-foreground text-[11px]">
                  {Number(item.taxRate) > 0 ? `${item.taxRate}%` : "—"}
                </td>
                <td className="py-2 px-2 text-end font-mono font-bold tabular-nums text-foreground">
                  {formatCurrency(item.totalPrice, { locale })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modern Totals & Notes Section */}
      <div className="grid grid-cols-2 gap-6 mb-6 no-break pt-2 border-t border-border">
        {/* Notes / Terms */}
        <div className="text-xs space-y-1.5 text-start">
          <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            الملاحظات وشروط التعامل
          </div>
          <p className="text-xs text-foreground leading-relaxed">
            {data.notes || "تم توثيق هذا المستند وفقاً للاتفاق المالي والتجاري المبرم بين الطرفين."}
          </p>
          {data.paymentTerms && (
            <p className="text-[11px] text-foreground pt-1">
              <span className="font-semibold">طريقة الدفع:</span> {data.paymentTerms}
            </p>
          )}
        </div>

        {/* Minimal Totals Card */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between py-1 text-muted-foreground">
            <span>المجموع:</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(data.financialSummary.subtotal, { locale })}
            </span>
          </div>
          {Number(data.financialSummary.discountAmount) > 0 && (
            <div className="flex justify-between py-1 text-destructive">
              <span>الخصم:</span>
              <span className="font-mono tabular-nums">
                -{formatCurrency(data.financialSummary.discountAmount, { locale })}
              </span>
            </div>
          )}
          {Number(data.financialSummary.taxAmount) > 0 && (
            <div className="flex justify-between py-1 text-foreground">
              <span>ضريبة القيمة المضافة:</span>
              <span className="font-mono tabular-nums">
                +{formatCurrency(data.financialSummary.taxAmount, { locale })}
              </span>
            </div>
          )}
          {Number(data.financialSummary.shippingCost) > 0 && (
            <div className="flex justify-between py-1 text-foreground">
              <span>الشحن / التوصيل:</span>
              <span className="font-mono tabular-nums">
                +{formatCurrency(data.financialSummary.shippingCost, { locale })}
              </span>
            </div>
          )}
          <div className="flex justify-between py-2 border-t border-b-2 border-border font-black text-sm text-foreground">
            <span>الإجمالي المستحق:</span>
            <span className="font-mono tabular-nums">
              {formatCurrency(data.financialSummary.totalAmount, { locale })}
            </span>
          </div>
          {data.financialSummary.paidAmount !== undefined && Number(data.financialSummary.paidAmount) > 0 && (
            <div className="flex justify-between py-1 text-success font-semibold">
              <span>المدفوع:</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(data.financialSummary.paidAmount, { locale })}
              </span>
            </div>
          )}
          {data.financialSummary.remainingAmount !== undefined && (
            <div className="flex justify-between py-1 text-destructive font-bold">
              <span>المتبقي:</span>
              <span className="font-mono tabular-nums">
                {formatCurrency(data.financialSummary.remainingAmount, { locale })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Dual Executive Signoff */}
      <div className="pt-6 border-t border-border no-break">
        <div className="grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <p className="font-bold text-foreground mb-8">إعداد وتوثيق المشتريات</p>
            <div className="border-t border-border pt-1 text-[11px] text-muted-foreground">
              التوقيع المعتمد
            </div>
          </div>
          <div>
            <p className="font-bold text-foreground mb-8">اعتماد الإدارة والصرف</p>
            <div className="border-t border-border pt-1 text-[11px] text-muted-foreground">
              الختم والاعتماد
            </div>
          </div>
        </div>
      </div>

      {/* Modern Minimal Footer */}
      <div className="mt-8 pt-3 border-t border-border flex justify-between text-[10px] text-muted-foreground font-mono">
        <span>MAXP PROCUREMENT ENGINE</span>
        <span>{docTitleAr} • {data.documentNumber}</span>
      </div>
    </div>
  );
};
