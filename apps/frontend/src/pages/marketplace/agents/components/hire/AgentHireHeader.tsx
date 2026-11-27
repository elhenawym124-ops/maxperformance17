import React from "react";
import { X } from "lucide-react";
import { AgentListing, getArabicInitials } from "../../agentMarketplaceData";

interface AgentHireHeaderProps {
  agent: AgentListing;
  onClose: () => void;
}

export const AgentHireHeader: React.FC<AgentHireHeaderProps> = ({
  agent,
  onClose,
}) => {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/70 pb-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary font-bold text-sm">
          {getArabicInitials(agent.name)}
        </div>
        <div className="min-w-0">
          <h2 id="hire-modal-title" className="text-base font-bold text-foreground truncate">
            توظيف {agent.name}
          </h2>
          <p className="text-xs text-muted-foreground line-clamp-1">{agent.position}</p>
        </div>
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="إغلاق النافذة"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg border border-border/70 text-muted-foreground hover:bg-muted hover:text-foreground active:scale-[0.97] transition-all"
      >
        <X className="size-4 stroke-[1.5]" />
      </button>
    </div>
  );
};
