import React from 'react';
import {
  Clock, ArrowUpCircle, ArrowDownCircle, DollarSign, FileText
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Payroll, statusConfig, formatCurrency } from './types';

interface PayrollDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payroll: Payroll | null;
  onPrint: (payroll: Payroll) => void;
}

export const PayrollDetailsModal: React.FC<PayrollDetailsModalProps> = ({
  open,
  onOpenChange,
  payroll,
  onPrint,
}) => {
  if (!payroll) return null;

  const deductionsObj = typeof payroll.deductions === 'string'
    ? JSON.parse(payroll.deductions || '{}')
    : (payroll.deductions || {});

  const absenceAmount = deductionsObj['غياب'] ?? 0;
  const lateAmount = deductionsObj['تأخيرات'] ?? (payroll.latePenalty || 0);
  const deficitAmount = deductionsObj['عجز ساعات العمل'] ?? 0;
  const totalAttDeduct = Number(absenceAmount) + Number(lateAmount) + Number(deficitAmount) || (payroll.attendanceDeduction || 0);

  const absenceLogs = deductionsObj.absenceDetails ? String(deductionsObj.absenceDetails).split(' | ') : [];
  const lateLogs = deductionsObj.lateDetails ? String(deductionsObj.lateDetails).split(' | ') : [];
  const deficitLogs = deductionsObj.deficitDetails ? String(deductionsObj.deficitDetails).split(' | ') : [];

  const allowancesObj = typeof payroll.allowances === 'string'
    ? JSON.parse(payroll.allowances || '{}')
    : (payroll.allowances || {});

  const metadataKeys = ['details', 'manualDetails', 'capNotes', 'advanceDetails', 'absenceDetails', 'lateDetails', 'deficitDetails'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>تفاصيل كشف الراتب</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[75vh] overflow-y-auto pe-2 px-1">
          {/* Employee Info */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <Avatar className="h-16 w-16">
              <AvatarImage src={payroll.employee?.avatar} />
              <AvatarFallback>
                {payroll.employee?.firstName?.[0]}{payroll.employee?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">
                {payroll.employee?.firstName} {payroll.employee?.lastName}
              </h3>
              <p className="text-gray-500">{payroll.employee?.position?.title}</p>
              <p className="text-sm text-muted-foreground">{payroll.employee?.employeeNumber}</p>
            </div>
            <Badge className={`me-auto ${statusConfig[payroll.status]?.color}`}>
              {statusConfig[payroll.status]?.label}
            </Badge>
          </div>

          {/* Attendance & Working Hours Telemetry Card */}
          <div className="rounded-xl border border-border dark:border-border bg-muted dark:bg-muted p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-xs font-bold text-foreground dark:text-muted-foreground uppercase tracking-wide">
                  سجل الحضور وساعات العمل والخصومات الآلية
                </span>
              </div>
              {totalAttDeduct > 0 ? (
                <Badge variant="outline" className="bg-rose-50 dark:bg-destructive/40 border-destructive text-destructive dark:text-destructive text-xs font-semibold tabular-nums">
                  إجمالي خصم الحضور: -{formatCurrency(totalAttDeduct)}
                </Badge>
              ) : (
                <Badge variant="outline" className="bg-emerald-50 dark:bg-success/40 border-success text-success dark:text-success text-xs font-semibold">
                  لا توجد استقطاعات حضور
                </Badge>
              )}
            </div>

            {/* 4 Telemetry Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-muted border border-border dark:border-border shadow-xs">
                <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block font-medium">أيام العمل الفعلية</span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-base font-bold text-foreground dark:text-muted-foreground tabular-nums">
                    {payroll.actualWorkDays ?? (payroll.workingDays ? payroll.workingDays - (payroll.absentDays || 0) : '-')}
                  </span>
                  {payroll.workingDays && (
                    <span className="text-[10px] text-muted-foreground">/ {payroll.workingDays} يوم</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-muted border border-border dark:border-border shadow-xs">
                <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block font-medium">أيام الغياب</span>
                <div className="flex items-baseline gap-1.5 mt-1">
                  <span className={`text-base font-bold tabular-nums ${payroll.absentDays > 0 ? 'text-rose-600 dark:text-destructive' : 'text-slate-800 dark:text-muted-foreground'}`}>
                    {payroll.absentDays || 0}
                  </span>
                  {Number(absenceAmount) > 0 && (
                    <span className="text-[10px] text-destructive tabular-nums font-medium">(-{formatCurrency(Number(absenceAmount))})</span>
                  )}
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-muted border border-border dark:border-border shadow-xs">
                <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block font-medium">غرامات التأخير</span>
                <div className="mt-1">
                  <span className={`text-base font-bold tabular-nums ${Number(lateAmount) > 0 ? 'text-amber-600 dark:text-warning' : 'text-slate-800 dark:text-muted-foreground'}`}>
                    {Number(lateAmount) > 0 ? `-${formatCurrency(Number(lateAmount))}` : '0.00'}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-white dark:bg-muted border border-border dark:border-border shadow-xs">
                <span className="text-[11px] text-muted-foreground dark:text-muted-foreground block font-medium">عجز الساعات / مبكر</span>
                <div className="mt-1">
                  <span className={`text-base font-bold tabular-nums ${Number(deficitAmount) > 0 ? 'text-primary' : 'text-slate-800 dark:text-muted-foreground'}`}>
                    {Number(deficitAmount) > 0 ? `-${formatCurrency(Number(deficitAmount))}` : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            {/* Detailed Calculation Logs if available */}
            {(absenceLogs.length > 0 || lateLogs.length > 0 || deficitLogs.length > 0 || deductionsObj.capNotes) && (
              <div className="mt-2 pt-2 border-t border-border dark:border-border space-y-1.5 text-[11px]">
                {absenceLogs.length > 0 && (
                  <div className="flex items-start gap-1.5 text-destructive dark:text-destructive">
                    <span className="font-semibold whitespace-nowrap">سجل الغياب:</span>
                    <span className="text-slate-600 dark:text-muted-foreground leading-relaxed tabular-nums">{absenceLogs.join(' • ')}</span>
                  </div>
                )}
                {lateLogs.length > 0 && (
                  <div className="flex items-start gap-1.5 text-warning dark:text-warning">
                    <span className="font-semibold whitespace-nowrap">سجل التأخيرات:</span>
                    <span className="text-slate-600 dark:text-muted-foreground leading-relaxed tabular-nums">{lateLogs.join(' • ')}</span>
                  </div>
                )}
                {deficitLogs.length > 0 && (
                  <div className="flex items-start gap-1.5 text-primary dark:text-primary">
                    <span className="font-semibold whitespace-nowrap">عجز الساعات:</span>
                    <span className="text-slate-600 dark:text-muted-foreground leading-relaxed tabular-nums">{deficitLogs.join(' • ')}</span>
                  </div>
                )}
                {deductionsObj.capNotes && (
                  <div className="flex items-start gap-1.5 text-muted-foreground dark:text-muted-foreground italic">
                    <span className="font-semibold whitespace-nowrap">سقف الخصم القانوني:</span>
                    <span>{deductionsObj.capNotes}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Salary Breakdown */}
          <div className="grid grid-cols-2 gap-8">
            {/* Allowances/Earnings */}
            <div className="space-y-4">
              <h4 className="font-bold text-success flex items-center gap-2 border-b pb-2">
                <ArrowUpCircle className="h-4 w-4" />
                الاستحقاقات (Earnings)
              </h4>
              <div className="space-y-2.5">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600 text-sm">الراتب الأساسي (تعاقدي)</span>
                  <span className="font-bold text-sm tabular-nums">{formatCurrency(payroll.fullMonthBaseSalary || payroll.baseSalary)}</span>
                </div>

                {Object.entries(allowancesObj).map(([name, amount], i) => (
                  <div key={i} className="flex justify-between items-center bg-success/30 dark:bg-success/10 px-2 py-1 rounded">
                    <span className="text-gray-500 text-xs">{name}</span>
                    <span className="text-xs text-success font-medium tabular-nums">+{formatCurrency(Number(amount))}</span>
                  </div>
                ))}

                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">
                    العمل الإضافي {payroll.overtimeHours ? `(${Number(payroll.overtimeHours).toFixed(1)} س @ ${payroll.overtimeRate || 1}x)` : ''}
                  </span>
                  <span className="font-medium text-sm text-success tabular-nums">+{formatCurrency(payroll.overtimeAmount)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">المكافآت</span>
                  <span className="font-medium text-sm text-success tabular-nums">+{formatCurrency(payroll.bonuses)}</span>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <h4 className="font-bold text-destructive flex items-center gap-2 border-b pb-2">
                <ArrowDownCircle className="h-4 w-4" />
                الاستقطاعات (Deductions)
              </h4>
              <div className="space-y-2.5">
                {payroll.fullMonthBaseSalary && Number(payroll.fullMonthBaseSalary) > Number(payroll.baseSalary) && (
                  <div className="flex justify-between items-start bg-destructive/50 dark:bg-destructive/10 px-2 py-1 rounded border-destructive border">
                    <div className="space-y-0.5">
                      <span className="text-red-800 text-xs font-bold block">فروقات عمل/تناسب</span>
                      <span className="text-[10px] text-destructive block">نقص {(payroll.workingDays || 30) - (payroll.actualWorkDays || 0)} يوم من الدورة</span>
                    </div>
                    <span className="font-bold text-xs text-destructive tabular-nums">-{formatCurrency(Number(payroll.fullMonthBaseSalary) - Number(payroll.baseSalary))}</span>
                  </div>
                )}

                {Object.entries(deductionsObj)
                  .filter(([key]) => !metadataKeys.includes(key))
                  .map(([name, amount], i) => {
                    const allDetails = String(deductionsObj.details || "");
                    const specificDetails = allDetails.split(' | ').filter(d => d.includes(name));

                    const isManual = name.includes('يدوي') ||
                      (deductionsObj.manualDetails && name.includes('يدوي')) ||
                      specificDetails.some(d => d.includes('يدوي'));

                    let subNote = "";
                    if (name === 'سلف' && deductionsObj.advanceDetails) {
                      subNote = "سداد أقساط سلف قائمة";
                    } else if (name === 'خصم يدوي' && deductionsObj.manualDetails) {
                      subNote = deductionsObj.manualDetails;
                    } else if (name === 'غياب' && deductionsObj.absenceDetails) {
                      subNote = deductionsObj.absenceDetails;
                    } else if (name === 'تأخيرات' && deductionsObj.lateDetails) {
                      subNote = deductionsObj.lateDetails;
                    } else if (name === 'عجز ساعات العمل' && deductionsObj.deficitDetails) {
                      subNote = deductionsObj.deficitDetails;
                    } else if (name === 'غياب وتأخير' && (payroll.absentDays > 0 || payroll.latePenalty > 0)) {
                      const notes = [];
                      if (payroll.absentDays > 0) notes.push(`${payroll.absentDays} أيام غياب`);
                      if (payroll.latePenalty > 0) notes.push(`تأخيرات`);
                      subNote = notes.join(' و ');
                    } else if (specificDetails.length > 0) {
                      subNote = specificDetails.join(' | ');
                    }

                    return (
                      <div key={i} className="space-y-1 bg-destructive/30 dark:bg-destructive/10 p-2 rounded-lg border border-destructive/30">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-1.5 text-wrap max-w-[70%]">
                            <span className="text-gray-700 text-xs font-bold">{name}</span>
                            <span className={`text-[8px] px-1 rounded-sm uppercase font-black whitespace-nowrap ${isManual ? 'bg-amber-100 text-warning border border-warning' : 'bg-blue-100 text-blue-700 border border-blue-200'}`}>
                              {isManual ? 'يدوي' : 'تلقائي'}
                            </span>
                          </div>
                          <span className="text-xs text-destructive font-bold whitespace-nowrap tabular-nums">-{formatCurrency(Number(amount))}</span>
                        </div>
                        {subNote && (
                          <p className="text-[10px] text-muted-foreground italic pe-2 border-r-2 border-destructive me-1 leading-relaxed">
                            {subNote}
                          </p>
                        )}
                      </div>
                    );
                  })}

                <div className="flex justify-between items-center pt-1">
                  <span className="text-gray-600 text-sm">التأمينات الاجتماعية</span>
                  <span className="font-medium text-sm text-destructive tabular-nums">-{formatCurrency(payroll.socialInsurance)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">الضرائب</span>
                  <span className="font-medium text-sm text-destructive tabular-nums">-{formatCurrency(payroll.taxAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Totals Section */}
          <div className="mt-8 pt-6 border-t-2 border-dashed space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">إجمالي الاستحقاقات (الراتب الحقيقي)</span>
              <span className="text-lg font-bold text-foreground tabular-nums">
                {formatCurrency(
                  Number(payroll.fullMonthBaseSalary || payroll.baseSalary) +
                  Number(payroll.totalAllowances || 0) +
                  Number(payroll.overtimeAmount || 0) +
                  Number(payroll.bonuses || 0)
                )}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">إجمالي الاستقطاعات</span>
              <span className="text-red-600 font-bold tabular-nums">
                -{formatCurrency(
                  (Number(payroll.fullMonthBaseSalary || payroll.baseSalary) - Number(payroll.baseSalary)) +
                  Number(payroll.totalDeductions || 0) +
                  Number(payroll.socialInsurance || 0) +
                  Number(payroll.taxAmount || 0)
                )}
              </span>
            </div>

            <div className="p-4 rounded-xl bg-primary text-primary-foreground flex justify-between items-center shadow-xs mt-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary-foreground/20 flex items-center justify-center">
                  <DollarSign className="h-6 w-6" />
                </div>
                <span className="text-lg font-bold">صافي الراتب المستلم</span>
              </div>
              <span className="text-2xl font-black font-mono tabular-nums" dir="ltr">
                {formatCurrency(payroll.netSalary)}
              </span>
            </div>
          </div>

          {payroll.paidAt && (
            <div className="bg-green-50 border border-success rounded-lg p-4">
              <p className="text-green-800">
                ✓ تم الصرف بتاريخ {new Date(payroll.paidAt).toLocaleDateString('ar-EG')}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            إغلاق
          </Button>
          <Button variant="outline" onClick={() => onPrint(payroll)}>
            <FileText className="h-4 w-4 ms-2" />
            طباعة
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
