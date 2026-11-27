import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  PenLine,
  Save,
  X,
  RefreshCw,
  Trash2,
  Archive,
  Loader2,
  FlaskConical,
  MessageSquare,
  GraduationCap,
  GitFork,
  ChevronDown,
  Plus,
  Bot,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface AgentProfileHeaderProps {
  agentId: string;
  agentRole: string;
  agentStatus: string;
  templateSlug: string | null;
  channels: string[];
  subscription?: {
    id: string;
    monthlyPrice: number;
    currency?: string;
    status: string;
    nextBillingAt?: string;
  } | null;
  editing: boolean;
  setEditing: (v: boolean) => void;
  draftName: string;
  setDraftName: (v: string) => void;
  draftIcon: string;
  setDraftIcon: (v: string) => void;
  hasUnsavedChanges: boolean;
  statusSaving: boolean;
  profileSaving: boolean;
  onToggleStatus: (nextActive: boolean) => void;
  onSave: () => void;
  onDiscard: () => void;
  onDelete: () => void;
  onArchive?: () => void;
  onRefresh: () => void;
  refreshLoading: boolean;
  onOpenDrawer?: () => void;
  onCreateAgent?: () => void;
}

const AGENT_ICONS = ["🤖", "💼", "🎧", "📦", "📣", "💬", "📊", "🧠", "⚡", "🎯", "🛒", "🔧"];

