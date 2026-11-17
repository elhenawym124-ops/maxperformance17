// Education Shared Helpers: Age Levels, Credentials, Installments, Discounts, Timetables

export interface AgeLevel {
  id: string;
  name: string;
  code?: string;
  levelNumber: number;
  bracketLabel?: string;
  ageRange?: string;
}

export interface AgeBracket {
  key: string;
  label: string;
  ageFrom: number;
  ageTo: number;
  levels: AgeLevel[];
}

export type AgeLevelsResult = AgeLevel[] & {
  bracket: AgeBracket | null;
  levels: AgeLevel[];
};

export const AGE_BRACKETS: AgeBracket[] = [
  {
    key: "EARLY",
    label: "مرحلة البراعم (4 - 6 سنوات)",
    ageFrom: 4,
    ageTo: 6,
    levels: [
      { id: "early-1", name: "تمهيدي أ (Pre-1) - استكشاف وأساسيات", levelNumber: 1 },
      { id: "early-2", name: "تمهيدي ب (Pre-2) - تهيئة وتفاعل", levelNumber: 2 },
      { id: "early-3", name: "تأسيس مبكر (Early Foundation)", levelNumber: 3 },
    ],
  },
  {
    key: "JUNIOR",
    label: "مرحلة الناشئين (7 - 9 سنوات)",
    ageFrom: 7,
    ageTo: 9,
    levels: [
      { id: "junior-1", name: "المستوى 1: مبتدئ (Beginner)", levelNumber: 1 },
      { id: "junior-2", name: "المستوى 2: ابتدائي (Elementary)", levelNumber: 2 },
      { id: "junior-3", name: "المستوى 3: مشاريع تطبيقية", levelNumber: 3 },
    ],
  },
  {
    key: "INTERMEDIATE",
    label: "مرحلة اليافعين (10 - 13 سنة)",
    ageFrom: 10,
    ageTo: 13,
    levels: [
      { id: "mid-1", name: "المستوى 1: استكشاف ومنطق برمجيات", levelNumber: 1 },
      { id: "mid-2", name: "المستوى 2: متوسط (Intermediate)", levelNumber: 2 },
      { id: "mid-3", name: "المستوى 3: حل مشكلات وتطبيقات ذكية", levelNumber: 3 },
      { id: "mid-4", name: "المستوى 4: متقدم يافعين", levelNumber: 4 },
    ],
  },
  {
    key: "SENIOR",
    label: "مرحلة المتقدمين والشباب (14 - 18+ سنة)",
    ageFrom: 14,
    ageTo: 99,
    levels: [
      { id: "senior-1", name: "المستوى التأسيسي المكثف", levelNumber: 1 },
      { id: "senior-2", name: "المستوى المتوسط المتقدم", levelNumber: 2 },
      { id: "senior-3", name: "المستوى المتقدم والاحتراف", levelNumber: 3 },
      { id: "senior-4", name: "مستوى مشاريع التخرج والشهادات", levelNumber: 4 },
    ],
  },
];

export function getLevelsForAge(age?: number | string | null): AgeLevelsResult {
  let bracket: AgeBracket | null = null;
  let levels: AgeLevel[] = [];

  if (!age || isNaN(Number(age))) {
    bracket = null;
    levels = AGE_BRACKETS.flatMap((b) =>
      b.levels.map((l) => ({
        ...l,
        code: l.id,
        bracketLabel: b.label,
        ageRange: `${b.ageFrom}-${b.ageTo}`,
      }))
    );
  } else {
    const num = Number(age);
    const matched = AGE_BRACKETS.find((b) => num >= b.ageFrom && num <= b.ageTo);
    if (matched) {
      bracket = matched;
      levels = matched.levels.map((l) => ({
        ...l,
        code: l.id,
        bracketLabel: matched.label,
        ageRange: `${matched.ageFrom}-${matched.ageTo}`,
      }));
    } else if (num < 4) {
      bracket = AGE_BRACKETS[0];
      levels = AGE_BRACKETS[0].levels.map((l) => ({
        ...l,
        code: l.id,
        bracketLabel: AGE_BRACKETS[0].label,
        ageRange: `${AGE_BRACKETS[0].ageFrom}-${AGE_BRACKETS[0].ageTo}`,
      }));
    } else {
      const senior = AGE_BRACKETS[AGE_BRACKETS.length - 1];
      bracket = senior;
      levels = senior.levels.map((l) => ({
        ...l,
        code: l.id,
        bracketLabel: senior.label,
        ageRange: `${senior.ageFrom}+`,
      }));
    }
  }

  const result = [...levels] as AgeLevelsResult;
  result.bracket = bracket;
  result.levels = levels;
  return result;
}

