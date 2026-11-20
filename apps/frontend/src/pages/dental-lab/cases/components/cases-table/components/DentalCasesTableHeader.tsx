import React from "react";

export interface DentalCasesTableHeaderProps {
  isAllSelected: boolean;
  onToggleSelectAll: () => void;
}

export const DentalCasesTableHeader: React.FC<DentalCasesTableHeaderProps> = ({
  isAllSelected,
  onToggleSelectAll,
}) => {
  return (
    <thead>
      <tr className="border-b border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground font-semibold">
        <th className="w-8 py-2.5 px-2 text-center">
          <input
            type="checkbox"
            className="rounded border-border dark:border-border text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer align-middle"
            checked={isAllSelected}
            onChange={onToggleSelectAll}
            title="تحديد كل الحالات في هذه الصفحة"
            aria-label="تحديد كل الحالات"
          />
        </th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">رقم الحالة</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">المريض</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">الطبيب / العيادة</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">نوع الشغل</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">الأولوية</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">الفني</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">الحالة</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">تاريخ الدخول</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">تاريخ الاستحقاق</th>
        <th className="text-right py-2.5 px-3 whitespace-nowrap">المستحقات</th>
        <th className="text-center py-2.5 px-3 whitespace-nowrap">إجراءات</th>
      </tr>
    </thead>
  );
};
