export interface AutomationReportKpis {
  totalTransitions: number;
  uniqueOrders: number;
  totalRevenue: number;
  autoRate: number;
  rulesTransitions: number;
  printTransitions: number;
  turboTransitions: number;
  otherTransitions: number;
}

export interface RuleOutcomes {
  delivered: number;
  cancelled: number;
  inProgress: number;
}

export interface AutomationRulePerformance {
  id: string;
  fromStatus: string;
  toStatus: string;
  waitTime: number;
  timeUnit: string;
  isActive: boolean;
  executionsCount: number;
  totalRevenue: number;
  pendingCount: number;
  outcomes: RuleOutcomes;
}

export interface EventAutomationSummaryItem {
  enabled: boolean;
  targetStatus: string;
  executionsCount: number;
  totalRevenue: number;
}

export interface AutomationEventsSummary {
  print: EventAutomationSummaryItem;
  turbo: EventAutomationSummaryItem;
}

export interface AutomationDailyTrend {
  date: string;
  rules: number;
  print: number;
  turbo: number;
  other: number;
  total: number;
}

export type AutomationTriggerType = "RULE" | "PRINT" | "TURBO" | "OTHER_AUTO";

export interface AutomationLogItem {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  total: number;
  currentOrderStatus: string;
  oldStatus: string | null;
  newStatus: string;
  reason: string | null;
  type: AutomationTriggerType;
  createdAt: string;
}

export interface AutomationReportData {
  kpis: AutomationReportKpis;
  rulesPerformance: AutomationRulePerformance[];
  eventsSummary: AutomationEventsSummary;
  dailyTrends: AutomationDailyTrend[];
  recentLogs: AutomationLogItem[];
}
