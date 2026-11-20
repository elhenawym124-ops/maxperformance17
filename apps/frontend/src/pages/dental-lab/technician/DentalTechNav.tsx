import React from "react";
import { ListChecks, ScanLine, Wallet, Bell, BarChart3, AlertTriangle } from "lucide-react";

export type TechPortalSection = "bench" | "wage" | "kiosk" | "notifications" | "reports";

interface DentalTechNavProps {
  currentSection: TechPortalSection;
  onSelectSection: (section: TechPortalSection) => void;
  activeCasesCount: number;
  overdueCasesCount: number;
}

export const DentalTechNav: React.FC<DentalTechNavProps> = ({
  currentSection,
  onSelectSection,
  activeCasesCount,
  overdueCasesCount,
}) => {
  return (
    <nav className="flex items-center gap-1.5 p-1.5 bg-muted dark:bg-muted rounded-xl overflow-x-auto text-xs font-semibold">
      {/* 1. Bench */}
      <button
        onClick={() => onSelectSection("bench")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
          currentSection === "bench"
            ? "bg-card text-primary dark:text-primary shadow-xs font-bold"
            : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
        }`}
      >
        <ListChecks className="w-4 h-4" />
        <span>طاولتي وحالاتي</span>
        {activeCasesCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-primary dark:bg-primary/50 text-primary dark:text-primary">
            {activeCasesCount}
          </span>
        )}
      </button>

      {/* 2. Kiosk Barcode */}
      <button
        onClick={() => onSelectSection("kiosk")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
          currentSection === "kiosk"
            ? "bg-card text-primary dark:text-primary shadow-xs font-bold"
            : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
        }`}
      >
        <ScanLine className="w-4 h-4" />
        <span>ماسح الباركود</span>
      </button>

      {/* 3. Wage & Ledger */}
      <button
        onClick={() => onSelectSection("wage")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
          currentSection === "wage"
            ? "bg-card text-primary dark:text-primary shadow-xs font-bold"
            : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
        }`}
      >
        <Wallet className="w-4 h-4" />
        <span>مستحقاتي وسجل الصرف</span>
      </button>

      {/* 4. Notifications & Alerts */}
      <button
        onClick={() => onSelectSection("notifications")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
          currentSection === "notifications"
            ? "bg-card text-primary dark:text-primary shadow-xs font-bold"
            : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
        }`}
      >
        <Bell className="w-4 h-4" />
        <span>التنبيهات</span>
        {overdueCasesCount > 0 && (
          <span className="px-1.5 py-0.2 rounded-full text-[11px] bg-destructive dark:bg-destructive/50 text-destructive dark:text-destructive flex items-center gap-0.5">
            <AlertTriangle className="w-3 h-3 text-destructive" />
            {overdueCasesCount}
          </span>
        )}
      </button>

      {/* 5. Productivity Reports */}
      <button
        onClick={() => onSelectSection("reports")}
        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg transition whitespace-nowrap ${
          currentSection === "reports"
            ? "bg-card text-primary dark:text-primary shadow-xs font-bold"
            : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-white"
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span>تقرير الإنتاجية</span>
      </button>
    </nav>
  );
};

export default DentalTechNav;
