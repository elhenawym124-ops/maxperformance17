import React from "react";
import { Link } from "react-router-dom";
import { Cloud, Smartphone, HelpCircle, ExternalLink, Info } from "lucide-react";
import { RoutingInfo } from "./types";
import { normalizeDigits } from "./formatters";
import { SourceBadge } from "./SourceBadge";

interface RoutingToolItem {
  tool: string;
  route: string;
  source: RoutingInfo;
  editable?: boolean;
}

interface LoyaltyRoutingSectionProps {
  routing: RoutingInfo;
  routingTools: RoutingToolItem[];
  openChannelDialog: () => void;
}

export const LoyaltyRoutingSection: React.FC<LoyaltyRoutingSectionProps> = ({
  routing,
  routingTools,
  openChannelDialog,
}) => {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <h3 className="mb-1 text-lg font-bold text-foreground">
        توجيه الرسائل (WhatsApp Routing)
      </h3>
      <p className="mb-4 text-xs text-muted-foreground">
        المصدر الحالي للإرسال مأخوذ من جلسات واتساب المتصلة — أي قيمة غير مؤكدة تُعرض
        «غير محدد» ولا تُخمَّن.
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border p-4 dark:border-border">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ${
            routing.key === "meta"
              ? "bg-sky-100 text-info dark:bg-info/40 dark:text-info"
              : routing.key === "wa"
                ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
                : "bg-gray-100 text-muted-foreground dark:bg-muted dark:text-muted-foreground"
          }`}
        >
          {routing.key === "meta" ? (
            <Cloud className="h-5 w-5" />
          ) : routing.key === "wa" ? (
            <Smartphone className="h-5 w-5" />
          ) : (
            <HelpCircle className="h-5 w-5" />
          )}
        </div>
        <div>
          <p className="text-sm font-bold text-foreground">
            المصدر الافتراضي للإرسال: {routing.label}
          </p>
          <p className="text-xs text-muted-foreground" dir="ltr">
            {normalizeDigits(routing.desc) || "لا توجد بيانات"}
          </p>
        </div>
        {routing.key === "unknown" && (
          <span className="ms-auto rounded-full bg-warning px-3 py-1 text-xs font-semibold text-warning dark:bg-warning/40 dark:text-warning">
            تحتاج ربط جلسة واتساب من الإعدادات
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-right text-xs text-muted-foreground dark:border-border dark:text-muted-foreground">
              <th className="py-2 pe-4 font-semibold">الأداة</th>
              <th className="py-2 pe-4 font-semibold">المصدر</th>
            </tr>
          </thead>
          <tbody>
            {routingTools.map((row) => (
              <tr
                key={row.route}
                className="border-b border-border last:border-0 dark:border-border"
              >
                <td className="py-2.5 pe-4">
                  <Link
                    to={row.route}
                    className="font-medium text-foreground hover:text-primary dark:text-muted-foreground"
                  >
                    {row.tool}
                  </Link>
                </td>
                <td className="py-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <SourceBadge source={row.source} />
                    {row.editable && (
                      <button
                        onClick={openChannelDialog}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground hover:bg-muted dark:border-border dark:text-muted-foreground dark:hover:bg-muted"
                      >
                        <ExternalLink className="h-3 w-3" />
                        تعديل
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5" />
        المصدر الافتراضي بيتحدد من جلسة الواتساب المتصلة — عدّله من
        <Link to="/whatsapp/settings" className="ms-1 font-medium text-primary hover:underline dark:text-primary">
          إعدادات واتساب
        </Link>
        . قناة عيد الميلاد لها إعداد خاص قابل للتعديل من هنا.
      </p>
    </div>
  );
};
