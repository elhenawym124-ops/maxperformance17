import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FlaskConical,
  ClipboardCheck,
  ArrowLeftRight,
  LayoutList,
  Sparkles,
  MessageSquare,
  Plus,
  Link2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import type { AgentConfig, ModelConfig } from "../types/sandbox.types";
import type { CentralKeyConfig } from "../types/sandbox.types";

interface HeaderBarProps {
  agent: AgentConfig;
  agents: AgentConfig[];
  model: string;
  keyId?: string | null;
  models: ModelConfig[];
  centralKeys?: CentralKeyConfig[];
  onAgentChange: (agentId: string) => void;
  onModelChange: (model: string, provider: string, keyId?: string | null) => void;
  onSessions?: () => void;
  activeSessionId?: string | null;
  activeSessionTitle?: string;
  onNewSession?: () => void;
  onCopySessionLink?: (sessionId?: string) => void;
  onEvaluate: () => void;
  onInspector?: () => void;
  onCompare?: () => void;
  onExport?: () => void;
  onAgentProfile?: () => void;
  isStreaming: boolean;
  isSuper?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  agent,
  agents,
  model,
  keyId,
  models,
  centralKeys = [],
  onAgentChange,
  onModelChange,
  onSessions,
  activeSessionId,
  activeSessionTitle,
  onNewSession,
  onCopySessionLink,
  onEvaluate,
  onInspector,
  onCompare,
  onExport,
  onAgentProfile,
  isStreaming,
  isSuper = false,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const optionValue = (m: ModelConfig) => `${m.provider}::${m.model}::${m.keyId || ""}`;
  const currentModel = models.find((m) => m.model === model && (!keyId || m.keyId === keyId))
    || models.find((m) => m.model === model);
  const selectedValue = currentModel ? optionValue(currentModel) : "";
  const visibleCentralKeys = centralKeys.length
    ? centralKeys
    : Object.values(models.reduce<Record<string, CentralKeyConfig>>((acc, m) => {
      if (m.keyId && m.keyName) {
        acc[m.keyId] = {
          id: m.keyId,
          name: m.keyName,
          provider: m.provider,
          keyType: "CENTRAL",
          scope: "central",
          isActive: m.keyIsActive !== false,
        };
      }
      return acc;
    }, {}));

  if (!agent || agents.length === 0) {
    return (
      <div className="px-3 sm:px-4 py-2 border-b border-border dark:border-border flex items-center gap-3 bg-white dark:bg-muted text-xs">
        <div className="flex items-center gap-1.5 font-bold text-foreground dark:text-muted-foreground">
          <FlaskConical className="size-4 text-primary" />
          <span>{isSuper ? "AI Agent Sandbox" : "المساعد الذكي"}</span>
        </div>
        <div className="h-4 w-px bg-muted dark:bg-muted" />
        <span className="text-slate-500">
          {agents.length === 0 ? "No agents available" : "Select an agent"}
        </span>
      </div>
    );
  }

