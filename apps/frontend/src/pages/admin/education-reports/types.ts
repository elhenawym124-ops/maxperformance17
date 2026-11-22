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

export type ReportPeriod = "all" | "30d" | "7d" | "today";
export type ReportTab = "campaigns" | "funnel" | "demoday" | "finance";

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
