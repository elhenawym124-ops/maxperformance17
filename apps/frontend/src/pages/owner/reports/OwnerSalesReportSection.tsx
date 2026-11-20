import React from "react";
import {
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { CompanySalesData, SalesReportData } from "./types";
import { getOwnerReportsImageUrl } from "./helpers";
import { DateInput } from '../../../components/ui/DateInput';

interface OwnerSalesReportSectionProps {
  startDate: string;
  onStartDateChange: (val: string) => void;
  endDate: string;
  onEndDateChange: (val: string) => void;
  onRangeSelect: (range: string) => void;
  overview?: SalesReportData["overview"];
  companies: CompanySalesData[];
  onNavigateCompanyOrders: (companyId: string) => void;
}

export const OwnerSalesReportSection: React.FC<
  OwnerSalesReportSectionProps
> = ({
  startDate,
  onStartDateChange,
  endDate,
  onEndDateChange,
  onRangeSelect,
  overview,
  companies,
  onNavigateCompanyOrders,
}) => {
  return (
    <>
      <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border">
        <div className="flex flex-wrap gap-3 items-center justify-center md:justify-start">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onRangeSelect("today")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              اليوم
            </button>
            <button
              onClick={() => onRangeSelect("yesterday")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              أمس
            </button>
            <button
              onClick={() => onRangeSelect("week")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              آخر 7 أيام
            </button>
            <button
              onClick={() => onRangeSelect("month")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              آخر 30 يوم
            </button>
            <button
              onClick={() => onRangeSelect("thisMonth")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              هذا الشهر
            </button>
            <button
              onClick={() => onRangeSelect("lastMonth")}
              className="px-3 py-1.5 text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground rounded-lg transition-colors"
            >
              الشهر الماضي
            </button>
          </div>
          <div className="flex items-center gap-2 bg-muted dark:bg-muted p-1.5 rounded-lg border border-border dark:border-border">
            <CalendarDaysIcon className="w-4 h-4 text-muted-foreground me-1" />
            <DateInput
              value={startDate}
              onChange={(e) => onStartDateChange(e.target.value)}
              className="bg-transparent border-none text-sm font-mono tabular-nums text-foreground focus:ring-0 p-0 w-32"
            />
            <span className="text-gray-400 text-sm">إلى</span>
            <DateInput
              value={endDate}
              onChange={(e) => onEndDateChange(e.target.value)}
              className="bg-transparent border-none text-sm font-mono tabular-nums text-foreground focus:ring-0 p-0 w-32"
            />
          </div>
        </div>
      </div>

      {overview && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-r from-primary to-primary p-4 rounded-xl text-white">
            <p className="text-sm opacity-80">عدد الشركات</p>
            <p className="text-2xl font-bold font-mono tabular-nums mt-1">
              {overview.totalCompanies}
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <ShoppingCartIcon className="w-4 h-4" /> إجمالي الطلبات
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground dark:text-white mt-1">
              {overview.totalOrders}
            </p>
          </div>
          <div className="bg-gradient-to-r from-success to-success p-4 rounded-xl text-white">
            <div className="flex items-center gap-2 text-sm opacity-80">
              <CurrencyDollarIcon className="w-4 h-4" /> إجمالي الإيرادات
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums mt-1">
              {overview.totalRevenue.toLocaleString()} ج.م
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border">
            <div className="flex items-center gap-2 text-success text-sm">
              <CheckCircleIcon className="w-4 h-4" /> مكتمل
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground dark:text-white mt-1">
              {overview.totalCompleted}
            </p>
          </div>
          <div className="bg-card p-4 rounded-xl shadow-sm border border-border dark:border-border">
            <div className="flex items-center gap-2 text-destructive text-sm">
              <XCircleIcon className="w-4 h-4" /> ملغي
            </div>
            <p className="text-2xl font-bold font-mono tabular-nums text-foreground dark:text-white mt-1">
              {overview.totalCancelled}
            </p>
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
        <div className="p-4 border-b border-border dark:border-border">
          <h2 className="text-lg font-bold text-foreground dark:text-white">
            مقارنة الشركات
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  الشركة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  الطلبات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  الإيرادات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  مكتمل
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  ملغي
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                  نسبة الإكمال
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:divide-border">
              {companies.map((item) => (
                <tr
                  key={item.company.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                        {item.company.logo ? (
                          <img
                            src={
                              getOwnerReportsImageUrl(item.company.logo) || ""
                            }
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BuildingOffice2Icon className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigateCompanyOrders(item.company.id);
                          }}
                          className="font-semibold text-primary dark:text-primary hover:underline text-right cursor-pointer"
                        >
                          {item.company.name}
                        </button>
                        <span className="text-xs text-muted-foreground">
                          اضغط لعرض التفاصيل
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono tabular-nums text-foreground">
                    {item.stats.totalOrders}
                  </td>
                  <td className="px-6 py-4 font-mono tabular-nums text-success font-medium">
                    {item.stats.totalRevenue.toLocaleString()} ج.م
                  </td>
                  <td className="px-6 py-4 font-mono tabular-nums text-foreground">
                    {item.stats.completedOrders}
                  </td>
                  <td className="px-6 py-4 font-mono tabular-nums text-foreground">
                    {item.stats.cancelledOrders}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium font-mono tabular-nums ${
                        item.stats.completionRate >= 80
                          ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                          : item.stats.completionRate >= 50
                            ? "bg-yellow-100 text-warning dark:bg-warning/30 dark:text-warning"
                            : "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive"
                      }`}
                    >
                      {item.stats.completionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
