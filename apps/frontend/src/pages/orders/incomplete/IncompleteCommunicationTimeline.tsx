import React from "react";
import { MessageCircle, Phone, Mail, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import type {
  IncompleteContactLogEntry,
  IncompleteWhatsAppLogEntry,
} from "../incompleteUtils";
import { formatDateTimeCompact } from "../incompleteUtils";

interface IncompleteCommunicationTimelineProps {
  contactLogs?: IncompleteContactLogEntry[];
  whatsappLogs?: IncompleteWhatsAppLogEntry[];
  lang: string;
}

const CONTACT_RESULT_LABELS: Record<string, string> = {
  answered: "تم الرد",
  no_reply: "لم يرد",
  busy: "مشغول",
  wrong_number: "رقم خاطئ",
  cancelled: "ملغي",
  sent: "تم الإرسال",
};

const CONTACT_METHOD_LABELS: Record<string, string> = {
  call: "مكالمة هاتفية",
  whatsapp: "واتساب",
  email: "بريد إلكتروني",
  dismissed: "استبعاد",
};

const WA_EVENT_LABELS: Record<string, string> = {
  INCOMPLETE_CART_FIRST_APPEARANCE: "رسالة المتابعة الأولى",
  CART_ABANDONED_1H: "تذكير السلة (ساعة)",
  CART_ABANDONED_24H: "تذكير السلة (24 ساعة)",
  CART_ABANDONED_72H: "تذكير السلة (72 ساعة)",
  CART_ABANDONED_WITH_DISCOUNT: "تذكير السلة بخصم",
};

export const IncompleteCommunicationTimeline: React.FC<
  IncompleteCommunicationTimelineProps
> = ({ contactLogs = [], whatsappLogs = [], lang }) => {
  const hasLogs = contactLogs.length > 0 || whatsappLogs.length > 0;

  return (
    <div className="rounded-xl border border-border/70 bg-card p-5 shadow-2xs space-y-4">
      <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
        <h2 className="text-sm font-bold text-foreground">
          سجل التواصل وإشعارات الواتساب
        </h2>
        <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
          {whatsappLogs.length + contactLogs.length} سجل
        </span>
      </div>

      {!hasLogs ? (
        <p className="text-xs text-muted-foreground py-2">
          لم يتم تسجيل أي تواصل أو إشعار واتساب لهذه السلة بعد.
        </p>
      ) : (
        <div className="divide-y divide-border/50">
          {whatsappLogs.map((log) => (
            <div key={`wa-${log.id}`} className="py-2.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40">
                  {log.status === "SENT" ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  ) : log.status === "FAILED" ? (
                    <AlertCircle className="h-3.5 w-3.5 text-destructive" />
                  ) : (
                    <Clock className="h-3.5 w-3.5 text-warning" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground">
                    {WA_EVENT_LABELS[log.eventType] || log.eventType}
                  </div>
                  {log.errorMessage && (
                    <div className="text-[11px] text-destructive mt-0.5 truncate">
                      {log.errorMessage}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-end shrink-0">
                <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-mono border border-border/60 bg-muted/30 text-muted-foreground">
                  {log.status}
                </span>
                <div className="text-[10px] font-mono tabular-nums text-muted-foreground mt-1">
                  {formatDateTimeCompact(log.sentAt || log.createdAt, lang)}
                </div>
              </div>
            </div>
          ))}

          {contactLogs.map((log) => (
            <div key={`ct-${log.id}`} className="py-2.5 flex items-start justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-border/70 bg-muted/40 text-muted-foreground">
                  {log.method === "whatsapp" ? (
                    <MessageCircle className="h-3.5 w-3.5 text-success" />
                  ) : log.method === "email" ? (
                    <Mail className="h-3.5 w-3.5" />
                  ) : (
                    <Phone className="h-3.5 w-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-foreground flex flex-wrap items-center gap-1.5">
                    <span>{CONTACT_METHOD_LABELS[log.method] || log.method}</span>
                    {log.result && (
                      <span className="rounded px-1.5 py-0.5 text-[10px] font-medium border border-border/60 bg-muted/30 text-foreground">
                        {CONTACT_RESULT_LABELS[log.result] || log.result}
                      </span>
                    )}
                  </div>
                  {log.note && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 break-words">
                      {log.note}
                    </p>
                  )}
                  {log.employeeName && (
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      بواسطة: {log.employeeName}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-[10px] font-mono tabular-nums text-muted-foreground shrink-0">
                {formatDateTimeCompact(log.createdAt, lang)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default IncompleteCommunicationTimeline;
