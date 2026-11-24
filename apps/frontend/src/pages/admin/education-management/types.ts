import React from "react";
import {
  GraduationCap,
  BookOpen,
  Gift,
  Users,
  Clock,
  BarChart3,
  Layers,
  Settings,
  History,
  Presentation,
  Award,
} from "lucide-react";

export interface EducationSubject {
  id: string;
  name: string;
  description?: string;
  price?: number;
  isActive: boolean;
}

export interface EducationPackage {
  id: string;
  subjectId?: string;
  name: string;
  description?: string;
  hoursCount: number;
  sessionDuration: number;
  price: number;
  levelNumber?: number | null;
  durationMonths?: number | null;
  ageFrom?: number | null;
  ageTo?: number | null;
  packageType?: "GROUP" | "PRIVATE";
  scheduleSlots?: Array<{ dayOfWeek: string; startTime: string; endTime: string }>;
  timetable?: Array<{ dayOfWeek: string; time: string; subject?: string; room?: string }>;
  isActive: boolean;
  subject?: { id: string; name: string };
}

export interface EducationStudent {
  id: string;
  customerId: string;
  code?: string;
  firstName: string;
  lastName?: string;
  phone?: string;
  phone2?: string;
  address?: string;
  gender?: string;
  grade?: string;
  subjects?: string[] | { id: string; name: string }[];
  currentLevel?: number;
  notes?: string;
  isActive: boolean;
  customer?: { id: string; firstName: string; lastName: string; phone: string; phone2?: string; email?: string };
  enrollments?: EducationEnrollment[];
}

export interface EducationTeacher {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  bio?: string;
  qualifications?: string;
  avatarUrl?: string;
  isActive: boolean;
  subjectRates?: {
    id: string;
    subjectId: string;
    hourlyRate: number;
    subject: { id: string; name: string };
  }[];
}

export interface EnrollmentInstallmentItem {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: "PENDING" | "PAID";
  paidAt?: string | null;
  notes?: string | null;
}

export interface EducationEnrollment {
  id: string;
  studentId: string;
  packageId: string;
  teacherId: string | null;
  branchId?: string | null;
  totalHours: number;
  remainingHours: number;
  amountPaid: number;
  paymentStatus: string;
  paymentMethod?: "CASH" | "INSTALLMENTS";
  installmentCount?: number;
  installments?: EnrollmentInstallmentItem[];
  discountType?: string;
  discountAmount?: number;
  finalAmount?: number;
  enrollmentDate: string;
  expiresAt?: string;
  isActive: boolean;
  student?: { id: string; code?: string; firstName: string; lastName?: string };
  package?: { id: string; name: string; price?: number; durationMonths?: number | null; subject?: { id: string; name: string } };
  teacher?: { id: string; name: string };
  branch?: { id: string; name: string };
  groups?: { id: string; name: string; teacherId?: string | null }[];
  groupId?: string | null;
}

export interface EducationSession {
  id: string;
  enrollmentId: string;
  studentId: string;
  teacherId: string;
  subjectId: string;
  sessionType?: "PRIVATE" | "GROUP";
  groupName?: string;
  groupId?: string;
  room?: string;
  scheduledAt: string;
  plannedDuration: number;
  actualDuration?: number;
  topic?: string;
  notes?: string;
  status: string;
  createdAt: string;
  student?: { id: string; code?: string; firstName: string; lastName?: string };
  teacher?: { id: string; name: string };
  subject?: { id: string; name: string };
  enrollment?: { id: string; remainingHours: number };
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  phone2?: string;
  email?: string;
}

export type TabId =
  | "dashboard"
  | "subjects"
  | "packages"
  | "groups"
  | "students"
  | "teachers"
  | "enrollments"
  | "sessions"
  | "exams"
  | "demo-day"
  | "settings"
  | "logs";

export const TABS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "dashboard", label: "لوحة التحكم", icon: BarChart3 },
  { id: "subjects", label: "المواد", icon: BookOpen },
  { id: "packages", label: "الباقات", icon: Gift },
  { id: "groups", label: "المجموعات (الجروبات)", icon: Users },
  { id: "students", label: "الطلاب", icon: Users },
  { id: "teachers", label: "المدرسين", icon: GraduationCap },
  { id: "enrollments", label: "الاشتراكات", icon: Layers },
  { id: "sessions", label: "الحصص", icon: Clock },
  { id: "exams", label: "الامتحانات والشهادات", icon: Award },
  { id: "demo-day", label: "الديمو داي", icon: Presentation },
  { id: "settings", label: "الإعدادات", icon: Settings },
  { id: "logs", label: "سجلات النظام التعليمي", icon: History },
];

