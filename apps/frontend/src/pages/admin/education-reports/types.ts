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
}

export type ReportPeriod = "all" | "30d" | "7d" | "today";
export type ReportTab = "campaigns" | "funnel" | "demoday" | "finance" | "missed" | "growth";

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
