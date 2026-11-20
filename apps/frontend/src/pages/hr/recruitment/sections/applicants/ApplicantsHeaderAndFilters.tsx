import React from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";

interface ApplicantsHeaderAndFiltersProps {
  searchTerm: string;
  onSearchTermChange: (val: string) => void;
  filterStatus: string;
  onFilterStatusChange: (val: string) => void;
  onOpenAddModal: () => void;
}

export const ApplicantsHeaderAndFilters: React.FC<
  ApplicantsHeaderAndFiltersProps
> = ({
  searchTerm,
  onSearchTermChange,
  filterStatus,
  onFilterStatusChange,
  onOpenAddModal,
}) => {
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground dark:text-white">
            المتقدمين
          </h2>
          <p className="text-gray-600 dark:text-muted-foreground mt-1">
            إدارة المتقدمين على الوظائف
          </p>
        </div>
        <button
          onClick={onOpenAddModal}
          className="px-6 py-3 bg-gradient-to-r from-blue-600 to-primary text-white rounded-xl hover:shadow-lg transition-all flex items-center gap-2 font-semibold"
        >
          <PlusIcon className="w-5 h-5" />
          إضافة متقدم
        </button>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-lg border-2 border-border dark:border-border">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <MagnifyingGlassIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="ابحث عن متقدم..."
              value={searchTerm}
              onChange={(e) => onSearchTermChange(e.target.value)}
              className="w-full pe-10 ps-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-muted dark:text-white"
            />
          </div>
          <select
            value={filterStatus}
            onChange={(e) => onFilterStatusChange(e.target.value)}
            className="px-4 py-3 border-2 border-border rounded-xl focus:ring-2 focus:ring-blue-500 dark:bg-muted dark:text-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="NEW">جديد</option>
            <option value="REVIEWING">قيد المراجعة</option>
            <option value="INTERVIEW_SCHEDULED">مقابلة مجدولة</option>
            <option value="INTERVIEWED">تمت المقابلة</option>
            <option value="OFFERED">تم العرض</option>
            <option value="HIRED">تم التوظيف</option>
            <option value="REJECTED">مرفوض</option>
          </select>
        </div>
      </div>
    </>
  );
};
