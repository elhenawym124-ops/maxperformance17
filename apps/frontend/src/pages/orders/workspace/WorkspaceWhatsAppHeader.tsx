import React from "react";
import { ArrowTopRightOnSquareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { WhatsAppIcon } from "../../../components/icons/brands";
import type { WorkspaceOrder } from "./types";
import type { WhatsAppSession } from "./useWorkspaceWhatsAppController";

export interface WorkspaceWhatsAppHeaderProps {
  order: WorkspaceOrder;
  isArabic: boolean;
  customerPhone: string;
  sessionDisplay: string;
  hasActiveSession: boolean;
  sessions?: WhatsAppSession[];
  activeSessionId?: string;
  onSelectSession?: (sessionId: string) => void;
  externalWaUrl: string;
  onClose: () => void;
}

export const WorkspaceWhatsAppHeader: React.FC<WorkspaceWhatsAppHeaderProps> = ({
  order,
  isArabic,
  customerPhone,
  sessionDisplay,
  hasActiveSession,
  sessions = [],
  activeSessionId,
  onSelectSession,
  externalWaUrl,
  onClose,
}) => {
  return (
    <div className="flex items-center justify-between border-b border-border/70 px-4 py-3 bg-muted/20">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-success/15 text-success dark:text-success">
          <WhatsAppIcon className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-black text-foreground">
              {order.customerName || (isArabic ? "عميل" : "Customer")}
            </h3>
            <span className="font-mono text-xs text-muted-foreground" dir="ltr">
              № {order.orderNumber}
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono" dir="ltr">
            <span>{customerPhone}</span>
            {sessions.length > 1 && onSelectSession ? (
              <select
                value={activeSessionId || ""}
                onChange={(e) => e.target.value && onSelectSession(e.target.value)}
                aria-label={isArabic ? "اختيار قناة واتساب" : "Select WhatsApp channel"}
                className="rounded border border-border/70 bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success dark:text-success cursor-pointer outline-none"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.provider === "META_CLOUD" ? "API" : "QR"} ·{" "}
                    {s.name || s.metaDisplayPhoneNumber || s.phoneNumber || s.id}
                  </option>
                ))}
              </select>
            ) : (
              hasActiveSession && (
                <span className="flex items-center gap-1 rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold text-success dark:text-success">
                  <span className="h-1.5 w-1.5 rounded-full bg-success" />
                  <span>{sessionDisplay}</span>
                </span>
              )
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <a
          href={externalWaUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1 rounded-lg border border-border/70 bg-background px-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/40 hover:text-foreground active:scale-95 transition-all"
          title={isArabic ? "فتح في واتساب ويب الخارجي" : "Open in WhatsApp Web"}
        >
          <ArrowTopRightOnSquareIcon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{isArabic ? "واتساب ويب" : "Web WA"}</span>
        </a>

        <button
          type="button"
          onClick={onClose}
          aria-label={isArabic ? "إغلاق محادثة واتساب" : "Close WhatsApp conversation"}
          className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-95 transition-all"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

export default WorkspaceWhatsAppHeader;
