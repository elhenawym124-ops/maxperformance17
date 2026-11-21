import React from "react";
import {
  CheckCircle,
  Clock,
  Cloud,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Send,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ChannelBadge } from "./ChannelBadge";
import { TemplateMetric } from "./TemplateMetric";
import {
  Template,
  categoryBadgeClasses,
  EVENT_TRIGGERS,
} from "./types";

interface TemplateCardsGridProps {
  templates: Template[];
  eventLabels: Record<string, string>;
  categoryLabels: Record<string, string>;
  selectedMetaSession: string;
  publishingId: string | null;
  onPublishToMeta: (id: string) => void;
  onEditTemplate: (template: Template) => void;
  onOpenStatusTemplates: () => void;
  onResetFilters: () => void;
  isArabic: boolean;
}

export const TemplateCardsGrid: React.FC<TemplateCardsGridProps> = ({
  templates,
  eventLabels,
  categoryLabels,
  selectedMetaSession,
  publishingId,
  onPublishToMeta,
  onEditTemplate,
  onOpenStatusTemplates,
  onResetFilters,
  isArabic,
}) => {
  if (templates.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border/70 bg-muted px-6 py-12 text-center">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-[color:var(--color-primary)]">
          <FileText className="size-7" />
        </div>
        <div className="mt-4 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {isArabic ? "لا توجد قوالب مطابقة" : "No matching templates"}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isArabic
              ? "جرّب تغيير كلمة البحث أو إعادة ضبط التصنيف الحالي."
              : "Try adjusting the search term or clearing the active category filter."}
          </p>
          <Button
            variant="outline"
            className="mt-2 rounded-full border-border/70 bg-[color:var(--color-card)] hover:brightness-95"
            onClick={onResetFilters}
          >
            {isArabic ? "إعادة ضبط الفلاتر" : "Reset filters"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
      {templates.map((template) => {
        const itemKey = template.id ?? template.eventType;
        const eventTitle =
          template.name ||
          eventLabels[template.eventType] ||
          template.eventType;
        const categoryLabel =
          categoryLabels[template.category] || template.category;
        const triggerText = EVENT_TRIGGERS[template.eventType];

        return (
          <div
            key={itemKey}
            className="flex h-full flex-col rounded-xl border border-border/70 bg-[color:var(--color-card)] p-5 shadow-sm transition-transform duration-200 hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                <h3 className="text-base font-semibold leading-7 text-foreground">
                  {eventTitle}
                </h3>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant="outline"
                    className={
                      categoryBadgeClasses[template.category] ||
                      categoryBadgeClasses.SYSTEM
                    }
                  >
                    {categoryLabel}
                  </Badge>
                  <ChannelBadge channel={template.channel} isArabic={isArabic} />
                  {template.isDefault && !template.id ? (
                    <Badge
                      variant="outline"
                      className="rounded-full border-dashed border-border/70 bg-muted text-muted-foreground"
                    >
                      {isArabic ? "نظامي" : "System"}
                    </Badge>
                  ) : null}
                  <Badge
                    variant="outline"
                    className={
                      template.isActive !== false
                        ? "border-emerald-300/70 bg-success/10 text-success dark:border-success/40 dark:bg-success/[0.08] dark:text-success"
                        : "border-slate-300/70 bg-muted text-foreground dark:border-border dark:bg-muted/[0.08] dark:text-muted-foreground"
                    }
                  >
                    {template.isActive !== false
                      ? isArabic
                        ? "نشط"
                        : "Active"
                      : isArabic
                        ? "معطل"
                        : "Disabled"}
                  </Badge>
                </div>
                {triggerText ? (
                  <div className="mt-2.5 flex items-center gap-1.5 rounded-lg bg-muted px-2.5 py-1 text-xs text-muted-foreground">
                    <Clock className="size-3.5 shrink-0 text-warning" />
                    <span className="font-medium text-foreground">
                      {isArabic ? "التشغيل:" : "Trigger:"}
                    </span>
                    <span className="truncate">{triggerText}</span>
                  </div>
                ) : null}
              </div>

              <div className="flex gap-1 shrink-0">
                {template.metaTemplateName ? (
                  <Badge
                    variant="outline"
                    className={
                      template.metaTemplateStatus === "APPROVED"
                        ? "border-emerald-300/70 bg-success/10 text-success"
                        : template.metaTemplateStatus === "REJECTED"
                          ? "border-red-300/70 bg-destructive/10 text-destructive"
                          : "border-amber-300/70 bg-warning/10 text-warning"
                    }
                  >
                    <Cloud className="size-3 me-1" />
                    {template.metaTemplateStatus === "APPROVED"
                      ? isArabic
                        ? "على ميتا"
                        : "On Meta"
                      : template.metaTemplateStatus === "REJECTED"
                        ? isArabic
                          ? "مرفوض"
                          : "Rejected"
                        : template.metaTemplateStatus === "PENDING"
                          ? isArabic
                            ? "قيد المراجعة"
                            : "Pending"
                          : template.metaTemplateStatus ||
                            (isArabic ? "منشور" : "Published")}
                  </Badge>
                ) : null}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full bg-primary/6 text-[color:var(--color-primary)] hover:bg-primary/12"
                  onClick={() => onEditTemplate(template)}
                  aria-label={isArabic ? "تعديل القالب" : "Edit template"}
                >
                  <Edit className="size-4" />
                </Button>
              </div>
            </div>

            {template.category === "ORDERS" ? (
              <div className="mt-3 flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs text-info border-info/70 hover:bg-info/10 dark:text-info dark:border-info/40"
                  onClick={onOpenStatusTemplates}
                >
                  <ExternalLink className="size-3" />
                  {isArabic ? "فتح في قوالب الحالات" : "Manage in status templates"}
                </Button>
              </div>
            ) : template.metaTemplateName &&
              template.metaTemplateStatus !== "APPROVED" ? null : (
              <div className="mt-3 flex items-center gap-2">
                {!selectedMetaSession ? (
                  <p className="text-xs text-muted-foreground">
                    {isArabic
                      ? "لا توجد جلسة ميتا متاحة"
                      : "No Meta session available"}
                  </p>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1 text-xs"
                    disabled={publishingId === template.id}
                    onClick={() => {
                      if (template.id) {
                        onPublishToMeta(template.id);
                      }
                    }}
                  >
                    <Cloud className="size-3" />
                    {publishingId === template.id
                      ? isArabic
                        ? "جاري النشر..."
                        : "Publishing..."
                      : template.metaTemplateName
                        ? isArabic
                          ? "إعادة النشر"
                          : "Re-publish"
                        : isArabic
                          ? "نشر على ميتا"
                          : "Publish to Meta"}
                  </Button>
                )}
              </div>
            )}

            <div className="mt-4 rounded-xl border border-success/80 bg-success/10 px-4 py-4 dark:border-success/40 dark:bg-success/[0.08]">
              <p className="mb-2 text-xs font-medium">
                {isArabic ? "محتوى الرسالة" : "Message preview"}
              </p>
              <p className="line-clamp-5 whitespace-pre-wrap text-sm leading-7 text-success dark:text-success">
                {template.content}
              </p>
            </div>

            <div className="mt-4 flex items-center rounded-xl border border-border/70 bg-[color:color-mix(in_srgb,var(--color-background)_86%,white)] px-2 py-2">
              <TemplateMetric
                icon={Send}
                label={isArabic ? "مرسل" : "Sent"}
                value={
                  template.sentCount != null && template.sentCount > 0
                    ? template.sentCount
                    : "—"
                }
                colorClass="text-muted-foreground"
              />
              <Separator orientation="vertical" className="mx-1 h-6" />
              <TemplateMetric
                icon={CheckCircle}
                label={isArabic ? "مستلم" : "Delivered"}
                value={
                  template.deliveredCount != null && template.deliveredCount > 0
                    ? template.deliveredCount
                    : "—"
                }
                colorClass="text-emerald-600 dark:text-success"
              />
              <Separator orientation="vertical" className="mx-1 h-6" />
              <TemplateMetric
                icon={Eye}
                label={isArabic ? "مقروء" : "Read"}
                value={
                  template.readCount != null && template.readCount > 0
                    ? template.readCount
                    : "—"
                }
                colorClass="text-sky-600 dark:text-info"
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
