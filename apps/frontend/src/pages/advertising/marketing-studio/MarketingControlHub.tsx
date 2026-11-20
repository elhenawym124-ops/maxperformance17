import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Plus,
  Search,
  Trash2,
  X,
  Clock,
  FolderArchive,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import type { CopilotSession } from "../../../components/advertising/copilot/types";

interface MarketingControlHubProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: CopilotSession[];
  totalCount?: number;
  activeSessionId: string;
  onSelectSession: (sessionId: string) => void;
  onNewSession: () => void;
  onDeleteSession: (sessionId: string) => void;
}

export const MarketingControlHub: React.FC<MarketingControlHubProps> = ({
  isOpen,
  onClose,
  sessions,
  totalCount,
  activeSessionId,
  onSelectSession,
  onNewSession,
  onDeleteSession,
}) => {
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success("تم نسخ معرف الجلسة بنجاح");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter((s) => (s.title || "").toLowerCase().includes(q));
  }, [sessions, search]);

  const formatSessionTime = (isoString?: string) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200">
      {/* Backdrop */}
      <div className="flex-1 cursor-pointer" onClick={onClose} aria-hidden="true" />

      {/* Drawer */}
      <aside
        aria-label="سجل جلسات التسويق"
        className="w-full sm:w-[380px] max-w-full h-full bg-white dark:bg-muted border-r sm:border-r-0 sm:border-l border-border dark:border-border shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-border dark:border-border flex items-center justify-between bg-muted dark:bg-muted">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-white shadow-sm">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground dark:text-white flex items-center gap-2">
                سجل الجلسات السابقة
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary dark:bg-primary text-primary dark:text-primary">
                  {totalCount || sessions.length}
                </span>
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action: New Session */}
        <div className="p-3 border-b border-border dark:border-border space-y-2">
          <button
            type="button"
            onClick={() => {
              onNewSession();
              onClose();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>بدء جلسة تسويق جديدة</span>
          </button>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="بحث في الجلسات..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pe-8 ps-3 py-1.5 text-xs rounded-xl border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground placeholder-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
          {filteredSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-muted-foreground">
              لم يتم العثور على جلسات مطابقة.
            </div>
          ) : (
            filteredSessions.map((sess) => {
              const isActive = sess.id === activeSessionId;
              const msgCount = sess.messages ? sess.messages.length : 0;
              const displayTitle =
                typeof sess.title === "string" && sess.title.trim()
                  ? sess.title
                  : "جلسة تسويقية جديدة";

              return (
                <div
                  key={sess.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    onSelectSession(sess.id);
                    onClose();
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      onSelectSession(sess.id);
                      onClose();
                    }
                  }}
                  className={`group w-full text-right p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between gap-2 ${
                    isActive
                      ? "bg-indigo-50 dark:bg-primary/40 border-primary dark:border-primary text-primary dark:text-primary shadow-sm"
                      : "bg-white dark:bg-muted border-border dark:border-border hover:bg-muted dark:hover:bg-muted"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${
                        isActive
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 dark:bg-muted text-muted-foreground"
                      }`}
                    >
                      <MessageSquare className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-xs font-bold truncate">
                        {displayTitle}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                        <span>{msgCount} رسائل</span>
                        <span>•</span>
                        <span>{formatSessionTime(sess.updatedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={(e) => handleCopyId(e, sess.id)}
                      className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 dark:hover:bg-primary/50 rounded-lg transition"
                      title={copiedId === sess.id ? "تم النسخ بنجاح!" : "نسخ معرف الجلسة للمراجعة والدعم الفني"}
                      aria-label="نسخ معرف الجلسة"
                    >
                      {copiedId === sess.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    {sessions.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSession(sess.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/50 rounded-lg transition"
                        title="حذف هذه الجلسة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </aside>
    </div>
  );
};

