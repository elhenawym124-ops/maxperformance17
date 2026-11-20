import React, { useState, useEffect } from "react";
import {
  Clock,
  Users,
  TrendingUp,
  TrendingDown,
  Download,
  RefreshCw,
  FileText,
} from "lucide-react";
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
import { Progress } from "../../../components/ui/progress";
import api from "../../../services/api";
import { toast } from "sonner";
import { tToast } from "../../../utils/i18n-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { Badge } from "../../../components/ui/badge";

interface AttendanceReport {
  totalEmployees: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  averageWorkHours: number;
  attendanceRate: number;
  byDepartment: {
    department: string;
    rate: number;
    employees: number;
  }[];
  employees: {
    id: string;
    userId: string;
    name: string;
    employeeNumber: string;
    department: string;
    position: string;
    presentDays: number;
    lateDays: number;
    absentDays: number;
    totalWorkHours: number;
    totalLateMinutes: number;
    attendanceRate: number;
  }[];
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

const AttendanceReport: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(
    currentDate.getMonth() + 1,
  );
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [report, setReport] = useState<AttendanceReport | null>(null);

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

      const response = await api.get(`/hr/reports/attendance?${params}`);
      setReport(response.data?.report || null);
    } catch (error) {
      console.error("Error fetching report:", error);
      tToast.error("AttendanceReport.failed_fetch_2d8e");
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    tToast.success("AttendanceReport.msg_74cd");
  };

  return (
    <div className="space-y-6 text-foreground">
      {/* Filters */}
      <Card className="border-none shadow-sm dark:bg-muted backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="space-y-2">
              <Label className="dark:text-gray-300">الشهر</Label>
              <Select
                value={selectedMonth.toString()}
                onValueChange={(v) => setSelectedMonth(parseInt(v))}
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
                onValueChange={(v) => setSelectedYear(parseInt(v))}
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
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-600 to-primary text-white border-none shadow-lg transform transition-all hover:scale-[1.02]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">
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
                        أيام الحضور
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-success dark:text-success">
                        {report.presentDays || 0}
                      </h3>
                    </div>
                    <Users className="h-10 w-10 text-success/20 dark:text-success/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        أيام الغياب
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-destructive dark:text-destructive">
                        {report.absentDays || 0}
                      </h3>
                    </div>
                    <TrendingDown className="h-10 w-10 text-destructive/20 dark:text-destructive/20" />
                  </div>
                </CardContent>
              </Card>

              <Card className="dark:bg-gray-800 dark:border-border shadow-sm border-none bg-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-muted-foreground text-sm font-medium">
                        متوسط ساعات العمل
                      </p>
                      <h3 className="text-3xl font-bold mt-1 text-warning dark:text-warning">
                        {report.averageWorkHours || 0}
                      </h3>
                    </div>
                    <Clock className="h-10 w-10 text-warning/20 dark:text-warning/20" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* By Department */}
              <Card className="lg:col-span-1 dark:bg-muted dark:border-border shadow-sm border-none bg-white overflow-hidden">
                <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted p-4">
                  <CardTitle className="text-lg font-semibold dark:text-white flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    الحضور حسب القسم
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {report.byDepartment && report.byDepartment.length > 0 ? (
                      report.byDepartment.map((dept, index) => (
                        <div
                          key={index}
                          className="space-y-2 p-2 rounded-lg hover:bg-muted/50/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium dark:text-muted-foreground">
                              {dept.department}
                            </span>
                            <span className="text-sm font-semibold text-primary">
                              {dept.rate}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{dept.employees} موظف</span>
                          </div>
                          <Progress
                            value={dept.rate}
                            className="h-1.5 dark:bg-muted"
                          />
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        لا توجد بيانات
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Comprehensive Employee Table */}
              <Card className="lg:col-span-2 dark:bg-muted dark:border-border shadow-sm border-none bg-white">
                <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted p-4">
                  <CardTitle className="text-lg font-semibold dark:text-white flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    تقرير الحضور لكل موظف
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-gray-50 dark:bg-muted">
                        <TableRow>
                          <TableHead className="text-right">الموظف</TableHead>
                          <TableHead className="text-right">القسم</TableHead>
                          <TableHead className="text-right">حضور</TableHead>
                          <TableHead className="text-right">غياب</TableHead>
                          <TableHead className="text-right">تأخير</TableHead>
                          <TableHead className="text-right">الساعات</TableHead>
                          <TableHead className="text-right">النسبة</TableHead>
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
                                  className="text-emerald-600 border-success bg-success/10 dark:bg-success/20 dark:border-success"
                                >
                                  {emp.presentDays}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${emp.absentDays > 0 ? "text-rose-600 border-destructive bg-destructive/10 dark:bg-destructive/20 dark:border-destructive" : "text-gray-400 border-border"}`}
                                >
                                  {emp.absentDays}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${emp.lateDays > 0 ? "text-amber-600 border-warning bg-warning/10 dark:bg-warning/20 dark:border-warning" : "text-gray-400 border-border"}`}
                                >
                                  {emp.lateDays}
                                </Badge>
                              </TableCell>
                              <TableCell className="dark:text-gray-300">
                                {emp.totalWorkHours.toFixed(1)}h
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-sm">
                                    {emp.attendanceRate}%
                                  </span>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell
                              colSpan={7}
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
            </div>
          </>
        )
      )}
    </div>
  );
};

export default AttendanceReport;
