import React from "react";
import { useTranslation } from "react-i18next";
import { RefreshCw, Trash2, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { tryApiFetch } from "./types";
import { type AgentProfileResponse } from "../ai-agent-sandbox/services/sandboxApi";

interface AgentArchivedCardProps {
  agentId: string;
  draftIcon: string;
  draftName: string;
  role: string;
  setProfile: React.Dispatch<React.SetStateAction<AgentProfileResponse | null>>;
  onRestoreSuccess: () => void;
  onOpenDeleteConfirm: () => void;
}

export const AgentArchivedCard: React.FC<AgentArchivedCardProps> = ({
  agentId,
  draftIcon,
  draftName,
  role,
  setProfile,
  onRestoreSuccess,
  onOpenDeleteConfirm,
}) => {
  const { t } = useTranslation();

  const handleRestore = async () => {
    const data = await tryApiFetch<{
      success: boolean;
      agent?: { status?: string };
    }>(`/agent/agents/${agentId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "ACTIVE" }),
    });
    if (data) {
      const nextStatus = data.agent?.status || "ACTIVE";
      setProfile((prev) =>
        prev ? { ...prev, agent: { ...prev.agent, status: nextStatus } } : prev,
      );
      toast.success(
        t(
          "agentProfiles.archived.restoreSuccess",
          "تمت استعادة الوكيل بنجاح.",
        ),
      );
      onRestoreSuccess();
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 p-6 bg-card border border-border/70 rounded-xl text-center space-y-5">
      <div className="size-12 rounded-xl bg-warning/10 border border-warning/25 text-warning flex items-center justify-center mx-auto">
        <Archive className="size-5 stroke-[1.5]" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-bold text-foreground">{draftName}</h3>
        <p className="text-xs text-muted-foreground">{role}</p>
        <p className="text-xs text-muted-foreground pt-2 leading-relaxed">
          {t(
            "agentProfiles.archived.desc",
            "هذا الوكيل مؤرشف حالياً. يمكنك استعادته للعمل، أو حذفه بشكل نهائي.",
          )}
        </p>
      </div>
      <div className="flex items-center justify-center gap-3 pt-2">
        <Button onClick={handleRestore} className="gap-1.5 h-8 text-xs">
          <RefreshCw className="size-3" />
          {t("agentProfiles.archived.restoreBtn", "استعادة الوكيل")}
        </Button>
        <Button
          variant="destructive"
          onClick={onOpenDeleteConfirm}
          className="gap-1.5 h-8 text-xs"
        >
          <Trash2 className="size-3" />
          {t("agentProfiles.archived.deleteBtn", "حذف نهائي")}
        </Button>
      </div>
    </div>
  );
};
