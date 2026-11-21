import React from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, Edit, Plus, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppSurfaceCard } from "../../components/WhatsAppPageShell";
import type { QuickReply } from "../types/whatsAppSettingsTypes";

interface WhatsAppQuickRepliesTabProps {
  quickReplies: QuickReply[];
  onOpenCreate: () => void;
  onEdit: (reply: QuickReply) => void;
  onDelete: (reply: QuickReply) => void;
}

export const WhatsAppQuickRepliesTab: React.FC<WhatsAppQuickRepliesTabProps> = ({
  quickReplies,
  onOpenCreate,
  onEdit,
  onDelete,
}) => {
  const { t } = useTranslation();
  const ts = (key: string, opts?: Record<string, unknown>) =>
    (t(key, opts as any) as unknown) as string;

  return (
    <WhatsAppSurfaceCard
      title={ts("whatsappSettings.quickReplies")}
      action={
        <Button
          className="rounded-full bg-[color:var(--business-success)] px-4 text-white hover:brightness-90"
          onClick={onOpenCreate}
        >
          <Plus className="size-4" />
          {t("whatsappSettings.addQuickReply")}
        </Button>
      }
    >
      {quickReplies.length === 0 ? (
        <Alert className="rounded-xl border-border/70 bg-[color:var(--color-card)]">
          <AlertCircle className="size-4 text-[color:var(--color-warning)]" />
          <AlertTitle>{t("whatsappSettings.quickReplies")}</AlertTitle>
          <AlertDescription>{t("whatsappSettings.noQuickReplies")}</AlertDescription>
        </Alert>
      ) : (
        <div className="space-y-3">
          {quickReplies.map((reply) => (
            <div
              key={reply.id}
              className="rounded-xl border border-border/70 bg-[color:var(--color-card)] px-4 py-4 shadow-sm"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-foreground">
                      {reply.title}
                    </p>
                    {reply.shortcut ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border/70 bg-[color:var(--color-card)] font-mono"
                      >
                        {reply.shortcut}
                      </Badge>
                    ) : null}
                    <Badge
                      variant="outline"
                      className="rounded-full border-primary/70 bg-primary/10 text-primary dark:border-primary/40 dark:text-primary"
                    >
                      {String(t(`whatsappSettings.categories.${reply.category}`))}
                    </Badge>
                    {!reply.isActive ? (
                      <Badge
                        variant="outline"
                        className="rounded-full border-border bg-muted text-foreground dark:border-border dark:text-muted-foreground"
                      >
                        Inactive
                      </Badge>
                    ) : null}
                  </div>

                  <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                    {reply.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-[color:var(--color-card)] font-mono tabular-nums"
                  >
                    {t("whatsappSettings.usedTimes", { count: reply.usageCount })}
                  </Badge>
                  <Button
                    variant="outline"
                    className="rounded-full border-border/70 bg-[color:var(--color-card)] hover:bg-[color:var(--color-card)]"
                    onClick={() => onEdit(reply)}
                  >
                    <Edit className="size-4" />
                    {t("whatsappSettings.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full border-destructive/70 bg-destructive/10 text-destructive hover:bg-destructive/15 dark:border-destructive/40 dark:text-destructive"
                    onClick={() => onDelete(reply)}
                  >
                    <Trash2 className="size-4" />
                    {t("whatsappSettings.delete")}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </WhatsAppSurfaceCard>
  );
};
