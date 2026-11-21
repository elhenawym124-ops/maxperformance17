import React from 'react';
import { Camera } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { getContactDisplayPhone } from '../../whatsappContactDisplay';
import { ChatSidebarEmptyState } from './ChatSidebarEmptyState';
import type { WhatsAppStatus } from './types';

interface ChatSidebarStatusesListProps {
  statuses: WhatsAppStatus[];
  isLoadingStatuses: boolean;
  onAddStatus: () => void;
  renderLoadingRows: () => React.ReactNode;
  translate: (key: string) => string;
  isRtl: boolean;
}

export const ChatSidebarStatusesList: React.FC<ChatSidebarStatusesListProps> = ({
  statuses,
  isLoadingStatuses,
  onAddStatus,
  renderLoadingRows,
  translate,
  isRtl,
}) => {
  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={onAddStatus}
        className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-[var(--whatsapp-surface-elevated)] px-4 py-3 text-start shadow-xs transition-colors hover:bg-[var(--whatsapp-surface-hover)]"
      >
        <div>
          <p className="text-xs font-semibold text-foreground">
            {translate('whatsapp.sidebar.addStatus')}
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {translate('whatsapp.sidebar.recentUpdates')}
          </p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-[color:var(--color-primary)]">
          <Camera className="size-4" />
        </div>
      </button>

      {isLoadingStatuses ? (
        renderLoadingRows()
      ) : statuses.length === 0 ? (
        <ChatSidebarEmptyState
          icon={Camera}
          title={translate('whatsapp.sidebar.noStatuses')}
          description={translate('whatsapp.sidebar.recentUpdates')}
        />
      ) : (
        statuses.map((status) => (
          <article
            key={status.id}
            className="rounded-xl border border-border/70 bg-[var(--whatsapp-surface-strong)] px-3.5 py-3 shadow-xs"
          >
            <div className="flex items-start gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-[color:var(--color-primary)]">
                <Camera className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="truncate text-xs font-semibold font-mono text-foreground">
                    {getContactDisplayPhone({ jid: status.remoteJid })}
                  </p>
                  <p className="shrink-0 text-[10px] text-muted-foreground">
                    {formatDistanceToNow(new Date(status.timestamp), {
                      addSuffix: true,
                      locale: isRtl ? ar : enUS,
                    })}
                  </p>
                </div>
                <p className="mt-1 line-clamp-2 text-xs leading-4 text-muted-foreground">
                  {status.content || `[${status.type}]`}
                </p>
              </div>
              {status.mediaUrl && (
                <img
                  src={status.mediaUrl}
                  alt=""
                  className="size-12 rounded-xl object-cover"
                />
              )}
            </div>
          </article>
        ))
      )}
    </div>
  );
};
