import React from "react";
import { Printer, Calendar, Wallet, TrendingUp, TrendingDown, Building, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import {
  MyPayrollSkeleton,
  MyPayrollEmptyState,
  MyPayrollHeroCard,
  MyPayrollBreakdownGrid,
  MyPayrollSidebar,
} from "./my-payroll/index";

export interface PolarisMyPayrollViewProps {
  t: (key: string) => string;
  loading: boolean;
  payrollData: any;
  month: number;
  setMonth: (month: number) => void;
  year: number;
  setYear: (year: number) => void;
  months: Array<{ value: number; label: string }>;
  years: number[];
  allowances: any[];
  groupedDeductions: any[];
  originalBaseSalary: number;
  totalEarningsDisplay: number;
  totalDeductionsDisplay: number;
  onPrint: () => void;
}

export const PolarisMyPayrollView: React.FC<PolarisMyPayrollViewProps> = ({
  t,
  loading,
  payrollData,
  month,
  setMonth,
  year,
  setYear,
  months,
  years,
  allowances,
  groupedDeductions,
  originalBaseSalary,
  totalEarningsDisplay,
  totalDeductionsDisplay,
  onPrint,
}) => {
  return (
    <div
      data-polaris-my-payroll-view="true"
      className="polaris-my-payroll-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title={t("myPayroll.title") || "قسيمة راتبي الشهرية"}
        subtitle={`استعراض مفردات المرتب، البدلات، والاستقطاعات لشهر ${month}/${year}`}
        badges={
          payrollData?.status && (
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-success/10 text-success dark:text-success border border-success/20 tabular-nums">
              {payrollData.status === "PAID" ? "مدفوع" : "معتمد"}
            </span>
          )
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1.5 bg-card p-1 rounded-lg border border-border/70 shadow-2xs">
              <Select value={String(month)} onValueChange={(val) => setMonth(Number(val))}>
                <SelectTrigger className="w-[100px] h-7 text-xs bg-transparent border-0 shadow-none focus:ring-0">
                  <SelectValue placeholder="الشهر" />
                </SelectTrigger>
                <SelectContent>
                  {months.map((m) => (
                    <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="h-4 w-px bg-border/70" />

              <Select value={String(year)} onValueChange={(val) => setYear(Number(val))}>
                <SelectTrigger className="w-[85px] h-7 text-xs bg-transparent border-0 shadow-none focus:ring-0 font-mono tabular-nums">
                  <SelectValue placeholder="السنة" />
                </SelectTrigger>
                <SelectContent>
                  {years.map((y) => (
                    <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={onPrint}
              disabled={!payrollData}
              className="gap-1.5 h-8 text-xs font-semibold rounded-lg border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-95 shadow-2xs"
            >
              <Printer className="h-3.5 w-3.5 text-muted-foreground" />
              <span>طباعة القسيمة</span>
            </Button>
          </div>
        }
      />

      {/* 2. Main Payslip Content */}
      {loading ? (
        <div className="bg-card rounded-xl border border-border/70 p-6 shadow-xs">
          <MyPayrollSkeleton />
        </div>
      ) : !payrollData ? (
        <div className="bg-card rounded-xl border border-border/70 p-6 shadow-xs">
          <MyPayrollEmptyState t={t} />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <MyPayrollHeroCard
              t={t}
              payrollData={payrollData}
              originalBaseSalary={originalBaseSalary}
            />

            <MyPayrollBreakdownGrid
              t={t}
              payrollData={payrollData}
              allowances={allowances}
              groupedDeductions={groupedDeductions}
              totalEarningsDisplay={totalEarningsDisplay}
              totalDeductionsDisplay={totalDeductionsDisplay}
            />
          </div>

          <div className="lg:col-span-4">
            <MyPayrollSidebar
              t={t}
              payrollData={payrollData}
              originalBaseSalary={originalBaseSalary}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default PolarisMyPayrollView;