export function generateAutoCredentials(
  studentName = "",
  phone = "",
  code = ""
): { username: string; password: string } {
  const cleanCode = String(code || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  let username = "";
  if (cleanCode.length >= 2) {
    username = cleanCode;
  }

  let clean = "";
  if (studentName) {
    clean = String(studentName)
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }

  const digits = String(phone || "").replace(/\D/g, "");
  const rnd = Math.floor(1000 + Math.random() * 9000);

  if (!username) {
    if (clean && clean.length >= 2) {
      username = `stu_${clean}_${rnd}`;
    } else if (digits.length >= 4) {
      username = `stu_${digits.slice(-4)}_${rnd}`;
    } else {
      username = `stu_${rnd}`;
    }
  }

  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let token = "";
  for (let i = 0; i < 4; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const password = `Edu@${token}${Math.floor(10 + Math.random() * 90)}`;

  return { username, password };
}

/**
 * توليد بريد إلكتروني افتراضي صحيح ومعتمد لولي الأمر
 * يضمن عدم وجود أي إيميل منقوص مثل @student.maxp.online
 */
export function generateGuardianDefaultEmail({
  phone = "",
  name = "",
  code = "",
}: {
  phone?: string;
  name?: string;
  code?: string;
} = {}): string {
  const digits = String(phone || "").replace(/\D/g, "");
  if (digits.length >= 7) {
    return `parent.${digits}@maxp.online`;
  }

  const cleanCode = String(code || "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
  if (cleanCode.length >= 2) {
    return `parent.${cleanCode}@maxp.online`;
  }

  let cleanName = "";
  if (name) {
    cleanName = String(name)
      .trim()
      .split(/\s+/)[0]
      .replace(/[^a-zA-Z0-9]/g, "")
      .toLowerCase();
  }
  const rnd = Math.floor(10000 + Math.random() * 90000);
  if (cleanName && cleanName.length >= 2) {
    return `parent.${cleanName}_${rnd}@maxp.online`;
  }

  return `parent.p${rnd}@maxp.online`;
}

export interface InstallmentPlan {
  installmentNumber: number;
  amount: number;
  dueDate: string;
  status: "PAID" | "PENDING";
  paidAt?: string;
  notes?: string;
}

export function calculateInstallmentSchedule(
  totalAmount: number,
  count: 2 | 3,
  startDate?: string
): InstallmentPlan[] {
  const baseDate = startDate ? new Date(startDate) : new Date();
  const safeTotal = Math.max(0, Number(totalAmount) || 0);

  const plans: InstallmentPlan[] = [];

  if (count === 2) {
    const part1 = Math.round(safeTotal / 2);
    const part2 = safeTotal - part1;

    const due1 = new Date(baseDate);
    const due2 = new Date(baseDate);
    due2.setMonth(due2.getMonth() + 1);

    plans.push({
      installmentNumber: 1,
      amount: part1,
      dueDate: due1.toISOString().split("T")[0],
      status: "PAID",
      paidAt: due1.toISOString(),
      notes: "دفعة أولى (50%)",
    });

    plans.push({
      installmentNumber: 2,
      amount: part2,
      dueDate: due2.toISOString().split("T")[0],
      status: "PENDING",
      notes: "القسط الثاني بعد شهر",
    });
  } else {
    // 3 installments
    const part1 = Math.round(safeTotal / 3);
    const part2 = Math.round(safeTotal / 3);
    const part3 = safeTotal - part1 - part2;

    const due1 = new Date(baseDate);
    const due2 = new Date(baseDate);
    due2.setMonth(due2.getMonth() + 1);
    const due3 = new Date(baseDate);
    due3.setMonth(due3.getMonth() + 2);

    plans.push({
      installmentNumber: 1,
      amount: part1,
      dueDate: due1.toISOString().split("T")[0],
      status: "PAID",
      paidAt: due1.toISOString(),
      notes: "دفعة أولى عند التسجيل",
    });

    plans.push({
      installmentNumber: 2,
      amount: part2,
      dueDate: due2.toISOString().split("T")[0],
      status: "PENDING",
      notes: "القسط الثاني بعد شهر",
    });

    plans.push({
      installmentNumber: 3,
      amount: part3,
      dueDate: due3.toISOString().split("T")[0],
      status: "PENDING",
      notes: "القسط الثالث بعد شهرين",
    });
  }

  return plans;
}

import type { EducationCustomDiscount } from "./types";

export const DEFAULT_EDUCATION_DISCOUNTS: EducationCustomDiscount[] = [
  {
    id: "disc_sibling",
    nameAr: "خصم الأخوات (15%)",
    nameEn: "Sibling Discount (15%)",
    type: "PERCENTAGE",
    value: 15,
    minSiblings: 2,
    isActive: true,
    description: "خصم تلقائي عند تسجيل أكثر من طالب لنفس ولي الأمر",
  },
  {
    id: "disc_seasonal",
    nameAr: "عرض ترويجي / مواسم (20%)",
    nameEn: "Seasonal Promo (20%)",
    type: "PERCENTAGE",
    value: 20,
    code: "SEASON20",
    isActive: true,
    description: "خصم العروض والمواسم الدراسية",
  },
  {
    id: "disc_cash",
    nameAr: "خصم الدفع النقدي الفوري",
    nameEn: "Full Cash Payment",
    type: "FIXED",
    value: 100,
    isActive: false,
    description: "خصم ثابت عند سداد كامل الاشتراك كاش",
  },
];

export const DISCOUNT_TYPES = [
  { id: "NONE", labelAr: "بدون خصم", labelEn: "No Discount" },
  { id: "SIBLING", labelAr: "خصم أخوات (15%)", labelEn: "Sibling Discount (15%)", defaultPercent: 15 },
  { id: "SEASONAL", labelAr: "خصم مواسم / عروض (20%)", labelEn: "Seasonal Promo (20%)", defaultPercent: 20 },
  { id: "CUSTOM", labelAr: "خصم مخصص (قيمة يدوية)", labelEn: "Custom Discount", defaultPercent: 0 },
];

export function computeDiscountAndFinal(
  price: number,
  discountType: string,
  customAmount?: number,
  customDiscounts?: EducationCustomDiscount[]
): { discountAmount: number; finalAmount: number } {
  const base = Math.max(0, Number(price) || 0);
  if (!discountType || discountType === "NONE") {
    return { discountAmount: 0, finalAmount: base };
  }

  // Check custom dynamic discounts first
  if (Array.isArray(customDiscounts) && customDiscounts.length > 0) {
    const matched = customDiscounts.find((d) => d && d.id === discountType);
    if (matched) {
      let disc = 0;
      if (customAmount !== undefined && customAmount > 0) {
        disc = Math.min(base, Number(customAmount));
      } else if (matched.type === "PERCENTAGE") {
        const rate = Math.min(100, Math.max(0, Number(matched.value) || 0)) / 100;
        disc = Math.round(base * rate);
      } else if (matched.type === "FIXED") {
        disc = Math.min(base, Math.round(Number(matched.value) || 0));
      }
      return { discountAmount: disc, finalAmount: Math.max(0, base - disc) };
    }
  }

  // Legacy fallback types
  if (discountType === "SIBLING" || discountType === "SIBLINGS") {
    const disc = customAmount !== undefined && customAmount > 0 ? customAmount : Math.round(base * 0.15);
    return { discountAmount: disc, finalAmount: Math.max(0, base - disc) };
  }

  if (discountType === "SEASONAL") {
    const disc = customAmount !== undefined && customAmount > 0 ? customAmount : Math.round(base * 0.20);
    return { discountAmount: disc, finalAmount: Math.max(0, base - disc) };
  }

  if (discountType === "CUSTOM") {
    const disc = Math.min(base, Math.max(0, Number(customAmount) || 0));
    return { discountAmount: disc, finalAmount: Math.max(0, base - disc) };
  }

  return { discountAmount: 0, finalAmount: base };
}
