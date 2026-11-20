import React from "react";
import {
  ChevronDown,
  ChevronUp,
  CopyPlus,
  GripVertical,
  Trash2,
} from "lucide-react";
import {
  DATA_TYPE_OPTIONS,
  FIELD_SOURCE_OPTIONS,
  SYSTEM_FIELD_OPTIONS,
} from "../catalog";
import { slugifyFieldKey } from "../utils";
import { WorkReportField, WorkReportFieldDataType } from "../types";
import { BuilderBadge } from "./WorkReportFormHeaderAndMeta";
import { WorkReportFieldSourceDetails } from "./WorkReportFieldSourceDetails";

interface WorkReportFieldCardProps {
  field: WorkReportField;
  index: number;
  onUpdateField: (
    index: number,
    updater: (field: WorkReportField) => WorkReportField
  ) => void;
  onMoveField: (index: number, direction: -1 | 1) => void;
  onDuplicateField: (index: number) => void;
  onRemoveField: (index: number) => void;
}

export const WorkReportFieldCard: React.FC<WorkReportFieldCardProps> = ({
  field,
  index,
  onUpdateField,
  onMoveField,
  onDuplicateField,
  onRemoveField,
}) => {
  return (
    <div className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-muted-foreground dark:bg-muted dark:text-muted-foreground">
            <GripVertical className="h-4 w-4" />
          </span>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-medium">
                {field.label || `حقل ${index + 1}`}
              </h3>
              <BuilderBadge
                label={
                  FIELD_SOURCE_OPTIONS.find(
                    (item) => item.value === field.sourceType
                  )?.label || field.sourceType
                }
              />
              <BuilderBadge
                label={
                  DATA_TYPE_OPTIONS.find(
                    (item) => item.value === field.dataType
                  )?.label || field.dataType
                }
              />
              {!field.isVisible ? (
                <BuilderBadge
                  label="مخفي"
                  tone="border-amber-200 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/30 dark:text-warning"
                />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground dark:text-muted-foreground">
              المفتاح البرمجي:{" "}
              <span className="font-mono">{field.key || "—"}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onMoveField(index, -1)}
            aria-label="تحريك لأعلى"
            className="rounded-xl border border-border p-2 text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border"
            title="تحريك لأعلى"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onMoveField(index, 1)}
            aria-label="تحريك لأسفل"
            className="rounded-xl border border-border p-2 text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border"
            title="تحريك لأسفل"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onDuplicateField(index)}
            aria-label="نسخ الحقل"
            className="rounded-xl border border-border p-2 text-foreground transition hover:border-border hover:text-foreground dark:border-border dark:text-muted-foreground dark:hover:border-border"
            title="نسخ الحقل"
          >
            <CopyPlus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemoveField(index)}
            aria-label="حذف الحقل"
            className="rounded-xl border border-destructive p-2 text-destructive transition hover:border-destructive hover:bg-destructive/10 dark:border-destructive/60 dark:text-destructive dark:hover:bg-destructive/30"
            title="حذف الحقل"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            اسم الحقل
          </label>
          <input
            value={field.label}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                label: event.target.value,
                key:
                  !current.key || current.key.startsWith("field_")
                    ? slugifyFieldKey(event.target.value) || current.key
                    : current.key,
              }))
            }
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            placeholder="مثال: عدد الرسائل"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            المفتاح البرمجي
          </label>
          <input
            value={field.key}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                key: slugifyFieldKey(event.target.value),
              }))
            }
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm font-mono outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            placeholder="orders_count"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            نوع المصدر
          </label>
          <select
            value={field.sourceType}
            onChange={(event) =>
              onUpdateField(index, (current) => {
                const nextSource = event.target
                  .value as WorkReportField["sourceType"];
                const nextState: WorkReportField = {
                  ...current,
                  sourceType: nextSource,
                };

                if (nextSource === "SYSTEM") {
                  const defaultSystem = SYSTEM_FIELD_OPTIONS[0];
                  nextState.systemKey = defaultSystem?.key || null;
                  nextState.dataType = defaultSystem?.dataType || "TEXT";
                  nextState.formula = null;
                } else if (nextSource === "CALCULATED") {
                  nextState.systemKey = null;
                  nextState.formula = current.formula || "";
                  nextState.dataType =
                    current.dataType === "TEXT" ||
                    current.dataType === "LONG_TEXT"
                      ? "NUMBER"
                      : current.dataType;
                } else {
                  nextState.systemKey = null;
                  nextState.formula = null;
                }

                return nextState;
              })
            }
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
          >
            {FIELD_SOURCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            نوع البيانات
          </label>
          <select
            value={field.dataType}
            disabled={field.sourceType === "SYSTEM"}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                dataType: event.target.value as WorkReportFieldDataType,
                options:
                  event.target.value === "SELECT" ? current.options : [],
              }))
            }
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
          >
            {DATA_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            وصف أو ملاحظة مساعدة
          </label>
          <input
            value={field.helpText || ""}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                helpText: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            placeholder="نص مساعد يظهر للموظف أو المدير."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            Placeholder
          </label>
          <input
            value={field.placeholder || ""}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                placeholder: event.target.value,
              }))
            }
            disabled={field.sourceType !== "MANUAL"}
            className="w-full rounded-xl border border-border bg-muted px-4 py-3 text-sm outline-none transition focus:border-border focus:bg-white disabled:cursor-not-allowed disabled:opacity-60 dark:border-border dark:bg-muted dark:text-white dark:focus:border-border"
            placeholder="نص يظهر داخل الحقل للموظف."
          />
        </div>
      </div>

      <WorkReportFieldSourceDetails
        field={field}
        index={index}
        onUpdateField={onUpdateField}
      />
    </div>
  );
};
