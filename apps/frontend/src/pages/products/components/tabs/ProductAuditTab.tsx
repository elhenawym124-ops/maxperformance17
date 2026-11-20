import React, { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../../../services/apiClient";
import {
  ClockIcon,
  UserCircleIcon,
  ArrowPathIcon,
  InformationCircleIcon,
  TagIcon,
  ChevronRightIcon,
  ChevronLeftIcon,
} from "@heroicons/react/24/outline";

interface AuditChange {
  before: any;
  after: any;
}

interface ProductAuditRecord {
  id: string;
  companyId: string;
  productId: string;
  userId?: string | null;
  userName?: string | null;
  action: string;
  changes?: Record<string, AuditChange> | null;
  source?: string;
  createdAt: string;
}

interface ProductAuditTabProps {
  productId?: string;
}

const ACTION_MAP: Record<string, { label: string; badgeClass: string }> = {
  CREATE: {
    label: "إنشاء منتج",
    badgeClass: "bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success",
  },
  UPDATE: {
    label: "تعديل بيانات",
    badgeClass: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800",
  },
  BULK_UPDATE: {
    label: "تعديل جماعي",
    badgeClass: "bg-purple-50 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary",
  },
  IMPORT: {
    label: "استيراد",
    badgeClass: "bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning",
  },
  DELETE: {
    label: "حذف",
    badgeClass: "bg-rose-50 text-destructive border-destructive dark:bg-destructive/40 dark:text-destructive dark:border-destructive",
  },
  STATUS_CHANGE: {
    label: "تغيير الحالة",
    badgeClass: "bg-cyan-50 text-info border-info dark:bg-info/40 dark:text-info dark:border-info",
  },
};

const SOURCE_MAP: Record<string, string> = {
  UI: "واجهة المستخدم",
  IMPORT: "استيراد",
  API: "واجهة برمجية (API)",
  AGENT: "وكيل ذكي",
};

const FIELD_LABELS: Record<string, string> = {
  name: "اسم المنتج",
  price: "السعر",
  comparePrice: "سعر المقارنة",
  cost: "سعر التكلفة",
  stock: "المخزون",
  sku: "رمز المنتج (SKU)",
  barcode: "الباركود",
  description: "الوصف",
  categoryId: "القسم",
  status: "الحالة",
  isActive: "حالة التفعيل",
  isHidden: "إخفاء من المتجر",
  trackInventory: "تتبع المخزون",
  weight: "الوزن",
  dimensions: "الأبعاد",
  tags: "الوسوم",
  images: "الصور",
  mainImage: "الصورة الرئيسية",
  deletedAt: "سلة المحذوفات",
  workflowStatus: "مرحلة العمل",
};

const formatFieldValue = (field: string, val: any): string => {
  if (val === null || val === undefined || val === "") return "—";
  if (typeof val === "boolean") {
    if (field === "isActive") return val ? "مفعل" : "معطل";
    if (field === "isHidden") return val ? "مخفي" : "ظاهر";
    if (field === "trackInventory") return val ? "مفعّل" : "معطّل";
    return val ? "نعم" : "لا";
  }
  if (field === "price" || field === "cost" || field === "comparePrice") {
    return `${val} ج.م`;
  }
  if (typeof val === "object") {
    try {
      return JSON.stringify(val);
    } catch {
      return String(val);
    }
  }
  return String(val);
};

export const ProductAuditTab: React.FC<ProductAuditTabProps> = ({ productId }) => {
  const [logs, setLogs] = useState<ProductAuditRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.get<any>(
        `products/${productId}/history?page=${page}&limit=10`
      );
      if (response && response.data) {
        const payload = response.data;
        const fetchedLogs = Array.isArray(payload)
          ? payload
          : payload.data || payload.logs || [];
        setLogs(fetchedLogs);
        const pagination = payload.pagination;
        if (pagination) {
          setTotal(pagination.total || fetchedLogs.length);
          setTotalPages(pagination.totalPages || 1);
        } else {
          setTotal(fetchedLogs.length);
          setTotalPages(1);
        }
      } else {
        setLogs([]);
      }
    } catch (err: any) {
      console.error("Error fetching product history:", err);
      setError("فشل في تحميل سجل التعديلات. يرجى المحاولة مرة أخرى.");
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [productId, page]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHours = Math.floor(diffMin / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSec < 60) return "الآن";
      if (diffMin < 60) return `منذ ${diffMin} دقيقة`;
      if (diffHours < 24) return `منذ ${diffHours} ساعة`;
      if (diffDays === 1) return "أمس";
      if (diffDays < 30) return `منذ ${diffDays} يوم`;
      return date.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return isoString;
    }
  };

  const formatExactDate = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleString("ar-EG", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-card shadow rounded-xl p-4 sm:p-6 space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border dark:border-border gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClockIcon className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">
              سجل تعديلات المنتج
            </h3>
            {total > 0 && (
              <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground font-mono">
                {total} عملية
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            سجل دقيق وتفصيلي يوضح من قام بالتعديل، وما هي الحقول المتغيرة وتاريخ التعديل
          </p>
        </div>

        <button
          type="button"
          onClick={() => fetchHistory()}
          disabled={loading}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted rounded-lg transition-colors disabled:opacity-50"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          تحديث السجل
        </button>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-xl text-destructive dark:text-destructive text-xs flex items-center gap-2">
          <InformationCircleIcon className="h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Loading Skeleton */}
      {loading && logs.length === 0 && (
        <div className="space-y-4 py-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="p-4 border border-border dark:border-border rounded-xl bg-muted dark:bg-muted animate-pulse space-y-3"
            >
              <div className="h-4 bg-muted dark:bg-muted rounded w-1/4" />
              <div className="h-3 bg-muted dark:bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && logs.length === 0 && (
        <div className="text-center py-12 px-4 border border-dashed border-border dark:border-border rounded-xl">
          <ClockIcon className="mx-auto h-12 w-12 text-muted-foreground dark:text-foreground mb-3" />
          <h4 className="text-sm font-bold text-foreground">
            لا يوجد سجل تعديلات
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            لم يتم تسجيل أي تعديلات سابقة على هذا المنتج بعد. سيتم توثيق أي تغيير يتم إجراؤه تلقائيًا هنا.
          </p>
        </div>
      )}

      {/* Timeline List of Logs */}
      {logs.length > 0 && (
        <div className="space-y-4">
          {logs.map((record) => {
            const actionInfo = ACTION_MAP[record.action] || {
              label: record.action,
              badgeClass: "bg-gray-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border",
            };
            const sourceLabel = SOURCE_MAP[record.source || "UI"] || record.source || "واجهة المستخدم";
            const changesList = record.changes ? Object.entries(record.changes) : [];

            return (
              <div
                key={record.id}
                className="border border-border dark:border-border rounded-xl p-4 bg-white dark:bg-muted hover:border-border transition-all shadow-2xs"
              >
                {/* Record Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border dark:border-border">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${actionInfo.badgeClass}`}
                    >
                      {actionInfo.label}
                    </span>
                    <span className="text-[11px] text-muted-foreground font-medium">
                      عبر {sourceLabel}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span title={formatExactDate(record.createdAt)} className="font-mono">
                      {formatRelativeTime(record.createdAt)}
                    </span>
                    <span className="text-gray-300 dark:text-foreground">•</span>
                    <span className="text-[11px] font-mono opacity-80">
                      {formatExactDate(record.createdAt)}
                    </span>
                  </div>
                </div>

                {/* User Snapshot */}
                <div className="mt-3 flex items-center gap-2 text-xs text-foreground">
                  <UserCircleIcon className="h-4 w-4 text-muted-foreground/80" />
                  <span className="font-semibold text-foreground">
                    {record.userName || "مستخدم غير معروف"}
                  </span>
                </div>

                {/* Field Changes Table */}
                {changesList.length > 0 ? (
                  <div className="mt-3 overflow-x-auto">
                    <table className="w-full text-xs text-right border-collapse">
                      <thead>
                        <tr className="text-muted-foreground border-b border-border dark:border-border text-[11px]">
                          <th className="py-1.5 px-2 font-semibold">الحقل</th>
                          <th className="py-1.5 px-2 font-semibold">القيمة السابقة</th>
                          <th className="py-1.5 px-2 font-semibold text-center w-8">←</th>
                          <th className="py-1.5 px-2 font-semibold">القيمة الجديدة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border dark:divide-border">
                        {changesList.map(([field, diff]) => {
                          const fieldNameAr = FIELD_LABELS[field] || field;
                          const beforeText = formatFieldValue(field, diff?.before);
                          const afterText = formatFieldValue(field, diff?.after);

                          return (
                            <tr key={field} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                              <td className="py-2 px-2 font-medium text-foreground flex items-center gap-1.5">
                                <TagIcon className="h-3 w-3 text-muted-foreground" />
                                {fieldNameAr}
                              </td>
                              <td className="py-2 px-2 text-destructive dark:text-destructive font-mono">
                                <span className="line-through bg-destructive/10 dark:bg-destructive/30 px-1.5 py-0.5 rounded">
                                  {beforeText}
                                </span>
                              </td>
                              <td className="py-2 px-2 text-center text-muted-foreground font-bold">
                                ←
                              </td>
                              <td className="py-2 px-2 text-success dark:text-success font-mono font-semibold">
                                <span className="bg-emerald-50 dark:bg-success/30 px-1.5 py-0.5 rounded">
                                  {afterText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="mt-2 text-[11px] text-muted-foreground italic">
                    تم تنفيذ العملية دون تغيير في الحقول المراقبة
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-4 border-t border-border dark:border-border text-xs">
          <div className="text-muted-foreground">
            الصفحة <span className="font-bold text-foreground font-mono">{page}</span> من{" "}
            <span className="font-bold text-foreground font-mono">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border dark:border-border bg-card text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRightIcon className="h-4 w-4" />
              السابق
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border dark:border-border bg-card text-foreground hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              التالي
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductAuditTab;
