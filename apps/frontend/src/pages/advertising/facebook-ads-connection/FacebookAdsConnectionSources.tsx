import React from "react";
import { AlertTriangle, CheckCircle2, Loader2, Unplug, Users, X } from "lucide-react";
import type {
  FacebookAdsConnectionSourceStatus,
  FacebookAdsRemoteSourceStatus,
} from "../../../services/facebookAdsService";
import { safeStr, type AdsConnectionTexts } from "../facebookAdsConnection.constants";

interface Props {
  sources: FacebookAdsConnectionSourceStatus[];
  remoteSourcesById: Map<string, FacebookAdsRemoteSourceStatus>;
  loading: boolean;
  disconnectingSourceId: string | null;
  confirmSourceId: string | null;
  onConfirmDisconnect: (sourceId: string) => void;
  onCancelConfirm: () => void;
  onStartDisconnect: (sourceId: string) => void;
  formatDateTime: (value?: string | null) => string;
  t: AdsConnectionTexts;
}

export const FacebookAdsConnectionSources: React.FC<Props> = ({
  sources,
  remoteSourcesById,
  loading,
  disconnectingSourceId,
  confirmSourceId,
  onConfirmDisconnect,
  onCancelConfirm,
  onStartDisconnect,
  formatDateTime,
  t,
}) => {
  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-border dark:border-border">
      <div className="flex items-center justify-between gap-2 bg-muted px-4 py-2.5 dark:bg-muted">
        <h3 className="text-xs font-bold text-foreground dark:text-muted-foreground">
          {t.connectedSourcesTitle}
        </h3>
        <span className="text-xs font-medium tabular-nums text-muted-foreground dark:text-muted-foreground">
          {sources.length} {t.sourcesCount}
        </span>
      </div>
      {loading ? (
        <div className="flex items-center gap-2 px-4 py-4 text-xs font-medium text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          {t.loadingSources}
        </div>
      ) : sources.length ? (
        <div className="divide-y divide-border dark:divide-border">
          {sources.map((source) => {
            const remoteSource = remoteSourcesById.get(source.id);
            const sourceName =
              source.facebookUserName ||
              source.facebookUserEmail ||
              source.facebookUserId;
            const isConnected =
              source.status === "connected" && source.hasToken;
            const disconnecting = disconnectingSourceId === source.id;
            const isConfirming = confirmSourceId === source.id;

            return (
              <div
                key={source.id}
                className="flex flex-col gap-3 p-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between dark:hover:bg-muted"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300">
                    <Users className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground dark:text-white">
                      {sourceName}
                    </p>
                    <p className="truncate font-mono text-xs tabular-nums text-muted-foreground dark:text-muted-foreground">
                      {source.facebookUserId}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-md bg-muted px-2 py-1 font-medium tabular-nums text-foreground dark:bg-muted dark:text-muted-foreground">
                    {source.syncedAdAccountsCount} {t.adAccountsCount}
                  </span>
                  <span className="tabular-nums text-muted-foreground">
                    {formatDateTime(source.lastSyncedAt || source.connectedAt)}
                  </span>
                  {remoteSource?.checked ? (
                    remoteSource.ok ? (
                      <span className="rounded-md bg-success/10 px-2 py-0.5 text-[11px] font-semibold tabular-nums text-success dark:bg-success/40 dark:text-success">
                        {remoteSource.accountsCount ?? 0} {t.fromMeta}
                      </span>
                    ) : (
                      <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive dark:bg-destructive/40 dark:text-destructive">
                        {safeStr(remoteSource.error) || t.testFailed}
                      </span>
                    )
                  ) : null}
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span
                    className={[
                      "inline-flex h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold tracking-wide",
                      isConnected
                        ? "border border-success/70 bg-success/10 text-success dark:border-success/60 dark:bg-success/40 dark:text-success"
                        : "border border-warning/70 bg-warning/10 text-warning dark:border-warning/60 dark:bg-warning/40 dark:text-warning",
                    ].join(" ")}
                  >
                    {isConnected ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <AlertTriangle className="h-3.5 w-3.5" />
                    )}
                    {isConnected ? t.connected : t.disconnected}
                  </span>
                  {isConfirming ? (
                    <div className="inline-flex items-center gap-1 rounded-lg border border-destructive bg-destructive/10 p-1 dark:border-destructive dark:bg-destructive/60">
                      <button
                        type="button"
                        onClick={() => onConfirmDisconnect(source.id)}
                        disabled={disconnecting}
                        className="inline-flex h-7 items-center gap-1 rounded-md bg-destructive px-2 text-[11px] font-semibold text-white transition hover:bg-destructive"
                      >
                        {disconnecting ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Unplug className="h-3 w-3" />
                        )}
                        {t.disconnect}
                      </button>
                      <button
                        type="button"
                        onClick={onCancelConfirm}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive dark:hover:bg-destructive"
                        title="إلغاء"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onStartDisconnect(source.id)}
                      disabled={!isConnected || disconnecting}
                      className="inline-flex h-8 items-center justify-center gap-1 rounded-lg border border-destructive bg-white px-2.5 text-xs font-semibold text-destructive transition hover:bg-destructive/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/30 disabled:cursor-not-allowed disabled:opacity-40 dark:border-destructive/60 dark:bg-muted dark:text-destructive dark:hover:bg-destructive/40"
                    >
                      <Unplug className="h-3 w-3" />
                      {t.disconnect}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="px-4 py-6 text-center text-xs text-muted-foreground dark:text-muted-foreground">
          {t.noSourcesFound}
        </div>
      )}
    </div>
  );
};
