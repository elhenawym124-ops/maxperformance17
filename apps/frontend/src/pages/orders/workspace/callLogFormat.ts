import { CallLogEntry, WorkspaceOrder } from './types';

type ResultTone = 'amber' | 'rose' | 'blue' | 'zinc' | 'emerald';

/** ترجمة نتائج المحاولات بدل طباعتها خامًا بالإنجليزية التقنية + لون دلالي لكل نتيجة */
const CALL_RESULT_LABELS: Record<string, { ar: string; en: string; tone: ResultTone }> = {
  unreached: { ar: 'لم يرد', en: 'Unreached', tone: 'amber' },
  reached: { ar: 'تم الرد', en: 'Answered', tone: 'emerald' },
  busy: { ar: 'مشغول / مغلق', en: 'Busy', tone: 'rose' },
  wrong_number: { ar: 'رقم خاطئ', en: 'Wrong number', tone: 'zinc' },
  callback: { ar: 'إعادة اتصال', en: 'Callback', tone: 'blue' },
};

export const CALL_RESULT_TONE_CLASSES: Record<ResultTone, string> = {
  amber: 'bg-warning/10 text-warning dark:text-warning',
  rose: 'bg-destructive/10 text-destructive dark:text-destructive',
  blue: 'bg-primary/10 text-primary dark:text-primary',
  zinc: 'bg-muted text-foreground',
  emerald: 'bg-success/10 text-success dark:text-success',
};

export const callResultLabel = (result: string, isArabic: boolean): string => {
  const entry = CALL_RESULT_LABELS[result];
  if (!entry) return result;
  return isArabic ? entry.ar : entry.en;
};

export const callResultToneClass = (result: string): string => {
  const tone = CALL_RESULT_LABELS[result]?.tone ?? 'zinc';
  return CALL_RESULT_TONE_CLASSES[tone];
};

/** «1 د و 25 ث» بدل تكرار نفس الحساب في مكوّنين معروضين معًا */
export const formatCallDuration = (seconds: number | undefined, isArabic: boolean): string | null => {
  if (!seconds || seconds <= 0) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m > 0) return isArabic ? `${m} د و ${s} ث` : `${m}m ${s}s`;
  return isArabic ? `${s} ث` : `${s}s`;
};

/** التاريخ مع الوقت — الوقت وحده كان يجعل محاولة الأمس تبدو كأنها اليوم */
export const formatCallTimestamp = (iso: string, isArabic: boolean): string =>
  new Date(iso).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

/** العداد الحقيقي: الخادم يقتطع السجل بعشرة فلا يجزم بطول القائمة */
export const totalCallAttempts = (order: WorkspaceOrder, logs: CallLogEntry[]): number =>
  Math.max(logs.length, order.callAttempts || 0);
