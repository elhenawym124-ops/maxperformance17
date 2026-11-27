import React, { useEffect } from "react";
import {
  X,
  Check,
  ShieldCheck,
  Lock,
  Users,
  ArrowUpLeft,
  AlertTriangle,
  Radio,
  Clock,
  MessageSquareText,
  Briefcase,
} from "lucide-react";
import {
  AGENT_KIND_META,
  AgentListing,
  CATEGORY_LABEL_MAP,
  REQUIRED_APP_LABELS,
  getArabicInitials,
} from "./agentMarketplaceData";

export interface AgentProfileDrawerProps {
  agent: AgentListing | null;
  open: boolean;
  onClose: () => void;
  onHire: (agent: AgentListing) => void;
  onManageHired?: (agent: AgentListing) => void;
  isHired?: boolean;
}

export const AgentProfileDrawer: React.FC<AgentProfileDrawerProps> = ({
  agent,
  open,
  onClose,
  onHire,
  onManageHired,
  isHired = false,
}) => {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open || !agent) return null;

  const isPro = agent.tier === "pro" && agent.priceMonthly > 0;
  const isSquad = agent.kind === "squad";
  const kindMeta = AGENT_KIND_META[agent.kind] || AGENT_KIND_META.solo;
  const effectiveHired = isHired || Boolean(agent.isHired);
  const missingAppLabel =
    agent.requiredAppSlug && agent.prerequisiteMet === false
      ? REQUIRED_APP_LABELS[agent.requiredAppSlug] || agent.requiredAppSlug
      : null;

  const cvBio = agent.cv?.bio || agent.summary;
  const communicationStyle = agent.cv?.communicationStyle || [];
  const responsibilities = agent.cv?.responsibilities || agent.capabilities || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="agent-dossier-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative flex h-full w-full max-w-xl flex-col bg-card text-card-foreground border-s border-border shadow-2xl overflow-hidden text-start"
      >
        {/* Top CV Document Bar */}
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/20">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xs font-bold text-foreground">
              السيرة الذاتية للمرشح (CV)
            </span>
            <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              {kindMeta.label}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق السيرة الذاتية"
            className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] transition-all"
          >
            <X className="size-4 stroke-[1.5]" />
          </button>
        </div>

        {/* Scrollable CV Body */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {/* Candidate Header Card */}
          <div className="flex items-start gap-3.5">
            <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-base">
              {isSquad ? (
                <Users className="size-6 stroke-[1.5]" />
              ) : (
                getArabicInitials(agent.name)
              )}
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-start justify-between gap-2 flex-wrap">
                <h2
                  id="agent-dossier-title"
                  dir="auto"
                  className="text-lg font-bold tracking-tight text-foreground leading-snug"
                >
                  {agent.name}
                </h2>
                <span className="text-xs font-bold text-foreground shrink-0 rounded-md bg-muted/60 px-2.5 py-1 border border-border/70">
                  {isPro ? (
                    <>
                      <span className="font-mono tabular-nums">
                        {Number(agent.priceMonthly).toLocaleString("en-US")}
                      </span>{" "}
                      {agent.currency}/شهر
                    </>
                  ) : (
                    <span className="text-success">مجاني بالباقة</span>
                  )}
                </span>
              </div>
              <p className="text-xs font-semibold text-primary">
                {agent.cv?.headline || agent.position}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                  {CATEGORY_LABEL_MAP[agent.category] || agent.category}
                </span>
                {agent.dialect && (
                  <span className="rounded-md border border-border/70 px-2 py-0.5 text-[11px] text-muted-foreground">
                    {agent.dialect}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Candidate Summary / Bio */}
          <section className="space-y-1.5 border-t border-border/70 pt-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Briefcase className="size-3.5 text-primary stroke-[1.5]" />
              <span>نبذة المرشح</span>
            </h3>
            <p className="text-xs text-foreground/90 leading-relaxed">
              {cvBio}
            </p>
          </section>

          {/* Prerequisite notice */}
          {missingAppLabel && (
            <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3 text-xs text-warning">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 stroke-[1.5]" />
              <div className="space-y-0.5">
                <div className="font-semibold">متطلب تشغيل غير مفعّل</div>
                <p className="text-[11px] opacity-90">
                  يباشر هذا المرشح كامل مهامه بعد تفعيل {missingAppLabel} في حساب الشركة.
                </p>
              </div>
            </div>
          )}

          {/* Work Conditions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-border/70 bg-muted/20 p-3.5 text-xs">
            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="size-3.5 text-primary stroke-[1.5]" />
                <span>ساعات العمل</span>
              </div>
              <div className="font-semibold text-foreground">
                {agent.cv?.availability || "دوام كامل ٢٤/٧"}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Radio className="size-3.5 text-primary stroke-[1.5]" />
                <span>قنوات العمل</span>
              </div>
              <div className="font-semibold text-foreground">
                {agent.channelLabels.join("، ")}
              </div>
            </div>

            <div className="space-y-1">
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="size-3.5 text-primary stroke-[1.5]" />
                <span>أسلوب العمل</span>
              </div>
              <div className="font-semibold text-foreground">
                {agent.governance === "human_in_loop"
                  ? "مسودات بموافقتك"
                  : "تنفيذ مباشر منضبط"}
              </div>
            </div>
          </div>

          {/* Communication Style from PERSONA.md */}
          {communicationStyle.length > 0 && (
            <section className="space-y-2 border-t border-border/70 pt-4">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <MessageSquareText className="size-3.5 text-primary stroke-[1.5]" />
                <span>أسلوب التواصل والشخصية المهنية</span>
              </h3>
              <ul className="space-y-1.5 rounded-xl border border-border/70 bg-background p-3.5">
                {communicationStyle.map((line, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
                    <span className="text-primary font-bold shrink-0">•</span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Squad Members Section */}
          {isSquad && agent.squadMemberDetails && agent.squadMemberDetails.length > 0 && (
            <section className="space-y-2.5 border-t border-border/70 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Users className="size-3.5 text-primary stroke-[1.5]" />
                  <span>أعضاء الفريق المشمولون في التوظيف</span>
                </h3>
                <span className="text-[11px] font-mono tabular-nums text-muted-foreground">
                  {agent.squadMemberDetails.length}
                </span>
              </div>
              <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-background">
                {agent.squadMemberDetails.map((member) => (
                  <div key={member.slug} className="px-3.5 py-2.5 space-y-0.5">
                    <div className="text-xs font-semibold text-foreground">{member.name}</div>
                    <div className="text-[11px] text-muted-foreground">{member.position}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Role Responsibilities */}
          <section className="space-y-2.5 border-t border-border/70 pt-4">
            <h3 className="text-xs font-bold text-foreground">
              المهام والخبرات التي يتولاها في متجرك
            </h3>
            <ul className="space-y-2">
              {responsibilities.map((cap, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2 rounded-lg border border-border/70 bg-background px-3 py-2 text-xs text-foreground"
                >
                  <Check className="size-3.5 shrink-0 mt-0.5 text-success stroke-[2]" />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Contract & Safety Terms */}
          <section className="space-y-2.5 border-t border-border/70 pt-4">
            <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Lock className="size-3.5 text-warning stroke-[1.5]" />
              <span>ضوابط التعيين وحدود الصلاحية</span>
            </h3>
            <ul className="rounded-xl border border-warning/25 bg-warning/5 p-3.5 space-y-2 text-xs text-muted-foreground">
              {agent.boundaries.map((boundary, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-warning font-bold shrink-0">•</span>
                  <span>{boundary}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Sticky Footer */}
        <div className="border-t border-border/70 bg-card px-5 py-3.5 pb-[calc(0.875rem+env(safe-area-inset-bottom))] flex items-center justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[11px] text-muted-foreground">قرار التعيين</div>
            <div className="text-xs font-semibold text-foreground truncate">
              {effectiveHired ? "معيّن بالفعل في فريق متجرك" : "جاهز للبدء فوراً"}
            </div>
          </div>

          {effectiveHired ? (
            <button
              type="button"
              onClick={() => onManageHired?.(agent)}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg border border-success/30 bg-success/10 text-xs font-semibold text-success hover:bg-success/15 active:scale-[0.97] transition-all whitespace-nowrap"
            >
              <span>إدارة الموظف في فريقي</span>
              <ArrowUpLeft className="size-3.5 stroke-[1.5]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onHire(agent)}
              className="inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all whitespace-nowrap"
            >
              <span>{isSquad ? "اختيار وتوظيف الفريق" : "اختيار وتوظيف المرشح"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
