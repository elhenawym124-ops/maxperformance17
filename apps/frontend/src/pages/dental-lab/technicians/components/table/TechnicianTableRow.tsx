import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Palmtree,
  Pencil,
  Plus,
  Receipt,
  ShieldCheck,
  Trash2,
  Wallet,
} from "lucide-react";
import {
  fmtMoney,
  isTechnicianOnVacation,
  ROLE_CONFIG,
  type DentalTechnician,
  type TeamMember,
} from "../../../shared";

export interface TechnicianTableRowProps {
  x: DentalTechnician;
  rows: DentalTechnician[];
  wageDefault: number;
  removingId: string | null;
  team: TeamMember[];
  onOpenEdit: (tech: DentalTechnician) => void;
  onRemove: (tech: DentalTechnician) => void;
  onToggleActive: (tech: DentalTechnician) => void;
  onOpenPayout: (tech: DentalTechnician) => void;
  onOpenLedger: (tech: DentalTechnician) => void;
}

export const TechnicianTableRow: React.FC<TechnicianTableRowProps> = ({
  x,
  rows,
  wageDefault,
  removingId,
  team,
  onOpenEdit,
  onRemove,
  onToggleActive,
  onOpenPayout,
  onOpenLedger,
}) => {
  const { t } = useTranslation();

  const roleBadge = (role: string) => {
    const cleanRole = String(role || "")
      .replace(/\s*\/\s*(Master|QC)\s*$/i, "")
      .trim();
    const meta = ROLE_CONFIG[cleanRole] || ROLE_CONFIG[role];
    if (!meta) {
      return (
        <span className="px-2 py-0.5 rounded-full text-xs bg-muted text-foreground">
          {cleanRole}
        </span>
      );
    }
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${meta.color}`}>
        {meta.label}
      </span>
    );
  };

  const teamName = (userId?: string) => {
    if (!userId) return "—";
    const m = team.find((mm) => mm.userId === userId);
    return m ? m.name || m.email || userId : userId;
  };

  const vac = isTechnicianOnVacation(x);

  return (
    <tr
      key={x.id}
      className="border-b dark:border-border last:border-b-0 hover:bg-muted/50"
    >
      <td className="py-3 px-3 font-medium text-foreground">
        <Link
          to={`/dental-lab/cases?technicianId=${x.id}`}
          className="hover:text-blue-600 dark:hover:text-primary hover:underline cursor-pointer"
          title="عرض كل حالات هذا الفني فقط"
        >
          {x.name}
        </Link>
      </td>
      <td className="py-3 px-3 text-xs text-muted-foreground font-mono" dir="ltr">
        {x.phone || "—"}
      </td>
      <td className="py-3 px-3">{roleBadge(x.role)}</td>
      <td className="py-3 px-3 text-xs">
        <div className="font-mono tabular-nums text-foreground dark:text-muted-foreground">
          {Array.isArray(x.workingDays) && x.workingDays.length > 0
            ? `${x.workingDays.length} أيام عمل`
            : "6 أيام (افتراضي)"}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5 font-mono tabular-nums">
          {x.dailyCap && x.dailyCap > 0 ? `سقف: ${x.dailyCap} حالة/يوم` : "سقف مفتوح"}
        </div>
        {vac.onVacation && vac.vacation && (
          <div
            className="inline-flex items-center gap-1 mt-1 text-[11px] font-medium text-warning dark:text-warning bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning/60 rounded px-1.5 py-0.5"
            title={
              vac.vacation.reason
                ? `السبب: ${vac.vacation.reason}`
                : `في إجازة حتى ${vac.vacation.endDate}`
            }
          >
            <Palmtree className="w-3 h-3 text-warning dark:text-warning shrink-0" />
            <span className="font-mono tabular-nums">في إجازة حتى {vac.vacation.endDate}</span>
          </div>
        )}
        {!vac.onVacation && vac.upcomingCount > 0 && (
          <div
            className="inline-flex items-center gap-1 mt-0.5 text-[10px] text-warning/90 dark:text-warning/90 font-mono tabular-nums"
            title={`${vac.upcomingCount} فترة إجازة قادمة مسجلة`}
          >
            <Palmtree className="w-2.5 h-2.5 shrink-0" />
            <span>{vac.upcomingCount} إجازة مجدولة</span>
          </div>
        )}
      </td>
      <td className="py-3 px-3 text-xs">
        {x.backupTechnicianName ||
        (x.backupTechnicianId &&
          rows.find((r) => r.id === x.backupTechnicianId)?.name) ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 px-2 py-0.5 rounded border border-primary dark:border-primary">
            {x.backupTechnicianName ||
              rows.find((r) => r.id === x.backupTechnicianId)?.name}
          </span>
        ) : (
          <span className="text-gray-400">—</span>
        )}
      </td>
      <td className="py-3 px-3">
        {x.wagePerStage != null ? (
          <span className="font-semibold text-foreground dark:text-muted-foreground font-mono tabular-nums">
            {fmtMoney(x.wagePerStage)} ج.م
          </span>
        ) : (
          <span className="text-xs text-muted-foreground font-mono tabular-nums">
            افتراضي ({fmtMoney(wageDefault)} ج.م)
          </span>
        )}
      </td>
      <td className="py-3 px-3 font-mono font-medium text-primary dark:text-primary tabular-nums">
        {x.completedStages ?? 0}
      </td>
      <td className="py-3 px-3 font-semibold text-primary dark:text-primary">
        <div className="font-mono tabular-nums">{fmtMoney(x.totalEarnings)} ج.م</div>
        {Number(x.totalBonuses) > 0 || Number(x.totalDeductions) > 0 ? (
          <div className="text-[11px] font-normal flex items-center gap-1 mt-0.5 font-mono tabular-nums">
            {Number(x.totalBonuses) > 0 && (
              <span className="text-emerald-600 dark:text-success">
                +{fmtMoney(x.totalBonuses)}
              </span>
            )}
            {Number(x.totalDeductions) > 0 && (
              <span className="text-red-600 dark:text-destructive">
                -{fmtMoney(x.totalDeductions)}
              </span>
            )}
          </div>
        ) : null}
      </td>
      <td className="py-3 px-3 font-semibold text-primary dark:text-primary font-mono tabular-nums">
        {fmtMoney(x.totalPaid ?? 0)} ج.م
      </td>
      <td
        className={`py-3 px-3 font-bold font-mono tabular-nums ${
          (x.balanceDue ?? 0) > 0
            ? "text-emerald-600 dark:text-success"
            : "text-muted-foreground"
        }`}
      >
        {fmtMoney(x.balanceDue ?? 0)} ج.م
      </td>
      <td className="py-3 px-3 text-xs">
        {x.userEmail ||
        x.user?.email ||
        (x.userId && teamName(x.userId) !== "—") ? (
          <div className="inline-flex items-center gap-1.5 font-mono text-xs text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 px-2.5 py-1 rounded-lg border border-primary dark:border-primary">
            <ShieldCheck className="w-3.5 h-3.5 text-primary dark:text-primary shrink-0" />
            <span
              className="truncate max-w-[170px]"
              title={x.userEmail || x.user?.email || teamName(x.userId)}
            >
              {x.userEmail || x.user?.email || teamName(x.userId)}
            </span>
          </div>
        ) : (
          <button
            onClick={() => onOpenEdit(x)}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning dark:text-warning bg-warning/10 dark:bg-warning/30 px-2 py-0.5 rounded border border-warning dark:border-warning hover:bg-warning"
            title="اضغط لإنشاء أو ربط حساب المنصة"
          >
            <Plus className="w-3 h-3" />
            <span>إنشاء حساب دخول</span>
          </button>
        )}
      </td>
      <td className="py-3 px-3">
        <button
          onClick={() => onToggleActive(x)}
          className={`text-xs px-2 py-0.5 rounded-full border ${
            x.isActive
              ? "bg-green-100 text-success dark:bg-success/40 dark:text-success border-success dark:border-success"
              : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground border-border"
          }`}
        >
          {x.isActive ? t("dentalLab.common.active") : t("dentalLab.common.inactive")}
        </button>
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-1">
          <button
            onClick={() => onOpenPayout(x)}
            className="p-1.5 text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/30 rounded-lg transition-colors"
            title="صرف مستحقات / سلفة"
          >
            <Wallet className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenLedger(x)}
            className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg transition-colors"
            title="كشف حساب وسجل السندات"
          >
            <Receipt className="w-4 h-4" />
          </button>
          <button
            onClick={() => onOpenEdit(x)}
            className="p-1.5 text-muted-foreground hover:bg-muted rounded-lg transition-colors"
            title={String(t("dentalLab.common.edit"))}
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRemove(x)}
            disabled={removingId !== null}
            className="p-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-40 transition-colors"
            title={String(t("dentalLab.common.delete"))}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );
};

export default TechnicianTableRow;
