import React from "react";
import { X, Check, ArrowUpLeft, Clock, ShieldCheck } from "lucide-react";
import {
  AGENT_KIND_META,
  AgentListing,
  CATEGORY_LABEL_MAP,
  getArabicInitials,
} from "../../agentMarketplaceData";

interface AgentCompareModalProps {
  agents: AgentListing[];
  open: boolean;
  onClose: () => void;
  onHire: (agent: AgentListing) => void;
  onManageHired: (agent: AgentListing) => void;
  onRemove: (slug: string) => void;
}

export const AgentCompareModal: React.FC<AgentCompareModalProps> = ({
  agents,
  open,
  onClose,
  onHire,
  onManageHired,
  onRemove,
}) => {
  if (!open || agents.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="compare-candidates-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-3 sm:p-5 text-start"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-xl border border-border bg-card text-card-foreground shadow-2xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5 bg-muted/20">
          <div>
            <h2 id="compare-candidates-title" className="text-sm sm:text-base font-bold text-foreground">
              مقارنة السير الذاتية للمرشحين
            </h2>
            <p className="text-xs text-muted-foreground">
              مقارنة سريعة للمهام والقنوات والراتب الشهري لاختيار الأنسب لمتجرك.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق المقارنة"
            className="flex size-8 items-center justify-center rounded-lg border border-border/70 bg-card text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] transition-all"
          >
            <X className="size-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-5">
          <div
            className={`grid gap-4 ${
              agents.length === 1
                ? "grid-cols-1 max-w-md mx-auto"
                : agents.length === 2
                ? "grid-cols-1 md:grid-cols-2"
                : "grid-cols-1 md:grid-cols-3"
            }`}
          >
            {agents.map((agent) => {
              const isPro = agent.tier === "pro" && agent.priceMonthly > 0;
              const isHired = Boolean(agent.isHired);
              const kindMeta = AGENT_KIND_META[agent.kind] || AGENT_KIND_META.solo;
              const tasks = (agent.cv?.responsibilities || agent.capabilities || []).slice(0, 4);

              return (
                <div
                  key={agent.slug}
                  className="flex flex-col justify-between rounded-xl border border-border/70 bg-background p-4 space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-xs">
                          {getArabicInitials(agent.name)}
                        </div>
                        <div className="min-w-0">
                          <h3 dir="auto" className="text-sm font-bold text-foreground line-clamp-2">
                            {agent.name}
                          </h3>
                          <p className="text-[11px] text-muted-foreground line-clamp-2">
                            {agent.position}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemove(agent.slug)}
                        aria-label={`إزالة ${agent.name} من المقارنة`}
                        className="text-muted-foreground hover:text-foreground p-1 rounded"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>

                    <div className="divide-y divide-border/70 rounded-lg border border-border/70 bg-card text-xs">
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">الراتب الشهري</span>
                        <span className="font-bold text-foreground">
                          {isPro ? (
                            <>
                              <span className="font-mono tabular-nums">
                                {Number(agent.priceMonthly).toLocaleString("en-US")}
                              </span>{" "}
                              {agent.currency}
                            </>
                          ) : (
                            <span className="text-success">مجاني مع الباقة</span>
                          )}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">التخصص</span>
                        <span className="font-medium text-foreground">
                          {CATEGORY_LABEL_MAP[agent.category] || agent.category}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2">
                        <span className="text-muted-foreground">نوع التعيين</span>
                        <span className="font-medium text-foreground">{kindMeta.label}</span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 gap-2">
                        <span className="text-muted-foreground shrink-0">القنوات</span>
                        <span className="font-medium text-foreground text-end">
                          {agent.channelLabels.join("، ")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 gap-2">
                        <span className="text-muted-foreground shrink-0">ساعات العمل</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground">
                          <Clock className="size-3 text-primary stroke-[1.5]" />
                          <span>{agent.cv?.availability || "دوام كامل ٢٤/٧"}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between px-3 py-2 gap-2">
                        <span className="text-muted-foreground shrink-0">أسلوب العمل</span>
                        <span className="inline-flex items-center gap-1 font-medium text-foreground text-end">
                          <ShieldCheck className="size-3 text-primary stroke-[1.5] shrink-0" />
                          <span>
                            {agent.governance === "human_in_loop"
                              ? "يعرض المسودات أولاً"
                              : "تنفيذ مباشر"}
                          </span>
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-[11px] font-bold text-foreground">أبرز المهام في CV</div>
                      <ul className="space-y-1">
                        {tasks.map((task, idx) => (
                          <li key={idx} className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
                            <Check className="size-3 text-success shrink-0 mt-0.5 stroke-[2]" />
                            <span>{task}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {isHired ? (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onManageHired(agent);
                      }}
                      className="w-full inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-lg border border-success/30 bg-success/10 text-xs font-semibold text-success hover:bg-success/15 active:scale-[0.97] transition-all"
                    >
                      <Check className="size-3.5 stroke-[2]" />
                      <span>موظف بالفعل — إدارة</span>
                      <ArrowUpLeft className="size-3.5 stroke-[1.5]" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onHire(agent);
                      }}
                      className="w-full inline-flex items-center justify-center h-9 px-3 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all"
                    >
                      <span>اختيار وتوظيف</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
