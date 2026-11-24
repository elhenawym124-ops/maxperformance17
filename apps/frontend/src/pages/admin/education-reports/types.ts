export interface CampaignAttributionItem {
  campaignName: string;
  adId?: string | null;
  postId?: string | null;
  channel: string;
  channelLabel: string;
  leadsCount: number;
  attendedCount: number;
  convertedCount: number;
  attendanceRate: number;
  conversionRate: number;
  revenueGenerated: number;
}

export interface AttributionSummary {
  totalLeads: number;
  totalAttended: number;
  totalConverted: number;
  totalRevenue: number;
  overallAttendanceRate: number;
  overallConversionRate: number;
}

export interface AttributionChannelSummary {
  channel: string;
  channelLabel: string;
  leadsCount: number;
  attendedCount: number;
  convertedCount: number;
  revenueGenerated: number;
}

export interface EducationAttributionData {
  summary: AttributionSummary;
  campaigns: CampaignAttributionItem[];
  channels: AttributionChannelSummary[];
}

export interface EducationFunnelData {
  totalCustomers: number;
  registeredStudents: number;
  packagesEnrollments: number;
  scheduledSessions: number;
  confirmedSessions: number;
  completedSessions: number;
  totalDemoAttendees?: number;
  attendedDemoAttendees?: number;
  convertedDemoAttendees?: number;
  demoAttendanceRate?: number;
  demoConversionRate?: number;
  rates: {
    customersToStudents: number;
    studentsToEnrollments: number;
    completionRate: number;
    repeatRate: number;
  };
  repeatStats?: {
    singleEnrollmentStudents: number;
    multipleEnrollmentsStudents: number;
  };
}

export interface InsightsData {
  period: { from: string; to: string; months: number; inactiveDays: number };
  summary: {
    revenue: number;
    payments: number;
    average: number;
    activeStudents: number;
    repeatStudents: number;
    repeatRate: number;
    atRisk: number;
    groupDue: number;
  };
  revenueByBranch: Array<{ id: string; name: string; amount: number; count: number }>;
  revenueByPackage: Array<{ id: string; name: string; amount: number; count: number }>;
  revenueByGroup: Array<{ id: string; name: string; amount: number; count: number }>;
  revenueByTeacher: Array<{ id: string; name: string; amount: number; count: number }>;
  atRisk: Array<{
    studentId: string;
    studentName: string;
    phone?: string | null;
    packageName?: string | null;
    teacherName?: string | null;
    remainingHours: number;
    expiresAt?: string | null;
    overdueAmount: number;
    reasons: Array<{ code: string; label: string }>;
  }>;
  groupDue: Array<{
    studentId: string;
    studentName: string;
    phone?: string | null;
    groupName: string;
    remaining: number;
    nextRenewalDate?: string | null;
    reasons: Array<{ code: string; label: string }>;
  }>;
  cohorts: Array<{ month: string; students: number; repeatStudents: number; retentionRate: number }>;
  teacherPerformance?: Array<{
    teacherId: string;
    name: string;
    privateSessions: number;
    groupSessions: number;
    sessions: number;
    cancelledSessions: number;
    hoursTaught: number;
    attendanceRate: number | null;
    absentCount: number;
    students: number;
    revenue: number;
  }>;
}

export type ReportPeriod = "all" | "30d" | "7d" | "today";
export type ReportTab = "campaigns" | "funnel" | "demoday" | "finance" | "missed" | "growth" | "attendance" | "group-pnl";

export interface MissedSessionRow {
  id: string;
  scheduledAt: string;
  plannedDuration: number;
  status: string;
  topic: string | null;
  studentName: string;
  studentCode: string | null;
  teacherName: string | null;
  subjectName: string | null;
}

export interface MissedSessionsData {
  days: number;
  total: number;
  noShowCount?: number;
  byTeacher: Array<{ teacherId: string; name: string; count: number }>;
  byStudent: Array<{ studentId: string; code: string | null; name: string; count: number }>;
  sessions: MissedSessionRow[];
}

export interface FinanceMonthPoint {
  month: string;
  amount: number;
  count: number;
}

export interface FinanceBreakdownItem {
  amount: number;
  count: number;
}

export interface FinanceTopDue {
  enrollmentId: string;
  studentName: string;
  phone?: string | null;
  packageName?: string | null;
  remaining: number;
  overdueAmount: number;
}

export interface FinanceReportData {
  period: { from: string; to: string; months: number };
  totals: { collected: number; payments: number; average: number };
  monthly: FinanceMonthPoint[];
  byMethod: Record<string, FinanceBreakdownItem>;
  bySource: Record<string, FinanceBreakdownItem>;
  outstanding: { amount: number; count: number; top: FinanceTopDue[] };
  overdueInstallments: { count: number; amount: number };
  pendingTopups: number;
}

export interface AbsenceAlert {
  companyId: string;
  studentId: string;
  studentName: string;
  studentPhone?: string | null;
  customerId?: string | null;
  parentName: string;
  parentPhone?: string | null;
  groupName: string;
  streak: number;
  lastSessionAt?: string | null;
}

export interface AttendanceReport {
  period: { from: string; to: string; months: number };
  summary: {
    records: number;
    present: number;
    absent: number;
    excused: number;
    attendanceRate: number | null;
    students: number;
    groups: number;
    atRiskStudents: number;
  };
  byGroup: Array<{
    groupId: string;
    groupName?: string | null;
    name: string;
    total: number;
    present: number;
    absent: number;
    excused: number;
    rate: number | null;
    atRisk: boolean;
    students: number;
  }>;
  byStudent: Array<{
    studentId: string;
    studentName: string;
    total: number;
    present: number;
    absent: number;
    excused: number;
    rate: number | null;
    atRisk: boolean;
    lastSessionAt?: string | null;
  }>;
  atRisk: Array<{
    studentId: string;
    studentName: string;
    firstName?: string | null;
    total: number;
    present: number;
    absent: number;
    excused: number;
    rate: number | null;
    atRisk: boolean;
  }>;
}

export interface GroupPnlReport {
  period: { from: string; to: string; months: number };
  summary: {
    groups: number;
    revenue: number;
    dues: number;
    teacherCost: number;
    net: number;
    members: number;
    capacity: number;
    occupancy: number | null;
    margin: number | null;
    lossMaking: number;
  };
  groups: Array<{
    groupId: string;
    name: string;
    teacherId?: string | null;
    teacherName?: string | null;
    feeAmount: number;
    feeType?: string | null;
    members: number;
    capacity: number;
    occupancy: number | null;
    sessions: number;
    revenue: number;
    dues: number;
    collectedTotal: number;
    teacherCost: number;
    net: number;
    margin: number | null;
  }>;
}

export interface GroupAlert {
  id: string;
  groupId: string;
  groupName?: string | null;
  type: "LOSS" | "LOW_OCCUPANCY" | "HIGH_DUES" | "HIGH_TEACHER_COST" | string;
  severity: "LOW" | "MEDIUM" | "HIGH" | string;
  message: string;
  suggestion?: string | null;
  metrics?: Record<string, unknown> | null;
  weekKey: string;
  status: string;
  createdAt?: string;
}
