import React from "react";
import { fmtMoney, type DoctorStatement } from "../../../../shared";

interface StatementCasesTableProps {
  cases: NonNullable<DoctorStatement["cases"]>;
}

export const StatementCasesTable: React.FC<StatementCasesTableProps> = ({
  cases,
}) => {
  return (
    <div className="overflow-x-auto max-h-72 print:max-h-none print:overflow-visible border dark:border-border rounded-xl print:border-slate-300 print:rounded-none">
      <table className="w-full text-xs text-right">
        <thead className="bg-gray-50 dark:bg-muted text-muted-foreground font-semibold print:bg-slate-100 print:text-black">
          <tr>
            <th className="py-2.5 px-3">رقم الحالة</th>
            <th className="py-2.5 px-3">المريض</th>
            <th className="py-2.5 px-3">نوع الشغل</th>
            <th className="py-2.5 px-3">الحالة</th>
            <th className="py-2.5 px-3">الإجمالي</th>
            <th className="py-2.5 px-3">المسدد</th>
            <th className="py-2.5 px-3">المتبقي</th>
          </tr>
        </thead>
        <tbody className="divide-y dark:divide-border print:divide-slate-200">
          {!cases || cases.length === 0 ? (
            <tr>
              <td colSpan={7} className="py-8 text-center text-muted-foreground">
                لا توجد حالات مسجلة في هذه الفترة
              </td>
            </tr>
          ) : (
            cases.map((c, idx) => (
              <tr
                key={c.caseNumber || idx}
                className="hover:bg-gray-50/50 dark:hover:bg-muted font-mono tabular-nums"
              >
                <td className="py-2.5 px-3 font-semibold text-blue-600 print:text-black">
                  {c.caseNumber || "—"}
                </td>
                <td className="py-2.5 px-3 font-medium font-sans">
                  {c.patientName || "—"}
                </td>
                <td className="py-2.5 px-3 text-muted-foreground print:text-black font-sans">
                  {c.workTypeName || "—"}
                </td>
                <td className="py-2.5 px-3 font-sans">
                  <span className="px-2 py-0.5 rounded-full text-[11px] bg-muted dark:bg-muted print:border">
                    {c.status || "—"}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium">{fmtMoney(c.total)}</td>
                <td className="py-2.5 px-3 text-success print:text-black">
                  {fmtMoney(c.paid)}
                </td>
                <td className="py-2.5 px-3 text-destructive font-bold print:text-black">
                  {fmtMoney(c.remaining)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StatementCasesTable;
