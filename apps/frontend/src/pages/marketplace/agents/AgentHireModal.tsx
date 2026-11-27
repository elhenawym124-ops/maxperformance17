import React from "react";
import { Users } from "lucide-react";
import { AgentListing } from "./agentMarketplaceData";
import { useAgentHireModal } from "./hooks/useAgentHireModal";
import { AgentHireHeader } from "./components/hire/AgentHireHeader";
import { AgentHirePricingGuard } from "./components/hire/AgentHirePricingGuard";
import { AgentHireFormFields } from "./components/hire/AgentHireFormFields";
import { AgentHireFooter } from "./components/hire/AgentHireFooter";

export interface AgentHireModalProps {
  agent: AgentListing | null;
  open: boolean;
  initialWalletBalance?: number | null;
  onClose: () => void;
  onHired: (agentSlug: string, agentName: string) => void;
}

export const AgentHireModal: React.FC<AgentHireModalProps> = ({
  agent,
  open,
  initialWalletBalance = null,
  onClose,
  onHired,
}) => {
  const {
    customName,
    setCustomName,
    department,
    setDepartment,
    safetyMode,
    setSafetyMode,
    loading,
    walletBalance,
    walletLoading,
    walletError,
    fetchWalletBalance,
    isPro,
    hasEnoughBalance,
    navigateToRecharge,
    handleConfirmHire,
  } = useAgentHireModal({ agent, open, initialWalletBalance, onClose, onHired });

  if (!open || !agent) return null;

  const isSquad = agent.kind === "squad";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="hire-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 backdrop-blur-sm p-4 text-start"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-lg rounded-xl border border-border bg-card text-card-foreground p-5 shadow-2xl space-y-4"
      >
        <AgentHireHeader agent={agent} onClose={onClose} />

        {isSquad && agent.squadMemberDetails && agent.squadMemberDetails.length > 0 && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs flex items-center gap-2 text-foreground">
            <Users className="size-4 text-primary shrink-0 stroke-[1.5]" />
            <span>
              سيتم تفعيل حزمة الفريق كاملة ({agent.squadMemberDetails.length} وكلاء مترابطين) دفعة واحدة.
            </span>
          </div>
        )}

        <AgentHirePricingGuard
          agent={agent}
          isPro={isPro}
          walletBalance={walletBalance}
          walletLoading={walletLoading}
          walletError={walletError}
          hasEnoughBalance={hasEnoughBalance}
          onRetryWallet={fetchWalletBalance}
          onNavigateToRecharge={navigateToRecharge}
        />

        <AgentHireFormFields
          customName={customName}
          department={department}
          safetyMode={safetyMode}
          onCustomNameChange={setCustomName}
          onDepartmentChange={setDepartment}
          onSafetyModeChange={setSafetyMode}
        />

        <AgentHireFooter
          loading={loading}
          isPro={isPro}
          isSquad={isSquad}
          walletLoading={walletLoading}
          walletError={walletError}
          hasEnoughBalance={hasEnoughBalance}
          onClose={onClose}
          onConfirmHire={handleConfirmHire}
        />
      </div>
    </div>
  );
};