export default function AgentProfileHeader({
  agentId,
  agentRole,
  agentStatus,
  templateSlug,
  channels,
  subscription = null,
  editing,
  setEditing,
  draftName,
  setDraftName,
  draftIcon,
  setDraftIcon,
  hasUnsavedChanges,
  statusSaving,
  profileSaving,
  onToggleStatus,
  onSave,
  onDiscard,
  onDelete,
  onArchive,
  onRefresh,
  refreshLoading,
  onOpenDrawer,
  onCreateAgent,
}: AgentProfileHeaderProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const active = agentStatus?.toUpperCase() === "ACTIVE";

  return (
    <div className="px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-b border-border/70 bg-card space-y-2.5 sm:space-y-3">
      {/* ── Mobile Identity Bar (Compact & Ergonomic) ── */}
      <div className="lg:hidden">
        {editing ? (
          <div className="flex flex-col gap-2.5 w-full">
            <div className="flex items-center gap-2">
              <Input
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className="h-9 text-base font-bold flex-1"
                placeholder={t("agentProfiles.settings.agentNamePlaceholder", "اسم الوكيل")}
              />
            </div>
            {/* Compact Emoji Grid */}
            <div className="grid grid-cols-6 gap-1 bg-muted/30 p-1.5 rounded-lg border border-border/40">
              {AGENT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setDraftIcon(icon)}
                  className={`size-8 flex items-center justify-center rounded-md text-base border transition-all active:scale-95 ${
                    draftIcon === icon
                      ? "border-primary bg-primary/15 font-bold shadow-xs"
                      : "border-border/60 hover:border-foreground/30 bg-background"
                  }`}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2 w-full">
            <button
              type="button"
              onClick={onOpenDrawer}
              className="flex items-center gap-2 py-1 px-1.5 -mx-1.5 rounded-lg hover:bg-muted/70 active:scale-97 transition-all text-start min-w-0 flex-1 group"
              aria-label={t("agentProfiles.sidebar.title", "فريق الايجنت")}
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border/70 bg-primary/10 text-primary">
                <Bot className="size-4 stroke-[1.5]" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h2 className="text-sm font-bold text-foreground truncate">{draftName}</h2>
                  <ChevronDown className="size-3.5 text-muted-foreground group-hover:text-foreground shrink-0 transition-transform" />
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <span className="truncate max-w-[120px]">{agentRole}</span>
                  <span
                    className={`inline-block size-1.5 rounded-full shrink-0 ${
                      active ? "bg-emerald-500" : "bg-muted-foreground/40"
                    }`}
                  />
                  <span>{active ? t("agentProfiles.header.status.active", "نشط") : t("agentProfiles.header.status.paused", "متوقف")}</span>
                </div>
              </div>
            </button>

            {/* Quick right actions on mobile */}
            <div className="flex items-center gap-1.5 shrink-0">
              <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2 py-1">
                <Switch
                  checked={active}
                  onCheckedChange={onToggleStatus}
                  disabled={statusSaving}
                  aria-label={t("agentProfiles.header.status.active_toggle", "تفعيل")}
                  className="scale-90"
                />
                <span className="text-[11px] font-medium text-muted-foreground select-none">
                  {statusSaving ? "..." : active ? t("agentProfiles.header.status.active_toggle", "مفعل") : t("agentProfiles.header.status.paused_toggle", "متوقف")}
                </span>
              </div>

              {onCreateAgent && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={onCreateAgent}
                  title={t("agentProfiles.sidebar.addTitle", "إضافة وكيل ذكي")}
                >
                  <Plus className="size-4" />
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Desktop Identity Row ── */}
      <div className="hidden lg:flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {editing ? (
            <div className="flex flex-col items-center gap-1 shrink-0">
              <div className="grid grid-cols-4 gap-1">
                {AGENT_ICONS.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setDraftIcon(icon)}
                    className={`size-7 flex items-center justify-center rounded-md text-sm border transition-colors ${
                      draftIcon === icon
                        ? "border-primary bg-primary/10 font-bold"
                        : "border-border/60 hover:border-foreground/30"
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-primary/10 text-primary mt-0.5">
              <Bot className="size-5 stroke-[1.5]" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              {editing ? (
                <Input
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="h-8 text-base font-bold w-64 max-w-full"
                />
              ) : (
                <h2 className="text-base font-bold text-foreground truncate">{draftName}</h2>
              )}

              {/* Status indicator */}
              <span
                className={`inline-block size-2.5 rounded-full shrink-0 ${
                  active ? "bg-emerald-500" : "bg-muted-foreground/30"
                }`}
                aria-hidden="true"
              />
              <span className="text-xs text-muted-foreground">
                {active ? t("agentProfiles.header.status.active", "نشط") : t("agentProfiles.header.status.paused", "متوقف")}
              </span>

              {/* Channel Badges */}
              {channels.map((ch) => (
                <span
                  key={ch}
                  className="text-[11px] bg-muted/60 text-muted-foreground px-2 py-0.5 rounded font-medium border border-border/40"
                >
                  {t(`agentProfiles.channel.${ch.toLowerCase()}`, ch)}
                </span>
              ))}

              {templateSlug && (
                <span className="text-[11px] font-mono text-muted-foreground/80 bg-muted/40 px-1.5 py-0.5 rounded border border-border/60">
                  {templateSlug}
                </span>
              )}

              {subscription && (
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border ${
                    subscription.status === "SUSPENDED"
                      ? "border-destructive/30 bg-destructive/10 text-destructive"
                      : "border-primary/25 bg-primary/10 text-primary"
                  }`}
                >
                  <CreditCard className="size-3 stroke-[1.5]" />
                  <span>
                    {subscription.status === "SUSPENDED"
                      ? "موقوف لنقص الرصيد"
                      : "اشتراك Pro"}
                  </span>
                  {subscription.nextBillingAt && subscription.status === "ACTIVE" && (
                    <span className="font-mono tabular-nums opacity-85">
                      • {new Date(subscription.nextBillingAt).toLocaleDateString("en-CA")}
                    </span>
                  )}
                </span>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-1">{agentRole}</p>
          </div>
        </div>

        {/* ── Status Switch & Actions ── */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/30 px-3 py-1.5">
            <Switch
              checked={active}
              onCheckedChange={onToggleStatus}
              disabled={statusSaving}
              aria-label={t("agentProfiles.header.status.active_toggle", "تفعيل")}
            />
            <span className="text-xs font-medium text-muted-foreground select-none">
              {statusSaving ? "..." : active ? t("agentProfiles.header.status.active_toggle", "مفعل") : t("agentProfiles.header.status.paused_toggle", "متوقف")}
            </span>
          </div>

          {agentRole !== "CEO" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label={t("agentProfiles.header.actions", "خيارات الوكيل")}
                  title={t("agentProfiles.header.deleteOrArchive", "حذف / أرشفة")}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-right" dir="rtl">
                <DropdownMenuItem
                  onClick={onArchive}
                  className="flex items-start gap-2.5 cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg text-warning dark:text-warning focus:text-warning focus:bg-warning/10 dark:focus:bg-warning/30"
                >
                  <Archive className="size-4 shrink-0 text-warning mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t("agentProfiles.archive.title", "أرشفة الوكيل")}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                      {t("agentProfiles.archive.menuDesc", "نقل للمؤرشفين مع حفظ البيانات وإمكانية الاستعادة")}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-start gap-2.5 cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="size-4 shrink-0 text-destructive mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t("agentProfiles.delete.title", "حذف الوكيل نهائياً")}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                      {t("agentProfiles.delete.menuDesc", "مسح كامل ودائم من النظام لا يمكن التراجع عنه")}
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* ── Bottom Toolbar Row: Quick Links & Save/Discard ── */}
      <div className="flex items-center justify-between gap-1.5 sm:gap-2 pt-2 border-t border-border/40 flex-nowrap overflow-x-auto no-scrollbar">
        {/* Left / Start: Edit & Quick AI Hub Navigation */}
        <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
          {!editing ? (
            <Button
              size="sm"
              variant="outline"
              className="h-8 text-xs px-2.5 sm:px-3 shrink-0"
              onClick={() => setEditing(true)}
            >
              <PenLine className="size-3.5 ms-1" />
              <span>{t("agentProfiles.settings.edit", "تعديل")}</span>
            </Button>
          ) : (
            <>
              <Button
                size="sm"
                className="h-8 text-xs px-2.5 sm:px-3 shrink-0"
                onClick={onSave}
                disabled={profileSaving || !hasUnsavedChanges}
              >
                {profileSaving ? (
                  <Loader2 className="size-3.5 animate-spin ms-1" />
                ) : (
                  <Save className="size-3.5 ms-1" />
                )}
                <span>
                  {profileSaving
                    ? t("agentProfiles.header.saving", "جارٍ الحفظ...")
                    : t("agentProfiles.header.save", "حفظ")}
                </span>
              </Button>
              {hasUnsavedChanges && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs px-2 sm:px-2.5 shrink-0"
                  onClick={onDiscard}
                  disabled={profileSaving}
                >
                  <X className="size-3.5 ms-1" />
                  <span>{t("agentProfiles.header.discard", "تراجع")}</span>
                </Button>
              )}
            </>
          )}

          {/* Quick Hub Links */}
          <span className="h-4 w-px bg-border/60 mx-0.5 sm:mx-1 shrink-0" />

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs px-2 sm:px-2.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => navigate("/admin/agent-chat")}
            title={t("agentProfiles.header.chat", "محادثة الوكيل")}
          >
            <MessageSquare className="size-3.5 ms-1 text-primary shrink-0" />
            <span className="hidden sm:inline">{t("agentProfiles.header.chat", "محادثة")}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs px-2 sm:px-2.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => navigate("/admin/ai-hub?tab=train")}
            title={t("agentProfiles.header.training", "تدريب الوكيل على معلومات المتجر")}
          >
            <GraduationCap className="size-3.5 ms-1 text-primary shrink-0" />
            <span className="hidden sm:inline">{t("agentProfiles.header.training", "التدريب")}</span>
          </Button>

          <Button
            size="sm"
            variant="ghost"
            className="h-8 text-xs px-2 sm:px-2.5 text-muted-foreground hover:text-foreground shrink-0"
            onClick={() => navigate("/admin/ai-hub?tab=routing")}
            title={t("agentProfiles.header.routing", "توزيع وربط القنوات")}
          >
            <GitFork className="size-3.5 ms-1 text-warning shrink-0" />
            <span className="hidden sm:inline">{t("agentProfiles.header.routing", "القنوات")}</span>
          </Button>

          {/* Delete / Archive dropdown on mobile */}
          {agentRole !== "CEO" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 lg:hidden shrink-0"
                  aria-label={t("agentProfiles.header.actions", "خيارات الوكيل")}
                  title={t("agentProfiles.header.deleteOrArchive", "حذف / أرشفة")}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 text-right" dir="rtl">
                <DropdownMenuItem
                  onClick={onArchive}
                  className="flex items-start gap-2.5 cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg text-warning dark:text-warning focus:text-warning focus:bg-warning/10 dark:focus:bg-warning/30"
                >
                  <Archive className="size-4 shrink-0 text-warning mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t("agentProfiles.archive.title", "أرشفة الوكيل")}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                      {t("agentProfiles.archive.menuDesc", "نقل للمؤرشفين مع حفظ البيانات وإمكانية الاستعادة")}
                    </span>
                  </div>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1" />
                <DropdownMenuItem
                  onClick={onDelete}
                  className="flex items-start gap-2.5 cursor-pointer py-2 px-2.5 text-xs font-medium rounded-lg text-destructive focus:text-destructive focus:bg-destructive/10"
                >
                  <Trash2 className="size-4 shrink-0 text-destructive mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold">{t("agentProfiles.delete.title", "حذف الوكيل نهائياً")}</span>
                    <span className="text-[10px] text-muted-foreground font-normal leading-tight">
                      {t("agentProfiles.delete.menuDesc", "مسح كامل ودائم من النظام لا يمكن التراجع عنه")}
                    </span>
                  </div>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right / End: Refresh */}
        <div className="flex items-center gap-1 shrink-0 me-auto">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-muted-foreground hover:text-foreground shrink-0"
            onClick={onRefresh}
            disabled={refreshLoading}
            aria-label={t("agentProfiles.header.refresh", "تحديث")}
            title={t("agentProfiles.header.refresh", "تحديث")}
          >
            <RefreshCw className={`size-3.5 ${refreshLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}
