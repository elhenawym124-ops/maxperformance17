import { EmployeeReportData } from "./types";

export const getStatusColor = (status: string): string => {
  const colors: Record<string, string> = {
    PRESENT:
      "text-green-600 bg-success/10 dark:bg-success/20 dark:text-success",
    ABSENT: "text-red-600 bg-destructive/10 dark:bg-destructive/20 dark:text-destructive",
    LATE: "text-orange-600 bg-warning/10 dark:bg-warning/20 dark:text-warning",
    ON_LEAVE:
      "text-blue-600 bg-primary/10 dark:bg-primary/20 dark:text-primary",
    APPROVED:
      "text-green-600 bg-success/10 dark:bg-success/20 dark:text-success",
    PENDING:
      "text-yellow-600 bg-warning/10 dark:bg-warning/20 dark:text-warning",
    REJECTED: "text-red-600 bg-destructive/10 dark:bg-destructive/20 dark:text-destructive",
  };
  return colors[status] || "text-gray-600 bg-muted";
};

export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    PRESENT: "حاضر",
    ABSENT: "غائب",
    LATE: "متأخر",
    ON_LEAVE: "إجازة",
    APPROVED: "موافق عليه",
    PENDING: "معلق",
    REJECTED: "مرفوض",
  };
  return labels[status] || status;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("ar-EG", {
    style: "currency",
    currency: "EGP",
    minimumFractionDigits: 0,
  }).format(amount);
};

export const getAttendanceRate = (report: EmployeeReportData | null): string => {
  if (!report?.attendance?.totalDays || report.attendance.totalDays === 0) {
    return "0";
  }
  return (
    (report.attendance.presentDays / report.attendance.totalDays) *
    100
  ).toFixed(1);
};

export const getPerformanceColor = (score: number): string => {
  if (score >= 4.5) return "text-green-600 dark:text-success";
  if (score >= 3.5) return "text-blue-600 dark:text-primary";
  if (score >= 2.5) return "text-yellow-600 dark:text-warning";
  return "text-red-600 dark:text-destructive";
};

export const buildEmployeeReportCsv = (report: EmployeeReportData): string => {
  const headers = [
    "التاريخ",
    "الحالة",
    "وقت الدخول",
    "وقت الخروج",
    "ساعات العمل",
    "التأخير (دقيقة)",
  ];
  const rows = (report.attendance?.records || []).map((record) => [
    new Date(record.date).toLocaleDateString("ar-EG"),
    getStatusLabel(record.status),
    record.checkIn ? new Date(record.checkIn).toLocaleTimeString("ar-EG") : "-",
    record.checkOut
      ? new Date(record.checkOut).toLocaleTimeString("ar-EG")
      : "-",
    record.workHours?.toFixed(2) || "0",
    String(record.lateMinutes || "0"),
  ]);

  return [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");
};
