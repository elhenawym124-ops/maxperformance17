import React from "react";
import { Gift } from "lucide-react";
import type { CustomerLoyaltyProgram } from "./types";
import { getProgramIcon, getStatusColor, getStatusLabel } from "./helpers";

interface LoyaltyProgramsTabProps {
  programs: CustomerLoyaltyProgram[];
  onCreateProgram: () => void;
}

export const LoyaltyProgramsTab: React.FC<LoyaltyProgramsTabProps> = ({
  programs,
  onCreateProgram,
}) => {
  if (programs.length === 0) {
    return (
      <div className="text-center py-12">
        <Gift className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          لا توجد برامج ولاء
        </h3>
        <p className="text-muted-foreground mb-4 text-sm">
          ابدأ بإنشاء برنامج ولاء للعملاء
        </p>
        <button
          type="button"
          onClick={onCreateProgram}
          className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary transition-colors shadow-sm text-sm"
        >
          إنشاء برنامج جديد
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {programs.map((program) => (
        <div
          key={program.id}
          className="bg-gray-50 dark:bg-muted rounded-xl p-5 border border-border shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between mb-4">
              <div
                className={`p-2.5 rounded-lg ${
                  program.status === "ACTIVE"
                    ? "bg-purple-100 text-primary dark:bg-primary/30"
                    : "bg-gray-100 text-foreground dark:bg-muted"
                }`}
              >
                {getProgramIcon(program.type)}
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
                  program.status,
                )}`}
              >
                {getStatusLabel(program.status)}
              </span>
            </div>

            <h3 className="font-bold text-lg text-foreground mb-2">
              {program.nameAr || program.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {program.description}
            </p>

            <div className="space-y-2 text-sm border-t border-border/80 pt-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  نقاط لكل عملية:
                </span>
                <span className="font-semibold text-foreground font-mono tabular-nums">
                  {program.pointsPerPurchase}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  العملاء:
                </span>
                <span className="font-semibold text-foreground font-mono tabular-nums">
                  {program.customersCount}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  معدل الاستبدال:
                </span>
                <span className="font-semibold text-foreground font-mono tabular-nums">
                  {program.redemptionRate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-5">
            <button
              type="button"
              className="flex-1 px-3 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary transition-colors shadow-sm"
            >
              تعديل
            </button>
            <button
              type="button"
              className="flex-1 px-3 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted dark:hover:bg-muted transition-colors"
            >
              عرض
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
