import React from "react";
import { Eye, Edit2, Trash2 } from "lucide-react";
import {
  Deduction,
  DEDUCTION_TYPES,
  DEDUCTION_STATUS,
} from "./types";
import { formatCurrency, formatDateWithDay } from "./helpers";

interface DeductionTableRowProps {
  deduction: Deduction;
  onViewDetails: (deduction: Deduction) => void;
  onEdit: (deduction: Deduction) => void;
  onDelete: (id: string) => void;
}

export const DeductionTableRow: React.FC<DeductionTableRowProps> = ({
  deduction,
  onViewDetails,
  onEdit,
  onDelete,
}) => {
  const statusInfo =
    DEDUCTION_STATUS[deduction.status as keyof typeof DEDUCTION_STATUS] ||
    DEDUCTION_STATUS.PENDING;

  return (
    <tr className="hover:bg-muted/50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div>
          <div className="text-sm font-medium text-foreground">
            {deduction.employee?.firstName} {deduction.employee?.lastName}
          </div>
          <div className="text-sm text-muted-foreground font-mono tabular-nums">
            {deduction.employee?.employeeNumber}
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-foreground">
          {DEDUCTION_TYPES[deduction.type as keyof typeof DEDUCTION_TYPES] ||
            deduction.type}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm font-medium text-foreground font-mono tabular-nums">
          {formatCurrency(deduction.amount)}
        </span>
      </td>
      <td className="px-6 py-4">
        <span className="text-sm text-foreground line-clamp-2">
          {deduction.reason}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className="text-sm text-foreground font-mono tabular-nums">
          {formatDateWithDay(deduction.date)}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
        >
          {statusInfo.label}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm">
        <div className="flex items-center space-x-2 space-x-reverse">
          <button
            onClick={() => onViewDetails(deduction)}
            className="text-blue-600 hover:text-primary dark:text-primary p-1 rounded hover:bg-primary/10 dark:hover:bg-primary/20"
            title="عرض التفاصيل"
          >
            <Eye className="h-5 w-5" />
          </button>

          {deduction.status === "PENDING" && (
            <button
              onClick={() => onEdit(deduction)}
              className="text-yellow-600 hover:text-warning dark:text-warning p-1 rounded hover:bg-warning/10 dark:hover:bg-warning/20"
              title="تعديل"
            >
              <Edit2 className="h-5 w-5" />
            </button>
          )}

          {!deduction.appliedToPayroll && (
            <button
              onClick={() => onDelete(deduction.id)}
              className="text-red-600 hover:text-destructive dark:text-destructive p-1 rounded hover:bg-destructive/10 dark:hover:bg-destructive/20"
              title="حذف"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};
