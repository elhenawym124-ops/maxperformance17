import React from "react";
import { Search } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Button } from "../../../components/ui/button";
import { statusConfig } from "./helpers";
import type { PayStatusFilter } from "./types";

interface AdvancesFiltersCardProps {
  searchTerm: string;
  onSearchChange: (val: string) => void;
  statusFilter: string;
  onStatusFilterChange: (val: string) => void;
  payStatusFilter: PayStatusFilter;
  onPayStatusFilterChange: (val: PayStatusFilter) => void;
}

export const AdvancesFiltersCard: React.FC<AdvancesFiltersCardProps> = ({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  payStatusFilter,
  onPayStatusFilterChange,
}) => {
  const statusOptions = [
    { key: "all", label: "الكل" },
    { key: "PENDING", label: statusConfig.PENDING.label },
    { key: "APPROVED", label: statusConfig.APPROVED.label },
    { key: "COMPLETED", label: statusConfig.COMPLETED.label },
    { key: "REJECTED", label: statusConfig.REJECTED.label },
  ];

  const payStatusOptions: Array<{ key: PayStatusFilter; label: string }> = [
    { key: "all", label: "كل حالات السداد" },
    { key: "paid", label: "مسدد" },
    { key: "unpaid", label: "غير مسدد" },
  ];

  return (
    <Card className="bg-white dark:bg-muted border border-border dark:border-border shadow-sm rounded-xl">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground dark:text-muted-foreground font-medium">
              تصفية سريعة
            </p>
            <h3 className="text-lg font-bold mt-0.5 text-foreground dark:text-white">
              ابحث وفرّز طلبات السلف
            </h3>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-1/2">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground dark:text-muted-foreground h-4 w-4" />
            <Input
              placeholder="بحث باسم الموظف..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pe-10 bg-white border border-border text-foreground placeholder:text-slate-400 focus:border-info focus:ring-2 focus:ring-info dark:bg-muted dark:border-border dark:text-white dark:placeholder:text-slate-400 rounded-xl text-sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 justify-end w-full md:w-auto">
            {statusOptions.map((item) => (
              <Button
                key={item.key}
                size="sm"
                variant={statusFilter === item.key ? "default" : "outline"}
                className={`text-xs font-semibold rounded-lg ${
                  statusFilter === item.key
                    ? "bg-slate-900 text-white hover:bg-muted dark:bg-white dark:text-foreground"
                    : "bg-white border-border text-foreground hover:border-border dark:bg-muted dark:border-border dark:text-muted-foreground"
                }`}
                onClick={() => onStatusFilterChange(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 items-center border-t border-border dark:border-border pt-3">
          <span className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
            حالة السداد:
          </span>
          {payStatusOptions.map((item) => (
            <Button
              key={item.key}
              size="sm"
              variant={payStatusFilter === item.key ? "default" : "outline"}
              className={`text-xs rounded-lg ${
                payStatusFilter === item.key
                  ? "bg-emerald-600 text-white hover:bg-success border-success font-semibold"
                  : "bg-white border-border text-foreground hover:border-border dark:bg-muted dark:border-border dark:text-muted-foreground"
              }`}
              onClick={() => onPayStatusFilterChange(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
