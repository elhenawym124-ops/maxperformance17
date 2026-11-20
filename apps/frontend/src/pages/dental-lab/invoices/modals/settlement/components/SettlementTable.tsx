import React from "react";
import {
  Loader2,
  Lock,
  MessageCircle,
  Printer,
  ShieldAlert,
  Unlock,
} from "lucide-react";
import {
  fmtMoney,
  type DentalMonthlySettlement,
} from "../../../../shared";

interface SettlementTableProps {
  settlements: DentalMonthlySettlement[];
  loading: boolean;
  period: string;
  saving: boolean;
  onCloseSingle: (docId: string, doctorName: string) => void;
  onOpenReopen: (settlement: DentalMonthlySettlement) => void;
  onOpenVoucher: (settlement: DentalMonthlySettlement) => void;
  onShareWhatsApp: (settlement: DentalMonthlySettlement) => void;
}

export const SettlementTable: React.FC<SettlementTableProps> = ({
  settlements,
  loading,
  period,
  saving,
  onCloseSingle,
  onOpenReopen,
  onOpenVoucher,
  onShareWhatsApp,
}) => {
  return (
    <div className="flex-1 overflow-y-auto border dark:border-border rounded-xl">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
          <p className="text-xs">جاري حساب المستحقات وترحيل الأرصدة...</p>
        </div>
      ) : settlements.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-xs">
          لم يتم العثور على أطباء أو بيانات لشهر {period}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right divide-y dark:divide-border tabular-nums">
            <thead className="bg-gray-50 dark:bg-muted text-foreground font-semibold sticky top-0">
              <tr>
                <th className="py-2.5 px-3 whitespace-nowrap">الطبيب / العيادة</th>
                <th className="py-2.5 px-3 whitespace-nowrap">رصيد أول المدة</th>
                <th className="py-2.5 px-3 whitespace-nowrap">فواتير الشهر (+)</th>
                <th className="py-2.5 px-3 whitespace-nowrap">المسدد بالشهر (-)</th>
                <th className="py-2.5 px-3 whitespace-nowrap">التسويات (-)</th>
                <th className="py-2.5 px-3 whitespace-nowrap">
                  الرصيد الختامي المرحل (=)
                </th>
                <th className="py-2.5 px-3 whitespace-nowrap">الحالة</th>
                <th className="py-2.5 px-3 text-center whitespace-nowrap">
                  الإجراءات
                </th>
              </tr>
            </thead>
            <tbody className="divide-y dark:divide-border bg-white dark:bg-muted">
              {settlements.map((s) => (
                <tr
                  key={s.doctorId}
                  className="hover:bg-gray-50 dark:hover:bg-muted transition-colors"
                >
                  <td className="py-2.5 px-3">
                    <div className="font-bold text-foreground">
                      {s.doctorName}
                    </div>
                    {s.clinicName && (
                      <div className="text-[11px] text-muted-foreground">
                        {s.clinicName}
                      </div>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-foreground font-mono">
                    <span className="tabular-nums">{fmtMoney(s.openingBalance)}</span> ج.م
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">
                      +<span className="tabular-nums">{fmtMoney(s.totalBilled)}</span> ج.م
                    </span>
                    <span className="block text-[10px] text-muted-foreground">
                      (<span className="tabular-nums">{s.invoicesCount}</span> فواتير /{" "}
                      <span className="tabular-nums">{s.casesCount}</span> حالات)
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-bold text-success dark:text-success font-mono">
                    -<span className="tabular-nums">{fmtMoney(s.totalPaid)}</span> ج.م
                  </td>
                  <td className="py-2.5 px-3 text-warning dark:text-warning font-mono">
                    {s.totalAdjustments > 0 ? (
                      <span>
                        -<span className="tabular-nums">{fmtMoney(s.totalAdjustments)}</span> ج.م
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="font-black text-sm text-destructive dark:text-destructive font-mono">
                      <span className="tabular-nums">{fmtMoney(s.closingBalance)}</span> ج.م
                    </span>
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    {s.status === "CLOSED" ? (
                      <div className="space-y-0.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success text-success dark:bg-success/40 dark:text-success">
                          <Lock className="w-3 h-3" />
                          <span>معتمد ومغلق</span>
                        </span>
                        {s.closedByName && (
                          <span className="block text-[9px] text-muted-foreground">
                            {s.closedByName}
                          </span>
                        )}
                      </div>
                    ) : s.status === "REOPENED" ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning text-warning dark:bg-warning/40 dark:text-warning">
                        <ShieldAlert className="w-3 h-3" />
                        <span>معاد فتحه</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
                        <span>مسودة أولية</span>
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {s.status === "CLOSED" ? (
                        <button
                          type="button"
                          onClick={() => onOpenReopen(s)}
                          className="p-1.5 text-warning bg-warning/10 hover:bg-warning dark:bg-warning/30 dark:text-warning rounded-lg"
                          title="إعادة فتح الشهر للتدقيق"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onCloseSingle(s.doctorId, s.doctorName || "")
                          }
                          disabled={saving}
                          className="px-2.5 py-1 bg-primary text-white rounded-lg font-semibold hover:bg-primary disabled:opacity-50 flex items-center gap-1"
                          title="تقفيل واعتماد الحساب وتجميده"
                        >
                          <Lock className="w-3 h-3" />
                          <span>تقفيل</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenVoucher(s)}
                        className="p-1.5 text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-lg border dark:border-border"
                        title="عرض وطباعة سند التقفيل"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>

                      {s.phone && (
                        <button
                          type="button"
                          onClick={() => onShareWhatsApp(s)}
                          className="p-1.5 text-success bg-success/10 dark:bg-success/30 hover:bg-success rounded-lg"
                          title="مراسلة الطبيب بتفاصيل التقفيل عبر واتساب"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default SettlementTable;
