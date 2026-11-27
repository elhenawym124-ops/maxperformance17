import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Save } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Session } from "../types/whatsAppSettingsTypes";
import {
  providerLabels,
  statusBadgeClasses,
} from "../types/whatsAppSettingsTypes";
import {
  getStatusText,
  SettingsToggle,
} from "../utils/whatsAppSettingsUtils";
import { EditSessionMetaSection } from "./edit-session/EditSessionMetaSection";

interface WhatsAppEditSessionDialogProps {
  editingSession: Session | null;
  setEditingSession: React.Dispatch<React.SetStateAction<Session | null>>;
  saving: boolean;
  onUpdateSession: () => void;
  onClose: () => void;
  getMetaWebhookUrl: () => string;
}

export const WhatsAppEditSessionDialog: React.FC<
  WhatsAppEditSessionDialogProps
> = ({
  editingSession,
  setEditingSession,
  saving,
  onUpdateSession,
  onClose,
  getMetaWebhookUrl,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={!!editingSession}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="max-w-[calc(100%-1.5rem)] rounded-xl border-border/70 bg-[var(--app-panel-bg)] p-0 sm:max-w-3xl">
        <DialogHeader className="border-b border-[color:color-mix(in_srgb,var(--color-border)_72%,transparent)] px-6 pt-6">
          <DialogTitle>{t("whatsappSettings.dialogs.editSession")}</DialogTitle>
          <DialogDescription>{editingSession?.name}</DialogDescription>
        </DialogHeader>

        {editingSession ? (
          <div className="max-h-[70vh] space-y-4 overflow-y-auto px-6 pb-6">
            <div className="space-y-2">
              <Label htmlFor="edit-session-name">
                {t("whatsappSettings.dialogs.sessionName")}
              </Label>
              <Input
                id="edit-session-name"
                value={editingSession.name}
                onChange={(event) =>
                  setEditingSession((previous) =>
                    previous
                      ? { ...previous, name: event.target.value }
                      : previous,
                  )
                }
                className="h-11 bg-[color:var(--color-card)]"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="rounded-full border-border/70 bg-[color:var(--color-card)]"
              >
                {providerLabels[editingSession.provider || "BAILEYS"]}
              </Badge>
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full",
                  statusBadgeClasses[
                    (
                      editingSession.liveStatus ||
                      editingSession.status ||
                      "DISCONNECTED"
                    ).toUpperCase() as keyof typeof statusBadgeClasses
                  ] || statusBadgeClasses["DISCONNECTED"],
                )}
              >
                {getStatusText(
                  (
                    editingSession.liveStatus ||
                    editingSession.status ||
                    "DISCONNECTED"
                  ).toUpperCase(),
                  t,
                )}
              </Badge>
            </div>

            {editingSession.provider === "META_CLOUD" ? (
              <EditSessionMetaSection
                editingSession={editingSession}
                setEditingSession={setEditingSession}
                getMetaWebhookUrl={getMetaWebhookUrl}
              />
            ) : null}

            <div className="grid gap-4 xl:grid-cols-2">
              <SettingsToggle
                label={t("whatsappSettings.dialogs.autoReply")}
                checked={editingSession.autoReply}
                onCheckedChange={(checked) =>
                  setEditingSession((previous) =>
                    previous ? { ...previous, autoReply: checked } : previous,
                  )
                }
              />
              <SettingsToggle
                label={t("whatsappSettings.dialogs.makeDefault")}
                checked={editingSession.isDefault}
                onCheckedChange={(checked) =>
                  setEditingSession((previous) =>
                    previous ? { ...previous, isDefault: checked } : previous,
                  )
                }
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-4">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  التحكم في صلاحيات القناة (الاستقبال والإرسال والإشعارات)
                </p>
                <p className="text-xs text-muted-foreground">
                  يمكنك إيقاف الاستقبال أو الإرسال أو الإشعارات التلقائية على هذه القناة مع بقاء الاتصال نشطاً.
                </p>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <SettingsToggle
                  label="استقبال الرسائل الواردة"
                  description="عند الإيقاف يتم تجاهل الرسائل الواردة وعدم الرد عليها."
                  checked={editingSession.inboundEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setEditingSession((previous) =>
                      previous ? { ...previous, inboundEnabled: checked } : previous,
                    )
                  }
                />
                <SettingsToggle
                  label="الإرسال والرد والحملات"
                  description="عند الإيقاف يُمنع أي إرسال يدوي أو حملة من هذا الرقم."
                  checked={editingSession.outboundEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setEditingSession((previous) =>
                      previous ? { ...previous, outboundEnabled: checked } : previous,
                    )
                  }
                />
                <SettingsToggle
                  label="إرسال الإشعارات التلقائية"
                  description="عند الإيقاف يُستبعد هذا الرقم من إشعارات الطلبات والموظفين حتى كبديل."
                  checked={editingSession.notificationsEnabled ?? true}
                  onCheckedChange={(checked) =>
                    setEditingSession((previous) =>
                      previous ? { ...previous, notificationsEnabled: checked } : previous,
                    )
                  }
                />
              </div>
              {editingSession.outboundEnabled === false && (
                <p className="text-xs font-medium text-warning">
                  ملاحظة: إيقاف الإرسال يوقف أيضاً إرسال الإشعارات التلقائية من هذه القناة تلقائياً.
                </p>
              )}
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="welcome-message">
                  {t("whatsappSettings.dialogs.welcomeMessage")}
                </Label>
                <Textarea
                  id="welcome-message"
                  value={editingSession.welcomeMessage || ""}
                  onChange={(event) =>
                    setEditingSession((previous) =>
                      previous
                        ? { ...previous, welcomeMessage: event.target.value }
                        : previous,
                    )
                  }
                  className="min-h-[8rem] bg-[color:var(--color-card)]"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="away-message">
                  {t("whatsappSettings.dialogs.awayMessage")}
                </Label>
                <Textarea
                  id="away-message"
                  value={editingSession.awayMessage || ""}
                  onChange={(event) =>
                    setEditingSession((previous) =>
                      previous
                        ? { ...previous, awayMessage: event.target.value }
                        : previous,
                    )
                  }
                  className="min-h-[8rem] bg-[color:var(--color-card)]"
                />
              </div>
            </div>

            {editingSession.provider !== "META_CLOUD" && (
              <div className="space-y-3 rounded-xl border border-warning/30 bg-warning/5 p-4">
                <SettingsToggle
                  label="درع المكالمات (Call Shield) — رفض المكالمات الواردة تلقائياً"
                  checked={editingSession.callShieldEnabled ?? false}
                  onCheckedChange={(checked) =>
                    setEditingSession((previous) =>
                      previous
                        ? { ...previous, callShieldEnabled: checked }
                        : previous,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  عند التفعيل، سيتم رفض أي مكالمة صوتية أو فيديو واردة تلقائياً على رقم واتساب وإرسال رد نصي فوري للمتصل.
                </p>
                <div className="space-y-1.5 pt-1">
                  <Label
                    htmlFor="call-shield-message"
                    className="text-xs font-medium"
                  >
                    رسالة الرد التلقائي عند رفض المكالمة
                  </Label>
                  <Textarea
                    id="call-shield-message"
                    placeholder="عذراً، هذا الرقم مخصص للمراسلات النصية وخدمة العملاء فقط ولا يستقبل مكالمات صوتية. كيف يمكننا مساعدتك؟"
                    value={editingSession.callShieldMessage || ""}
                    onChange={(event) =>
                      setEditingSession((previous) =>
                        previous
                          ? {
                              ...previous,
                              callShieldMessage: event.target.value,
                            }
                          : previous,
                      )
                    }
                    className="min-h-[5rem] text-xs bg-[color:var(--color-card)]"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2 rounded-xl border border-border/70 bg-[color:var(--color-card)] px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">
                    Load balancing weight
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Higher numbers route more work to this session.
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className="rounded-full border-border/70 bg-muted font-mono tabular-nums"
                >
                  {editingSession.loadBalanceWeight || 1}
                </Badge>
              </div>
              <Slider
                className="mt-4"
                min={1}
                max={10}
                step={1}
                value={[editingSession.loadBalanceWeight || 1]}
                onValueChange={([value]) =>
                  setEditingSession((previous) =>
                    previous
                      ? { ...previous, loadBalanceWeight: value }
                      : previous,
                  )
                }
              />
            </div>
          </div>
        ) : null}

        <DialogFooter className="px-6">
          <Button
            variant="outline"
            className="rounded-full border-border/70 bg-[color:var(--color-card)] hover:bg-[color:var(--color-card)]"
            onClick={onClose}
          >
            {t("whatsappSettings.dialogs.cancel")}
          </Button>
          <Button
            className="rounded-full bg-[color:var(--business-success)] px-5 text-white hover:brightness-90"
            onClick={onUpdateSession}
            disabled={saving}
          >
            {saving ? (
              <RefreshCw className="size-4 animate-spin" />
            ) : (
              <Save className="size-4" />
            )}
            {t("whatsappSettings.dialogs.save")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
