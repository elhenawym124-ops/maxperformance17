import React from "react";
import {
  PackageCheck,
  CheckSquare,
  Square,
  Warehouse,
  ClipboardCheck,
} from "lucide-react";
import { formatShortDate } from "../../../utils/dateFormat";
import { ProcurementTemplateProps } from "./types";

export const GoodsReceiptTemplate: React.FC<ProcurementTemplateProps> = ({
  data,
  isRtl = true,
}) => {
  const isInvoice = data.documentType === "PI";
  const locale = isRtl ? "ar" : "en";
  const linkedRefText = data.linkedReference
    ? `${data.linkedReference.type === "PO" ? "أمر شراء" : "فاتورة"} #${data.linkedReference.number}`
    : isInvoice
    ? "توريد مباشر بدون أمر"
    : "طلب بضاعة للمستودع";

  return (
    <div
      className="printable-commercial-sheet relative text-foreground bg-white p-6 sm:p-8 min-w-[700px] w-full max-w-[210mm] mx-auto overflow-hidden font-sans border border-border print:border-none print:shadow-none print:p-2"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Top Header: Warehouse Inspection Voucher */}
      <div className="flex justify-between items-center pb-4 mb-4 border-b-2 border-border">
        <div className="space-y-1 text-start">
          <div className="flex items-center gap-2">
            <span className="bg-amber-600 text-white px-2.5 py-0.5 rounded text-xs font-black tracking-wide flex items-center gap-1">
              <PackageCheck className="size-3.5" />
              <span>إذن استلام وفحص بضاعة</span>
            </span>
            <span className="text-xs font-mono font-bold text-muted-foreground">GOODS RECEIPT (GRN)</span>
          </div>
          <h1 className="text-xl font-black text-foreground tracking-tight">
            {data.buyer?.name || data.companyName}
          </h1>
          <p className="text-xs text-foreground font-medium">
            قسم إدارة المخازن والرقابة على الجودة والتسليم
          </p>
        </div>

        {/* Document Tracking Box */}
        <div className="text-end">
          <div className="border border-border rounded-lg p-2.5 bg-muted min-w-[200px] print:border-slate-400">
            <div className="text-[10px] text-muted-foreground font-bold mb-1">بيانات إذن الاستلام</div>
            <div className="space-y-0.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">رقم الإذن:</span>
                <span className="font-mono font-black text-foreground">
                  GRN-{data.documentNumber.replace(/\D/g, "") || "2026"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">تاريخ الاستلام:</span>
                <span className="font-mono font-semibold text-foreground">
                  {formatShortDate(data.documentDate, locale)}
                </span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-border print:border-slate-300">
                <span className="text-slate-600 font-medium">المستند المرجعي:</span>
                <span className="font-semibold text-foreground">{linkedRefText}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logistics & Supplier Strip */}
      <div className="grid grid-cols-3 gap-3 mb-4 text-xs">
        <div className="border border-border rounded-lg p-2.5 bg-muted text-start print:border-slate-400">
          <div className="font-bold text-foreground text-[10px] uppercase border-b border-border pb-1 mb-1.5 flex items-center justify-between print:border-slate-300">
            <span>جهة التوريد (المورد)</span>
            <span className="text-slate-400 font-mono">SUPPLIER</span>
          </div>
          <div className="font-bold text-foreground text-sm">{data.supplier.name}</div>
          {data.supplier.phone && (
            <div className="text-slate-600 font-mono text-[11px] mt-1">
              الهاتف: <span className="font-semibold">{data.supplier.phone}</span>
            </div>
          )}
        </div>

        <div className="border border-border rounded-lg p-2.5 bg-muted text-start print:border-slate-400">
          <div className="font-bold text-foreground text-[10px] uppercase border-b border-border pb-1 mb-1.5 flex items-center justify-between print:border-slate-300">
            <span>المستودع المستلم</span>
            <span className="text-slate-400 font-mono">LOCATION</span>
          </div>
          <div className="font-bold text-foreground text-sm">
            {data.warehouseName || "المستودع الرئيسي"}
          </div>
          <div className="text-slate-600 text-[11px] mt-1">منطقة الفحص والتسليم المخزني</div>
        </div>

        <div className="border border-border rounded-lg p-2.5 bg-muted text-start print:border-slate-400">
          <div className="font-bold text-foreground text-[10px] uppercase border-b border-border pb-1 mb-1.5 flex items-center justify-between print:border-slate-300">
            <span>حالة المطابقة الأولية</span>
            <span className="text-slate-400 font-mono">STATUS</span>
          </div>
          <div className="flex items-center gap-3 mt-1.5 font-bold text-[11px]">
            <span className="inline-flex items-center gap-1.5 text-success bg-success/10 px-2 py-0.5 rounded border border-success">
              <span className="size-2 bg-success rounded-full inline-block" />
              مطابق
            </span>
            <span className="inline-flex items-center gap-1.5 text-warning bg-warning/10 px-2 py-0.5 rounded border border-warning">
              <span className="size-2 bg-warning rounded-full inline-block" />
              جزئي
            </span>
            <span className="inline-flex items-center gap-1.5 text-destructive bg-destructive/10 px-2 py-0.5 rounded border border-destructive">
              <span className="size-2 bg-destructive rounded-full inline-block" />
              تالف
            </span>
          </div>
        </div>
      </div>

      {/* Physical Quantities & QC Inspection Table */}
      <div className="border border-border rounded-lg overflow-hidden mb-4 print:border-slate-400">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-slate-800 text-white font-bold print:border-b-2 print:border-slate-800">
              <th className="py-2 px-2 text-center w-8">#</th>
              <th className="py-2 px-3 text-start">بيان الصنف والمواصفات</th>
              <th className="py-2 px-2 text-center w-24">كود الصنف SKU</th>
              <th className="py-2 px-2 text-center w-20">الكمية المطلوبة</th>
              <th className="py-2 px-2 text-center w-20 bg-success text-white">
                المستلم فعلياً
              </th>
              <th className="py-2 px-2 text-center w-20 bg-destructive text-white">
                الفارق / التالف
              </th>
              <th className="py-2 px-2 text-center w-24">موقع التخزين (Bin)</th>
              <th className="py-2 px-2 text-center w-20">نتيجة الفحص</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-white print:divide-slate-300">
            {data.items.map((item, idx) => {
              const reqQty = Number(item.quantity) || 0;
              const recQty = item.receivedQuantity !== undefined ? Number(item.receivedQuantity) : reqQty;
              const diffQty = reqQty - recQty;

              return (
                <tr key={item.id || idx} className="hover:bg-slate-50/70">
                  <td className="py-2 px-2 text-center text-muted-foreground font-mono">{idx + 1}</td>
                  <td className="py-2 px-3 text-start">
                    <div className="font-bold text-foreground">{item.productName}</div>
                    {item.description && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">{item.description}</div>
                    )}
                  </td>
                  <td className="py-2 px-2 text-center font-mono text-[11px] text-foreground">
                    {item.sku || "—"}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-foreground tabular-nums">
                    {reqQty}
                  </td>
                  <td className="py-2 px-2 text-center font-black text-success bg-success/60 tabular-nums text-sm">
                    {recQty}
                  </td>
                  <td className="py-2 px-2 text-center font-bold text-destructive bg-destructive/60 tabular-nums">
                    {diffQty > 0 ? diffQty : "0"}
                  </td>
                  <td className="py-2 px-2 text-center text-foreground font-mono">
                    <span className="border-b border-dashed border-border inline-block w-16 pb-0.5">
                      {(item as { binLocation?: string }).binLocation || "______"}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-center">
                    <span
                      className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        diffQty === 0
                          ? "bg-emerald-100 text-success"
                          : "bg-amber-100 text-warning"
                      }`}
                    >
                      {diffQty === 0 ? "مطابق" : "عجز جزئي"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Inspection Checklist & Storage Instructions */}
      <div className="grid grid-cols-2 gap-3 mb-4 no-break text-xs">
        <div className="border border-border rounded-lg p-3 bg-muted text-start space-y-2 print:border-slate-400">
          <div className="font-bold text-foreground border-b border-border pb-1 flex items-center justify-between print:border-slate-300">
            <span className="flex items-center gap-1.5">
              <ClipboardCheck className="size-3.5 text-warning print:text-slate-800" />
              <span>قائمة التحقق والفحص الظاهري (QC Checklist)</span>
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[11px] pt-0.5">
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckSquare className="size-3.5 text-success shrink-0 print:text-slate-800" />
              <span>سلامة التغليف الخارجي</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckSquare className="size-3.5 text-success shrink-0 print:text-slate-800" />
              <span>مطابقة الباركود / الكتالوج</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <CheckSquare className="size-3.5 text-success shrink-0 print:text-slate-800" />
              <span>خلو الشحنة من الكسر والرطوبة</span>
            </div>
            <div className="flex items-center gap-1.5 text-foreground">
              <Square className="size-3.5 text-muted-foreground shrink-0" />
              <span>مطابقة تواريخ الصلاحية</span>
            </div>
          </div>
        </div>

        <div className="border border-border rounded-lg p-3 bg-muted text-start space-y-1.5 print:border-slate-400">
          <div className="font-bold text-foreground border-b border-border pb-1 flex items-center gap-1.5 print:border-slate-300">
            <Warehouse className="size-3.5 text-foreground" />
            <span>ملاحظات أمين المستودع والتوجيه:</span>
          </div>
          <p className="text-[11px] text-foreground leading-relaxed">
            {data.notes ||
              "تم الاستلام المبدئي للأصناف الواردة تحت شرط الفحص والمطابقة المخزنية الدقيقة وجرد العبوات."}
          </p>
        </div>
      </div>

      {/* Warehouse Signoff Strip */}
      <div className="border border-border rounded-lg p-3 bg-muted no-break print:border-slate-400">
        <div className="grid grid-cols-3 gap-6 text-center text-xs text-foreground">
          <div>
            <p className="font-bold text-foreground mb-6">سائق / مندوب التسليم</p>
            <div className="border-t border-dashed border-border pt-1 text-[11px] text-foreground">
              الاسم ورقم المركبة والتوقيع
            </div>
          </div>
          <div>
            <p className="font-bold text-foreground mb-6">أمين المستودع المستلم</p>
            <div className="border-t border-dashed border-border pt-1 text-[11px] text-foreground">
              التوقيع وتاريخ التخزين
            </div>
          </div>
          <div>
            <p className="font-bold text-foreground mb-6">مسؤول الجودة والاعتماد</p>
            <div className="border-t border-dashed border-border pt-1 text-[11px] text-foreground">
              الختم واعتماد إدخال المخزن
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-4 pt-2 border-t border-border text-center text-[10px] text-muted-foreground flex justify-between font-mono print:border-slate-300">
        <span>{data.companyName || "مستند استلام وفحص بضاعة مخزني"}</span>
        <span>صفحة 1 من 1</span>
      </div>
    </div>
  );
};
