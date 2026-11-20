import React from "react";
import {
  User,
  Calendar,
  Clock,
  DollarSign,
  Award,
  Target,
  CheckCircle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { Progress } from "../../../../components/ui/progress";
import { EmployeeReportData } from "./types";
import {
  formatCurrency,
  getAttendanceRate,
  getPerformanceColor,
} from "./helpers";

interface EmployeeReportOverviewSectionProps {
  report: EmployeeReportData;
}

export const EmployeeReportOverviewSection: React.FC<
  EmployeeReportOverviewSectionProps
> = ({ report }) => {
  const attendanceRate = getAttendanceRate(report);

  return (
    <>
      <Card className="border-none shadow-lg overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary to-primary text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
              <User className="h-10 w-10" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">
                {report.employee?.name}
              </CardTitle>
              <p className="text-blue-100 text-sm mt-1 flex items-center gap-2">
                <span className="font-mono tabular-nums">
                  {report.employee?.employeeNumber}
                </span>
                <span className="opacity-50">•</span>
                <span>{report.employee?.department}</span>
                <span className="opacity-50">•</span>
                <span>{report.employee?.position}</span>
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-success to-success text-white border-none shadow-lg hover:shadow-xl transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-emerald-100 text-sm font-medium">
                  نسبة الحضور
                </p>
                <h3 className="text-3xl font-bold mt-1 font-mono tabular-nums">
                  {attendanceRate}%
                </h3>
              </div>
              <Clock className="h-10 w-10 opacity-30" />
            </div>
            <Progress
              value={parseFloat(attendanceRate)}
              className="mt-3 h-2 bg-white/20"
            />
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  طلبات الإجازات
                </p>
                <h3 className="text-3xl font-bold mt-1 text-primary dark:text-primary font-mono tabular-nums">
                  {report.leaves?.totalRequests || 0}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-mono tabular-nums">
                    {report.leaves?.approved || 0}
                  </span>{" "}
                  موافق عليها
                </p>
              </div>
              <Calendar className="h-10 w-10 text-primary/20 dark:text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  صافي الراتب
                </p>
                <h3 className="text-2xl font-bold mt-1 text-primary dark:text-primary font-mono tabular-nums">
                  {formatCurrency(report.payroll?.netSalary || 0)}
                </h3>
              </div>
              <DollarSign className="h-10 w-10 text-primary/20 dark:text-primary/20" />
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  تقييم الأداء
                </p>
                <h3
                  className={`text-3xl font-bold mt-1 font-mono tabular-nums ${getPerformanceColor(report.performance?.lastReview?.score || 0)}`}
                >
                  {report.performance?.lastReview?.score || "N/A"}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="font-mono tabular-nums">
                    {report.performance?.activeGoals || 0}
                  </span>{" "}
                  أهداف نشطة
                </p>
              </div>
              <Award className="h-10 w-10 text-warning/20 dark:text-warning/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm">
          <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-success dark:text-success" />
              تفاصيل الحضور
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-success/10 dark:bg-success/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  أيام الحضور
                </span>
                <Badge className="bg-emerald-600 text-white font-mono tabular-nums">
                  {report.attendance?.presentDays || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-destructive/10 dark:bg-destructive/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  أيام الغياب
                </span>
                <Badge className="bg-red-600 text-white font-mono tabular-nums">
                  {report.attendance?.absentDays || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-warning/10 dark:bg-warning/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  أيام التأخير
                </span>
                <Badge className="bg-orange-600 text-white font-mono tabular-nums">
                  {report.attendance?.lateDays || 0}
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 dark:bg-primary/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  إجمالي ساعات العمل
                </span>
                <Badge className="bg-blue-600 text-white font-mono tabular-nums">
                  {report.attendance?.totalWorkHours?.toFixed(1) || 0}h
                </Badge>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 dark:bg-primary/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  ساعات إضافية
                </span>
                <Badge className="bg-purple-600 text-white font-mono tabular-nums">
                  {report.attendance?.overtimeHours?.toFixed(1) || 0}h
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm">
          <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted">
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary dark:text-primary" />
              تفاصيل الراتب
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-muted dark:bg-muted rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  الراتب الأساسي
                </span>
                <span className="font-bold text-foreground font-mono tabular-nums">
                  {formatCurrency(report.payroll?.baseSalary || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-success/10 dark:bg-success/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  البدلات
                </span>
                <span className="font-bold text-success dark:text-success font-mono tabular-nums">
                  +{formatCurrency(report.payroll?.allowances || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-primary/10 dark:bg-primary/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  مكافأة الوقت الإضافي
                </span>
                <span className="font-bold text-primary dark:text-primary font-mono tabular-nums">
                  +{formatCurrency(report.payroll?.overtimePay || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-destructive/10 dark:bg-destructive/10 rounded-lg">
                <span className="text-sm font-medium dark:text-muted-foreground">
                  الخصومات
                </span>
                <span className="font-bold text-destructive dark:text-destructive font-mono tabular-nums">
                  -{formatCurrency(report.payroll?.deductions || 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-3 bg-gradient-to-r from-primary to-primary dark:from-primary/20 dark:to-primary/10 rounded-lg border-2 border-primary dark:border-primary">
                <span className="text-sm font-bold dark:text-muted-foreground">
                  صافي الراتب
                </span>
                <span className="font-bold text-xl text-primary dark:text-primary font-mono tabular-nums">
                  {formatCurrency(report.payroll?.netSalary || 0)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(report.performance?.lastReview ||
        (report.performance?.activeGoals || 0) > 0) && (
        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm">
          <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5 text-warning dark:text-warning" />
              الأداء والأهداف
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {report.performance?.lastReview && (
                <div className="p-4 bg-gradient-to-br from-warning to-warning dark:from-warning/10 dark:to-warning/10 rounded-lg border border-warning dark:border-warning">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="h-5 w-5 text-warning dark:text-warning" />
                    <span className="text-sm font-medium dark:text-muted-foreground">
                      آخر تقييم
                    </span>
                  </div>
                  <p
                    className={`text-3xl font-bold font-mono tabular-nums ${getPerformanceColor(report.performance.lastReview.score)}`}
                  >
                    {report.performance.lastReview.score}/5
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 font-mono tabular-nums">
                    {new Date(
                      report.performance.lastReview.date
                    ).toLocaleDateString("ar-EG")}
                  </p>
                </div>
              )}
              <div className="p-4 bg-gradient-to-br from-primary to-primary dark:from-primary/10 dark:to-primary/10 rounded-lg border border-primary dark:border-primary">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-5 w-5 text-primary dark:text-primary" />
                  <span className="text-sm font-medium dark:text-muted-foreground">
                    أهداف نشطة
                  </span>
                </div>
                <p className="text-3xl font-bold text-primary dark:text-primary font-mono tabular-nums">
                  {report.performance?.activeGoals || 0}
                </p>
              </div>
              <div className="p-4 bg-gradient-to-br from-success to-success dark:from-success/10 dark:to-success/10 rounded-lg border border-success dark:border-success">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-success dark:text-success" />
                  <span className="text-sm font-medium dark:text-muted-foreground">
                    أهداف مكتملة
                  </span>
                </div>
                <p className="text-3xl font-bold text-success dark:text-success font-mono tabular-nums">
                  {report.performance?.completedGoals || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
