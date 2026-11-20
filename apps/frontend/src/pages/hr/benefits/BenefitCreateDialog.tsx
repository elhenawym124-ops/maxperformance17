import React from "react";
import { Gift, Pencil, Filter, DollarSign, HeartPulse, Save } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BenefitFormData } from "./types";

interface BenefitCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingId: string | null;
  formData: BenefitFormData;
  setFormData: React.Dispatch<React.SetStateAction<BenefitFormData>>;
  submitting: boolean;
  onSubmit: () => void;
  onCancel: () => void;
}

export const BenefitCreateDialog: React.FC<BenefitCreateDialogProps> = ({
  open,
  onOpenChange,
  editingId,
  formData,
  setFormData,
  submitting,
  onSubmit,
  onCancel,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl bg-white/95 dark:bg-muted backdrop-blur-md"
        dir="rtl"
      >
        <div className="p-8 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border-b border-border dark:border-border">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-card rounded-xl flex items-center justify-center mb-6 shadow-xl shadow-primary/10">
              <Gift className="h-10 w-10 text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black text-foreground">
              {editingId ? "تعديل ميزة قائمة" : "إضافة ميزة جديدة"}
            </DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground max-w-sm">
              {editingId
                ? "قم بتحديث بيانات الميزة الحالية لتنسجم مع سياسات الشركة المتغيرة."
                : "ابدأ بتعريف ميزة جديدة تساهم في رفع مستوى رفاهية موظفيك."}
            </DialogDescription>
          </div>
        </div>

        <ScrollArea className="max-h-[60vh]">
          <div className="p-8 space-y-8">
            <div className="space-y-3 px-1">
              <Label className="text-sm font-black text-foreground flex items-center gap-2">
                <Pencil className="h-4 w-4 text-primary" />
                اسم الميزة الفريد
              </Label>
              <Input
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="مثال: تأمين طبي VIP، بدل سكن كبار المدراء..."
                className="h-14 rounded-xl bg-card border-border dark:border-border shadow-sm focus:ring-2 focus:ring-primary/20 transition-all text-lg font-bold"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 px-1">
              <div className="space-y-3">
                <Label className="text-sm font-black text-foreground flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" />
                  نوع الميزة
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(val) =>
                    setFormData({ ...formData, type: val })
                  }
                >
                  <SelectTrigger className="h-14 rounded-xl bg-card border-border dark:border-border shadow-sm font-bold">
                    <SelectValue placeholder="اختر النوع" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem
                      value="health_insurance"
                      className="rounded-xl m-1"
                    >
                      تأمين صحي
                    </SelectItem>
                    <SelectItem
                      value="life_insurance"
                      className="rounded-xl m-1"
                    >
                      تأمين على الحياة
                    </SelectItem>
                    <SelectItem value="retirement" className="rounded-xl m-1">
                      تقاعد ومساهمات
                    </SelectItem>
                    <SelectItem
                      value="transportation"
                      className="rounded-xl m-1"
                    >
                      بدل انتقال
                    </SelectItem>
                    <SelectItem value="housing" className="rounded-xl m-1">
                      بدل سكن
                    </SelectItem>
                    <SelectItem value="other" className="rounded-xl m-1">
                      أخرى
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-black text-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  التكلفة الشهرية
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-sm">
                    EGP
                  </span>
                  <Input
                    type="number"
                    value={formData.cost}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cost: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-14 rounded-xl bg-card border-border dark:border-border shadow-sm ps-16 text-lg font-black font-mono tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 px-1">
              <Label className="text-sm font-black text-foreground flex items-center gap-2">
                <HeartPulse className="h-4 w-4 text-primary" />
                وصف الميزة وشروط الاستحقاق
              </Label>
              <Textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="اشرح هنا تفاصيل الميزة، من يستحقها، وكيفية تفعيلها..."
                className="min-h-[120px] rounded-xl bg-card border-border dark:border-border shadow-sm p-4 text-foreground dark:text-muted-foreground resize-none leading-relaxed"
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="p-8 pt-4 border-t border-border dark:border-border bg-muted dark:bg-black/20 gap-3">
          <Button
            onClick={onSubmit}
            disabled={submitting}
            className="flex-1 h-14 rounded-xl font-black text-lg shadow-xl shadow-primary/20 hover:shadow-primary/30 transition-all active:scale-95"
          >
            {submitting ? (
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 border-3 border-white/30 border-t-white animate-spin rounded-full" />
                جاري الحفظ...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                {editingId ? "حفظ التعديلات" : "تأكيد إضافة الميزة"}
              </div>
            )}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="h-14 px-8 rounded-xl text-muted-foreground font-bold hover:bg-muted dark:hover:bg-muted"
          >
            إلغاء
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
