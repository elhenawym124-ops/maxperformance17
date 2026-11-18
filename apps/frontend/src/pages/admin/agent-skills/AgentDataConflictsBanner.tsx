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
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50/70 p-4 shadow-sm transition-all dark:border-amber-900/60 dark:bg-amber-950/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-200">
              تعارضات بيانات الوكيل ({openConflicts.length})
            </h3>
            <p className="text-xs text-amber-700/80 dark:text-amber-300/80">
              اكتشف النظام أرقاماً في التعليمات/المهارات تخالف البيانات الحيّة. الأداة تكسب في الرد، ويرجى حسم التعارض أدناه.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="rounded-lg p-1.5 text-amber-700 hover:bg-amber-200/50 dark:text-amber-300 dark:hover:bg-amber-900/40"
          aria-label="Toggle conflicts"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {expanded && (
        <div className="mt-3.5 space-y-2.5 pt-2 border-t border-amber-200/60 dark:border-amber-900/40">
          {openConflicts.map((c) => (
            <div
              key={c.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white p-3 dark:border-amber-900/40 dark:bg-zinc-900/80"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    {CONFLICT_KEY_LABELS[c.conflictKey] || c.conflictKey}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    المصدر: {c.liveSource}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium">
                  <span className="text-rose-600 dark:text-rose-400">
                    المكتوب: <span className="tabular-nums font-bold">{c.writtenValue}</span>
                  </span>
                  <span className="text-zinc-300 dark:text-zinc-700">|</span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    الحيّ المسجل: <span className="tabular-nums font-bold">{c.liveValue}</span>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  disabled={resolvingId === c.id}
                  onClick={() => handleResolve(c.id, "CORRECT_WRITTEN")}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  <Edit3 className="h-3.5 w-3.5 text-blue-500" />
                  صحّح المكتوب ({c.liveValue})
                </button>
                <button
                  type="button"
                  disabled={resolvingId === c.id}
                  onClick={() => handleResolve(c.id, "DATA_IS_RIGHT")}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
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
