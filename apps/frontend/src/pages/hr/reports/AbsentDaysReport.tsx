import React, { useState, useEffect } from "react";
import { CalendarX2, Users, TrendingUp, Download, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../components/ui/select";
import { Badge } from "../../../components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import api from "../../../services/api";
import { toast } from "sonner";

interface AbsentEmployee {
  id: string;
  userId: string;
  name: string;
  employeeNumber: string;
  department: string;
  position: string;
  absentDays: number;
  absentDates: string[];
  attendanceRate: number;
}

interface AbsentDaysReportData {
  month: number;
  year: number;
  totalEmployees: number;
  totalAbsentDays: number;
  totalWorkingDays: number;
  attendanceRate: number;
  employees: AbsentEmployee[];
}

const months = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

const formatDate = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-");
  return `${day}/${month}/${year}`;
};

const getWeekday = (dateStr: string): string => {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year!, month! - 1, day!);
  return new Intl.DateTimeFormat("ar-EG", { weekday: "long" }).format(date);
};

const AbsentDaysReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [report, setReport] = useState<AbsentDaysReportData | null>(null);

  useEffect(() => {
    fetchReport();
  }, [selectedMonth, selectedYear]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        month: selectedMonth.toString(),
        year: selectedYear.toString(),
      });

      const response = await api.get<{ report: AbsentDaysReportData }>(
        `/hr/reports/absent-days?${params}`,
      );
      setReport(response.data?.report || null);
    } catch (error) {
      console.error("Error fetching absent days report:", error);
      toast.error("حدث خطأ أثناء جلب تقرير أيام الغياب");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!report || report.employees.length === 0) {
      toast.error("لا توجد بيانات للتصدير");
      return;
    }

    const rows: Array<Record<string, string | number>> = report.employees.map(
      (emp) => ({
        الموظف: emp.name,
        "رقم الموظف": emp.employeeNumber,
        القسم: emp.department,
        "عدد أيام الغياب": emp.absentDays,
        "أيام الغياب": emp.absentDates.map(formatDate).join("، "),
        "نسبة الحضور %": emp.attendanceRate,
      }),
    );

    const headers = Object.keys(rows[0] ?? {});
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers
          .map((h) => `"${String(r[h]).replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `absent-days-${selectedYear}-${selectedMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-foreground">
      <Card className="border-none shadow-sm dark:bg-muted backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">الشهر</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v ?? "1"))}
              >
                <SelectTrigger className="w-[150px] dark:bg-muted dark:border-border">
                  <SelectValue className="dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-border">
                  {months.map((month, index) => (
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
                  setSelectedYear(parseInt(v ?? String(currentDate.getFullYear())))
                }
              >
                <SelectTrigger className="w-[120px] dark:bg-muted dark:border-border">
                  <SelectValue className="dark:text-white" />
                </SelectTrigger>
                <SelectContent className="dark:bg-gray-800 dark:border-border">
                  {[2023, 2024, 2025, 2026].map((year) => (
                    <SelectItem
                      key={year}
                      value={year.toString()}
                      className="dark:text-gray-300 dark:focus:bg-muted"
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
                onClick={fetchReport}
                className="dark:bg-gray-800 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
              >
                <RefreshCw className="h-4 w-4 ms-2" />
                تحديث
              </Button>
              <Button
                variant="outline"
                onClick={handleExport}
                className="dark:bg-gray-800 dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
              >
                <Download className="h-4 w-4 ms-2" />
                تصدير
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        report && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-destructive to-destructive text-white border-none shadow-lg transform transition-all hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-rose-100 text-sm font-medium">
                        نسبة الحضور
                      </p>
                      <h3 className="text-3xl font-bold mt-1">
                        {report.attendanceRate || 0}%
                      </h3>
                    </div>
                    <TrendingUp className="h-10 w-10 opacity-40" />
                  </div>
                  <div className="mt-4 bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-white h-full"
                      style={{ width: `${report.attendanceRate || 0}%` }}
                    ></div>
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        إجمالي أيام الغياب
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-destructive dark:text-destructive">
                        {report.totalAbsentDays || 0}
                      </h3>
                    </div>
                    <CalendarX2 className="h-10 w-10 text-destructive/20 dark:text-destructive/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        أيام العمل في الشهر
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-warning dark:text-warning">
                        {report.totalWorkingDays || 0}
                      </h3>
                    </div>
                    <Users className="h-10 w-10 text-warning/20 dark:text-warning/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        عدد الموظفين
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-primary dark:text-primary">
                        {report.totalEmployees || 0}
                      </h3>
                    </div>
                    <Users className="h-10 w-10 text-primary/20 dark:text-primary/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
              <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted p-4">
                <CardTitle className="text-lg font-semibold dark:text-white flex items-center gap-2">
                  <CalendarX2 className="h-5 w-5 text-primary" />
                  أيام الغياب التفصيلية لكل موظف
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-gray-50 dark:bg-muted">
                      <TableRow>
                        <TableHead className="text-right">الموظف</TableHead>
                        <TableHead className="text-right">القسم</TableHead>
                        <TableHead className="text-right">عدد أيام الغياب</TableHead>
                        <TableHead className="text-right">النسبة</TableHead>
                        <TableHead className="text-right w-2/5">أيام الغياب</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {report.employees && report.employees.length > 0 ? (
                        report.employees.map((emp) => (
                          <TableRow
                            key={emp.id}
                            className="hover:bg-muted/50/50"
                          >
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium dark:text-muted-foreground">
                                  {emp.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  #{emp.employeeNumber}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">
                              {emp.department}
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${emp.absentDays > 0 ? "text-rose-600 border-destructive bg-destructive/10 dark:bg-destructive/20 dark:border-destructive" : "text-gray-400 border-border"}`}
                              >
                                {emp.absentDays}
                              </Badge>
                            </TableCell>
                            <TableCell className="dark:text-gray-300">
                              {emp.attendanceRate}%
                            </TableCell>
                            <TableCell>
                              {emp.absentDates.length > 0 ? (
                                <div className="flex flex-wrap gap-1">
                                  {emp.absentDates.map((d) => (
                                    <Badge
                                      key={d}
                                      variant="outline"
                                      className="text-rose-600 border-destructive bg-destructive/10 dark:bg-destructive/20 dark:border-destructive"
                                    >
                                      {formatDate(d)}
                                      <span className="me-1 text-xs text-muted-foreground/80">
                                        {getWeekday(d)}
                                      </span>
                                    </Badge>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-emerald-600 dark:text-success text-sm font-medium">
                                  لا يوجد غياب
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="text-center py-8 text-muted-foreground"
                          >
                            لا توجد بيانات للموظفين
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </>
        )
      )}
    </div>
  );
};

export default AbsentDaysReport;