  return (
    <div className="px-2.5 sm:px-4 py-2 border-b border-border dark:border-border flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between bg-white dark:bg-muted text-xs select-none">
      {/* Top Row on Mobile: Title + Active Session Trigger + Quick Actions */}
      <div className="flex items-center justify-between gap-2 min-w-0 w-full sm:w-auto">
        <div className="flex items-center gap-2 min-w-0">
          <FlaskConical className="size-4 text-primary flex-shrink-0" />
          <span className="font-bold text-foreground dark:text-muted-foreground truncate">
            {isSuper ? "AI Agent Sandbox" : agent.name}
          </span>
          {isStreaming && (
            <span className="relative flex h-2 w-2 ms-1 flex-shrink-0" title="جاري الرد...">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-success"></span>
            </span>
          )}
        </div>

        {/* Sessions Trigger Button & Conversation Link (Mobile & Compact View) */}
        <div className="flex items-center gap-1 shrink-0">
          {onSessions && (
            <Button
              size="sm"
              variant="outline"
              onClick={onSessions}
              className="h-7 text-xs font-semibold flex items-center gap-1 px-2.5 rounded-lg border-border dark:border-border text-foreground dark:text-muted-foreground bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted max-w-[150px] truncate cursor-pointer active:scale-95 shadow-2xs"
              title="عرض الجلسات السابقة"
            >
              <MessageSquare className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{activeSessionTitle || "الجلسات"}</span>
            </Button>
          )}

          {activeSessionId && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                if (onCopySessionLink) {
                  onCopySessionLink(activeSessionId);
                } else {
                  const origin = typeof window !== "undefined" && window.location.origin ? window.location.origin : "https://maxp.online";
                  const link = `${origin}/admin/ai-hub?tab=sandbox&sessionId=${encodeURIComponent(activeSessionId)}`;
                  navigator?.clipboard?.writeText?.(link);
                  toast.success("تم نسخ رابط المحادثة بنجاح");
                }
                setCopiedLink(true);
                setTimeout(() => setCopiedLink(false), 2000);
              }}
              className="h-7 text-xs font-semibold flex items-center gap-1 px-2 rounded-lg border-border dark:border-border text-foreground dark:text-muted-foreground bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted cursor-pointer active:scale-95 shadow-2xs shrink-0"
              title="نسخ رابط المحادثة"
              aria-label="نسخ رابط المحادثة"
            >
              {copiedLink ? (
                <>
                  <Check className="size-3.5 text-success" />
                  <span className="text-[11px] text-success dark:text-success font-bold">تم النسخ</span>
                </>
              ) : (
                <>
                  <Link2 className="size-3.5 text-primary" />
                  <span className="hidden sm:inline text-[11px]">نسخ رابط المحادثة</span>
                </>
              )}
            </Button>
          )}

          {onNewSession && (
            <Button
              size="icon"
              variant="ghost"
              onClick={onNewSession}
              className="size-7 rounded-lg text-primary hover:bg-primary/10 dark:hover:bg-primary/40 cursor-pointer active:scale-95"
              title="جلسة جديدة"
            >
              <Plus className="size-3.5" />
            </Button>
          )}
        </div>
      </div>

      {isSuper && <div className="h-4 w-px bg-muted dark:bg-muted hidden sm:block" />}

      {/* Selectors Row: Agent & Model */}
      <div className="flex items-center gap-2 min-w-0 w-full sm:w-auto">
        {/* Agent Dropdown */}
        <div className="flex-1 sm:flex-initial min-w-0">
          <select
            value={agent.id}
            onChange={(e) => onAgentChange(e.target.value)}
            className="w-full sm:w-auto sm:max-w-[180px] h-8 rounded-lg border border-border dark:border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate cursor-pointer"
          >
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name} ({a.role})
              </option>
            ))}
          </select>
        </div>

        {/* Model Dropdown */}
        {models.length > 0 && (
          <div className="flex-1 sm:flex-initial min-w-0">
            <select
              value={selectedValue}
              onChange={(e) => {
                const selected = models.find((m) => optionValue(m) === e.target.value);
                if (selected) onModelChange(selected.model, selected.provider, selected.keyId || null);
              }}
              className="w-full sm:w-auto sm:max-w-[200px] h-8 rounded-lg border border-border dark:border-border bg-background px-2.5 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary font-medium truncate cursor-pointer"
            >
              {models.map((m) => (
                <option
                  key={optionValue(m)}
                  value={optionValue(m)}
                  disabled={m.isSelectable === false || m.keyIsActive === false}
                >
                  {m.label.replace(/🤖/g, "").trim()} ({m.provider}){m.keyName ? ` · ${m.keyName}${m.keyIsActive === false ? " (Inactive)" : ""}` : ""}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {isSuper && currentModel?.keyName && (
        <div className="hidden sm:block text-[10px] text-muted-foreground ps-1">
          <span className="font-semibold block text-[9px] uppercase tracking-wider text-muted-foreground">Central Key</span>
          <span className="text-slate-700 dark:text-muted-foreground font-medium">{currentModel.keyName}</span>
        </div>
      )}

      {isSuper && visibleCentralKeys.length > 0 && (
        <div className="hidden sm:flex items-center gap-1.5" data-testid="central-keys-list">
          <span className="text-[10px] text-muted-foreground font-medium">Central Keys ({visibleCentralKeys.length}):</span>
          {visibleCentralKeys.map((key) => (
            <span
              key={key.id}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium border border-border dark:border-border text-foreground dark:text-muted-foreground bg-muted dark:bg-muted"
            >
              <span className={`w-1.5 h-1.5 rounded-full ${key.isActive ? "bg-emerald-500" : "bg-amber-500"}`} />
              <span>{key.name}</span>
              <span className="text-[9px] text-muted-foreground font-normal">[{key.isActive ? "Active" : "Inactive"}]</span>
            </span>
          ))}
        </div>
      )}

      {isSuper && <div className="flex-1" />}

      {isSuper && (
      <div className="flex items-center gap-1.5">
        <Button
          size="sm"
          variant="outline"
          onClick={onEvaluate}
          disabled={isStreaming}
          className="h-8 text-xs font-semibold flex items-center gap-1.5 px-2 sm:px-3 border-border dark:border-border"
        >
          <ClipboardCheck className="size-3.5 text-primary" />
          <span className="hidden sm:inline">Evaluate</span>
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={onInspector}
          className="h-8 text-xs font-semibold flex items-center gap-1.5 px-2 sm:px-3 border-border dark:border-border cursor-pointer"
        >
          <LayoutList className="size-3.5 text-primary" />
          <span>Inspector</span>
        </Button>

        {onSessions && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onSessions}
            className="size-8 hover:bg-muted dark:hover:bg-muted"
            title="Toggle sessions sidebar"
          >
            <LayoutList className="size-4 text-foreground" />
          </Button>
        )}

        {onAgentProfile && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onAgentProfile}
            className="size-8 hover:bg-primary/10 dark:hover:bg-primary/30"
            title="Open agent profile"
          >
            <Sparkles className="size-4 text-primary" />
          </Button>
        )}

        {onExport && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onExport}
            disabled={isStreaming}
            className="size-8 hover:bg-muted dark:hover:bg-muted"
            title="Export Session"
          >
            <Download className="size-4 text-foreground" />
          </Button>
        )}

        {onCompare && (
          <Button
            size="icon"
            variant="ghost"
            onClick={onCompare}
            disabled={isStreaming}
            className="size-8 hover:bg-muted dark:hover:bg-muted"
            title="Compare Models"
          >
            <ArrowLeftRight className="size-4 text-foreground" />
          </Button>
        )}
      </div>
      )}
    </div>
  );
};
