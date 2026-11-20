import React from "react";
import {
  CalendarOff,
  Download,
  RefreshCw,
  Timer,
  UserCheck,
  UserX,
} from "lucide-react";
import { Card, CardContent } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { ATTENDANCE_MONTHS } from "./helpers";

interface AttendanceSheetFiltersAndKPIsProps {
  selectedMonth: number;
  selectedYear: number;
  currentYear: number;
  hasReport: boolean;
  attendanceRate: string;
  totals: { present: number; late: number; absent: number; leave: number };
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRefresh: () => void;
  onExport: () => void;
}

export const AttendanceSheetFiltersAndKPIs: React.FC<
  AttendanceSheetFiltersAndKPIsProps
> = ({
  selectedMonth,
  selectedYear,
  currentYear,
  hasReport,
  attendanceRate,
  totals,
  onMonthChange,
  onYearChange,
  onRefresh,
  onExport,
}) => {
  return (
    <>
      <Card className="border-none shadow-sm dark:bg-muted backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">الشهر</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => onMonthChange(parseInt(v ?? "1", 10))}
              >
                <SelectTrigger className="w-[150px] dark:bg-muted dark:border-border">
                  <SelectValue className="dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-border">
                  {ATTENDANCE_MONTHS.map((month, index) => (
                    <SelectItem
                      key={index}
                      value={(index + 1).toString()}
                      className="dark:text-gray-300 dark:focus:bg-muted"
                    >
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="dark:text-gray-300">السنة</Label>
              <Select
                value={selectedYear.toString()}
                onValueChange={(v) =>
                  onYearChange(parseInt(v ?? String(currentYear), 10))
                }
              >
                <SelectTrigger className="w-[120px] dark:bg-muted dark:border-border font-mono tabular-nums">
                  <SelectValue className="dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-border">
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="dark:text-gray-300 dark:focus:bg-muted font-mono tabular-nums"
                    >
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 me-auto">
              <Button
                variant="outline"
                onClick={onRefresh}
                className="dark:bg-gray-800 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
              <Button
                variant="outline"
                onClick={onExport}
                className="dark:bg-gray-800 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
              >
                <Download className="h-4 w-4 ms-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {hasReport && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card className="bg-gradient-to-br from-success to-success text-white border-none shadow-lg">
            <CardContent className="p-5">
              <p className="text-emerald-100 text-sm font-medium">
                نسبة الحضور
              </p>
              <h3 className="text-2xl font-bold mt-1 font-mono tabular-nums">
                {attendanceRate}%
              </h3>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    حاضر
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-success dark:text-success font-mono tabular-nums">
                    {totals.present}
                  </h3>
                </div>
                <UserCheck className="h-8 w-8 text-success/20 dark:text-success/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    متأخر
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-warning dark:text-warning font-mono tabular-nums">
                    {totals.late}
                  </h3>
                </div>
                <Timer className="h-8 w-8 text-warning/20 dark:text-warning/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    غائب
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-destructive dark:text-destructive font-mono tabular-nums">
                    {totals.absent}
                  </h3>
                </div>
                <UserX className="h-8 w-8 text-destructive/20 dark:text-destructive/20" />
              </div>
            </CardContent>
          </Card>
          <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">
                    إجازات
                  </p>
                  <h3 className="text-2xl font-bold mt-1 text-primary dark:text-primary font-mono tabular-nums">
                    {totals.leave}
                  </h3>
                </div>
                <CalendarOff className="h-8 w-8 text-primary/20 dark:text-primary/20" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};
