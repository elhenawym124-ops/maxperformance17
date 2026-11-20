import React, { useState } from "react";
import { AlertTriangle, CheckCircle2, Edit3, Database, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import tokenManager from "../../../utils/tokenManager";
import { buildApiUrl } from "../../../utils/urlHelper";

export interface AgentDataConflictItem {
  id: string;
  companyId: string;
  surface: string;
  sourceRowId?: string;
  conflictKey: string;
  writtenValue: string;
  liveValue: string;
  liveSource: string;
  conversationId?: string;
  status: string;
  createdAt: string;
}

interface ConflictsBannerProps {
  conflicts: AgentDataConflictItem[];
  companyId?: string;
  onResolved?: () => void;
}

const CONFLICT_KEY_LABELS: Record<string, string> = {
  product_price: "سعر المنتج",
  shipping_cost: "تكلفة الشحن",
  return_window_days: "مهلة الاسترجاع",
  discount_pct: "نسبة الخصم",
  min_order: "الحد الأدنى للطلب",
  stock_qty: "كمية المخزون",
};

export const AgentDataConflictsBanner: React.FC<ConflictsBannerProps> = ({
  conflicts,
  companyId,
  onResolved,
}) => {
  const [expanded, setExpanded] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const openConflicts = conflicts.filter((c) => c.status === "OPEN");
  if (openConflicts.length === 0) return null;

  const handleResolve = async (
    conflictId: string,
    decision: "CORRECT_WRITTEN" | "DATA_IS_RIGHT"
  ) => {
    setResolvingId(conflictId);
    try {
      const q = companyId ? `?companyId=${encodeURIComponent(companyId)}` : "";
      const res = await fetch(
        buildApiUrl(`agent/conflicts/${conflictId}/resolve${q}`),
        {
          method: "POST",
          headers: {
            ...tokenManager.createAuthHeaders(),
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ decision }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.success === false) {
        throw new Error(data.error || "فشل حسم التعارض");
      }
      toast.success(
        decision === "CORRECT_WRITTEN"
          ? "تم تصحيح المكتوب وتحديث التعليمات تلقائياً"
          : "تم اعتماد صحة بيانات النظام الحيّة بنجاح"
      );
      if (onResolved) onResolved();
    } catch (err: any) {
      toast.error(err.message || "حدث خطأ أثناء حسم التعارض");
    } finally {
      setResolvingId(null);
    }
  };

  return (
    <div className="mb-6 rounded-xl border border-warning bg-warning/70 p-4 shadow-sm transition-all dark:border-warning/60 dark:bg-warning/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning dark:text-warning">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-warning dark:text-warning">
              تعارضات بيانات الوكيل ({openConflicts.length})
            </h3>
            <p className="text-xs text-warning/80 dark:text-warning/80">
              اكتشف النظام أرقاماً في التعليمات/المهارات تخالف البيانات الحيّة. الأداة تكسب في الرد، ويرجى حسم التعارض أدناه.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1.5 text-warning hover:bg-warning/50 dark:text-warning dark:hover:bg-warning/40"
          aria-label="Toggle conflicts"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-2.5 pt-2 border-t border-warning/60 dark:border-warning/40">
          {openConflicts.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-warning bg-white p-3 dark:border-warning/40 dark:bg-muted"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-warning px-2 py-0.5 text-xs font-semibold text-warning dark:bg-warning/50 dark:text-warning">
                    {CONFLICT_KEY_LABELS[c.conflictKey] || c.conflictKey}
                  </span>
                  <span className="text-xs text-muted-foreground dark:text-muted-foreground">
                    المصدر: {c.liveSource}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="text-rose-600 dark:text-destructive">
                    المكتوب: <span className="tabular-nums font-bold">{c.writtenValue}</span>
                  </span>
                  <span className="text-zinc-300 dark:text-foreground">|</span>
                  <span className="text-emerald-600 dark:text-success">
                    الحيّ المسجل: <span className="tabular-nums font-bold">{c.liveValue}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  disabled={resolvingId === c.id}
                  onClick={() => handleResolve(c.id, "CORRECT_WRITTEN")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-muted px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-50 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  صحّح المكتوب ({c.liveValue})
                </button>
                <button
                  type="button"
                  disabled={resolvingId === c.id}
                  onClick={() => handleResolve(c.id, "DATA_IS_RIGHT")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-success px-2.5 py-1.5 text-xs font-medium text-white hover:bg-success disabled:opacity-50"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  الداتا صح
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
