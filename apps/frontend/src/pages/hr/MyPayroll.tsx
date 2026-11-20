import React from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PolarisMyPayrollView } from "./PolarisMyPayrollView";
import {
  useMyPayrollController,
  containerVariants,
  MyPayrollHeader,
  MyPayrollHeroCard,
  MyPayrollBreakdownGrid,
  MyPayrollSidebar,
  MyPayrollSkeleton,
  MyPayrollEmptyState,
  MyPayrollFooter,
} from "./my-payroll/index";

const MyPayroll: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlLayout = searchParams.get("layout");
  const sessionLayout =
    typeof window !== "undefined"
      ? sessionStorage.getItem("maxp_session_layout")
      : null;
  const isPolaris = urlLayout !== "legacy" && sessionLayout !== "legacy";

  const {
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
    handlePrint,
  } = useMyPayrollController();

  if (isPolaris) {
    return (
      <PolarisMyPayrollView
        t={t}
        loading={loading}
        payrollData={payrollData}
        month={month}
        setMonth={setMonth}
        year={year}
        setYear={setYear}
        months={months}
        years={years}
        allowances={allowances}
        groupedDeductions={groupedDeductions}
        originalBaseSalary={originalBaseSalary}
        totalEarningsDisplay={totalEarningsDisplay}
        totalDeductionsDisplay={totalDeductionsDisplay}
        onPrint={handlePrint}
      />
    );
  }

  return (
    <div
      className="space-y-6 w-full pb-8"
      dir="rtl"
    >
      <MyPayrollHeader
        t={t}
        payrollData={payrollData}
        month={month}
        onMonthChange={setMonth}
        year={year}
        onYearChange={setYear}
        months={months}
        years={years}
        onPrint={handlePrint}
      />

      <AnimatePresence mode="wait">
        {loading ? (
          <MyPayrollSkeleton />
        ) : !payrollData ? (
          <MyPayrollEmptyState t={t} />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-[1400px] mx-auto w-full grid lg:grid-cols-12 gap-10 relative z-10"
          >
            <div className="lg:col-span-8 space-y-10">
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

            <MyPayrollSidebar
              t={t}
              payrollData={payrollData}
              originalBaseSalary={originalBaseSalary}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <MyPayrollFooter />
    </div>
  );
};

export default MyPayroll;
