import React from 'react';
import { ShieldAlert, AlertTriangle, Clock, RefreshCw, Cpu, Building2, Search, Filter } from 'lucide-react';

export interface AiIncident {
  id: string;
  companyId: string;
  companyName: string;
  companySpecialty?: string | null;
  conversationId?: string | null;
  errorType: string;
  errorMessage?: string | null;
  createdAt: string;
  category: 'AUTH_FAIL' | 'UPSTREAM_TIMEOUT' | 'SCHEMA_MISMATCH' | 'POLICY_BLOCKED' | 'SYSTEM_ERROR';
  toolName: string;
  arguments: Record<string, any>;
  userMessage?: string | null;
  agentId: string;
  model: string;
  latencyMs: number;
  stack?: string | null;
  resolved: boolean;
  isolated?: boolean;
}

interface IncidentStreamPaneProps {
  incidents: AiIncident[];
  selectedId: string | null;
  onSelect: (incident: AiIncident) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeCategory: string;
  onCategoryChange: (cat: string) => void;
  loading: boolean;
  onRefresh: () => void;
}

const CATEGORY_STYLES: Record<string, { label: string; badge: string }> = {
  AUTH_FAIL: {
    label: 'AUTH_FAIL',
    badge: 'bg-rose-50 dark:bg-destructive/60 text-destructive dark:text-destructive border-destructive/80 dark:border-destructive/60',
  },
  UPSTREAM_TIMEOUT: {
    label: 'TIMEOUT',
    badge: 'bg-amber-50 dark:bg-warning/60 text-warning dark:text-warning border-warning/80 dark:border-warning/60',
  },
  SCHEMA_MISMATCH: {
    label: 'SCHEMA',
    badge: 'bg-sky-50 dark:bg-info/60 text-info dark:text-info border-info/80 dark:border-info/60',
  },
  POLICY_BLOCKED: {
    label: 'POLICY',
    badge: 'bg-purple-50 dark:bg-primary/60 text-primary dark:text-primary border-primary/80 dark:border-primary/60',
  },
  SYSTEM_ERROR: {
    label: 'SYSTEM',
    badge: 'bg-slate-100 dark:bg-muted text-foreground dark:text-muted-foreground border-border dark:border-border',
  },
};

export const IncidentStreamPane: React.FC<IncidentStreamPaneProps> = ({
  incidents,
  selectedId,
  onSelect,
  searchQuery,
  onSearchChange,
  activeCategory,
  onCategoryChange,
  loading,
  onRefresh,
}) => {
  return (
    <div className="flex flex-col h-full bg-white dark:bg-muted border-e border-border dark:border-border min-w-0">
      {/* Search & Category Filter Bar */}
      <div className="p-3 border-b border-border dark:border-border space-y-2 bg-muted dark:bg-muted">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute start-3 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="البحث باسم الأداة، الشركة، أو رسالة الخطأ..."
              className="w-full ps-8 pe-3 py-1.5 text-xs rounded-lg border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg border border-border dark:border-border hover:bg-white dark:hover:bg-muted text-muted-foreground dark:text-muted-foreground transition-colors disabled:opacity-50"
            title="تحديث البيانات"
            aria-label="تحديث البيانات"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Filter Categories Horizontal Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5 text-[11px]">
          {['ALL', 'AUTH_FAIL', 'UPSTREAM_TIMEOUT', 'SCHEMA_MISMATCH', 'POLICY_BLOCKED'].map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => onCategoryChange(cat)}
                className={`px-2.5 py-1 rounded-md font-mono transition-all flex-shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-foreground font-semibold shadow-2xs'
                    : 'bg-white dark:bg-muted border border-border dark:border-border text-foreground dark:text-muted-foreground hover:border-border'
                }`}
              >
                {cat === 'ALL' ? 'الكل' : cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* High-Density Incident Timeline Stream */}
      <div className="flex-1 overflow-y-auto divide-y divide-border dark:divide-border">
        {incidents.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground dark:text-muted-foreground space-y-2">
            <ShieldAlert className="h-6 w-6 mx-auto text-success opacity-70" />
            <p className="font-semibold text-foreground dark:text-muted-foreground">
              لا توجد استثناءات أو أعطال مسجلة في هذه النافذة
            </p>
            <p className="text-[11px]">
              جميع أدوات الوكلاء واستدعاءات الربط الخارجي تعمل بحالة مستقرة.
            </p>
          </div>
        ) : (
          incidents.map((inc) => {
            const isSelected = selectedId === inc.id;
            const style = CATEGORY_STYLES[inc.category] || CATEGORY_STYLES.SYSTEM_ERROR!;
            const timeFormatted = new Date(inc.createdAt).toLocaleTimeString('ar-EG', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            });

            return (
              <div
                key={inc.id}
                onClick={() => onSelect(inc)}
                className={`p-3 text-right cursor-pointer transition-colors border-r-2 ${
                  isSelected
                    ? 'bg-indigo-50/60 dark:bg-primary/40 border-r-indigo-600'
                    : 'hover:bg-slate-50/80 dark:hover:bg-muted border-r-transparent'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-mono text-[9px] px-1.5 py-0.5 rounded border font-semibold ${style.badge}`}
                    >
                      {style.label}
                    </span>
                    {inc.isolated && (
                      <span className="font-mono text-[9px] px-1.5 py-0.5 rounded border font-semibold bg-destructive text-destructive border-destructive dark:bg-destructive dark:text-destructive">
                        معزولة (ISOLATED)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-mono tabular-nums">
                    <span>{inc.latencyMs ? `${inc.latencyMs}ms` : '—'}</span>
                    <span>·</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeFormatted}
                    </span>
                  </div>
                </div>

                {/* Tool signature headline */}
                <div className="font-mono text-xs font-bold text-foreground dark:text-white truncate dir-ltr text-left">
                  {inc.toolName}()
                </div>

                {/* Tenant & Agent Context */}
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground dark:text-muted-foreground mt-1 truncate">
                  <span className="flex items-center gap-1 font-medium text-foreground dark:text-muted-foreground">
                    <Building2 className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                    <span className="truncate max-w-[140px]">{inc.companyName}</span>
                  </span>
                  <span>·</span>
                  <span className="truncate font-mono text-[10px] text-muted-foreground">
                    {inc.agentId}
                  </span>
                </div>

                {/* Error message snippet */}
                {inc.errorMessage && (
                  <p className="text-[11px] text-destructive dark:text-destructive truncate mt-1">
                    {inc.errorMessage}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
