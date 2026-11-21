import React from "react";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CheckCircle2,
  Edit,
  Globe,
  Link2,
  Link2Off,
  MoreVertical,
  Plus,
  RefreshCw,
  Smartphone,
  Trash2,
  Users,
  XCircle,
  MessageSquareText,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarBadge, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { WhatsAppSurfaceCard } from "../../components/WhatsAppPageShell";
import type { Session, WorkspaceSettings } from "../types/whatsAppSettingsTypes";
import {
  providerLabels,
  statusBadgeClasses,
} from "../types/whatsAppSettingsTypes";
import {
  getStatusText,
  isConnectedStatus,
  isPendingStatus,
  isReconnectingStatus,
} from "../utils/whatsAppSettingsUtils";

interface WhatsAppSessionsTabProps {
  sessions: Session[];
  settings: WorkspaceSettings | null;
  connectingSessionId: string | null;
  onRefresh: () => void;
  onOpenCreateSession: () => void;
  onOpenWebhookDetails: (session: Session | null) => void;
  onConnectSession: (session: Session) => void;
  onDisconnectSession: (sessionId: string) => void;
  onStartEditSession: (session: Session) => void;
  onDeleteSession: (session: Session) => void;
}

export const WhatsAppSessionsTab: React.FC<WhatsAppSessionsTabProps> = ({
  sessions,
  settings,
  connectingSessionId,
  onRefresh,
  onOpenCreateSession,
  onOpenWebhookDetails,
  onConnectSession,
  onDisconnectSession,
  onStartEditSession,
  onDeleteSession,
}) => {
  const { t } = useTranslation();
  // قطع الاتصال بيوقف استقبال الرسائل فورًا، فبيلزمه تأكيد بدل ضغطة واحدة.
  const [pendingDisconnect, setPendingDisconnect] = React.useState<Session | null>(
    null,
  );

  return (
    <div className="w-full min-w-0 space-y-4">
      {sessions.length === 0 ? (
        <WhatsAppSurfaceCard contentClassName="p-4 sm:p-6">
          <Alert className="rounded-xl border-border/70 bg-[color:var(--color-card)]">
            <AlertCircle className="size-4 text-[color:var(--color-warning)]" />
            <AlertTitle>لا توجد جلسات بعد</AlertTitle>
            <AlertDescription>{t("whatsappSettings.noSessions")}</AlertDescription>
          </Alert>
        </WhatsAppSurfaceCard>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[repeat(auto-fit,minmax(min(100%,360px),1fr))]">
          {sessions.map((session) => {
            const statusValue = (
              session.liveStatus ||
              session.status ||
              "DISCONNECTED"
            ).toUpperCase();
            const phoneLabel =
              session.provider === "META_CLOUD"
                ? session.metaDisplayPhoneNumber ||
                  session.phoneNumber ||
                  (session.metaPhoneNumberId
                    ? `ID: ${session.metaPhoneNumberId}`
                    : t("whatsappSettings.disconnected"))
                : session.phoneNumber || t("whatsappSettings.disconnected");

            return (
              <div
                key={session.id}
                data-session-card
                className="flex min-w-0 flex-col justify-between overflow-hidden rounded-xl border border-border/70 bg-[color:var(--color-card)] p-4 shadow-sm transition-all sm:rounded-xl sm:p-5"
              >
                <div>
                  {/* Top row: Identity */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        size="lg"
                        className="shrink-0 bg-primary/10 ring-2 ring-primary/10"
                      >
                        <AvatarFallback className="bg-transparent text-[color:var(--color-primary)]">
                          <Smartphone className="size-5" />
                        </AvatarFallback>
                        <AvatarBadge
                          className={cn(
                            "ring-[color:var(--app-panel-bg)]",
                            isConnectedStatus(statusValue)
                              ? "bg-emerald-500 text-white"
                              : isPendingStatus(statusValue)
                              ? "bg-amber-500 text-white"
                              : isReconnectingStatus(statusValue)
                              ? "bg-violet-500 text-white"
                              : "bg-rose-500 text-white",
                          )}
                        >
                          {isConnectedStatus(statusValue) ? (
                            <CheckCircle2 className="size-3" />
                          ) : isPendingStatus(statusValue) ||
                            isReconnectingStatus(statusValue) ? (
                            <RefreshCw
                              className={cn(
                                "size-3",
                                isReconnectingStatus(statusValue) && "animate-spin",
                              )}
                            />
                          ) : (
                            <XCircle className="size-3" />
                          )}
                        </AvatarBadge>
                      </Avatar>

                      <div className="flex min-w-0 items-baseline gap-2" data-session-identity>
                        <p
                          className="min-w-0 truncate text-sm font-semibold text-foreground sm:text-base"
                          title={session.name}
                        >
                          {session.name}
                        </p>
                        <span
                          className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums sm:text-sm"
                          dir="ltr"
                        >
                          {phoneLabel}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-2 flex min-w-0">
                    <Badge
                      variant="outline"
                      className={cn(
                        "w-fit shrink-0 rounded-full text-[11px] font-medium sm:text-xs",
                        statusBadgeClasses[
                          statusValue as keyof typeof statusBadgeClasses
                        ] || statusBadgeClasses["DISCONNECTED"],
                      )}
                    >
                      {getStatusText(statusValue, t)}
                    </Badge>
                  </div>

                  {/* Badges row: In their own row */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5 sm:mt-4 sm:gap-2">
                    {session.isDefault ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-primary/70 bg-primary/10 text-[10px] font-medium text-primary dark:border-primary/40 dark:text-primary sm:text-xs"
                      >
                        {t("whatsappSettings.default")}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className="rounded-full border-border/70 bg-[color:var(--color-card)] text-[11px] font-medium sm:text-xs"
                    >
                      {providerLabels[session.provider || "BAILEYS"]}
                    </Badge>
                    {session.autoReply ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-warning/70 bg-warning/10 text-[11px] font-medium text-warning dark:border-warning/40 dark:text-warning sm:text-xs"
                      >
                        {t("whatsappSettings.dialogs.autoReply")}
                      </Badge>
                    ) : null}
                  </div>

                  {/* Stats row: 2 columns, wrap-friendly, zero overflow */}
                  <div className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-2.5 text-xs sm:mt-4 sm:p-3">
                    <div className="flex min-w-0 items-center gap-1.5 text-muted-foreground">
                      <Users className="size-3.5 shrink-0 text-primary" />
                      <span className="shrink-0">المحادثات:</span>
                      <span className="truncate font-mono font-semibold text-foreground tabular-nums">
                        {session._count?.contacts || 0}
                      </span>
                    </div>
                    <div className="flex min-w-0 items-center justify-end gap-1.5 text-muted-foreground sm:justify-start">
                      <MessageSquareText className="size-3.5 shrink-0 text-primary" />
                      <span className="shrink-0">الرسائل:</span>
                      <span className="truncate font-mono font-semibold text-foreground tabular-nums">
                        {session._count?.messages || 0}
                      </span>
                    </div>
                  </div>

                  {/* History import progress */}
                  {session.historyImport &&
                  ["REQUESTED", "IN_PROGRESS"].includes(
                    session.historyImport.status,
                  ) ? (
                    <div className="mt-3 rounded-xl border border-info/60 bg-info/10 px-3 py-2 text-xs text-info dark:border-info/40 dark:text-info">
                      <div className="flex items-center justify-between gap-3">
                        <span>جاري مزامنة الرسائل</span>
                        <span className="font-mono tabular-nums">
                          {Math.round(session.historyImport.lastProgress || 0)}%
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-info/10 dark:bg-white/10">
                        <div
                          className="h-full rounded-full bg-info transition-all"
                          style={{
                            width: `${Math.min(
                              Math.max(
                                session.historyImport.lastProgress || 0,
                                0,
                              ),
                              100,
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>

                {/* Bottom actions row: >= 36px touch target */}
                <div
                  data-session-actions
                  className="mt-3.5 space-y-2 border-t border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] pt-3 sm:mt-4 sm:pt-4"
                >
                  <div className="flex">
                    {isConnectedStatus(statusValue) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 min-h-[36px] w-full whitespace-nowrap rounded-full border-destructive/70 bg-destructive/10 text-xs font-medium text-destructive hover:bg-destructive/15 dark:border-destructive/40 dark:text-destructive sm:text-sm"
                        onClick={() => setPendingDisconnect(session)}
                      >
                        <Link2Off className="size-3.5 ms-1 shrink-0" />
                        <span>{t("whatsappSettings.disconnect")}</span>
                      </Button>
                    ) : isReconnectingStatus(statusValue) ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 min-h-[36px] w-full whitespace-nowrap rounded-full border-primary/70 bg-primary/10 text-xs font-medium text-primary hover:bg-primary/15 dark:border-primary/40 dark:text-primary sm:text-sm"
                        disabled
                      >
                        <RefreshCw className="size-3.5 ms-1 shrink-0 animate-spin" />
                        <span>{t("whatsappSettings.reconnecting") || "Reconnecting..."}</span>
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        className="h-9 min-h-[36px] w-full whitespace-nowrap rounded-full bg-[color:var(--business-success)] text-xs font-medium text-white shadow-sm hover:brightness-90 sm:text-sm"
                        onClick={() => onConnectSession(session)}
                        disabled={connectingSessionId === session.id}
                      >
                        {connectingSessionId === session.id ? (
                          <RefreshCw className="size-3.5 ms-1 shrink-0 animate-spin" />
                        ) : (
                          <Link2 className="size-3.5 ms-1 shrink-0" />
                        )}
                        <span>{t("whatsappSettings.connect")}</span>
                      </Button>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    {session.provider === "META_CLOUD" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9 min-h-[36px] shrink-0 gap-1.5 rounded-full border-border/70 bg-[color:var(--color-card)] px-3 text-xs font-medium text-info hover:bg-muted dark:text-info"
                        onClick={() => onOpenWebhookDetails(session)}
                        title="بيانات Webhook"
                      >
                        <Globe className="size-3.5 shrink-0" />
                        <span>الويب هوك</span>
                      </Button>
                    ) : null}

                    <Button
                      variant="outline"
                      size="sm"
                      className="h-9 min-h-[36px] shrink-0 rounded-full border-border/70 bg-[color:var(--color-card)] px-3 text-xs font-medium hover:bg-muted"
                      onClick={() => onStartEditSession(session)}
                    >
                      <Edit className="size-3.5 ms-1 shrink-0" />
                      <span>{t("whatsappSettings.edit")}</span>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="size-9 min-h-[36px] min-w-[36px] shrink-0 rounded-full border-border/70 bg-[color:var(--color-card)] text-muted-foreground hover:bg-muted hover:text-foreground"
                          aria-label="خيارات الجلسة"
                        >
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-44 rounded-xl border-border/70 p-1.5 shadow-lg"
                      >
                        <DropdownMenuItem
                          onClick={() => onStartEditSession(session)}
                          className="flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs sm:text-sm"
                        >
                          <Edit className="size-4 text-[color:var(--color-primary)]" />
                          <span>{t("whatsappSettings.edit")}</span>
                        </DropdownMenuItem>
                        {session.provider === "META_CLOUD" && (
                          <DropdownMenuItem
                            onClick={() => onOpenWebhookDetails(session)}
                            className="flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs text-info focus:text-info sm:text-sm"
                          >
                            <Globe className="size-4" />
                            <span>بيانات Webhook</span>
                          </DropdownMenuItem>
                        )}
                        {session.provider === "BAILEYS" &&
                          isConnectedStatus(statusValue) && (
                            <DropdownMenuItem
                              onClick={() => onConnectSession(session)}
                              className="flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs sm:text-sm"
                            >
                              <RefreshCw className="size-4 text-muted-foreground" />
                              <span>إعادة المزامنة</span>
                            </DropdownMenuItem>
                          )}
                        <DropdownMenuSeparator className="my-1" />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => onDeleteSession(session)}
                          className="flex cursor-pointer items-center gap-2 rounded-xl py-2 text-xs text-destructive focus:bg-destructive/10 focus:text-destructive dark:focus:bg-destructive/30 sm:text-sm"
                        >
                          <Trash2 className="size-4" />
                          <span>{t("whatsappSettings.delete")}</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={pendingDisconnect !== null}
        title={t("whatsappSettings.dialogs.disconnectConfirmTitle")}
        content={t("whatsappSettings.dialogs.disconnectConfirmBody", {
          phone:
            pendingDisconnect?.phoneNumber ||
            pendingDisconnect?.metaDisplayPhoneNumber ||
            pendingDisconnect?.name ||
            "",
        })}
        confirmLabel={t("whatsappSettings.dialogs.disconnectConfirmAction")}
        cancelLabel={t("whatsappSettings.dialogs.cancel")}
        confirmColor="error"
        onConfirm={() => {
          if (pendingDisconnect) onDisconnectSession(pendingDisconnect.id);
          setPendingDisconnect(null);
        }}
        onCancel={() => setPendingDisconnect(null)}
      />
    </div>
  );
};
