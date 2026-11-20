import React from "react";
import { AlertCircle } from "lucide-react";
import { Deduction } from "./types";
import { DeductionTableRow } from "./DeductionTableRow";

interface DeductionTableProps {
  deductions: Deduction[];
  onViewDetails: (deduction: Deduction) => void;
  onEdit: (deduction: Deduction) => void;
  onDelete: (id: string) => void;
}

export const DeductionTable: React.FC<DeductionTableProps> = ({
  deductions,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-gray-50 dark:bg-muted">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                الموظف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                النوع
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                المبلغ
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                السبب
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                التاريخ الفعلي
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border dark:divide-border">
            {deductions.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-6 py-12 text-center text-muted-foreground"
                >
                  <AlertCircle className="mx-auto h-12 w-12 mb-4" />
                  <p>لا توجد خصومات</p>
                </td>
              </tr>
            ) : (
              deductions.map((deduction) => (
                <DeductionTableRow
                  key={deduction.id}
                  deduction={deduction}
                  onViewDetails={onViewDetails}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
