import React from "react";
import { Link } from "react-router-dom";
import {
  Target,
  Send,
  Users,
  TrendingUp,
  TrendingDown,
  Eye,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { ReEngagementLine } from "./types";
import { fmt, normalizeDigits } from "./formatters";
import { SourceBadge } from "./SourceBadge";
import { StatusBadge } from "./StatusBadge";

interface LoyaltyReEngagementSectionProps {
  reEngagementLines: ReEngagementLine[];
  savingToggle: boolean;
  handleToggle: (line: ReEngagementLine) => void;
  thresholdDraft: number;
  setThresholdDraft: (val: number) => void;
  saveThreshold: () => Promise<void>;
  viewCustomers: (id: string) => Promise<void>;
}

export const LoyaltyReEngagementSection: React.FC<LoyaltyReEngagementSectionProps> = ({
  reEngagementLines,
  savingToggle,
  handleToggle,
  thresholdDraft,
  setThresholdDraft,
  saveThreshold,
  viewCustomers,
}) => {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="mb-1 flex items-center gap-2">
        <Target className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-bold text-foreground">
          أداة إعادة الاستهداف (Re-engagement)
        </h3>
      </div>
      <p className="mb-4 text-xs text-muted-foreground">
        العميل اشترى ← النظام يحدد إنه محتاج إعادة استهداف ← تُرسل رسالة إعادة شراء من
        الأداة المناسبة في قسم العملاء.
      </p>

      <div className="space-y-3">
        {reEngagementLines.map((line) => (
          <div
            key={line.id}
            className="rounded-xl border border-border p-4 dark:border-border"
          >
            <div className="flex flex-wrap items-center gap-2">
              <Send className="h-4 w-4 text-primary" />
              <p className="text-sm font-bold text-foreground">
                {line.trigger}
              </p>
              <span className="ms-auto">
                <StatusBadge status={line.status} />
              </span>
              <Switch
                checked={line.enabled}
                disabled={savingToggle}
                onCheckedChange={() => handleToggle(line)}
                aria-label={`تفعيل حلقة ${line.tool}`}
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-muted px-3 py-2 dark:bg-muted">
              <div className="flex items-center gap-2 text-sm">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  العملاء المطابقين:
                </span>
                <span className="font-bold font-mono tabular-nums text-foreground">
                  {line.count === null ? "غير محدد" : fmt(line.count)}
                </span>
              </div>
              {line.trend && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    line.trend.up === line.trend.goodWhenUp
                      ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
                      : "bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning"
                  }`}
                  title={line.trend.text}
                >
                  {line.trend.up ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  {line.trend.text}
                </span>
              )}
              {line.id === "postPurchase" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    حد السكوت (يوم):
                  </span>
                  <Input
                    type="number"
                    min={1}
                    max={365}
                    value={thresholdDraft}
                    onChange={(e) =>
                      setThresholdDraft(Math.max(1, Math.min(365, Number(e.target.value) || 30)))
                    }
                    className="h-7 w-20 px-2 text-xs font-mono tabular-nums"
                  />
                  <button
                    onClick={saveThreshold}
                    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                  >
                    حفظ
                  </button>
                </div>
              )}
              <button
                onClick={() => viewCustomers(line.id)}
                className="ms-auto inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-semibold text-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
              >
                <Eye className="h-3 w-3" />
                شوف العملاء
              </button>
            </div>

            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  الأداة
                </p>
                <Link
                  to={line.route}
                  className="mt-1 inline-block text-sm font-medium text-primary hover:underline dark:text-primary"
                >
                  {line.tool}
                </Link>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  الرسالة (قالب)
                </p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {line.message}
                </p>
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase text-muted-foreground">
                  بتتبعت منين
                </p>
                <div className="mt-1">
                  <SourceBadge source={line.source} />
                </div>
                <p className="mt-1 text-[10px] text-muted-foreground" dir="ltr">
                  {normalizeDigits(line.source.desc)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
