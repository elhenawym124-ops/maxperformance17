import React from "react";
import { useTranslation } from "react-i18next";
import { DocumentTextIcon } from "@heroicons/react/24/outline";
import { OrderDetailsType } from "../types";
import { CustomerInfoCardCustomFieldConfig } from "./customerCardTypes";

interface CustomerNotesSectionProps {
  order: OrderDetailsType;
  isEditing: boolean;
  editForm: any;
  setEditForm: (form: any) => void;
  isCustomFieldEnabled?: boolean;
  customFieldConfig: CustomerInfoCardCustomFieldConfig;
  customFields: Array<{ label: string; value: string }>;
  displayNotes?: string;
}

export const CustomerNotesSection: React.FC<CustomerNotesSectionProps> = ({
  order,
  isEditing,
  editForm,
  setEditForm,
  isCustomFieldEnabled,
  customFieldConfig,
  customFields,
  displayNotes,
}) => {
  const { t } = useTranslation();

  const hasNotes =
    typeof order.notes === "string"
      ? Boolean(order.notes.trim())
      : Boolean(order.notes && Array.isArray(order.notes) ? order.notes.length : order.notes);

  if (!(hasNotes || (isEditing && editForm))) {
    return null;
  }

  return (
    <div>
      <label className={isEditing ? "text-xs font-medium text-muted-foreground block mb-1" : "sr-only"}>
        {isCustomFieldEnabled && customFields.length > 0
          ? customFieldConfig.label
            ? `${customFieldConfig.label} / ${t("orderDetails.orderNotes", "ملاحظات الطلب")}`
            : t("orderDetails.customFieldsAndNotes", "المواصفات وملاحظات الطلب")
          : t("orderDetails.orderNotes", "ملاحظات الطلب")}
      </label>
      {isEditing ? (
        <textarea
          value={editForm.notes || ""}
          onChange={(e) =>
            setEditForm({ ...editForm, notes: e.target.value })
          }
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-base sm:text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-primary"
          rows={3}
          placeholder={
            isCustomFieldEnabled
              ? customFieldConfig.placeholder ||
                t(
                  "orderDetails.customFieldEditPlaceholder",
                  "أدخل تفاصيل ومواصفات الطلب...",
                )
              : t(
                  "orderDetails.notesPlaceholder",
                  "أدخل ملاحظات الطلب...",
                )
          }
        />
      ) : isCustomFieldEnabled && customFields.length > 0 ? (
        <div className="space-y-2">
          <div className="rounded-xl border border-warning/35 bg-warning/10 p-3 text-sm text-foreground shadow-xs">
            <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-warning/25">
              <DocumentTextIcon className="w-4 h-4 text-warning shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-warning">
                {customFieldConfig.label ||
                  t(
                    "orderDetails.customFieldsHeader",
                    "المواصفات والحقول المخصصة",
                  )}
              </span>
            </div>
            <div className="divide-y divide-warning/20">
              {customFields.map((cf, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0"
                >
                  <span className="text-xs font-semibold text-muted-foreground shrink-0">
                    {cf.label}:
                  </span>
                  <span className="text-sm font-bold text-foreground text-end min-w-0 break-words">
                    {cf.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {displayNotes ? (
            <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-sm text-foreground shadow-xs">
              <span className="text-xs font-semibold block mb-1 text-muted-foreground">
                {t("orderDetails.additionalNotes", "ملاحظات إضافية:")}
              </span>
              <p className="whitespace-pre-wrap font-medium leading-relaxed break-words">
                {displayNotes}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="rounded-xl border border-border/70 bg-muted/40 p-3 text-sm text-foreground shadow-xs">
          <div className="flex items-start gap-2.5">
            <DocumentTextIcon className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <div className="space-y-1 w-full min-w-0">
              <p className="whitespace-pre-wrap font-medium leading-relaxed break-words">
                {order.notes}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
