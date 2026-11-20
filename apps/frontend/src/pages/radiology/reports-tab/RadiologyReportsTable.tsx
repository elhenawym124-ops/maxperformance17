import React from "react";
import { useTranslation } from "react-i18next";
import { Eye, Loader2, Pencil, ShieldAlert } from "lucide-react";
import {
  RADIOLOGY_CRITICAL_META,
  RadiologyReportStatusMap,
  criticalCategoryText,
} from "../shared";
import { ActionKind, ReportRow } from "./types";
import { ACTION_META, fmtDate, nextActionFor, ROLES } from "./constants";

interface RadiologyReportsTableProps {
  rows: ReportRow[];
  canManage: boolean;
  selected: Set<string>;
  toggleSelect: (id: string) => void;
  toggleSelectAll: () => void;
  allVisibleSelected: boolean;
  busyId: string | null;
  onEdit: (id: string) => void;
  onConfirmAction: (action: { id: string; kind: ActionKind }) => void;
  navigate: (path: string) => void;
}

export const RadiologyReportsTable: React.FC<RadiologyReportsTableProps> = ({
  rows,
  canManage,
  selected,
  toggleSelect,
  toggleSelectAll,
  allVisibleSelected,
  busyId,
  onEdit,
  onConfirmAction,
  navigate,
}) => {
  const { t } = useTranslation();

  const reportStatusOf = (s: ReportRow) => s.report?.reportStatus || "";

  const nextAction = (s: ReportRow): { kind: ActionKind; cls: string } | null => {
    const kind = nextActionFor(reportStatusOf(s));
    return kind ? { kind, cls: ACTION_META[kind].cls } : null;
  };

  const reportBadge = (value: string) => {
    const meta = RadiologyReportStatusMap[value];
    if (meta) {
      return (
        <span
          className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${meta.color}`}
        >
          {t(meta.label)}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">
        {value || "—"}
      </span>
    );
  };

  return (
    <div className="bg-card rounded-xl shadow-sm border dark:border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground text-sm">
              <th className="py-3 px-4 whitespace-nowrap">
                {canManage ? (
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-blue-600"
                    checked={allVisibleSelected}
                    onChange={toggleSelectAll}
                    title={t("radiology.bulk.selectAll") as string}
                    aria-label={t("radiology.bulk.selectAll") as string}
                  />
                ) : null}
              </th>
              {[
                { key: "patient", label: t("radiology.reports.patient") },
                { key: "studyNumber", label: t("radiology.reports.studyNumber") },
                { key: "examType", label: t("radiology.reports.examType") },
                { key: "reportStatus", label: t("radiology.reports.reportStatus") },
                { key: "roles", label: t("radiology.reports.roles") },
                { key: "lastUpdated", label: t("radiology.reports.lastUpdated") },
                { key: "actions", label: t("radiology.reports.actions") },
              ].map((col) => (
                <th key={col.key} className="text-right py-3 px-4 whitespace-nowrap">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((s) => {
              const action = nextAction(s);
              const reportStatus = reportStatusOf(s);
              const criticalCat = criticalCategoryText(s.report);
              const criticalMeta = criticalCat ? RADIOLOGY_CRITICAL_META[criticalCat] : undefined;

              return (
                <tr
                  key={s.id}
                  className="border-b dark:border-border hover:bg-muted/50 text-sm"
                >
                  <td className="py-3 px-4">
                    {canManage ? (
                      <input
                        type="checkbox"
                        className="w-4 h-4 accent-blue-600"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                        aria-label={t("radiology.bulk.selectAll") as string}
                      />
                    ) : null}
                  </td>
                  <td className="py-3 px-4 font-medium">{s.patientName}</td>
                  <td className="py-3 px-4 font-medium font-mono" dir="ltr">
                    {s.studyNumber || s.id.slice(0, 8)}
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {s.examTypeName || s.examType?.name || "—"}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {reportBadge(reportStatus)}
                      {criticalMeta ? (
                        <span
                          title={s.report?.criticalFindingText}
                          className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center gap-1 ${criticalMeta.color}`}
                        >
                          <ShieldAlert className="w-3 h-3" />
                          {t(criticalMeta.label)}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-1 min-w-[140px]">
                      {ROLES.map((r) => {
                        const name = s.report?.[r.field];
                        return (
                          <span
                            key={r.key}
                            className="text-xs text-right px-2 py-0.5 rounded border border-border dark:border-border"
                          >
                            {t(r.labelKey)}: <b>{name || "—"}</b>
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground/80 whitespace-nowrap tabular-nums">
                    {fmtDate(s.report?.updatedAt || s.report?.signedAt || s.report?.typedAt || s.createdAt)}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => navigate(`/radiology/study/${s.id}`)}
                        className="p-1.5 text-muted-foreground hover:bg-muted rounded cursor-pointer"
                        title={t("radiology.reports.details") as string}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onEdit(s.id)}
                        className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded cursor-pointer"
                        title={t("radiology.reports.editReport") as string}
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {canManage && action ? (
                        <button
                          onClick={() => onConfirmAction({ id: s.id, kind: action.kind })}
                          disabled={busyId === s.id}
                          className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium cursor-pointer ${action.cls}`}
                        >
                          {busyId === s.id ? (
                            <Loader2 className="w-3 h-3 inline animate-spin ms-1" />
                          ) : null}
                          {t(ACTION_META[action.kind].labelKey)}
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
