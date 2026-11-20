import React from "react";
import {
  Calendar,
  User,
  Home,
  ShoppingCart,
  FileText,
  Truck,
  Percent,
  Tag,
  Coins,
  MapPin,
} from "lucide-react";
import { formatCurrency } from "../../../utils/currency";
import { formatShortDate } from "../../../utils/dateFormat";
import { ProcurementTemplateProps } from "./types";

export const CommercialFactoryTemplate: React.FC<ProcurementTemplateProps> = ({
  data,
  isRtl = true,
}) => {
  const isInvoice = data.documentType === "PI";
  const docTitle = isInvoice ? "فاتورة شراء مورد" : "أمر شراء مورد";
  const locale = isRtl ? "ar" : "en";

  const totalAmount = Number(data.financialSummary?.totalAmount || 0);
  const discountAmount = Number(data.financialSummary?.discountAmount || 0);
  const taxAmount = Number(data.financialSummary?.taxAmount || 0);
  const shippingCost = Number(data.financialSummary?.shippingCost || 0);

  const buyerName = data.buyer?.name || data.companyName;
  const buyerInitials = (buyerName || "MP")
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <div
      className="printable-commercial-sheet relative text-foreground bg-white p-6 sm:p-8 min-w-[700px] w-full max-w-[210mm] mx-auto overflow-hidden font-sans print:p-2 print:border-none print:shadow-none"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Decorative Brand Accent (Top Corner Angles) - Preserved in Print */}
      <div className="absolute top-0 end-0 w-36 h-8 pointer-events-none overflow-hidden">
        <div className="absolute -top-6 -end-6 w-24 h-24 bg-destructive rotate-45 transform origin-bottom-left" />
        <div className="absolute -top-8 -end-12 w-24 h-24 bg-muted rotate-45 transform origin-bottom-left opacity-80" />
      </div>

      {/* Top Header: Company Legal Name & Logo */}
      <div className="flex justify-between items-start pb-5 mb-5 border-b border-border">
        {/* Right (in RTL): Company Name & Address */}
        <div className="space-y-1.5 text-start pt-1">
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {buyerName}
          </h1>
          {data.buyer?.address && (
            <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
              <MapPin className="size-3.5 text-destructive shrink-0" />
              <span>{data.buyer.address}</span>
            </div>
          )}
          {(data.buyer?.phone || data.buyer?.taxNumber || data.buyer?.crNumber) && (
            <div className="text-[11px] text-muted-foreground font-mono">
              {data.buyer?.phone && (
                <>
                  هاتف: <span className="font-semibold text-foreground">{data.buyer.phone}</span>
                </>
              )}
              {data.buyer?.taxNumber && (
                <span className="ms-3">
                  الرقم الضريبي: <span className="font-semibold text-foreground">{data.buyer.taxNumber}</span>
                </span>
              )}
              {data.buyer?.crNumber && (
                <span className="ms-3">
                  س.ت: <span className="font-semibold text-foreground">{data.buyer.crNumber}</span>
                </span>
              )}
            </div>
          )}
        </div>

        {/* Left (in RTL): Brand Logo Box */}
        <div className="flex flex-col items-center justify-center text-center ps-4">
          {data.buyer?.logoUrl ? (
            <img
              src={data.buyer.logoUrl}
              alt="Company Logo"
              className="h-14 max-w-[160px] object-contain mb-1"
            />
          ) : (
            <div className="flex flex-col items-center">
              <div className="size-11 rounded-lg bg-muted text-white font-black text-sm flex items-center justify-center mb-1 shadow-xs">
                {buyerInitials}
              </div>
              <div className="text-xs font-black tracking-wide text-foreground text-center max-w-[170px] truncate">
                {buyerName}
              </div>
            </div>
          )}
          {data.buyer?.slogan && (
            <div className="text-[8px] font-bold tracking-wider text-muted-foreground mt-1 uppercase">
              {data.buyer.slogan}
            </div>
          )}
        </div>
      </div>

      {/* Document Bar: Order Number Card + Order Banner */}
      <div className="flex items-center justify-between gap-3 mb-5">
        {/* Left: Document ID Card */}
        <div className="flex items-center gap-2.5 border border-border bg-muted rounded-lg px-3.5 py-2 shadow-2xs print:shadow-none print:border-slate-300">
          <div className="size-8 rounded-md bg-white border border-border flex items-center justify-center text-foreground shadow-2xs print:shadow-none print:border-slate-300">
            <ShoppingCart className="size-4 text-foreground" />
          </div>
          <div>
            <div className="text-[10px] text-muted-foreground font-medium">
              {isInvoice ? "رقم فاتورة الشراء" : "رقم أمر الشراء"}
            </div>
            <div className="text-sm font-black text-foreground font-mono tracking-tight">
              {data.documentNumber}
            </div>
          </div>
        </div>

        {/* Right: Order Banner */}
        <div className="bg-red-600 text-white rounded-lg px-4 py-2 text-end shadow-xs print:shadow-none min-w-[220px]">
          <div className="flex items-center justify-end gap-1.5 font-bold text-sm">
            <FileText className="size-4" />
            <span>{docTitle}</span>
          </div>
          <div className="text-[10px] text-destructive font-normal">
            مستند معتمد من نظام إدارة المشتريات والمخزون
          </div>
        </div>
      </div>

      {/* 2-Column Side-by-Side Data Cards */}
      <div className="grid grid-cols-2 gap-4 mb-5 text-xs">
        {/* Right Card (in RTL): Document Metadata */}
        <div className="border border-border rounded-xl overflow-hidden bg-white shadow-2xs print:shadow-none print:border-slate-300">
          <div className="bg-slate-50 border-b border-border px-3.5 py-2 flex items-center justify-between font-bold text-foreground print:border-slate-300">
            <span className="flex items-center gap-1.5">
              <Calendar className="size-3.5 text-destructive" />
              <span>{isInvoice ? "بيانات الفاتورة" : "بيانات أمر الشراء"}</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">DOC DETAILS</span>
          </div>
          <div className="p-3 space-y-1.5">
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">
                {isInvoice ? "تاريخ الفاتورة:" : "تاريخ أمر الشراء:"}
              </span>
              <span className="font-mono font-semibold text-foreground">
                {formatShortDate(data.documentDate, locale)}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">تاريخ الاستلام المتوقع:</span>
              <span className="font-mono font-semibold text-foreground">
                {data.expectedDelivery
                  ? formatShortDate(data.expectedDelivery, locale)
                  : data.dueDate
                  ? formatShortDate(data.dueDate, locale)
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">شروط الدفع:</span>
              <span className="font-medium text-foreground">
                {data.paymentTerms || "سداد آجل معتمد"}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground pt-1 border-t border-border print:border-slate-200">
              <span className="text-slate-500 flex items-center gap-1">
                <Home className="size-3 text-muted-foreground" />
                المخزن:
              </span>
              <span className="font-bold text-foreground">
                {data.warehouseName || "المخزن الرئيسي"}
              </span>
            </div>
          </div>
        </div>

        {/* Left Card (in RTL): Supplier Information */}
        <div className="border border-border rounded-xl overflow-hidden bg-white shadow-2xs print:shadow-none print:border-slate-300">
          <div className="bg-slate-50 border-b border-border px-3.5 py-2 flex items-center justify-between font-bold text-foreground print:border-slate-300">
            <span className="flex items-center gap-1.5">
              <User className="size-3.5 text-destructive" />
              <span>بيانات المورد</span>
            </span>
            <span className="text-[10px] text-muted-foreground font-mono">SUPPLIER INFO</span>
          </div>
          <div className="p-3 space-y-1.5">
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">اسم المورد:</span>
              <span className="font-bold text-foreground">{data.supplier.name}</span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">رقم المورد:</span>
              <span className="font-mono font-semibold text-foreground">
                {data.supplier.code || data.supplier.id.slice(0, 8)}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground">
              <span className="text-slate-500">رقم الهاتف:</span>
              <span className="font-mono font-semibold text-foreground">
                {data.supplier.phone || "—"}
              </span>
            </div>
            <div className="flex justify-between items-center text-foreground pt-1 border-t border-border print:border-slate-200">
              <span className="text-slate-500">العنوان:</span>
              <span className="text-slate-700 truncate max-w-[200px]">
                {data.supplier.address || "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Products & Items Table */}
      <div className="border border-border rounded-xl overflow-hidden mb-4 shadow-2xs print:shadow-none print:border-slate-300">
        <table className="w-full text-xs text-start border-collapse">
          <thead>
            <tr className="bg-[#1E293B] text-white print:border-b-2 print:border-slate-800">
              <th className="py-2.5 px-3 text-center w-10 font-bold">م</th>
              <th className="py-2.5 px-3 text-start font-bold">الصنف</th>
              <th className="py-2.5 px-3 text-center w-20 font-bold">الكمية</th>
              <th className="py-2.5 px-3 text-center w-28 font-bold">تعبئة الوحدة</th>
              <th className="py-2.5 px-3 text-end w-28 font-bold">سعر الوحدة</th>
              <th className="py-2.5 px-3 text-end w-32 font-bold">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white print:divide-slate-300">
            {data.items.map((item, idx) => {
              const packaging = item.packagingUnit || (item as { unit?: string }).unit || "—";

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/60">
                  <td className="py-2.5 px-3 text-center text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-foreground">{item.productName}</div>
                    {item.sku && (
                      <div className="text-[10px] text-muted-foreground font-mono">كود: {item.sku}</div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center font-bold font-mono text-foreground text-sm">
                    {item.quantity}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="inline-block bg-muted text-foreground px-2 py-0.5 rounded text-[11px] font-medium border border-border print:border-slate-300">
                      {packaging}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono font-medium text-foreground">
                    {formatCurrency(Number(item.unitPrice || 0))}
                  </td>
                  <td className="py-2.5 px-3 text-end font-mono font-bold text-foreground text-sm">
                    {formatCurrency(Number(item.totalPrice || 0))}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Horizontal Financial Summary Bar */}
      <div className="grid grid-cols-4 gap-2 mb-4 text-xs">
        {/* Discount Card */}
        <div className="border border-border rounded-lg p-2.5 bg-muted flex flex-col justify-between print:border-slate-300">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Tag className="size-3 text-muted-foreground" />
              الخصم
            </span>
          </div>
          <div className="font-mono font-bold text-foreground text-sm">
            {formatCurrency(discountAmount)}
          </div>
        </div>

        {/* Taxes Card */}
        <div className="border border-border rounded-lg p-2.5 bg-muted flex flex-col justify-between print:border-slate-300">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Percent className="size-3 text-muted-foreground" />
              الضرائب
            </span>
            <span className="text-[10px] text-muted-foreground">14%</span>
          </div>
          <div className="font-mono font-bold text-foreground text-sm">
            {formatCurrency(taxAmount)}
          </div>
        </div>

        {/* Shipping Card */}
        <div className="border border-border rounded-lg p-2.5 bg-muted flex flex-col justify-between print:border-slate-300">
          <div className="flex items-center justify-between text-muted-foreground text-[11px] mb-1">
            <span className="flex items-center gap-1">
              <Truck className="size-3 text-muted-foreground" />
              الشحن
            </span>
          </div>
          <div className="font-mono font-bold text-foreground text-sm">
            {formatCurrency(shippingCost)}
          </div>
        </div>

        {/* Grand Total Card */}
        <div className="bg-[#1E293B] text-white rounded-lg p-2.5 flex items-center justify-between shadow-xs print:shadow-none">
          <div className="size-8 rounded-md bg-white/10 flex items-center justify-center text-warning">
            <Coins className="size-4" />
          </div>
          <div className="text-end">
            <div className="text-[10px] text-muted-foreground font-medium">
              {isInvoice ? "إجمالي الفاتورة" : "إجمالي أمر الشراء"}
            </div>
            <div className="text-base sm:text-lg font-black font-mono text-white tracking-tight">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </div>

      {/* Notes Box */}
      <div className="border border-border rounded-lg p-3 bg-muted mb-5 text-xs text-start print:border-slate-300">
        <div className="font-bold text-foreground flex items-center gap-1.5 mb-1">
          <FileText className="size-3.5 text-muted-foreground" />
          <span>ملاحظات:</span>
        </div>
        <p className="text-slate-600 text-[11px] leading-relaxed">
          {data.notes ||
            "يرجى التأكد من مطابقة الكميات والمواصفات القياسية المعتمدة قبل التوقيع والاستلام."}
        </p>
      </div>

      {/* Dual Signature Section */}
      <div className="grid grid-cols-2 gap-8 pt-4 pb-4 border-t border-border text-xs print:border-slate-300">
        {/* Responsible Manager Signature */}
        <div className="text-center space-y-1">
          <div className="font-bold text-foreground">
            {data.signatures?.purchasingTitle || "توقيع المسؤول"}
          </div>
          <div className="text-[11px] text-muted-foreground">(المدير المسؤول)</div>
          <div className="border-b-2 border-dotted border-border w-44 mx-auto pt-8" />
        </div>

        {/* Supplier / Warehouse Signature */}
        <div className="text-center space-y-1">
          <div className="font-bold text-foreground">
            {data.signatures?.warehouseTitle || "توقيع المورد"}
          </div>
          <div className="text-[11px] text-muted-foreground">(الاسم والتوقيع)</div>
          <div className="border-b-2 border-dotted border-border w-44 mx-auto pt-8" />
        </div>
      </div>

      {/* Bottom Brand Slogan & Accents */}
      <div className="relative pt-3 border-t border-border print:border-slate-300 flex items-center justify-between text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
        <span>{data.buyer?.slogan || buyerName}</span>
        <span className="text-slate-400 font-mono text-[8px]">
          {data.documentNumber} &bull; {formatShortDate(data.documentDate, locale)}
        </span>
      </div>

      {/* Bottom Decorative Angles - SCREEN ONLY */}
      <div className="absolute bottom-0 start-0 w-32 h-4 pointer-events-none overflow-hidden print:hidden">
        <div className="absolute -bottom-4 -start-4 w-16 h-16 bg-destructive rotate-45 transform" />
        <div className="absolute -bottom-6 -start-8 w-16 h-16 bg-muted rotate-45 transform opacity-80" />
      </div>
    </div>
  );
};
