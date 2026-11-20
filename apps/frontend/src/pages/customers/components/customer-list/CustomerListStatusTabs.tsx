import React from "react";

interface CustomerListStatusTabsProps {
  currentStatus: string;
  onStatusChange: (statusId: string) => void;
}

export const CustomerListStatusTabs: React.FC<CustomerListStatusTabsProps> = ({
  currentStatus,
  onStatusChange,
}) => {
  const tabs = [
    { id: "", label: "الكل" },
    { id: "LEAD", label: "عملاء محتملون" },
    { id: "ACTIVE", label: "نشطون" },
    { id: "INACTIVE", label: "غير نشطين" },
    { id: "BLOCKED", label: "محظورون" },
  ];

  return (
    <div className="bg-zinc-100/80 dark:bg-muted p-1 rounded-lg border border-border dark:border-border flex items-center gap-1 overflow-x-auto no-scrollbar">
      {tabs.map((tab) => {
        const isActive = currentStatus === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onStatusChange(tab.id)}
            className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-all duration-150 active:scale-[0.97] flex items-center gap-1.5 ${
              isActive
                ? "bg-white dark:bg-muted text-foreground dark:text-muted-foreground shadow-xs font-semibold"
                : "text-zinc-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted font-medium"
            }`}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};
