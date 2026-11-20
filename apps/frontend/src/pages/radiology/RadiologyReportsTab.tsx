import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { AlertTriangle, FileText, Loader2, RefreshCw } from "lucide-react";
import { useRadiologyRiskFlags } from "./shared";
import {
  RadiologyBulkActionBar,
  RadiologyConfirmActionModal,
  RadiologyKpiCards,
  RadiologyReportModal,
  RadiologyReportsFilterBar,
  RadiologyReportsTable,
  useReportsTab,
} from "./reports-tab";

export { RadiologyReportModal };

export default function RadiologyReportsTab() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useRadiologyRiskFlags();

  const {
    rows,
    loading,
    refreshing,
    loadError,
    filters,
    page,
    setPage,
    total,
    totalPages,
    counters,
    hasActiveFilters,
    canManage,
    editId,
    setEditId,
    confirmAction,
    setConfirmAction,
    busyId,
    selected,
    setSelected,
    bulkBusy,
    updateFilter,
    isCounterActive,
    toggleCounter,
    refresh,
    runAction,
    toggleSelect,
    toggleSelectAll,
    allVisibleSelected,
    runBulkAction,
  } = useReportsTab();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("radiology.reports.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("radiology.reports.subtitle")}</p>
        </div>
        <button
          onClick={() => refresh()}
          className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50 cursor-pointer"
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          {t("radiology.refresh")}
        </button>
      </div>

      <RadiologyKpiCards
        counters={counters}
        isCounterActive={isCounterActive}
        toggleCounter={toggleCounter}
      />

      <RadiologyReportsFilterBar
        filters={filters}
        updateFilter={updateFilter}
        refreshing={refreshing}
      />

      {loading && !rows ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : rows === null && loadError ? (
        <div className="text-center py-16">
          <AlertTriangle className="w-10 h-10 mx-auto mb-3 text-destructive" />
          <p className="text-sm text-destructive mb-4">{loadError}</p>
          <button
            onClick={() => refresh()}
            className="px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50 cursor-pointer"
          >
            {t("radiology.reports.retry")}
          </button>
        </div>
      ) : rows === null || rows.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground/80">
          <FileText className="w-10 h-10 mx-auto mb-3" />
          {hasActiveFilters ? t("radiology.reports.noReportsMatch") : t("radiology.reports.noReportsYet")}
        </div>
      ) : (
        <>
          <RadiologyReportsTable
            rows={rows}
            canManage={canManage}
            selected={selected}
            toggleSelect={toggleSelect}
            toggleSelectAll={toggleSelectAll}
            allVisibleSelected={allVisibleSelected}
            busyId={busyId}
            onEdit={(id) => setEditId(id)}
            onConfirmAction={(act) => setConfirmAction(act)}
            navigate={navigate}
          />

          <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
            <p className="text-sm text-muted-foreground">
              {t("radiology.reports.showingRange", {
                shown: rows.length,
                total,
                page,
                pages: totalPages,
              })}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || refreshing}
                className="px-3 py-1.5 border dark:border-border rounded-lg text-sm disabled:opacity-40 hover:bg-muted/50 cursor-pointer"
              >
                {t("radiology.reports.previous")}
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page >= totalPages || refreshing}
                className="px-3 py-1.5 border dark:border-border rounded-lg text-sm disabled:opacity-40 hover:bg-muted/50 cursor-pointer"
              >
                {t("radiology.reports.next")}
              </button>
            </div>
          </div>
        </>
      )}

      {editId && (
        <RadiologyReportModal
          studyId={editId}
          onClose={() => setEditId(null)}
          onSaved={() => refresh({ silent: true })}
        />
      )}

      <RadiologyConfirmActionModal
        confirmAction={confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={(studyId, kind) => runAction(studyId, kind)}
        busy={Boolean(confirmAction && busyId === confirmAction.id)}
      />

      {canManage ? (
        <RadiologyBulkActionBar
          selectedCount={selected.size}
          bulkBusy={bulkBusy}
          onBulkAction={(act) => void runBulkAction(act)}
          onClearSelection={() => setSelected(new Set())}
        />
      ) : null}
    </div>
  );
}
