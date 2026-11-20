import React from "react";
import { Clock, AlertCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../../../components/ui/dialog";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { cn } from "../../../lib/utils";
import {
  calculateWorkHours,
  SHIFT_TEMPLATES,
} from "../../../utils/shiftHelpers";
import type { ShiftFormData } from "./types";

interface ShiftFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  formData: ShiftFormData;
  formErrors: Record<string, string>;
  onFormDataChange: (data: ShiftFormData) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

export const ShiftFormDialog: React.FC<ShiftFormDialogProps> = ({
  open,
  onOpenChange,
  isEditing,
  formData,
  formErrors,
  onFormDataChange,
  onSubmit,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl bg-white dark:bg-muted rounded-xl"
        dir="rtl"
      >
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-2xl font-black text-foreground dark:text-muted-foreground">
            {isEditing ? "تعديل المناوبة" : "مناوبة جديدة"}
          </DialogTitle>
          <p className="text-sm text-muted-foreground font-medium">
            قم بضبط تفاصيل وقت العمل وفترة الراحة وألوان التمييز
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-2 space-y-6 custom-scrollbar">
          {/* Quick Templates - Only show when creating new shift */}
          {!isEditing && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-4 w-1 bg-primary rounded-full" />
                <Label className="text-sm font-black text-foreground">
                  قوالب سريعة
                </Label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SHIFT_TEMPLATES.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => {
                      onFormDataChange({
                        name: template.name,
                        startTime: template.startTime,
                        endTime: template.endTime,
                        breakDuration: template.breakDuration,
                        color: template.color,
                        sortOrder: 0,
                      });
                    }}
                    className="group flex items-start gap-4 p-4 border border-border dark:border-border rounded-xl hover:bg-white dark:hover:bg-muted hover:shadow-xl hover:shadow-primary dark:hover:shadow-none transition-all duration-300 text-right bg-muted dark:bg-white/5 relative overflow-hidden"
                  >
                    <div className="w-12 h-12 bg-card rounded-xl shadow-sm flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300 relative z-10 shrink-0">
                      {template.icon}
                    </div>
                    <div className="flex-1 min-w-0 relative z-10">
                      <p className="font-black text-foreground dark:text-muted-foreground text-sm group-hover:text-primary dark:group-hover:text-primary transition-colors uppercase tracking-tight truncate">
                        {template.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground/80 font-bold mt-0.5 line-clamp-1">
                        {template.description}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge
                          variant="outline"
                          className="text-[9px] font-black border-none bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary px-1.5 py-0 font-mono tabular-nums"
                        >
                          {template.startTime} - {template.endTime}
                        </Badge>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border dark:border-border" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white dark:bg-muted px-4 text-[10px] font-black uppercase text-muted-foreground/80 rounded-full">
                    أو إدخال بيانات مخصصة
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                اسم المناوبة
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  onFormDataChange({ ...formData, name: e.target.value })
                }
                placeholder="مثال: الدوام الصباحي (A)"
                className={cn(
                  "rounded-xl border-border dark:border-border dark:bg-muted focus:ring-primary h-11 font-medium shadow-sm transition-all",
                  formErrors["name"]
                    ? "border-red-500 ring-1 ring-destructive/20"
                    : "",
                )}
              />
              {formErrors["name"] && (
                <p className="text-xs text-destructive font-bold mt-1 flex items-center gap-1">
                  <span>⚠</span> {formErrors["name"]}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                  وقت البدء
                </Label>
                <div className="relative">
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        startTime: e.target.value,
                      })
                    }
                    className="pe-10 rounded-xl border-border dark:border-border dark:bg-muted focus:ring-primary font-black h-11 dark:text-white font-mono tabular-nums"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                  وقت الانتهاء
                </Label>
                <div className="relative">
                  <Clock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) =>
                      onFormDataChange({
                        ...formData,
                        endTime: e.target.value,
                      })
                    }
                    className={cn(
                      "pe-10 rounded-xl border-border dark:border-border dark:bg-muted focus:ring-primary font-black h-11 dark:text-white font-mono tabular-nums",
                      formErrors["endTime"] ? "border-red-500" : "",
                    )}
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                  مدة الراحة (دقائق)
                </Label>
                <Input
                  type="number"
                  value={formData.breakDuration}
                  onChange={(e) =>
                    onFormDataChange({
                      ...formData,
                      breakDuration: parseInt(e.target.value) || 0,
                    })
                  }
                  className={cn(
                    "rounded-xl border-border dark:border-border dark:bg-muted focus:ring-primary h-11 font-black dark:text-white font-mono tabular-nums",
                    formErrors["breakDuration"] ? "border-red-500" : "",
                  )}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                  لون التمييز
                </Label>
                <div className="flex items-center gap-3 p-1 border border-border dark:border-border rounded-xl bg-muted dark:bg-white/5 h-11 group">
                  <Input
                    type="color"
                    value={formData.color}
                    onChange={(e) =>
                      onFormDataChange({ ...formData, color: e.target.value })
                    }
                    className="w-12 h-full p-0.5 border-none bg-transparent cursor-pointer rounded-lg overflow-hidden"
                  />
                  <span className="text-xs font-black text-muted-foreground font-mono tracking-tighter uppercase">
                    {formData.color}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground me-1">
                ترتيب العرض (اختياري)
              </Label>
              <Input
                type="number"
                value={formData.sortOrder}
                onChange={(e) =>
                  onFormDataChange({
                    ...formData,
                    sortOrder: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="0"
                className="rounded-xl border-border dark:border-border dark:bg-muted focus:ring-primary h-11 font-medium shadow-sm transition-all font-mono tabular-nums"
              />
              <p className="text-[9px] text-muted-foreground me-1">
                أرقام أصغر تظهر أولاً
              </p>
            </div>
          </div>

          {/* Enhanced Live Preview */}
          <div className="rounded-xl border border-border/70 bg-muted/30 p-4 relative overflow-hidden">
            <div className="flex items-center justify-between relative z-10">
              <div className="space-y-0.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  ساعات العمل الصافية
                </p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-foreground">
                    {calculateWorkHours(
                      formData.startTime,
                      formData.endTime,
                      formData.breakDuration,
                    )}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    ساعة / يوم
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center p-2 text-primary">
                <Clock className="w-full h-full" />
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-card border-border/70 text-foreground rounded-md text-[11px] px-2 py-0.5 font-mono tabular-nums">
                  {formData.startTime}
                </Badge>
                <div className="h-0.5 w-2.5 bg-border rounded-full" />
                <Badge variant="outline" className="bg-card border-border/70 text-foreground rounded-md text-[11px] px-2 py-0.5 font-mono tabular-nums">
                  {formData.endTime}
                </Badge>
              </div>
              <p className="text-[11px] font-mono text-muted-foreground">
                احتساب تلقائي
              </p>
            </div>
          </div>

          {formErrors["time"] && (
            <div className="p-3 bg-destructive/10 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-xl">
              <p className="text-xs text-destructive dark:text-destructive font-black flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formErrors["time"]}</span>
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="p-5 pt-3 bg-muted dark:bg-black/20 flex flex-row items-center justify-between border-t border-border dark:border-border">
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="font-bold text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted rounded-xl"
          >
            إلغاء
          </Button>
          <Button
            type="button"
            onClick={onSubmit}
            className="bg-blue-600 hover:bg-primary text-white font-black px-8 h-11 rounded-xl shadow-lg shadow-primary dark:shadow-none transition-all hover:scale-105 active:scale-95 border-none"
          >
            {isEditing ? "حفظ التحديثات" : "إنشاء المناوبة الآن"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
