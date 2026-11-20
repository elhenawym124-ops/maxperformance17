import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { PreparationSlipDocumentSettings } from "./types";

export interface OrderPreparationSlipLivePreviewProps {
  slipDocument: PreparationSlipDocumentSettings;
}

export const OrderPreparationSlipLivePreview: React.FC<OrderPreparationSlipLivePreviewProps> = ({
  slipDocument,
}) => {
  return (
    <Card className="border-slate-200/80 bg-white dark:border-border dark:bg-muted xl:sticky xl:top-4 xl:self-start">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-foreground dark:text-white">
          معاينة
        </CardTitle>
        <CardDescription className="text-slate-500 dark:text-muted-foreground">
          شكل ورقة التجهيز بعد الطباعة
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div
          className="overflow-hidden rounded-xl border border-border bg-white p-6 shadow-xs"
          style={{
            backgroundColor: "#ffffff",
            color: "#1e293b",
            minHeight: 300,
          }}
        >
          {/* Header */}
          <div
            className="mb-4 border-b-2 pb-3"
            style={{ borderColor: slipDocument.accentColor }}
          >
            <h3
              className="text-lg font-extrabold tracking-tight"
              style={{ color: slipDocument.accentColor }}
            >
              {slipDocument.documentTitle}
            </h3>
            {slipDocument.showCompanyName && (
              <p className="mt-1 text-xs text-foreground">
                اسم الشركة: متجر ماكس بيرفورمانس
              </p>
            )}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {slipDocument.documentSubtitle}
            </p>
          </div>

          {/* Instructions */}
          {slipDocument.preparationInstructions && (
            <div className="mb-4 rounded-lg border border-warning/80 bg-warning/80 p-2.5 text-xs text-warning">
              <span className="font-bold">تعليمات التجهيز: </span>
              <span>{slipDocument.preparationInstructions}</span>
            </div>
          )}

          {/* Table */}
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr
                className="border-b"
                style={{ borderColor: `${slipDocument.accentColor}30` }}
              >
                {slipDocument.showItemSku && (
                  <th className="p-1.5 text-right font-semibold">SKU</th>
                )}
                {slipDocument.showItemDetails && (
                  <th className="p-1.5 text-right font-semibold">المنتج</th>
                )}
                {slipDocument.showItemColor && (
                  <th className="p-1.5 text-right font-semibold">اللون</th>
                )}
                {slipDocument.showItemSize && (
                  <th className="p-1.5 text-right font-semibold">المقاس</th>
                )}
                <th className="p-1.5 text-right font-semibold">الكمية</th>
                {slipDocument.showItemPrice && (
                  <th className="p-1.5 text-right font-semibold">السعر</th>
                )}
                {slipDocument.showItemTotal && (
                  <th className="p-1.5 text-right font-semibold">الإجمالي</th>
                )}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                {slipDocument.showItemSku && (
                  <td className="p-1.5 font-mono text-[11px] text-muted-foreground">
                    SKU-001
                  </td>
                )}
                {slipDocument.showItemDetails && (
                  <td className="p-1.5 font-medium text-foreground">
                    حذاء كلاسيكي أنيق
                  </td>
                )}
                {slipDocument.showItemColor && (
                  <td className="p-1.5 text-foreground">رصاصي</td>
                )}
                {slipDocument.showItemSize && (
                  <td className="p-1.5 font-mono tabular-nums text-foreground">
                    37
                  </td>
                )}
                <td className="p-1.5 font-mono tabular-nums text-foreground">
                  1
                </td>
                {slipDocument.showItemPrice && (
                  <td className="p-1.5 font-mono tabular-nums text-foreground">
                    720 ج.م
                  </td>
                )}
                {slipDocument.showItemTotal && (
                  <td className="p-1.5 font-mono tabular-nums font-bold text-foreground">
                    720 ج.م
                  </td>
                )}
              </tr>
            </tbody>
          </table>

          {/* Financial Summary */}
          {slipDocument.showFinancialSummary && (
            <div className="mt-3 space-y-0.5 border-t border-border pt-2 text-xs">
              <div className="flex justify-between text-foreground">
                <span>المجموع الفرعي</span>
                <span className="font-mono tabular-nums">720 ج.م</span>
              </div>
              <div className="flex justify-between text-foreground">
                <span>الشحن</span>
                <span className="font-mono tabular-nums">110 ج.م</span>
              </div>
              <div className="flex justify-between font-bold text-foreground">
                <span>الإجمالي</span>
                <span className="font-mono tabular-nums">830 ج.م</span>
              </div>
            </div>
          )}

          {/* Payment Summary */}
          {slipDocument.showPaymentSummary && (
            <div className="mt-2.5 rounded-lg border border-success/80 bg-success/70 p-2 text-xs text-success">
              <span className="font-bold">الدفع: </span>
              <span className="font-mono tabular-nums">830 ج.م</span>
              <span> عند الاستلام</span>
            </div>
          )}

          {/* Footer Note */}
          <div className="mt-4 border-t border-border pt-2 text-[11px] text-muted-foreground">
            {slipDocument.footerNote}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
