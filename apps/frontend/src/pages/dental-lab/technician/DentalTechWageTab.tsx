import React, { useState } from "react";
import { Wallet, Receipt, CheckCircle2 } from "lucide-react";
import { MyWage, fmtMoney, fmtDate } from "../shared";

interface DentalTechWageTabProps {
  wage: MyWage | null;
}

export const DentalTechWageTab: React.FC<DentalTechWageTabProps> = ({ wage }) => {
  const [ledgerSubTab, setLedgerSubTab] = useState<"STAGES" | "VOUCHERS">("STAGES");

  const recentStages = Array.isArray(wage?.recentStages) ? wage.recentStages : [];
  const payouts = Array.isArray(wage?.payouts) ? wage.payouts : [];

  return (
    <div className="space-y-4">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-xs">
          <span className="text-xs text-muted-foreground block">إجمالي أجر المراحل المنجزة</span>
          <p className="text-xl font-black text-foreground mt-1">
            {fmtMoney(wage?.totalEarned ?? 0)} <span className="text-xs text-muted-foreground">ج.م</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-xs">
          <span className="text-xs text-muted-foreground block">إجمالي ما تم صرفه لك (سندات)</span>
          <p className="text-xl font-black text-foreground mt-1">
            {fmtMoney(wage?.totalPaid ?? 0)} <span className="text-xs text-muted-foreground">ج.م</span>
          </p>
        </div>

        <div className="p-4 rounded-xl border border-primary dark:border-primary bg-primary/50 dark:bg-primary/20 shadow-xs">
          <span className="text-xs text-primary dark:text-primary font-semibold block">صافي الرصيد المستحق</span>
          <p className="text-xl font-black text-primary dark:text-primary mt-1">
            {fmtMoney(wage?.balance ?? 0)} <span className="text-xs">ج.م</span>
          </p>
        </div>
      </div>

      {/* Subtab Selector */}
      <div className="flex items-center gap-2 border-b border-border dark:border-border pb-2">
        <button
          onClick={() => setLedgerSubTab("STAGES")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            ledgerSubTab === "STAGES"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 dark:bg-muted text-muted-foreground hover:bg-muted"
          }`}
        >
          سجل مراحل العمل المنجزة ({recentStages.length})
        </button>
        <button
          onClick={() => setLedgerSubTab("VOUCHERS")}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
            ledgerSubTab === "VOUCHERS"
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-gray-100 dark:bg-muted text-muted-foreground hover:bg-muted"
          }`}
        >
          سندات الصرف والمدفوعات ({payouts.length})
        </button>
      </div>

      {/* SubTab Content */}
      {ledgerSubTab === "STAGES" ? (
        <div className="border border-border dark:border-border rounded-xl overflow-hidden bg-white dark:bg-muted shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 dark:bg-muted text-muted-foreground border-b border-border dark:border-border">
                <tr>
                  <th className="py-3 px-3">تاريخ الإنجاز</th>
                  <th className="py-3 px-3">رقم الحالة</th>
                  <th className="py-3 px-3">المرحلة المنفذة</th>
                  <th className="py-3 px-3">نوع الشغل</th>
                  <th className="py-3 px-3">الطبيب</th>
                  <th className="py-3 px-3 text-left">الأجر المحسوب</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {recentStages.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-muted-foreground">
                      لا توجد مراحل مسجلة باسمك بعد
                    </td>
                  </tr>
                ) : (
                  recentStages.map((st) => (
                    <tr key={st.id} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                      <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(st.completedAt)}</td>
                      <td className="py-2.5 px-3 font-mono font-bold">#{st.caseNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-foreground">{st.stageName}</td>
                      <td className="py-2.5 px-3 text-foreground dark:text-muted-foreground">{st.workTypeName || "—"}</td>
                      <td className="py-2.5 px-3 text-foreground dark:text-muted-foreground">{st.doctorName || "—"}</td>
                      <td className="py-2.5 px-3 text-left font-bold text-success dark:text-success">
                        +{fmtMoney(st.wageAmount)} ج.م
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="border border-border dark:border-border rounded-xl overflow-hidden bg-white dark:bg-muted shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-right">
              <thead className="bg-gray-50 dark:bg-muted text-muted-foreground border-b border-border dark:border-border">
                <tr>
                  <th className="py-3 px-3">تاريخ الصرف</th>
                  <th className="py-3 px-3">المبلغ المصروف</th>
                  <th className="py-3 px-3">طريقة الصرف</th>
                  <th className="py-3 px-3">البيان والملاحظات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border dark:divide-border">
                {payouts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-muted-foreground">
                      لا توجد سندات صرف مسجلة حتى الآن
                    </td>
                  </tr>
                ) : (
                  payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                      <td className="py-2.5 px-3 text-muted-foreground">{fmtDate(p.createdAt)}</td>
                      <td className="py-2.5 px-3 font-bold text-warning dark:text-warning">
                        -{fmtMoney(p.amount)} ج.م
                      </td>
                      <td className="py-2.5 px-3 text-foreground font-medium">
                        {p.method === "CASH" ? "نقدي" : p.method === "BANK" ? "تحويل بنكي" : "محفظة إلكترونية"}
                      </td>
                      <td className="py-2.5 px-3 text-foreground dark:text-muted-foreground">{p.notes || "سند صرف مستحقات"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DentalTechWageTab;
