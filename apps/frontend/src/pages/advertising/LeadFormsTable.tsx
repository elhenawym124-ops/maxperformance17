/**
 * جدول نماذج جمع البيانات — مكوّن خاص بصفحة LeadFormsManagement
 */

import React from "react";
import { Eye, FileText, Loader2 } from "lucide-react";
import type { LeadFormSummary } from "../../services/facebookAdsService";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "نشط",
  PAUSED: "متوقف",
  DRAFT: "مسودة",
  ARCHIVED: "مؤرشف",
  DELETED: "محذوف",
};

const statusLabel = (status: string) => STATUS_LABELS[status] || status || "-";

const statusClass = (status: string) =>
  status === "ACTIVE"
    ? "inline-flex px-2 py-0.5 text-xs rounded-full bg-success text-success dark:bg-success/40 dark:text-success"
    : "inline-flex px-2 py-0.5 text-xs rounded-full bg-muted text-foreground dark:bg-muted dark:text-muted-foreground";

interface LeadFormsTableProps {
  loading: boolean;
  forms: LeadFormSummary[];
  pageLabel: string;
  hasPages: boolean;
  onViewLeads: (form: LeadFormSummary) => void;
}

export const LeadFormsTable: React.FC<LeadFormsTableProps> = ({
  loading,
  forms,
  pageLabel,
  hasPages,
  onViewLeads,
}) => {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (forms.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border p-12 text-center">
        <FileText className="w-16 h-16 text-muted-foreground dark:text-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">
          لا توجد نماذج
        </h3>
        <p className="text-muted-foreground">
          {hasPages
            ? "لا توجد نماذج على هذه الصفحة — ابدأ بإنشاء نموذج جديد"
            : "اربط صفحة Facebook أولاً لعرض نماذج جمع البيانات"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border dark:border-border overflow-hidden">
      <div className="px-5 py-3 border-b border-border dark:border-border text-sm text-foreground dark:text-muted-foreground">
        الصفحة:{" "}
        <span className="font-medium text-foreground">
          {pageLabel}
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-muted">
            <tr>
              {[
                "النموذج",
                "الصفحة",
                "الحالة",
                "تاريخ الإنشاء",
                "العملاء المحتملون",
                "إجراء",
              ].map((title) => (
                <th
                  key={title}
                  className="px-4 py-3 text-right font-medium text-foreground whitespace-nowrap"
                >
                  {title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border dark:divide-border">
            {forms.map((form) => (
              <tr
                key={form.id}
                className="hover:bg-muted/50/30"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {form.name}
                </td>
                <td className="px-4 py-3 text-foreground dark:text-muted-foreground">
                  {pageLabel}
                </td>
                <td className="px-4 py-3">
                  <span className={statusClass(form.status)}>
                    {statusLabel(form.status)}
                  </span>
                </td>
                <td className="px-4 py-3 text-foreground dark:text-muted-foreground tabular-nums">
                  {form.createdTime
                    ? new Date(form.createdTime).toLocaleDateString("ar-EG")
                    : "-"}
                </td>
                <td className="px-4 py-3 text-foreground tabular-nums">
                  {form.leadsCount}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onViewLeads(form)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50"
                  >
                    <Eye className="w-4 h-4" />
                    عرض البيانات
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeadFormsTable;
