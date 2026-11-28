import React from "react";
import {
  MoreVertical,
  Eye,
  Edit,
  Check,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Payroll, months, statusConfig, formatCurrency } from "./types";

interface PayrollMobileCardProps {
  isMyPayroll: boolean;
  payroll: Payroll;
  selectedMonth: number;
  selectedYear: number;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onViewDetails: (payroll: Payroll) => void;
  onApprove: (id: string) => void;
  onEdit: (payroll: Payroll) => void;
  onPay: (id: string) => void;
  onPrint: (payroll: Payroll) => void;
}

export const PayrollMobileCard: React.FC<PayrollMobileCardProps> = ({
  isMyPayroll,
  payroll,
  selectedMonth,
  selectedYear,
  selected,
  onToggleSelect,
  onViewDetails,
  onApprove,
  onEdit,
  onPay,
  onPrint,
}) => {
  const status = statusConfig[payroll.status];
  const period = `${months[(payroll.month || selectedMonth) - 1]} ${payroll.year || selectedYear}`;

  return (
    <div className="p-3.5 space-y-3" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        {isMyPayroll ? (
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground">{period}</p>
            <p className="text-[11px] text-muted-foreground">مسير الرواتب</p>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 shrink-0 border border-border/60">
              <AvatarImage src={payroll.employee?.avatar} />
              <AvatarFallback>
                {payroll.employee?.firstName?.[0]}
                {payroll.employee?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-foreground truncate">
                {payroll.employee?.firstName} {payroll.employee?.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {payroll.employee?.position?.title || period}
              </p>
            </div>
          </div>
        )}
        <Badge
          className={`${status?.color || ""} shrink-0 text-[10px] px-2 py-0.5 border`}
        >
          {status?.label || payroll.status}
        </Badge>
      </div>

      <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-center">
        <div className="min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground block">
            الأساسي
          </span>
          <span className="text-[11px] font-bold text-foreground font-mono tabular-nums">
            {formatCurrency(payroll.fullMonthBaseSalary || payroll.baseSalary)}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground block">
            البدلات
          </span>
          <span className="text-[11px] font-bold text-green-600 font-mono tabular-nums">
            +{formatCurrency(payroll.totalAllowances)}
          </span>
        </div>
        <div className="min-w-0">
          <span className="text-[10px] font-medium text-muted-foreground block">
            الخصومات
          </span>
          <span className="text-[11px] font-bold text-red-600 font-mono tabular-nums">
            -{formatCurrency(payroll.totalDeductions)}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">صافي الراتب</span>
        <span
          dir="ltr"
          className={`text-base font-bold font-mono tabular-nums ${
            payroll.netSalary < 0 ? "text-red-600" : "text-foreground"
          }`}
        >
          {formatCurrency(payroll.netSalary)}
        </span>
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
        {!isMyPayroll && (
          <label className="flex items-center gap-1.5 text-[11px] text-muted-foreground shrink-0 cursor-pointer">
            <input
              type="checkbox"
              checked={selected}
              onChange={() => onToggleSelect(payroll.id)}
              className="h-4 w-4 rounded border-border"
            />
            تحديد
          </label>
        )}
        <Button
          variant="outline"
          className="flex-1 h-9 min-h-[40px] text-xs gap-1.5"
          onClick={() => onViewDetails(payroll)}
        >
          <Eye className="h-4 w-4" />
          التفاصيل
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 min-h-[40px] px-3 text-xs gap-1.5 shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
              الإجراءات
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" dir="rtl">
            <DropdownMenuItem onClick={() => onViewDetails(payroll)}>
              <Eye className="h-4 w-4 ms-2" />
              عرض التفاصيل
            </DropdownMenuItem>
            {!isMyPayroll && payroll.status !== "PAID" && (
              <DropdownMenuItem onClick={() => onApprove(payroll.id)}>
                <Check className="h-4 w-4 ms-2" />
                اعتماد
              </DropdownMenuItem>
            )}
            {!isMyPayroll && (
              <DropdownMenuItem onClick={() => onEdit(payroll)}>
                <Edit className="h-4 w-4 ms-2" />
                تعديل
              </DropdownMenuItem>
            )}
            {!isMyPayroll &&
              (payroll.status === "PROCESSED" ||
                payroll.status === "APPROVED") && (
                <DropdownMenuItem onClick={() => onPay(payroll.id)}>
                  <CreditCard className="h-4 w-4 ms-2" />
                  صرف
                </DropdownMenuItem>
              )}
            <DropdownMenuItem onClick={() => onPrint(payroll)}>
              <FileText className="h-4 w-4 ms-2" />
              طباعة
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default PayrollMobileCard;
