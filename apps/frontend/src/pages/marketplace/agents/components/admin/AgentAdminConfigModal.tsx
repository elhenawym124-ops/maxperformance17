import React, { useState, useEffect } from "react";
import { X, Save, Loader2, Eye, EyeOff } from "lucide-react";
import {
  AGENT_CATEGORIES,
  AGENT_KIND_META,
  AgentCategory,
  AgentKind,
  AgentListing,
  AgentTier,
} from "../../agentMarketplaceData";

interface AgentAdminConfigModalProps {
  agent: AgentListing | null;
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (
    slug: string,
    patch: {
      visible: boolean;
      kind: AgentKind;
      category: Exclude<AgentCategory, "all">;
      tier: AgentTier;
      priceMonthly: number;
      featured: boolean;
      summary: string;
    }
  ) => Promise<boolean>;
}

export const AgentAdminConfigModal: React.FC<AgentAdminConfigModalProps> = ({
  agent,
  open,
  saving,
  onClose,
  onSave,
}) => {
  const [visible, setVisible] = useState(true);
  const [kind, setKind] = useState<AgentKind>("solo");
  const [category, setCategory] = useState<Exclude<AgentCategory, "all">>("executive");
  const [tier, setTier] = useState<AgentTier>("free");
  const [priceMonthly, setPriceMonthly] = useState<number>(0);
  const [featured, setFeatured] = useState<boolean>(false);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    if (agent) {
      setVisible(agent.visible);
      setKind(agent.kind);
      setCategory(agent.category);
      setTier(agent.tier);
      setPriceMonthly(agent.priceMonthly || 0);
      setFeatured(Boolean(agent.featured));
      setSummary(agent.summary || "");
    }
  }, [agent]);

  if (!open || !agent) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const ok = await onSave(agent.slug, {
      visible,
      kind,
      category,
      tier,
      priceMonthly: tier === "free" ? 0 : Math.max(0, Number(priceMonthly) || 0),
      featured,
      summary,
    });
    if (ok) onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-agent-config-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 text-start"
      onClick={onClose}
    >
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between border-b border-border/70 px-5 py-3.5">
          <div className="min-w-0">
            <h2
              id="admin-agent-config-title"
              className="text-sm font-bold text-foreground truncate"
            >
              إعدادات عرض الوكيل في السوق
            </h2>
            <p className="text-[11px] font-mono text-muted-foreground truncate mt-0.5">
              {agent.slug}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="flex size-8 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] transition-all"
          >
            <X className="size-4 stroke-[1.5]" />
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Visibility switch */}
          <div className="flex items-center justify-between rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2.5">
            <div className="flex items-center gap-2">
              {visible ? (
                <Eye className="size-4 text-success stroke-[1.5]" />
              ) : (
                <EyeOff className="size-4 text-muted-foreground stroke-[1.5]" />
              )}
              <div>
                <div className="font-semibold text-foreground">
                  {visible ? "ظاهر في سوق التجار" : "مخفي عن سوق التجار"}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  إخفاء الوكيل لا يؤثر على الشركات التي وظفته بالفعل.
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              className={`h-8 px-3 rounded-lg text-xs font-semibold active:scale-[0.97] transition-all ${
                visible
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {visible ? "إخفاء" : "إظهار"}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="admin-agent-kind" className="font-semibold text-foreground block">
                نوع الوكيل
              </label>
              <select
                id="admin-agent-kind"
                value={kind}
                onChange={(e) => setKind(e.target.value as AgentKind)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {(Object.keys(AGENT_KIND_META) as AgentKind[]).map((k) => (
                  <option key={k} value={k}>
                    {AGENT_KIND_META[k].label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-agent-cat" className="font-semibold text-foreground block">
                القسم
              </label>
              <select
                id="admin-agent-cat"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as Exclude<AgentCategory, "all">)
                }
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                {AGENT_CATEGORIES.filter((c) => c.id !== "all").map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label htmlFor="admin-agent-tier" className="font-semibold text-foreground block">
                الباقة
              </label>
              <select
                id="admin-agent-tier"
                value={tier}
                onChange={(e) => setTier(e.target.value as AgentTier)}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              >
                <option value="free">مجاني مع الباقة</option>
                <option value="pro">تخصصي Pro (مدفوع)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="admin-agent-price" className="font-semibold text-foreground block">
                الاشتراك الشهري (ج.م)
              </label>
              <input
                id="admin-agent-price"
                type="number"
                min={0}
                step={10}
                disabled={tier === "free"}
                value={tier === "free" ? 0 : priceMonthly}
                onChange={(e) => setPriceMonthly(Number(e.target.value))}
                className="w-full h-9 rounded-lg border border-border bg-background px-3 text-xs font-mono tabular-nums text-foreground disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="admin-agent-summary" className="font-semibold text-foreground block">
              الوصف المختصر في البطاقة
            </label>
            <textarea
              id="admin-agent-summary"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-border bg-background p-2.5 text-xs text-foreground focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none resize-none"
            />
          </div>

          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={featured}
              onChange={(e) => setFeatured(e.target.checked)}
              className="rounded border-border text-primary focus:ring-primary"
            />
            <span className="text-xs font-medium text-foreground">
              تمييز الوكيل كـ «مقترح» في أعلى السوق
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border/70 px-5 py-3 bg-muted/20">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-9 px-4 rounded-lg border border-border bg-card text-xs font-medium text-foreground hover:bg-muted active:scale-[0.97] transition-all"
          >
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-1.5 h-9 px-4 rounded-lg bg-primary text-xs font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.97] transition-all disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Save className="size-3.5 stroke-[1.5]" />
            )}
            <span>حفظ التغييرات</span>
          </button>
        </div>
      </form>
    </div>
  );
};
