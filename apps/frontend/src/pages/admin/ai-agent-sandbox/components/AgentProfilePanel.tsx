import React, { useEffect, useState } from "react";
import { Brain, Users, Wrench, Zap, User, ChevronDown, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { sandboxApi, type AgentProfileResponse, type AgentSkillDetail } from "../services/sandboxApi";
import type { AgentConfig } from "../types/sandbox.types";

interface Props {
  selectedAgent: AgentConfig | null;
}

type Tab = "soul" | "persona" | "agents" | "tools" | "skills";

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "soul",   label: "Soul",    icon: <Brain className="size-3.5" /> },
  { key: "persona",label: "Persona", icon: <User className="size-3.5" /> },
  { key: "agents", label: "Agents",  icon: <Users className="size-3.5" /> },
  { key: "tools",  label: "Tools",   icon: <Wrench className="size-3.5" /> },
  { key: "skills", label: "Skills",  icon: <Zap className="size-3.5" /> },
];

function MarkdownText({ content }: { content: string }) {
  if (!content) return <p className="text-xs text-muted-foreground italic">No content</p>;
  return (
    <pre className="text-[11px] leading-relaxed text-foreground dark:text-muted-foreground whitespace-pre-wrap font-mono break-words">
      {content}
    </pre>
  );
}

function ToolBadge({ name }: { name: string }) {
  const isWrite = name.includes("create") || name.includes("update") || name.includes("delete") || name.includes("send");
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
        isWrite
          ? "bg-orange-50 border-warning text-warning dark:bg-warning/30 dark:border-warning dark:text-warning"
          : "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400"
      }`}
    >
      {name}
    </span>
  );
}

function SkillCard({ skill }: { skill: AgentSkillDetail }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border dark:border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-3 py-2 bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted transition-colors text-left"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Zap className="size-3.5 text-primary flex-shrink-0" />
          <span className="text-xs font-medium text-foreground dark:text-muted-foreground truncate">{skill.displayName || skill.id}</span>
        </div>
        {open ? <ChevronDown className="size-3.5 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="size-3.5 text-muted-foreground flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-3 py-2 space-y-2 bg-white dark:bg-muted">
          {skill.description && (
            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground">{skill.description}</p>
          )}
          {skill.instructions && (
            <p className="text-[11px] text-muted-foreground dark:text-muted-foreground italic">{skill.instructions}</p>
          )}
          {skill.allowedTools.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {skill.allowedTools.map((t) => <ToolBadge key={t} name={t} />)}
            </div>
          )}
          {skill.allowedTools.length === 0 && (
            <p className="text-[10px] text-muted-foreground italic">No tools configured</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function AgentProfilePanel({ selectedAgent }: Props) {
  const [tab, setTab] = useState<Tab>("soul");
  const [profile, setProfile] = useState<AgentProfileResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedAgent?.id) {
      setProfile(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    sandboxApi.getAgentProfile(selectedAgent.id)
      .then((data) => { if (!cancelled) setProfile(data); })
      .catch((err) => { if (!cancelled) setError(err?.message || "Failed to load profile"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [selectedAgent?.id]);

  if (!selectedAgent) {
    return (
      <div className="flex items-center justify-center bg-white dark:bg-muted">
        <p className="text-xs text-muted-foreground">No agent selected</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white dark:bg-muted overflow-hidden">
      {/* Agent header */}
      <div className="px-3 py-2.5 border-b border-border dark:border-border bg-muted dark:bg-muted">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{selectedAgent.icon || "🤖"}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground dark:text-muted-foreground truncate">{selectedAgent.name}</p>
            <p className="text-[10px] text-muted-foreground dark:text-muted-foreground">{selectedAgent.role}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border dark:border-border bg-white dark:bg-muted">
        {TABS.map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
              tab === key
                ? "text-indigo-600 border-b-2 border-primary bg-primary/50 dark:bg-primary/20"
                : "text-slate-500 hover:text-foreground dark:hover:text-muted-foreground"
            }`}
          >
            {icon}
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {loading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-4 text-primary animate-spin" />
          </div>
        )}

        {error && !loading && (
          <div className="flex items-start gap-2 p-2 bg-destructive/10 dark:bg-destructive/20 border border-destructive dark:border-destructive rounded-lg">
            <AlertCircle className="size-3.5 text-destructive flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-destructive dark:text-destructive">{error}</p>
          </div>
        )}

        {!loading && !error && profile && (
          <>
            {tab === "soul" && (
              <MarkdownText content={profile.files["SOUL.md"]} />
            )}

            {tab === "persona" && (
              <MarkdownText content={profile.files["PERSONA.md"]} />
            )}

            {tab === "agents" && (
              <MarkdownText content={profile.files["AGENTS.md"]} />
            )}

            {tab === "tools" && (
              <div className="space-y-3">
                <MarkdownText content={profile.files["TOOLS.md"]} />
                {profile.allowedTools.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground dark:text-muted-foreground uppercase tracking-wider mb-2">
                      Allowed Tools ({profile.allowedTools.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {profile.allowedTools.map((t) => <ToolBadge key={t} name={t} />)}
                    </div>
                  </div>
                )}
              </div>
            )}

            {tab === "skills" && (
              <div className="space-y-2">
                {profile.skills.length === 0 && (
                  <p className="text-xs text-muted-foreground italic">No skills assigned</p>
                )}
                {profile.skills.map((skill) => (
                  <SkillCard key={skill.id} skill={skill} />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && !profile && (
          <p className="text-xs text-muted-foreground italic">Loading profile...</p>
        )}
      </div>
    </div>
  );
}
