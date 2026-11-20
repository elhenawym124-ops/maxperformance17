import React from 'react';
import { Bot, ArrowRightLeft, PlusCircle } from 'lucide-react';
import {
  FIELD_LABELS,
  CONTACT_RESULTS_MAP,
} from './returnDetailsConstants';

export interface ReturnActivityEventBadgesProps {
  action: string;
  details: unknown;
}

export const ReturnActivityEventBadges: React.FC<ReturnActivityEventBadgesProps> = ({
  action,
  details,
}) => {
  const detailsObj = (typeof details === 'object' && details !== null ? details : {}) as Record<string, unknown>;

  if (action === 'AUTO_CREATED') {
    return (
      <div className="text-xs text-primary dark:text-primary bg-primary/70 dark:bg-primary/30 p-2.5 rounded-lg border border-primary dark:border-primary/30 flex items-center gap-2">
        <Bot size={16} className="text-blue-600 dark:text-primary shrink-0" />
        <span>
          {typeof details === 'string' && details.length > 0
            ? details
            : 'تم إنشاء طلب الإرجاع تلقائياً بواسطة النظام لتحديث حالة الطلب إلى مرتجع'}
        </span>
      </div>
    );
  }

  if (action === 'CONTACT_ATTEMPT') {
    const method = (detailsObj.method as string) || 'PHONE';
    const result = (detailsObj.result as string) || 'NO_ANSWER';
    const notes = detailsObj.notes as string | undefined;

    return (
      <div className="text-xs bg-primary/70 dark:bg-primary/30 p-2.5 rounded-lg border border-primary dark:border-primary/30 space-y-1.5">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-muted-foreground">وسيلة التواصل:</span>
          <span className="font-semibold text-foreground">
            {method === 'WHATSAPP' ? 'واتساب (WhatsApp)' : 'مكالمة هاتفية (Phone)'}
          </span>
          <span className="text-gray-300 dark:text-foreground">•</span>
          <span className="text-muted-foreground">النتيجة:</span>
          <span className="font-semibold text-primary dark:text-primary">
            {CONTACT_RESULTS_MAP[result] || result}
          </span>
        </div>
        {notes && (
          <p className="text-foreground text-xs mt-1 border-t border-primary dark:border-primary/30 pt-1">
            &ldquo;{notes}&rdquo;
          </p>
        )}
      </div>
    );
  }

  if (action === 'STATUS_CHANGE') {
    const fromVal = String(detailsObj.from || '—');
    const toVal = String(detailsObj.to || '—');
    const reason = detailsObj.reason as string | undefined;

    return (
      <div className="text-xs bg-warning/70 dark:bg-warning/30 p-2.5 rounded-lg border border-warning dark:border-warning/30 space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">تغيير الحالة:</span>
          <span className="font-semibold px-2 py-0.5 rounded bg-card border border-warning dark:border-warning text-foreground dark:text-white font-mono">
            {fromVal}
          </span>
          <ArrowRightLeft size={12} className="text-amber-600 dark:text-warning" />
          <span className="font-semibold px-2 py-0.5 rounded bg-warning dark:bg-warning/50 border border-warning dark:border-warning text-warning dark:text-warning font-mono">
            {toVal}
          </span>
        </div>
        {reason && (
          <p className="text-gray-600 dark:text-muted-foreground text-xs mt-1">السبب: {reason}</p>
        )}
      </div>
    );
  }

  if (action === 'UPDATED') {
    const description = (detailsObj.description as string) || 'تم تعديل بيانات طلب الإرجاع:';
    const changes = detailsObj.changes as Record<string, { from?: unknown; to?: unknown }> | undefined;

    return (
      <div className="text-xs bg-primary/70 dark:bg-primary/30 p-2.5 rounded-lg border border-primary dark:border-primary/30 space-y-2">
        <span className="font-medium text-primary dark:text-primary block">
          {description}
        </span>
        {changes && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
            {Object.entries(changes).map(([field, change]) => (
              <div
                key={field}
                className="bg-card p-2 rounded border border-primary dark:border-primary/40 text-xs"
              >
                <span className="text-muted-foreground block text-[11px] mb-0.5">
                  {FIELD_LABELS[field] || field}
                </span>
                <span className="text-red-500 line-through me-1 font-mono">
                  {String(change?.from ?? 'فارغ')}
                </span>
                <span className="text-emerald-600 font-semibold font-mono">
                  {' '}← {String(change?.to ?? 'فارغ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (action === 'NOTE_ADDED') {
    const noteText =
      detailsObj.note
        ? String(detailsObj.note)
        : typeof details === 'string'
        ? details
        : null;

    return (
      <div className="text-xs bg-muted dark:bg-muted p-2.5 rounded-lg border border-border dark:border-border">
        <span className="text-muted-foreground block mb-1">الملاحظة:</span>
        <p className="text-gray-800 dark:text-muted-foreground font-medium">
          {noteText || 'تم تحديث الملاحظات الإدارية'}
        </p>
      </div>
    );
  }

  if (action === 'CREATED') {
    return (
      <div className="text-xs text-info dark:text-info bg-info/70 dark:bg-info/30 p-2.5 rounded-lg border border-info dark:border-info/30 flex items-center gap-2">
        <PlusCircle size={15} className="text-cyan-600 dark:text-info shrink-0" />
        <span>تم إنشاء طلب الإرجاع في النظام</span>
      </div>
    );
  }

  return null;
};
