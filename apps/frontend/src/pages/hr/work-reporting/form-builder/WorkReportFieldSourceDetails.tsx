import React from "react";
import { SYSTEM_FIELD_OPTIONS } from "../catalog";
import { WorkReportField } from "../types";

interface WorkReportFieldSourceDetailsProps {
  field: WorkReportField;
  index: number;
  onUpdateField: (
    index: number,
    updater: (field: WorkReportField) => WorkReportField
  ) => void;
}

export const WorkReportFieldSourceDetails: React.FC<
  WorkReportFieldSourceDetailsProps
> = ({ field, index, onUpdateField }) => {
  const systemOption = SYSTEM_FIELD_OPTIONS.find(
    (option) => option.key === field.systemKey
  );

  return (
    <>
      {field.sourceType === "SYSTEM" ? (
        <div className="mt-4 space-y-2 rounded-xl bg-muted p-4 dark:bg-muted">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            مصدر البيانات من النظام
          </label>
          <select
            value={field.systemKey || ""}
            onChange={(event) =>
              onUpdateField(index, (current) => {
                const option = SYSTEM_FIELD_OPTIONS.find(
                  (item) => item.key === event.target.value
                );
                return {
                  ...current,
                  systemKey: event.target.value,
                  dataType: option?.dataType || current.dataType,
                };
              })
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-border dark:border-border dark:bg-muted dark:text-white"
          >
            {SYSTEM_FIELD_OPTIONS.map((option) => (
              <option key={option.key} value={option.key}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-xs leading-6 text-muted-foreground dark:text-muted-foreground">
            {systemOption?.description}
          </p>
        </div>
      ) : null}

      {field.sourceType === "CALCULATED" ? (
        <div className="mt-4 space-y-2 rounded-xl bg-muted p-4 dark:bg-muted">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            المعادلة الحسابية
          </label>
          <input
            value={field.formula || ""}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                formula: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-mono outline-none transition focus:border-border dark:border-border dark:bg-muted dark:text-white"
            placeholder="(orders_count / replied_conversations_count) * 100"
          />
          <p className="text-xs leading-6 text-muted-foreground dark:text-muted-foreground">
            استخدم مفاتيح الحقول بالأحرف الإنجليزية مع العمليات الحسابية
            الأساسية مثل + و - و * و /.
          </p>
        </div>
      ) : null}

      {field.dataType === "SELECT" && field.sourceType !== "SYSTEM" ? (
        <div className="mt-4 space-y-2 rounded-xl bg-muted p-4 dark:bg-muted">
          <label className="text-sm font-medium text-foreground dark:text-muted-foreground">
            خيارات القائمة
          </label>
          <textarea
            value={field.options.join("\n")}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                options: event.target.value
                  .split("\n")
                  .map((option) => option.trim())
                  .filter(Boolean),
              }))
            }
            rows={4}
            className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm outline-none transition focus:border-border dark:border-border dark:bg-muted dark:text-white"
            placeholder="اكتب كل اختيار في سطر مستقل"
          />
        </div>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-6">
        <label className="inline-flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground">
          <input
            type="checkbox"
            checked={field.isRequired}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                isRequired: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-border"
          />
          الحقل مطلوب
        </label>
        <label className="inline-flex items-center gap-2 text-sm text-foreground dark:text-muted-foreground">
          <input
            type="checkbox"
            checked={field.isVisible}
            onChange={(event) =>
              onUpdateField(index, (current) => ({
                ...current,
                isVisible: event.target.checked,
              }))
            }
            className="h-4 w-4 rounded border-border"
          />
          يظهر للموظف داخل الفورم
        </label>
      </div>
    </>
  );
};
