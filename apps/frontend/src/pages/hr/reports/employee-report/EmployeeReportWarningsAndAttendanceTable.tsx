import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../../components/ui/card";
import { Badge } from "../../../../components/ui/badge";
import { EmployeeReportData } from "./types";
import { getStatusColor, getStatusLabel } from "./helpers";

interface EmployeeReportWarningsAndAttendanceTableProps {
  report: EmployeeReportData;
}

export const EmployeeReportWarningsAndAttendanceTable: React.FC<
  EmployeeReportWarningsAndAttendanceTableProps
> = ({ report }) => {
  return (
    <>
      {report.warnings?.total > 0 && (
        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm overflow-hidden">
          <CardHeader className="border-b dark:border-border bg-destructive/50 dark:bg-destructive/20">
            <CardTitle className="text-red-700 dark:text-destructive flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              الإنذارات والتحذيرات التأديبية
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y dark:divide-border">
              {report.warnings?.recent?.map((warning) => (
                <div
                  key={warning.id}
                  className="p-4 hover:bg-destructive/30 dark:hover:bg-destructive/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-destructive dark:text-destructive">
                        {warning.type}
                      </p>
                      <p className="text-sm text-foreground dark:text-muted-foreground mt-1 leading-relaxed">
                        {warning.description}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded whitespace-nowrap font-mono tabular-nums">
                      {new Date(warning.date).toLocaleDateString("ar-EG")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {report.attendance?.records && report.attendance.records.length > 0 && (
        <Card className="dark:bg-gray-800 dark:border-border border-none shadow-sm">
          <CardHeader className="border-b dark:border-border bg-muted dark:bg-muted">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Clock className="h-5 w-5 text-foreground dark:text-muted-foreground" />
              سجل الحضور الأخير
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      التاريخ
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      الحالة
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      الدخول
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      الخروج
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      ساعات العمل
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground">
                      التأخير
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y dark:divide-border max-h-96 overflow-y-auto">
                  {report.attendance.records.map((record, index) => (
                    <tr
                      key={index}
                      className="hover:bg-muted/50/50"
                    >
                      <td className="px-4 py-3 text-sm dark:text-muted-foreground font-mono tabular-nums">
                        {new Date(record.date).toLocaleDateString("ar-EG")}
                      </td>
                      <td className="px-4 py-3">
                        <Badge className={getStatusColor(record.status)}>
                          {getStatusLabel(record.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-muted-foreground font-mono tabular-nums">
                        {record.checkIn
                          ? new Date(record.checkIn).toLocaleTimeString(
                              "ar-EG",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-muted-foreground font-mono tabular-nums">
                        {record.checkOut
                          ? new Date(record.checkOut).toLocaleTimeString(
                              "ar-EG",
                              { hour: "2-digit", minute: "2-digit" }
                            )
                          : "-"}
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-muted-foreground font-mono tabular-nums">
                        {record.workHours?.toFixed(1) || 0}h
                      </td>
                      <td className="px-4 py-3 text-sm dark:text-muted-foreground font-mono tabular-nums">
                        {record.lateMinutes > 0
                          ? `${record.lateMinutes} دقيقة`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};
