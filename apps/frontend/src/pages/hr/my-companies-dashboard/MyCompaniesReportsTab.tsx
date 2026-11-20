import React from "react";
import { ChartBarIcon } from "@heroicons/react/24/outline";

interface MyCompaniesReportsTabProps {
  onGoToReports: () => void;
}

export const MyCompaniesReportsTab: React.FC<MyCompaniesReportsTabProps> = ({
  onGoToReports,
}) => {
  return (
    <div className="bg-card p-8 rounded-xl shadow-sm border border-border dark:border-border text-center">
      <ChartBarIcon className="w-16 h-16 mx-auto text-muted-foreground dark:text-foreground mb-4" />
      <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">
        التقارير الموحدة
      </h3>
      <p className="text-muted-foreground mb-4">
        قريباً... يمكنك الوصول للتقارير من صفحة التقارير الموحدة
      </p>
      <button
        onClick={onGoToReports}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        الذهاب للتقارير
      </button>
    </div>
  );
};
