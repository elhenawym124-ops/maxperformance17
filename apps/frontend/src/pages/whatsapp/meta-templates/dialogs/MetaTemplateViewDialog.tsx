import React from "react";
import { AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { resolveTemplateSection } from "@/data/templateSectionRegistry";
import { MetaTemplate, statusBadge, statusIcon } from "../types";

interface MetaTemplateViewDialogProps {
  viewTemplate: MetaTemplate | null;
  onClose: () => void;
}

export const MetaTemplateViewDialog: React.FC<MetaTemplateViewDialogProps> = ({
  viewTemplate,
  onClose,
}) => {
  if (!viewTemplate) return null;

  const StatusIcon = statusIcon[viewTemplate.status] || AlertTriangle;
  const sec = resolveTemplateSection(viewTemplate.name, viewTemplate.category);

  return (
    <Dialog open={Boolean(viewTemplate)} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:rounded-xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-base sm:text-lg">
            {viewTemplate.name}
          </DialogTitle>
          <DialogDescription>تفاصيل قالب Meta API</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">
                الحالة
              </p>
              <Badge
                variant="outline"
                className={`mt-1 ${statusBadge[viewTemplate.status] || ""}`}
              >
                <StatusIcon className="ms-1 size-3.5 inline" />
                {viewTemplate.status}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                التصنيف
              </p>
              <p className="mt-1 font-medium text-xs sm:text-sm">
                {viewTemplate.category}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                القسم
              </p>
              <Badge
                variant="outline"
                className={`mt-1 text-[11px] ${sec.badge}`}
                title={sec.description}
              >
                {sec.label}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                اللغة
              </p>
              <p className="mt-1 font-medium font-mono text-xs sm:text-sm">
                {viewTemplate.language}
              </p>
            </div>
          </div>

          {viewTemplate.rejected_reason && (
            <div>
              <p className="text-xs text-muted-foreground">
                سبب الرفض
              </p>
              <p className="mt-1 font-medium text-xs text-destructive">
                {viewTemplate.rejected_reason}
              </p>
            </div>
          )}

          <div className="rounded-xl border border-border/70 bg-[var(--color-muted)] p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              معاينة المكونات
            </p>
            {viewTemplate.components?.map((c, i) => {
              if (c.type === "HEADER") {
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      {(c.format || "TEXT") === "TEXT"
                        ? "رأس الرسالة"
                        : `رأس (${c.format})`}
                    </p>
                    <p className="rounded-xl bg-popover px-3 py-2 text-sm font-medium">
                      {c.text || "(بدون نص)"}
                    </p>
                  </div>
                );
              }
              if (c.type === "BODY") {
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      محتوى الرسالة
                    </p>
                    <p className="rounded-xl bg-popover px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed">
                      {c.text || "(بدون نص)"}
                    </p>
                  </div>
                );
              }
              if (c.type === "FOOTER") {
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      تذييل
                    </p>
                    <p className="rounded-xl bg-popover px-3 py-2 text-xs text-muted-foreground">
                      {c.text || "(بدون نص)"}
                    </p>
                  </div>
                );
              }
              if (c.type === "BUTTONS") {
                return (
                  <div key={i} className="space-y-1">
                    <p className="text-[10px] font-medium text-muted-foreground">
                      أزرار
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.buttons?.map((b, bi) => (
                        <span
                          key={bi}
                          className="rounded-full border border-border/70 bg-popover px-3 py-1 text-xs"
                        >
                          {b.text}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              }
              return null;
            })}
            {(!viewTemplate.components || viewTemplate.components.length === 0) && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                لا توجد تفاصيل للمكونات
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="rounded-full"
          >
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
