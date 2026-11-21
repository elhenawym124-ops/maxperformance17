import React from "react";
import { useTranslation } from "react-i18next";
import { Copy, ExternalLink, Globe, Info } from "lucide-react";
import { toast } from "sonner";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Session } from "../types/whatsAppSettingsTypes";

interface WhatsAppWebhookDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  webhookDetailsSession: Session | null;
  newMetaWebhookVerifyToken?: string;
  platformVerifyToken?: string;
  getMetaWebhookUrl: () => string;
  onClose: () => void;
}

export const WhatsAppWebhookDialog: React.FC<WhatsAppWebhookDialogProps> = ({
  open,
  onOpenChange,
  webhookDetailsSession,
  newMetaWebhookVerifyToken,
  platformVerifyToken,
  getMetaWebhookUrl,
  onClose,
}) => {
  const activeVerifyToken =
    webhookDetailsSession?.metaWebhookVerifyToken?.trim() ||
    newMetaWebhookVerifyToken?.trim() ||
    platformVerifyToken?.trim() ||
    "maxp_verify_token";
  const { t } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-xl border-border/70 bg-[var(--app-panel-bg)] p-6 sm:max-w-xl">
        <DialogHeader className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info/10 text-info dark:text-info">
              <Globe className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold">
                بيانات رد الاتصال (Meta Webhook)
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                بيانات الربط مع بوابة Meta Developers لاستقبال رسائل الواتساب
                الواردة وحالات التسليم
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Callback URL */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-medium text-foreground">
                رابط الويب هوك (Callback URL)
              </Label>
              <span className="text-[10px] text-info dark:text-info font-medium">
                انسخ هذا الرابط إلى Meta
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={getMetaWebhookUrl()}
                className="h-10 bg-[color:var(--color-card)] font-mono text-xs select-all text-foreground"
                dir="ltr"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3.5 shrink-0 gap-1.5 rounded-xl border-border/70"
                onClick={() => {
                  navigator.clipboard.writeText(getMetaWebhookUrl());
                  toast.success("تم نسخ رابط الويب هوك بنجاح");
                }}
              >
                <Copy className="size-3.5" />
                <span className="text-xs">نسخ</span>
              </Button>
            </div>
          </div>

          {/* Verify Token */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <Label className="font-medium text-foreground">
                رمز التحقق (Verify Token)
              </Label>
              <span className="text-[10px] text-muted-foreground">
                {webhookDetailsSession
                  ? `جلسة: ${webhookDetailsSession.name}`
                  : "رمز التحقق للربط"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={activeVerifyToken}
                className="h-10 bg-[color:var(--color-card)] font-mono text-xs select-all text-foreground"
                dir="ltr"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-10 px-3.5 shrink-0 gap-1.5 rounded-xl border-border/70"
                onClick={() => {
                  navigator.clipboard.writeText(activeVerifyToken);
                  toast.success("تم نسخ رمز التحقق بنجاح");
                }}
              >
                <Copy className="size-3.5" />
                <span className="text-xs">نسخ</span>
              </Button>
            </div>
            <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1 pt-0.5">
              <span>رمز بديل معتمد (64 محرف):</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText("61d94df61ed00ab77e2a7e2c15458d7ce9ec8abc4520a6a83f0b483829617314");
                  toast.success("تم نسخ الرمز البديل بنجاح");
                }}
                className="font-mono text-info dark:text-info hover:underline inline-flex items-center gap-1 cursor-pointer"
                title="اضغط لنسخ الرمز البديل"
              >
                <code>61d94df...7314</code>
                <Copy className="size-2.5" />
              </button>
            </div>
          </div>

          {/* Subscribed Fields */}
          <div className="rounded-xl border border-border/70 bg-[color:var(--color-card)] p-3.5 space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-medium text-foreground">
                الحقول المطلوبة (Webhook fields):
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-success/10 border-success text-success dark:border-success/40 dark:text-success"
                >
                  messages
                </Badge>
                <Badge
                  variant="outline"
                  className="font-mono text-xs bg-info/10 border-info text-info dark:border-info/40 dark:text-info"
                >
                  message_template_status_update
                </Badge>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              في لوحة تحكم Meta، اضغط <strong>Manage</strong> في حقل Webhook fields
              واشترك في <strong>messages</strong> وأيضاً <strong>message_template_status_update</strong> لتصلك الرسائل وتحديثات القراءة
              والتسليم وحالات القوالب مباشرة إلى لوحة التحكم.
            </p>
          </div>

          {/* Step Guide */}
          <div className="rounded-xl border border-info/20 bg-info/5 p-3.5 text-xs text-muted-foreground space-y-2">
            <p className="font-semibold text-foreground flex items-center gap-1.5">
              <Info className="size-3.5 text-info" />
              خطوات التثبيت في بوابة Meta Developers:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-[11px] leading-relaxed">
              <li>
                سجّل الدخول إلى{" "}
                <a
                  href="https://developers.facebook.com/apps"
                  target="_blank"
                  rel="noreferrer"
                  className="text-sky-600 underline font-medium inline-flex items-center gap-0.5"
                >
                  Meta for Developers{" "}
                  <ExternalLink className="size-2.5 inline" />
                </a>{" "}
                ثم اختر تطبيقك.
              </li>
              <li>
                انتقل إلى <strong>WhatsApp</strong> &gt;{" "}
                <strong>Configuration</strong> من القائمة الجانبية.
              </li>
              <li>
                في قسم <strong>Webhook</strong> اضغط <strong>Edit</strong>، ثم
                الصق رابط الويب هوك ورمز التحقق أعلاه واضغط{" "}
                <strong>Verify and save</strong>.
              </li>
              <li>
                في جدول <strong>Webhook fields</strong> اضغط{" "}
                <strong>Manage</strong> وفعّل حقول{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">
                  messages
                </code>{" "}
                و{" "}
                <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-primary font-bold">
                  message_template_status_update
                </code>
                .
              </li>
            </ol>
          </div>

          {/* Direct Meta Link */}
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-full border-border/70 h-10 text-xs gap-2 font-medium bg-[color:var(--color-card)] hover:bg-muted"
            onClick={() =>
              window.open("https://developers.facebook.com/apps", "_blank")
            }
          >
            <ExternalLink className="size-3.5" />
            الانتقال إلى بوابة Meta for Developers
          </Button>
        </div>

        <DialogFooter>
          <Button
            type="button"
            className="rounded-full w-full sm:w-auto"
            onClick={onClose}
          >
            {t("whatsappSettings.dialogs.close")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
