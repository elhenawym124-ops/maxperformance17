import React, { useState } from "react";
import { RefreshCw, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SelectableTemplate } from "./types";

interface JourneyTestSendModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templates: SelectableTemplate[];
  onSendTest: (payload: {
    recipientPhone: string;
    templateId?: string;
    eventType?: string;
    content?: string;
  }) => Promise<{ success: boolean; message?: string }>;
}

export const JourneyTestSendModal: React.FC<JourneyTestSendModalProps> = ({
  open,
  onOpenChange,
  templates,
  onSendTest,
}) => {
  const [phone, setPhone] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);

  const selectedTpl = templates.find((t) => t.id === selectedTemplateId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;
    try {
      setSending(true);
      setFeedback(null);
      const res = await onSendTest({
        recipientPhone: phone.trim(),
        templateId: selectedTpl?.id,
        eventType: selectedTpl?.eventType,
        content: selectedTpl?.content,
      });
      setFeedback({
        ok: res.success,
        text:
          res.message ||
          (res.success
            ? "تم إرسال الرسالة التجريبية بنجاح"
            : "تعذر الإرسال التجريبي"),
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-2rem)] rounded-xl border-border/70 bg-card sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>تجربة إرسال حي عبر البوابة الموحدة</DialogTitle>
          <DialogDescription>
            اختبر إرسال أي قالب مربوط على رقمك للتأكد من مطابقة Meta والأزرار.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="journey-test-phone">رقم الموبايل (واتساب)</Label>
            <Input
              id="journey-test-phone"
              type="tel"
              dir="ltr"
              placeholder="2010xxxxxxxx"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="font-mono tabular-nums"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="journey-test-tpl">القالب المراد تجربته</Label>
            <select
              id="journey-test-tpl"
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              className="h-10 w-full rounded-lg border border-border/70 bg-background px-3 text-sm text-foreground"
            >
              <option value="">اختر قالباً من القائمة...</option>
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  [{tpl.health}] {tpl.name} ({tpl.eventType})
                </option>
              ))}
            </select>
          </div>

          {selectedTpl?.hasButtons && (
            <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-2.5 text-xs text-amber-600 dark:text-amber-400">
              تنبيه: هذا القالب يحتوي على أزرار تفاعلية في Meta. تأكد من ملاءمتها قبل الإرسال للعملاء.
            </div>
          )}

          {feedback && (
            <div
              className={
                feedback.ok
                  ? "rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-2.5 text-xs text-emerald-600 dark:text-emerald-400"
                  : "rounded-lg border border-destructive/20 bg-destructive/10 p-2.5 text-xs text-destructive"
              }
            >
              {feedback.text}
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              إغلاق
            </Button>
            <Button
              type="submit"
              disabled={!phone.trim() || sending}
              className="active:scale-[0.97] transition-transform duration-150"
            >
              {sending ? (
                <RefreshCw className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              إرسال تجربة
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
