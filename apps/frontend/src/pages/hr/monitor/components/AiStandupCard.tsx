import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Archive, ShieldAlert } from 'lucide-react';

interface AiStandupCardProps {
  aiStandup: {
    date?: string;
    headline?: string;
    summary?: string;
    telemetry?: any;
    attentionFlags?: string[];
  } | null;
  isSuperOrOwner: boolean;
  archiving: boolean;
  archiveSuccess: string | null;
  onTriggerArchive: () => void;
}

export const AiStandupCard: React.FC<AiStandupCardProps> = ({
  aiStandup,
  isSuperOrOwner,
  archiving,
  archiveSuccess,
  onTriggerArchive,
}) => {
  return (
    <div className="relative overflow-hidden rounded-xl border border-info/30 bg-gradient-to-br from-card via-card to-info dark:to-info/20 p-4 shadow-sm backdrop-blur-md">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-info/10 text-info dark:text-info ring-1 ring-inset ring-info/25">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-foreground">
                الموجز التحليلي الذكي لفريق العمل (AI Standup Digest)
              </h3>
              <span className="rounded-full bg-info/10 px-2 py-0.5 text-[10px] font-semibold text-info dark:text-info ring-1 ring-inset ring-info/20">
                تحليل لحظي
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {aiStandup?.headline || 'تحليل مؤشرات النشاط، أوقات العمل الفعلية، ومعدلات الإنجاز لليوم'}
            </p>
          </div>
        </div>

        {/* Admin Data Retention Archival Action */}
        {isSuperOrOwner && (
          <div className="flex items-center gap-2">
            {archiveSuccess && (
              <span className="text-[11px] font-medium text-success dark:text-success">
                {archiveSuccess}
              </span>
            )}
            <button
              onClick={onTriggerArchive}
              disabled={archiving}
              className="flex h-7 items-center gap-1.5 rounded-md border border-border/50 bg-muted/60 dark:bg-muted px-2.5 text-[11px] font-medium text-muted-foreground transition hover:bg-muted dark:hover:bg-muted hover:text-foreground active:scale-95"
              title="أرشفة السجلات التفصيلية الأقدم من 60 يوماً وتفريغ مساحة التخزين"
            >
              <Archive className={`h-3 w-3 ${archiving ? 'animate-spin' : ''}`} />
              <span>{archiving ? 'جاري الأرشفة…' : 'أرشفة السجلات القديمة'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Summary Narrative */}
      {aiStandup?.summary && (
        <p className="mt-3 text-xs leading-relaxed text-foreground">
          {aiStandup.summary}
        </p>
      )}

      {/* Attention Flags */}
      {aiStandup?.attentionFlags && aiStandup.attentionFlags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-border/30">
          {aiStandup.attentionFlags.map((flag, idx) => (
            <div
              key={idx}
              className="flex items-center gap-1.5 rounded-md bg-warning/10 text-warning border border-warning dark:border-transparent dark:bg-warning/10 dark:text-warning px-2 py-1 text-[11px]"
            >
              <AlertTriangle className="h-3 w-3 text-warning dark:text-warning shrink-0" />
              <span>{flag}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AiStandupCard;
