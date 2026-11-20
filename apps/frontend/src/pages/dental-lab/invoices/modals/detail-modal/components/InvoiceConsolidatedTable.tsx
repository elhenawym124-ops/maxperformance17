import { FileSpreadsheet } from "lucide-react";
import { fmtMoney } from "../../../../shared";
import type { ConsolidatedItem } from "../types";

interface InvoiceConsolidatedTableProps {
  items: ConsolidatedItem[];
  casesCount: number;
  totalUnits: number;
  total: number;
}

export function InvoiceConsolidatedTable({
  items,
  casesCount,
  totalUnits,
  total,
}: InvoiceConsolidatedTableProps) {
  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border dark:border-border overflow-hidden bg-card/40">
      <div className="bg-indigo-50/70 dark:bg-primary/40 p-2.5 px-3 border-b dark:border-border flex items-center justify-between">
        <span className="font-bold text-primary dark:text-primary flex items-center gap-1.5 text-xs">
          <FileSpreadsheet className="w-4 h-4 text-primary" />
          تفاصيل حالات الفاتورة المجمعة ({casesCount} حالة — {totalUnits} وحدة)
        </span>
        <span className="text-[11px] text-primary dark:text-primary font-medium tabular-nums">
          متوسط الحالة: {fmtMoney(total / (casesCount || 1))} ج.م
        </span>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <table className="w-full text-right text-xs tabular-nums">
          <thead className="bg-gray-50 dark:bg-muted text-muted-foreground dark:text-muted-foreground sticky top-0 font-semibold border-b dark:border-border">
            <tr>
              <th className="py-2 px-2.5 text-center w-8">م</th>
              <th className="py-2 px-2.5 whitespace-nowrap">رقم الحالة</th>
              <th className="py-2 px-2.5 whitespace-nowrap">اسم المريض</th>
              <th className="py-2 px-2.5 whitespace-nowrap">الطبيب المعالج</th>
              <th className="py-2 px-2.5 whitespace-nowrap">نوع التركيبة / الشغل</th>
              <th className="py-2 px-2.5 text-center whitespace-nowrap">العدد</th>
              <th className="py-2 px-2.5 whitespace-nowrap">سعر الوحدة</th>
              <th className="py-2 px-2.5 text-left whitespace-nowrap">الإجمالي</th>
            </tr>
          </thead>
          <tbody className="divide-y dark:divide-border">
            {items.map((item, idx) => (
              <tr
                key={item.caseId || idx}
                className="hover:bg-blue-50/40 dark:hover:bg-blue-900/10 transition-colors"
              >
                <td className="py-2 px-2.5 text-center text-muted-foreground font-mono text-[11px]">{idx + 1}</td>
                <td className="py-2 px-2.5 font-bold text-blue-600 dark:text-blue-400 font-mono whitespace-nowrap">
                  {item.caseNumber || "—"}
                </td>
                <td className="py-2 px-2.5 font-semibold text-foreground whitespace-nowrap">
                  {item.patientName || "—"}
                </td>
                <td className="py-2 px-2.5 text-foreground whitespace-nowrap">
                  {item.doctorName ? (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary">
                      د. {item.doctorName}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="py-2 px-2.5 text-foreground">{item.workTypeName || "—"}</td>
                <td className="py-2 px-2.5 text-center font-bold text-foreground dark:text-muted-foreground font-mono">
                  {item.unitsCount || 1}
                </td>
                <td className="py-2 px-2.5 text-muted-foreground font-mono whitespace-nowrap">
                  {fmtMoney(item.unitPrice || 0)}
                </td>
                <td className="py-2 px-2.5 text-left font-bold text-foreground font-mono whitespace-nowrap">
                  {fmtMoney(item.total || 0)} ج.م
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
