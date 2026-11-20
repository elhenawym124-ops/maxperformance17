import React from "react";
import {
  CalendarDaysIcon,
  BellAlertIcon,
  ChartBarIcon,
  ShieldExclamationIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { format } from "date-fns";
import { MaintenanceAlertsData, MaintenanceRecord } from "./types";

interface MaintenanceAlertsAndHistoryTableProps {
  alerts: MaintenanceAlertsData;
  history: MaintenanceRecord[];
  formatPrice: (val: number | string) => string;
}

export const MaintenanceAlertsAndHistoryTable: React.FC<
  MaintenanceAlertsAndHistoryTableProps
> = ({ alerts, history, formatPrice }) => {
  return (
    <>
      {/* Alerts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Due Warranties */}
        <div className="bg-card rounded-xl border border-destructive dark:border-destructive/20 overflow-hidden shadow-sm">
          <div className="bg-red-50 dark:bg-destructive/10 px-6 py-4 border-b border-destructive dark:border-destructive/20 flex items-center gap-3">
            <ShieldExclamationIcon className="h-5 w-5 text-destructive" />
            <h3 className="font-black text-destructive dark:text-destructive">
              تنبيهات انتهاء الضمان (خلال 30 يوم)
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {alerts.expiringWarranties.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground italic text-sm">
                لا توجد ضمانات قاربت على الانتهاء
              </p>
            ) : (
              alerts.expiringWarranties.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-destructive/30 dark:bg-destructive/5 rounded-xl border border-destructive dark:border-destructive/10 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-destructive dark:bg-destructive/30 flex items-center justify-center text-destructive">
                      <BellAlertIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        {alert.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {alert.code}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      تاريخ الانتهاء
                    </span>
                    <span className="text-xs font-black text-destructive font-mono tabular-nums">
                      {alert.endDate
                        ? format(new Date(alert.endDate), "yyyy/MM/dd")
                        : "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Maintenance */}
        <div className="bg-card rounded-xl border border-warning dark:border-warning/20 overflow-hidden shadow-sm">
          <div className="bg-amber-50 dark:bg-warning/10 px-6 py-4 border-b border-warning dark:border-warning/20 flex items-center gap-3">
            <CalendarDaysIcon className="h-5 w-5 text-warning" />
            <h3 className="font-black text-warning dark:text-warning">
              مواعيد الصيانة القادمة
            </h3>
          </div>
          <div className="p-4 space-y-3">
            {alerts.upcomingMaintenance.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground italic text-sm">
                لا توجد صيانات مجدولة حالياً
              </p>
            ) : (
              alerts.upcomingMaintenance.map((alert, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 bg-warning/30 dark:bg-warning/5 rounded-xl border border-warning dark:border-warning/10 transition-all hover:scale-[1.01]"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-warning dark:bg-warning/30 flex items-center justify-center text-warning">
                      <ClockIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground text-sm">
                        {alert.name}
                      </h4>
                      <p className="text-[10px] font-bold text-warning uppercase">
                        {alert.maintenanceType}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <span className="text-[10px] text-muted-foreground block mb-1">
                      تاريخ الصيانة
                    </span>
                    <span className="text-xs font-black text-foreground font-mono tabular-nums">
                      {alert.scheduledDate
                        ? format(new Date(alert.scheduledDate), "yyyy/MM/dd")
                        : "-"}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Maintenance History Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-black text-foreground flex items-center gap-2">
            <ChartBarIcon className="h-6 w-6 text-primary" />
            سجل العمليات الأخير
          </h3>
        </div>

        <div className="bg-card rounded-[2.5rem] border border-border dark:border-border shadow-xl overflow-hidden">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-gray-50 dark:bg-muted text-muted-foreground text-[10px] font-black uppercase tracking-widest">
                <th className="px-6 py-5">الأصل</th>
                <th className="px-6 py-5">النوع</th>
                <th className="px-6 py-5">التكلفة</th>
                <th className="px-6 py-5">التاريخ</th>
                <th className="px-6 py-5">الحالة</th>
                <th className="px-6 py-5">بواسطة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border">
              {history.map((rec) => (
                <tr
                  key={rec.id}
                  className="hover:bg-gray-50/50 dark:hover:bg-muted transition-colors group"
                >
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-bold text-foreground text-sm">
                        {rec.asset?.name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
                        {rec.asset?.code}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground text-sm">
                        {rec.type}
                      </span>
                      <p className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">
                        {rec.description}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="font-black text-sm text-foreground font-mono tabular-nums">
                      {formatPrice(rec.cost)}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-bold text-muted-foreground font-mono tabular-nums">
                      {format(new Date(rec.startDate), "yyyy/MM/dd")}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black border ${
                        rec.status === "COMPLETED"
                          ? "bg-green-100 text-success border-success"
                          : rec.status === "SCHEDULED"
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-gray-100 text-foreground border-border"
                      }`}
                    >
                      {rec.status === "COMPLETED" ? "مكتمل" : "مجدول"}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-sm text-muted-foreground">
                    {rec.performedBy || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};
