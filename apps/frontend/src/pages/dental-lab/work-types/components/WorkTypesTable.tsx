import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Building2,
  FileText,
  Loader2,
  Pencil,
  Search,
  ShieldCheck,
  Trash2,
  Workflow,
  Wrench,
} from "lucide-react";
import { fmtMoney, type DentalWorkType, MODAL_INPUT_CLS } from "../../shared";
import { CATEGORY_LABELS } from "../types/workTypeTypes";

interface WorkTypesTableProps {
  rows: DentalWorkType[];
  loading: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  removingId: string | null;
  onEdit: (workType: DentalWorkType) => void;
  onStagesModal: (workType: DentalWorkType) => void;
  onToggleActive: (workType: DentalWorkType) => void;
  onRemove: (workType: DentalWorkType) => void;
}

export function WorkTypesTable({
  rows,
  loading,
  searchInput,
  onSearchChange,
  removingId,
  onEdit,
  onStagesModal,
  onToggleActive,
  onRemove,
}: WorkTypesTableProps) {
  const { t } = useTranslation();
  const inputCls = `${MODAL_INPUT_CLS} text-sm`;

  return (
    <div className="bg-card rounded-xl border dark:border-border">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-border">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-semibold">
            {t("dentalLab.workTypes.title")}{" "}
            <span className="font-mono tabular-nums">({rows.length})</span>
          </h3>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input
            className={`${inputCls} pe-9 w-64`}
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="بحث بالاسم أو الخامة أو الماركة..."
          />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground/80">
          <Wrench className="w-10 h-10 mx-auto mb-3" />
          {t("dentalLab.common.noResults")}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  {t("dentalLab.common.name")}
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  {t("dentalLab.workTypes.category")}
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  طريقة التسعير
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  السعر للعيادة
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  التكلفة والربح
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  الخامة والماركة
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  {t("dentalLab.workTypes.leadTimeDays")}
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  {t("dentalLab.common.status")}
                </th>
                <th className="text-right py-3 px-4 whitespace-nowrap">
                  {t("dentalLab.common.actions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => {
                const profit = Math.max(0, (w.price ?? 0) - (w.costPrice ?? 0));
                const margin =
                  (w.price ?? 0) > 0
                    ? Math.round((profit / (w.price ?? 1)) * 100)
                    : 0;
                return (
                  <tr
                    key={w.id}
                    className="border-b dark:border-border last:border-b-0 hover:bg-muted/50/50"
                  >
                    <td className="py-3 px-4 font-semibold text-foreground">
                      <Link
                        to={`/dental-lab/cases?workTypeId=${w.id}`}
                        className="hover:text-blue-600 dark:hover:text-primary hover:underline cursor-pointer"
                        title="عرض كل حالات هذا النوع فقط"
                      >
                        {w.name}
                      </Link>
                      {w.instructions && (
                        <span
                          className="flex items-center gap-1 text-[11px] text-muted-foreground font-normal truncate max-w-xs mt-0.5"
                          title={w.instructions}
                        >
                          <FileText className="w-3 h-3 shrink-0" />
                          <span className="truncate">{w.instructions}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-muted">
                        {CATEGORY_LABELS[w.category ?? ""] || w.category || "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          w.pricingMode === "PER_UNIT"
                            ? "bg-blue-100 text-primary dark:bg-primary/40 dark:text-primary"
                            : "bg-purple-100 text-primary dark:bg-primary/40 dark:text-primary"
                        }`}
                      >
                        {w.pricingMode === "PER_UNIT"
                          ? "لكل وحدة"
                          : "سعر ثابت للخدمة"}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold tabular-nums text-foreground">
                      {fmtMoney(w.price)} {t("dentalLab.common.egp")}
                    </td>
                    <td className="py-3 px-4">
                      {(w.costPrice ?? 0) > 0 ? (
                        <div className="text-xs">
                          <span className="text-emerald-600 dark:text-success font-bold font-mono tabular-nums">
                            +{fmtMoney(profit)} ج.م
                          </span>
                          <span className="text-[10px] text-muted-foreground me-1 font-mono tabular-nums">
                            ({margin}%)
                          </span>
                          <div className="text-[10px] text-muted-foreground font-mono tabular-nums">
                            ت: {fmtMoney(w.costPrice)} ج.م
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">غير محدد</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="text-xs text-foreground font-medium">
                        {w.defaultMaterial || "—"}
                      </div>
                      {w.materialBrand && (
                        <div className="text-[11px] text-primary dark:text-primary font-semibold flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          <span>{w.materialBrand}</span>
                        </div>
                      )}
                      {(w.defaultWarrantyYears ?? 0) > 0 && (
                        <div className="flex items-center gap-1 text-[11px] text-success dark:text-success mt-0.5">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span className="font-mono tabular-nums">
                            ضمان {w.defaultWarrantyYears} سنوات
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium">
                      <div className="tabular-nums font-mono">
                        {w.leadTimeDays ?? 0} أيام
                      </div>
                      {(w.urgentLeadTimeDays ?? 0) > 0 && (
                        <div className="text-[11px] text-warning dark:text-warning font-mono tabular-nums mt-0.5">
                          مستعجل: {w.urgentLeadTimeDays} يوم
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onToggleActive(w)}
                        className={`text-xs px-2 py-0.5 rounded-full border ${
                          w.isActive
                            ? "bg-green-100 text-success dark:bg-success/40 dark:text-success border-success dark:border-success"
                            : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground border-border"
                        }`}
                      >
                        {w.isActive
                          ? t("dentalLab.common.active")
                          : t("dentalLab.common.inactive")}
                      </button>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button
                          onClick={() => onStagesModal(w)}
                          className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                          title="قالب مراحل الإنتاج ومواصفات SLA"
                        >
                          <Workflow className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEdit(w)}
                          className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
                          title={t("dentalLab.common.edit")}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onRemove(w)}
                          disabled={removingId !== null}
                          className="p-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-40"
                          title={t("dentalLab.common.delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default WorkTypesTable;
