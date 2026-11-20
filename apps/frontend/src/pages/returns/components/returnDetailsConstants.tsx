import React from 'react';
import {
  CheckCircle2,
  Bot,
  Phone,
  ArrowRightLeft,
  FileText,
  Edit3,
  PlusCircle,
} from 'lucide-react';

export const ACTION_CONFIG: Record<
  string,
  {
    label: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    badgeClass: string;
    borderClass: string;
    dotClass: string;
  }
> = {
  REVIEWED: {
    label: 'مراجعة واعتماد المرتجع',
    icon: CheckCircle2,
    badgeClass:
      'bg-emerald-50 text-success dark:bg-success/40 dark:text-success border-success dark:border-success/40',
    borderClass: 'border-emerald-500 dark:border-success',
    dotClass: 'bg-emerald-500 dark:border-success',
  },
  AUTO_CREATED: {
    label: 'إنشاء طلب إرجاع تلقائي',
    icon: Bot,
    badgeClass:
      'bg-blue-50 text-primary dark:bg-primary/40 dark:text-primary border-primary dark:border-primary/40',
    borderClass: 'border-blue-500 dark:border-primary',
    dotClass: 'bg-blue-500 dark:bg-primary',
  },
  CONTACT_ATTEMPT: {
    label: 'تسجيل محاولة تواصل',
    icon: Phone,
    badgeClass:
      'bg-purple-50 text-primary dark:bg-primary/40 dark:text-primary border-primary dark:border-primary/40',
    borderClass: 'border-purple-500 dark:border-primary',
    dotClass: 'bg-purple-500 dark:bg-primary',
  },
  STATUS_CHANGE: {
    label: 'تغيير حالة المرتجع',
    icon: ArrowRightLeft,
    badgeClass:
      'bg-amber-50 text-warning dark:bg-warning/40 dark:text-warning border-warning dark:border-warning/40',
    borderClass: 'border-amber-500 dark:border-warning',
    dotClass: 'bg-amber-500 dark:bg-warning',
  },
  NOTE_ADDED: {
    label: 'ملاحظة إدارية',
    icon: FileText,
    badgeClass:
      'bg-slate-50 text-foreground dark:bg-muted dark:text-muted-foreground border-border dark:border-border',
    borderClass: 'border-slate-400 dark:border-border',
    dotClass: 'bg-slate-500 dark:bg-muted',
  },
  UPDATED: {
    label: 'تعديل بيانات المرتجع',
    icon: Edit3,
    badgeClass:
      'bg-indigo-50 text-primary dark:bg-primary/40 dark:text-primary border-primary dark:border-primary/40',
    borderClass: 'border-indigo-500 dark:border-primary',
    dotClass: 'bg-indigo-500 dark:bg-primary',
  },
  CREATED: {
    label: 'إنشاء طلب إرجاع يدوي',
    icon: PlusCircle,
    badgeClass:
      'bg-cyan-50 text-info dark:bg-info/40 dark:text-info border-info dark:border-info/40',
    borderClass: 'border-cyan-500 dark:border-info',
    dotClass: 'bg-cyan-500 dark:bg-info',
  },
};

export const renderRoleBadge = (role?: string) => {
  if (!role) return null;
  const upper = role.toUpperCase();
  if (upper === 'OWNER') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/10 text-warning border border-warning dark:bg-warning/40 dark:text-warning dark:border-warning/40">
        مالك الحساب
      </span>
    );
  }
  if (upper === 'ADMIN') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary dark:bg-primary/40 dark:text-primary dark:border-primary/40">
        مدير
      </span>
    );
  }
  if (upper === 'MODERATOR') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary dark:bg-primary/40 dark:text-primary dark:border-primary/40">
        مشرف
      </span>
    );
  }
  if (upper === 'EMPLOYEE') {
    return (
      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border dark:bg-muted dark:text-muted-foreground dark:border-border">
        موظف
      </span>
    );
  }
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-muted text-foreground border border-border dark:bg-muted dark:text-muted-foreground dark:border-border">
      {role}
    </span>
  );
};

export const FIELD_LABELS: Record<string, string> = {
  responsibleParty: 'الجهة المسؤولة',
  reason: 'سبب الإرجاع',
  shippingCompany: 'شركة الشحن',
  returnType: 'نوع المرتجع',
  shippingReturnCost: 'تكلفة الشحن الراجع',
  settlementAmount: 'صافي التسوية',
  customerNotes: 'ملاحظات العميل',
  adminNotes: 'ملاحظات الإدارة',
  refundAmount: 'المبلغ المسترد',
};

export const parseResponsibleParty = (party?: string | null) => {
  if (!party) return null;
  switch (party) {
    case 'CUSTOMER':
      return 'العميل';
    case 'SHIPPING':
    case 'SHIPPING_COMPANY':
      return 'شركة الشحن';
    case 'STORE':
      return 'المتجر';
    case 'OTHER':
      return 'أخرى';
    default:
      return party;
  }
};

export const CONTACT_RESULTS_MAP: Record<string, string> = {
  NO_ANSWER: 'لم يرد',
  ANSWERED: 'تم الرد',
  BUSY: 'مشغول',
  WRONG_NUMBER: 'رقم خاطئ',
  CALL_BACK_LATER: 'إعادة اتصال لاحقاً',
};
