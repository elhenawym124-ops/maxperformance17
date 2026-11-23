import React, { useCallback, useEffect, useState } from "react";
import { AlertTriangle, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";
import { fetchAbsenceAlerts, fetchInsights, runAbsenceAlerts } from "./api";
import type { AbsenceAlert, InsightsData } from "./types";

const money = (value: number) =>
  (Math.round((Number(value) || 0) * 100) / 100).toLocaleString("en-EG", { maximumFractionDigits: 2 });

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

interface RevenueRow {
  id: string;
  name: string;
  amount: number;
  count: number;
}

const RevenueTable: React.FC<{ title: string; rows: RevenueRow[]; isEn: boolean; empty: string }> = ({
  title,
  rows,
  isEn,
  empty,
}) => (
  <div className="rounded-xl border border-border/70 bg-card p-4">
    <h4 className="text-xs font-semibold text-foreground">{title}</h4>
    {rows.length === 0 ? (
      <p className="text-[11px] text-muted-foreground mt-2">{empty}</p>
    ) : (
      <div className="mt-2 space-y-1">
        {rows.slice(0, 6).map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-2 text-[11px] border-b border-border/40 last:border-0 py-1">
            <span className="truncate text-foreground">{row.name}</span>
            <span className="font-mono tabular-nums text-muted-foreground shrink-0">
              {money(row.amount)} {isEn ? "EGP" : "ج.م"} · {row.count}
            </span>
          </div>
        ))}
      </div>
    )}
  </div>
);