export interface EducationLogItem {
  id: string;
  userId?: string | null;
  companyId: string;
  category: string;
  action: string;
  description: string;
  targetType?: string | null;
  targetId?: string | null;
  targetName?: string | null;
  metadata?: any;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  isSuccess: boolean;
  errorMessage?: string | null;
  tags?: string[] | null;
  createdAt: string;
  user?: {
    id: string;
    name?: string | null;
    email?: string | null;
    role?: string | null;
    avatarUrl?: string | null;
  } | null;
  actorName: string;
  actorRole: string;
  actorType: string;
}

export interface EducationLogStats {
  totalLogs: number;
  todayLogs: number;
  weekLogs: number;
  targetTypeCounts: Record<string, number>;
  actionCounts: Record<string, number>;
  recent: Array<{
    id: string;
    action: string;
    description: string;
    targetType?: string;
    targetName?: string;
    createdAt: string;
    actorName: string;
    isSuccess: boolean;
  }>;
}

export const SESSION_STATUS: Record<string, { label: string; color: string }> = {
  SCHEDULED: {
    label: "مجدولة",
    color: "bg-blue-500/10 text-primary dark:text-primary border-primary/20",
  },
  CONFIRMED: {
    label: "مؤكدة",
    color: "bg-emerald-500/10 text-success dark:text-success border-success/20",
  },
  COMPLETED: {
    label: "مكتملة",
    color: "bg-purple-500/10 text-primary dark:text-primary border-primary/20",
  },
  CANCELLED: {
    label: "ملغية",
    color: "bg-red-500/10 text-destructive dark:text-destructive border-destructive/20",
  },
};

export const getSessionStatus = (status: string, isEn = false): { label: string; color: string } => {
  const map: Record<string, { ar: string; en: string; color: string }> = {
    SCHEDULED: { ar: "مجدولة", en: "Scheduled", color: "bg-blue-500/10 text-primary dark:text-primary border-primary/20" },
    CONFIRMED: { ar: "مؤكدة", en: "Confirmed", color: "bg-emerald-500/10 text-success dark:text-success border-success/20" },
    COMPLETED: { ar: "مكتملة", en: "Completed", color: "bg-purple-500/10 text-primary dark:text-primary border-primary/20" },
    CANCELLED: { ar: "ملغية", en: "Cancelled", color: "bg-red-500/10 text-destructive dark:text-destructive border-destructive/20" },
  };
  const item = map[status];
  if (!item) return { label: status, color: "bg-muted text-muted-foreground" };
  return { label: isEn ? item.en : item.ar, color: item.color };
};

export const MODAL_CLS =
  "bg-card border border-border rounded-xl shadow-2xl p-4 sm:p-6 w-full max-w-xl mx-auto space-y-4 max-h-[90vh] overflow-y-auto";
export const INPUT_CLS =
  "w-full bg-background border border-input rounded-lg px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary";
export const CELL_CLS = "py-2.5 px-3 sm:py-3 sm:px-4 text-xs";

export interface EducationTabConfig {
  id: string;
  key: string;
  defaultLabelAr: string;
  defaultLabelEn: string;
  labelAr: string;
  labelEn: string;
  order: number;
  visible: boolean;
  locked?: boolean;
  iconName: string;
}

export interface EducationCustomDiscount {
  id: string;
  nameAr: string;
  nameEn?: string;
  type: "PERCENTAGE" | "FIXED";
  value: number;
  code?: string;
  minSiblings?: number;
  isActive: boolean;
  description?: string;
}

export interface EducationSettingsData {
  systemTitle: string;
  systemTitleEn: string;
  educationMode?: "COURSES" | "ACADEMIC";
  enableSubjects?: boolean;
  enableDemoDay?: boolean;
  pushFirstSaveWhatsApp?: boolean;
  companySlug?: string | null;
  publicCode?: string | null;
  customDomain?: string | null;
  tabs: EducationTabConfig[];
  customDiscounts?: EducationCustomDiscount[];
}
