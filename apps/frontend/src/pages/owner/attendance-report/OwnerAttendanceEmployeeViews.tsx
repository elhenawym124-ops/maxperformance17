import React from "react";
import {
  BuildingOfficeIcon,
  ChartBarIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  ClockIcon,
  EnvelopeIcon,
  UserGroupIcon,
  UserMinusIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { EmployeeAttendanceData, OwnerReportViewMode } from "./types";
import {
  getAttendanceEvaluationText,
  getAttendanceRate,
  getOwnerReportImageUrl,
} from "./reportExporters";

interface OwnerAttendanceEmployeeViewsProps {
  viewMode: OwnerReportViewMode;
  filteredEmployees: EmployeeAttendanceData[];
  expandedEmployees: Set<string>;
  onToggleExpand: (employeeId: string) => void;
}

export const OwnerAttendanceEmployeeViews: React.FC<
  OwnerAttendanceEmployeeViewsProps
> = ({
  viewMode,
  filteredEmployees,
  expandedEmployees,
  onToggleExpand,
}) => {
  if (viewMode === "cards") {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filteredEmployees.map((item) => {
          const attendanceRate = getAttendanceRate(item);
          const isExpanded = expandedEmployees.has(item.user.id);

          return (
            <div
              key={`${item.user.id}-${item.company.id}`}
              className="bg-card rounded-xl border border-border dark:border-border shadow-sm hover:shadow-md transition-all overflow-hidden"
            >
              <div className="p-5 bg-gradient-to-r from-primary to-primary dark:from-primary/20 dark:to-primary/20 border-b border-border dark:border-border">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 bg-card rounded-xl flex items-center justify-center overflow-hidden border-2 border-white dark:border-border shadow-md flex-shrink-0">
                    {item.user.avatar ? (
                      <img
                        src={getOwnerReportImageUrl(item.user.avatar) || ""}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-primary font-bold text-xl">
                        {item.user.firstName?.charAt(0)}
                        {item.user.lastName?.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-foreground truncate">
                      {item.user.firstName} {item.user.lastName}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-foreground dark:text-muted-foreground mt-1">
                      <EnvelopeIcon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="truncate">{item.user.email}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="inline-flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-lg border border-border">
                        <div className="w-4 h-4 rounded overflow-hidden flex-shrink-0">
                          {item.company.logo ? (
                            <img
                              src={getOwnerReportImageUrl(item.company.logo) || ""}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <BuildingOfficeIcon className="w-full h-full text-muted-foreground" />
                          )}
                        </div>
                        <span className="text-xs font-medium text-foreground">
                          {item.company.name}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left">
                    <div
                      className={`text-2xl font-bold font-mono tabular-nums ${
                        attendanceRate >= 90
                          ? "text-green-600"
                          : attendanceRate >= 75
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {attendanceRate}%
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      معدل الانضباط
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4">
                  <div className="flex justify-between text-xs font-medium text-foreground dark:text-muted-foreground mb-2">
                    <span>الحضور خلال الفترة</span>
                    <span className="text-gray-500 font-mono tabular-nums">
                      {item.stats.totalRecords} يوم
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        attendanceRate >= 90
                          ? "bg-gradient-to-r from-success to-success"
                          : attendanceRate >= 75
                            ? "bg-gradient-to-r from-warning to-warning"
                            : "bg-gradient-to-r from-destructive to-destructive"
                      }`}
                      style={{ width: `${Math.min(100, attendanceRate)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                  <div className="text-center p-3 bg-success/10 dark:bg-success/20 rounded-lg border border-success dark:border-success/30">
                    <CheckCircleIcon className="w-5 h-5 text-success mx-auto mb-1" />
                    <div className="text-xl font-bold font-mono tabular-nums text-success">
                      {item.stats.present}
                    </div>
                    <div className="text-[10px] text-foreground dark:text-muted-foreground mt-0.5">
                      حاضر
                    </div>
                  </div>
                  <div className="text-center p-3 bg-warning/10 dark:bg-warning/20 rounded-lg border border-warning dark:border-warning/30">
                    <ClockIcon className="w-5 h-5 text-warning mx-auto mb-1" />
                    <div className="text-xl font-bold font-mono tabular-nums text-warning">
                      {item.stats.late}
                    </div>
                    <div className="text-[10px] text-foreground dark:text-muted-foreground mt-0.5">
                      متأخر
                    </div>
                  </div>
                  <div className="text-center p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg border border-destructive dark:border-destructive/30">
                    <XCircleIcon className="w-5 h-5 text-destructive mx-auto mb-1" />
                    <div className="text-xl font-bold font-mono tabular-nums text-destructive">
                      {item.stats.absent}
                    </div>
                    <div className="text-[10px] text-foreground dark:text-muted-foreground mt-0.5">
                      غائب
                    </div>
                  </div>
                  <div className="text-center p-3 bg-primary/10 dark:bg-primary/20 rounded-lg border border-primary dark:border-primary/30">
                    <UserMinusIcon className="w-5 h-5 text-primary mx-auto mb-1" />
                    <div className="text-xl font-bold font-mono tabular-nums text-primary">
                      {item.stats.onLeave}
                    </div>
                    <div className="text-[10px] text-foreground dark:text-muted-foreground mt-0.5">
                      إجازة
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onToggleExpand(item.user.id)}
                  className="w-full mt-4 flex items-center justify-center gap-2 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg transition-colors"
                >
                  {isExpanded ? (
                    <>
                      <ChevronUpIcon className="w-4 h-4" />
                      إخفاء التفاصيل
                    </>
                  ) : (
                    <>
                      <ChevronDownIcon className="w-4 h-4" />
                      عرض المزيد من التفاصيل
                    </>
                  )}
                </button>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-border dark:border-border space-y-3 animate-fadeIn">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-gray-50 dark:bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          أيام الحضور الفعلي
                        </div>
                        <div className="font-bold font-mono tabular-nums text-foreground">
                          {item.stats.present + item.stats.late} يوم
                        </div>
                      </div>
                      <div className="bg-gray-50 dark:bg-muted p-3 rounded-lg">
                        <div className="text-xs text-muted-foreground mb-1">
                          أيام الغياب الكلي
                        </div>
                        <div className="font-bold font-mono tabular-nums text-foreground">
                          {item.stats.absent + item.stats.onLeave} يوم
                        </div>
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-primary to-primary dark:from-primary/10 dark:to-primary/10 p-3 rounded-lg border border-primary dark:border-primary/30">
                      <div className="flex items-center gap-2 text-xs text-primary dark:text-primary font-medium mb-2">
                        <ChartBarIcon className="w-4 h-4" />
                        تقييم الأداء
                      </div>
                      <div className="text-sm text-foreground">
                        {getAttendanceEvaluationText(attendanceRate)}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredEmployees.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <UserGroupIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg font-medium">
              لا توجد بيانات حضور للمرشحات المختارة
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-gray-50 dark:bg-muted">
            <tr>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                الموظف
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                الشركة
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider lg:w-20">
                حاضر
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider lg:w-20">
                متأخر
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider lg:w-20">
                غائب
              </th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider lg:w-20">
                إجازة
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                معدل الانضباط
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border dark:divide-border">
            {filteredEmployees.map((item) => {
              const attendanceRate = getAttendanceRate(item);

              return (
                <tr
                  key={`${item.user.id}-${item.company.id}`}
                  className="hover:bg-gray-50/80 dark:hover:bg-muted transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary dark:bg-primary/30 rounded-full flex items-center justify-center overflow-hidden border border-white dark:border-border shadow-sm">
                        {item.user.avatar ? (
                          <img
                            src={getOwnerReportImageUrl(item.user.avatar) || ""}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-primary font-bold text-sm">
                            {item.user.firstName?.charAt(0)}
                            {item.user.lastName?.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {item.user.firstName} {item.user.lastName}
                        </p>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <EnvelopeIcon className="w-3 h-3" />
                          {item.user.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5 bg-muted px-2 py-1 rounded-md">
                      <div className="w-5 h-5 rounded overflow-hidden">
                        {item.company.logo ? (
                          <img
                            src={getOwnerReportImageUrl(item.company.logo) || ""}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <BuildingOfficeIcon className="w-full h-full text-muted-foreground p-0.5" />
                        )}
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        {item.company.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-green-600 font-bold font-mono tabular-nums bg-success/10 dark:bg-success/20 px-2 py-1 rounded-md text-sm">
                      {item.stats.present}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-yellow-600 font-bold font-mono tabular-nums bg-warning/10 dark:bg-warning/20 px-2 py-1 rounded-md text-sm">
                      {item.stats.late}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-red-600 font-bold font-mono tabular-nums bg-destructive/10 dark:bg-destructive/20 px-2 py-1 rounded-md text-sm">
                      {item.stats.absent}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="text-blue-600 font-bold font-mono tabular-nums bg-primary/10 dark:bg-primary/20 px-2 py-1 rounded-md text-sm">
                      {item.stats.onLeave}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap min-w-[140px]">
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between text-[11px] font-medium font-mono tabular-nums">
                        <span
                          className={
                            attendanceRate >= 90
                              ? "text-green-600"
                              : attendanceRate >= 75
                                ? "text-yellow-600"
                                : "text-red-600"
                          }
                        >
                          {attendanceRate}%
                        </span>
                        <span className="text-gray-400">
                          {item.stats.totalRecords} أيام
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            attendanceRate >= 90
                              ? "bg-green-500"
                              : attendanceRate >= 75
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${Math.min(100, attendanceRate)}%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filteredEmployees.length === 0 && (
        <div className="py-20 text-center">
          <UserGroupIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            لا توجد بيانات حضور للمرشحات المختارة
          </p>
        </div>
      )}
    </div>
  );
};
