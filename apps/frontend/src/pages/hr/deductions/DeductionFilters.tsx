import React from "react";
import { Search } from "lucide-react";
import { DEDUCTION_TYPES } from "./types";

interface DeductionFiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterStatus: string;
  setFilterStatus: (status: string) => void;
  filterType: string;
  setFilterType: (type: string) => void;
  filterMonth: string;
  setFilterMonth: (month: string) => void;
  filterYear: string;
  setFilterYear: (year: string) => void;
}

export const DeductionFilters: React.FC<DeductionFiltersProps> = ({
  searchTerm,
  setSearchTerm,
  filterStatus,
  setFilterStatus,
  filterType,
  setFilterType,
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
}) => {
  return (
    <div className="bg-card rounded-lg shadow p-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            بحث
          </label>
          <div className="relative">
            <Search className="absolute right-3 top-2.5 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ابحث عن موظف أو سبب..."
              className="w-full pe-10 border border-border rounded-md px-3 py-2 bg-card text-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            الحالة
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
          >
            <option value="">الكل</option>
            <option value="PENDING">في الانتظار</option>
            <option value="APPROVED">موافق عليه</option>
            <option value="REJECTED">مرفوض</option>
            <option value="APPLIED">تم التطبيق</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            النوع
          </label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
          >
            <option value="">الكل</option>
            {Object.entries(DEDUCTION_TYPES).map(([key, value]) => (
              <option key={key} value={key}>
                {value}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            الشهر
          </label>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
          >
            <option value="">الكل</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
              <option key={month} value={month.toString()}>
                {month}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            السنة
          </label>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
          >
            <option value="">الكل</option>
            {Array.from(
              { length: 5 },
              (_, i) => new Date().getFullYear() - i,
            ).map((year) => (
              <option key={year} value={year.toString()}>
                {year}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