export const EducationGrowthTab: React.FC<{ isEn: boolean }> = ({ isEn }) => {
  const [months, setMonths] = useState(6);
  const [data, setData] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [absenceAlerts, setAbsenceAlerts] = useState<AbsenceAlert[]>([]);
  const [absenceBusy, setAbsenceBusy] = useState(false);
  const [absenceNotice, setAbsenceNotice] = useState("");

  const loadAbsence = useCallback(() => {
    let alive = true;
    fetchAbsenceAlerts(3, 45).then((rows) => {
      if (alive) setAbsenceAlerts(rows);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const cleanup = loadAbsence();
    return cleanup;
  }, [loadAbsence]);

  const handleSendAbsenceAlerts = async () => {
    setAbsenceBusy(true);
    setAbsenceNotice("");
    try {
      const result = await runAbsenceAlerts(3, 45);
      if (result) {
        setAbsenceNotice(
          isEn
            ? `Sent ${result.sent} · skipped ${result.skipped} · failed ${result.failed}`
            : `تم إرسال ${result.sent} · تم تخطي ${result.skipped} · فشل ${result.failed}`
        );
      } else {
        setAbsenceNotice(isEn ? "Failed to send alerts" : "تعذر إرسال التنبيهات");
      }
      loadAbsence();
    } finally {
      setAbsenceBusy(false);
    }
  };

  const load = useCallback(() => {
    let alive = true;
    setLoading(true);
    setError("");
    fetchInsights(months)
      .then((result) => {
        if (!alive) return;
        if (result) setData(result);
        else setError(isEn ? "Failed to load growth report" : "فشل جلب تقرير النمو");
      })
      .catch(() => alive && setError(isEn ? "Failed to load growth report" : "فشل جلب تقرير النمو"))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [months, isEn]);

  useEffect(() => {
    const cleanup = load();
    return cleanup;
  }, [load]);

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-4 text-xs text-destructive flex items-center justify-between gap-3">
        <span>{error}</span>
        <button type="button" onClick={load} className="inline-flex items-center gap-1 font-semibold">
          <RefreshCw className="w-3.5 h-3.5" />
          {isEn ? "Retry" : "إعادة المحاولة"}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-success" />
          <h3 className="text-sm font-semibold text-foreground">
            {isEn ? "Growth & retention" : "النمو والاحتفاظ"}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1 rounded-lg border border-border/70 bg-card p-1">
            {[3, 6, 12].map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setMonths(value)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                  months === value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                {value} {isEn ? "mo" : "شهور"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={load}
            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:bg-muted"
            aria-label={isEn ? "Refresh" : "تحديث"}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5">
        {[
          { label: isEn ? "Revenue" : "الإيراد", value: `${money(data?.summary.revenue || 0)} ${isEn ? "EGP" : "ج.م"}`, icon: Wallet, tone: "text-success" },
          { label: isEn ? "Active students" : "طلاب نشطون", value: String(data?.summary.activeStudents || 0), icon: Users, tone: "text-foreground" },
          { label: isEn ? "Repeat rate" : "معدل التكرار", value: `${data?.summary.repeatRate || 0}%`, icon: TrendingUp, tone: "text-primary" },
          { label: isEn ? "At-risk students" : "طلاب معرّضون للتسرب", value: String(data?.summary.atRisk || 0), icon: AlertTriangle, tone: data?.summary.atRisk ? "text-destructive" : "text-muted-foreground" },
          { label: isEn ? "Group renewals due" : "تجديدات جروبات مستحقة", value: String(data?.summary.groupDue || 0), icon: Users, tone: data?.summary.groupDue ? "text-warning" : "text-muted-foreground" },
        ].map((item) => (
          <div key={item.label} className="rounded-xl border border-border/70 bg-card p-3">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] text-muted-foreground">{item.label}</span>
              <item.icon className={`w-3.5 h-3.5 ${item.tone}`} />
            </div>
            <p className={`text-sm font-bold font-mono tabular-nums mt-1 ${item.tone}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <RevenueTable
          title={isEn ? "Revenue by branch" : "الإيراد حسب الفرع"}
          rows={data?.revenueByBranch || []}
          isEn={isEn}
          empty={isEn ? "No revenue in this period" : "لا يوجد إيراد في هذه الفترة"}
        />
        <RevenueTable
          title={isEn ? "Revenue by teacher" : "الإيراد حسب المدرّس"}
          rows={data?.revenueByTeacher || []}
          isEn={isEn}
          empty={isEn ? "No revenue in this period" : "لا يوجد إيراد في هذه الفترة"}
        />
        <RevenueTable
          title={isEn ? "Revenue by group" : "الإيراد حسب المجموعة"}
          rows={data?.revenueByGroup || []}
          isEn={isEn}
          empty={isEn ? "No group revenue" : "لا يوجد إيراد مجموعات"}
        />
        <RevenueTable
          title={isEn ? "Revenue by package" : "الإيراد حسب الباقة"}
          rows={data?.revenueByPackage || []}
          isEn={isEn}
          empty={isEn ? "No package revenue" : "لا يوجد إيراد باقات"}
        />
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "At-risk students" : "طلاب معرّضون للتسرب"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{data?.atRisk.length || 0}</span>
        </div>
        {(data?.atRisk.length || 0) === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No at-risk students" : "لا يوجد طلاب معرّضون للتسرب"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data?.atRisk.map((student) => (
              <div key={student.studentId} className="px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px]">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{student.studentName || "—"}</span>
                    {student.phone ? <span className="text-muted-foreground font-mono">{student.phone}</span> : null}
                  </div>
                  <div className="flex items-center gap-1 flex-wrap mt-1">
                    {student.reasons.map((reason) => (
                      <span key={reason.code} className="px-1.5 py-0.5 rounded border border-warning/20 bg-warning/10 text-warning">
                        {reason.label}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums text-muted-foreground shrink-0">
                  <span>{isEn ? "Hours" : "ساعات"}: {student.remainingHours}</span>
                  {student.overdueAmount > 0 ? (
                    <span className="text-destructive">{isEn ? "Overdue" : "متأخر"}: {money(student.overdueAmount)}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Group renewals due" : "تجديدات المجموعات المستحقة"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{data?.groupDue.length || 0}</span>
        </div>
        {(data?.groupDue.length || 0) === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No renewals due" : "لا توجد تجديدات مستحقة"}</p>
        ) : (
          <div className="divide-y divide-border/60">
            {data?.groupDue.map((member) => (
              <div key={`${member.studentId}-${member.groupName}`} className="px-4 py-2.5 flex items-center justify-between gap-2 text-[11px]">
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">{member.studentName || "—"}</span>
                  <span className="text-muted-foreground"> — {member.groupName}</span>
                  {member.nextRenewalDate ? (
                    <p className="text-muted-foreground font-mono mt-0.5">
                      {isEn ? "Renew" : "التجديد"}: <span dir="ltr">{formatDate(member.nextRenewalDate)}</span>
                    </p>
                  ) : null}
                </div>
                <span className="font-mono tabular-nums font-bold text-warning shrink-0">
                  {money(member.remaining)} {isEn ? "EGP" : "ج.م"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-3.5 h-3.5 ${absenceAlerts.length ? "text-destructive" : "text-muted-foreground"}`} />
            <h4 className="text-xs font-semibold text-foreground">
              {isEn ? "Repeated absence" : "غياب متكرر"}
            </h4>
            <span className="text-[10px] text-muted-foreground font-mono">{absenceAlerts.length}</span>
          </div>
          <button
            type="button"
            onClick={handleSendAbsenceAlerts}
            disabled={absenceBusy || absenceAlerts.length === 0}
            className="px-2.5 py-1 rounded-lg border border-border/70 text-[11px] font-semibold text-foreground hover:bg-muted disabled:opacity-50"
          >
            {absenceBusy ? (isEn ? "Sending..." : "جارٍ الإرسال...") : (isEn ? "Notify parents" : "إشعار أولياء الأمور")}
          </button>
        </div>
        {absenceNotice ? (
          <p className="px-4 pt-2 text-[10px] text-muted-foreground font-mono">{absenceNotice}</p>
        ) : null}
        {absenceAlerts.length === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">
            {isEn ? "No repeated absence (3 in a row) detected" : "لا يوجد غياب متكرر (3 حصص متتالية)"}
          </p>
        ) : (
          <div className="divide-y divide-border/60">
            {absenceAlerts.map((alert) => (
              <div key={`${alert.studentId}-${alert.groupName}`} className="px-4 py-2.5 flex items-center justify-between gap-2 text-[11px]">
                <div className="min-w-0">
                  <span className="font-semibold text-foreground">{alert.studentName || "—"}</span>
                  <span className="text-muted-foreground"> — {alert.groupName || (isEn ? "Group" : "مجموعة")}</span>
                  <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                    {alert.parentPhone || "—"}
                    {alert.lastSessionAt ? ` · ${formatDate(alert.lastSessionAt)}` : ""}
                  </p>
                </div>
                <span className="shrink-0 px-1.5 py-0.5 rounded border border-destructive/20 bg-destructive/10 text-destructive font-mono tabular-nums">
                  {alert.streak} {isEn ? "in a row" : "غياب"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70 flex items-center justify-between">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Teacher performance" : "أداء المدرّسين"}</h4>
          <span className="text-[10px] text-muted-foreground font-mono">{data?.teacherPerformance?.length || 0}</span>
        </div>
        {(data?.teacherPerformance?.length || 0) === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No teacher activity in this period" : "لا يوجد نشاط مدرّسين في هذه الفترة"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-2 font-medium">{isEn ? "Teacher" : "المدرّس"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Sessions" : "حصص"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Cancelled" : "ملغية"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Hours" : "ساعات"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Attendance" : "الحضور"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Students" : "طلاب"}</th>
                  <th className="text-start px-3 py-2 font-medium">{isEn ? "Revenue" : "الإيراد"}</th>
                </tr>
              </thead>
              <tbody>
                {data?.teacherPerformance?.map((teacher) => (
                  <tr key={teacher.teacherId} className="border-t border-border/60">
                    <td className="px-4 py-2 font-semibold text-foreground">{teacher.name}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {teacher.sessions}
                      <span className="text-muted-foreground"> ({teacher.privateSessions}+{teacher.groupSessions})</span>
                    </td>
                    <td className={`px-3 py-2 font-mono tabular-nums ${teacher.cancelledSessions > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                      {teacher.cancelledSessions}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">{teacher.hoursTaught}</td>
                    <td className="px-3 py-2 font-mono tabular-nums">
                      {teacher.attendanceRate === null ? "—" : `${teacher.attendanceRate}%`}
                    </td>
                    <td className="px-3 py-2 font-mono tabular-nums">{teacher.students}</td>
                    <td className="px-3 py-2 font-mono tabular-nums font-semibold text-success">
                      {money(teacher.revenue)} {isEn ? "EGP" : "ج.م"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-border/70 bg-card overflow-hidden">
        <div className="px-4 py-3 border-b border-border/70">
          <h4 className="text-xs font-semibold text-foreground">{isEn ? "Cohort retention" : "احتفاظ الدفعات (Cohort)"}</h4>
        </div>
        {(data?.cohorts.length || 0) === 0 ? (
          <p className="p-4 text-[11px] text-muted-foreground">{isEn ? "No cohorts yet" : "لا توجد دفعات بعد"}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-muted/40 text-muted-foreground">
                <tr>
                  <th className="text-start px-4 py-2 font-medium">{isEn ? "Cohort" : "الشهر"}</th>
                  <th className="text-start px-4 py-2 font-medium">{isEn ? "Students" : "طلاب"}</th>
                  <th className="text-start px-4 py-2 font-medium">{isEn ? "Repeated" : "كرروا الشراء"}</th>
                  <th className="text-start px-4 py-2 font-medium">{isEn ? "Retention" : "نسبة الاحتفاظ"}</th>
                </tr>
              </thead>
              <tbody>
                {data?.cohorts.map((cohort) => (
                  <tr key={cohort.month} className="border-t border-border/60">
                    <td className="px-4 py-2 font-mono"><span dir="ltr">{cohort.month}</span></td>
                    <td className="px-4 py-2 font-mono tabular-nums">{cohort.students}</td>
                    <td className="px-4 py-2 font-mono tabular-nums">{cohort.repeatStudents}</td>
                    <td className="px-4 py-2 font-mono tabular-nums font-semibold text-primary">{cohort.retentionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
