import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Globe,
  Loader2,
  LockKeyhole,
  MessageCircle,
  PlugZap,
  RefreshCw,
  Users,
  WalletCards,
} from "lucide-react";
import { toast } from "sonner";
import { changeLanguage } from "../../i18n";
import { useAuth } from "../../hooks/useAuthSimple";
import {
  facebookAdsService,
  type FacebookAdsConnectionStatus,
  type FacebookAdsSavedAdAccountStatus,
} from "../../services/facebookAdsService";
import { safeStr, i18nTexts } from "./facebookAdsConnection.constants";
import { FacebookAdsConnectionSources } from "./facebook-ads-connection/FacebookAdsConnectionSources";
import { FacebookAdsSavedAccountsTable } from "./facebook-ads-connection/FacebookAdsSavedAccountsTable";
import {
  StatusPill,
  MetricTile,
} from "./facebook-ads-connection/FacebookAdsConnectionWidgets";

const FacebookAdsConnection: React.FC = () => {
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));
  const t = isEn ? i18nTexts.en : i18nTexts.ar;

  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState<FacebookAdsConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [disconnectingSourceId, setDisconnectingSourceId] = useState<string | null>(null);
  const [confirmSourceId, setConfirmSourceId] = useState<string | null>(null);
  const [activatingAccountId, setActivatingAccountId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const savedAdAccounts = status?.savedAdAccounts ?? [];
  const connectionSources = status?.connectionSources ?? [];
  const remoteSourcesById = useMemo(
    () => new Map((status?.remoteSources ?? []).map((s) => [s.sourceId, s])),
    [status?.remoteSources],
  );

  const toggleLanguage = () => changeLanguage(isEn ? "ar" : "en");

  const getOAuthErrorMessage = useCallback(
    (errorCode: string) => {
      switch (errorCode) {
        case "facebook_oauth_access_denied":
          return t.oauthAccessDenied;
        case "missing_code_or_state":
        case "invalid_state":
          return t.oauthMissingParams;
        case "state_expired":
          return t.oauthExpired;
        case "callback_failed":
          return t.oauthFailed;
        default:
          return t.oauthGeneralError;
      }
    },
    [t],
  );

  const formatDateTime = useCallback(
    (value?: string | null) => {
      if (!value) return t.notSyncedYet;
      try {
        return new Intl.DateTimeFormat(isEn ? "en-US" : "ar-EG", {
          dateStyle: "short",
          timeStyle: "short",
        }).format(new Date(value));
      } catch {
        return safeStr(value);
      }
    },
    [isEn, t],
  );

  const loadStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const nextStatus = await facebookAdsService.getAdsConnectionStatus();
      setStatus(nextStatus);
    } catch (loadError: unknown) {
      console.error("Failed to load Facebook Ads connection status:", loadError);
      setError(t.loadStatusFailed);
    } finally {
      setLoading(false);
    }
  }, [t.loadStatusFailed]);

  useEffect(() => {
    loadStatus();
  }, [loadStatus]);

  useEffect(() => {
    const success = searchParams.get("success");
    const errorCode = searchParams.get("error");
    const syncedAdAccounts = searchParams.get("syncedAdAccounts");

    if (success === "ads_connected") {
      toast.success(
        syncedAdAccounts
          ? t.adsConnectedCount.replace("{count}", syncedAdAccounts)
          : t.adsConnectedSuccess,
      );
      loadStatus();
    } else if (errorCode) {
      toast.error(getOAuthErrorMessage(errorCode));
    } else {
      return;
    }

    const nextParams = new URLSearchParams(searchParams);
    ["success", "error", "syncedAdAccounts", "activeAdAccountId", "sourceId"].forEach((k) =>
      nextParams.delete(k),
    );
    setSearchParams(nextParams, { replace: true });
  }, [getOAuthErrorMessage, loadStatus, searchParams, setSearchParams, t]);

  const handleConnectAds = async () => {
    if (!user?.companyId) {
      toast.error(t.companyNotFound);
      return;
    }

    try {
      setConnecting(true);
      setError(null);
      const response = await facebookAdsService.getAdsAuthorizationUrl({
        companyId: user.companyId,
        returnOrigin: window.location.origin,
      });

      if (!response.success || !response.authUrl) {
        throw new Error(response.message || "Failed to create ads auth URL");
      }

      window.location.assign(response.authUrl);
    } catch (connectError: unknown) {
      console.error("Failed to start Facebook Ads OAuth:", connectError);
      setError(t.startConnectFailed);
      toast.error(t.startConnectFailed);
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnectSource = async (sourceId: string) => {
    try {
      setDisconnectingSourceId(sourceId);
      setConfirmSourceId(null);
      await facebookAdsService.disconnectAdsConnectionSource(sourceId);
      toast.success(t.disconnectSuccess);
      await loadStatus();
    } catch (disconnectError: unknown) {
      console.error("Failed to disconnect Facebook Ads source:", disconnectError);
      toast.error(t.disconnectFailed);
    } finally {
      setDisconnectingSourceId(null);
    }
  };

  const handleSetActiveAccount = async (account: FacebookAdsSavedAdAccountStatus) => {
    try {
      setActivatingAccountId(account.id);
      await facebookAdsService.saveAdAccount({
        accountId: account.accountId,
        name: account.name,
        currency: account.currency,
        timezone: account.timezone || undefined,
      });
      toast.success(t.setActiveSuccess);
      await loadStatus();
    } catch (activateError: unknown) {
      console.error("Failed to set active ad account:", activateError);
      toast.error(t.setActiveFailed);
    } finally {
      setActivatingAccountId(null);
    }
  };

  const connectionLabel = useMemo(() => {
    if (!status) return t.loading;
    return status.connected ? t.connected : t.disconnected;
  }, [status, t]);

  return (
    <div className="min-h-screen bg-muted p-3 text-foreground sm:p-6 dark:bg-muted dark:text-muted-foreground">
      <div className="mx-auto flex max-w-6xl 2xl:max-w-7xl flex-col gap-4">
        {/* Header Container */}
        <header className="flex flex-col gap-3.5 rounded-xl border border-border bg-white/95 p-4 shadow-xs backdrop-blur-md sm:p-5 dark:border-border dark:bg-muted">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200/70 bg-blue-50/80 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                <PlugZap className="h-3.5 w-3.5" />
                {t.badge}
              </div>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground sm:text-3xl dark:text-white">
                {t.title}
              </h1>
              <p className="mt-1 max-w-2xl text-xs text-foreground sm:text-sm dark:text-muted-foreground">
                {t.subtitle}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill ok={Boolean(status?.connected)} label={connectionLabel} />
              <button
                type="button"
                onClick={toggleLanguage}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-xs font-semibold text-foreground shadow-xs transition-all hover:border-border hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
                title={isEn ? "تبديل إلى العربية" : "Switch to English"}
              >
                <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span>{t.switchLang}</span>
              </button>
              <button
                type="button"
                onClick={loadStatus}
                disabled={loading}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-white px-3.5 text-xs font-semibold text-foreground shadow-xs transition-all hover:bg-muted disabled:opacity-60 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
              >
                <RefreshCw className={["h-3.5 w-3.5", loading ? "animate-spin" : ""].join(" ")} />
                {t.refresh}
              </button>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-xl border border-destructive bg-destructive/90 px-4 py-3 text-sm font-semibold text-destructive dark:border-destructive/60 dark:bg-destructive/30 dark:text-destructive">
            {safeStr(error)}
          </div>
        ) : null}

        {/* 4 Metric Tiles */}
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricTile
            icon={Users}
            label={t.facebookAccounts}
            value={status?.connectedFacebookAccountsCount ?? 0}
          />
          <MetricTile
            icon={WalletCards}
            label={t.adAccounts}
            value={savedAdAccounts.length}
          />
          <MetricTile
            icon={LockKeyhole}
            label={t.isolatedTokens}
            value={status?.isolatedAdAccountsCount ?? 0}
          />
          <MetricTile
            icon={MessageCircle}
            label={t.messengerPages}
            value={status?.pageConnection.connectedPagesCount ?? 0}
          />
        </section>

        {/* Main Grid: Accounts List + Aside */}
        <main className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <section className="space-y-4">
            {/* Primary Action Card */}
            <div className="rounded-xl border border-border bg-white p-5 shadow-xs dark:border-border dark:bg-muted">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground dark:text-white">
                    {t.isolatedSectionTitle}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted-foreground dark:text-muted-foreground">
                    {t.isolatedSectionSubtitle}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleConnectAds}
                  disabled={connecting}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 text-xs font-semibold text-white shadow-sm shadow-blue-500/25 transition-all hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40 disabled:opacity-60"
                >
                  {connecting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlugZap className="h-4 w-4" />
                  )}
                  {connecting ? t.connecting : t.connectAnother}
                </button>
              </div>

              {/* Connected Facebook Profiles List */}
              <FacebookAdsConnectionSources
                sources={connectionSources}
                remoteSourcesById={remoteSourcesById}
                loading={loading}
                disconnectingSourceId={disconnectingSourceId}
                confirmSourceId={confirmSourceId}
                onConfirmDisconnect={handleDisconnectSource}
                onCancelConfirm={() => setConfirmSourceId(null)}
                onStartDisconnect={(id) => setConfirmSourceId(id)}
                formatDateTime={formatDateTime}
                t={t}
              />

              {/* Saved Ad Accounts Table */}
              <FacebookAdsSavedAccountsTable
                accounts={savedAdAccounts}
                loading={loading}
                activatingAccountId={activatingAccountId}
                onSetActive={handleSetActiveAccount}
                t={t}
              />
            </div>
          </section>

          {/* Aside: Meta Health & Diagnostics */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-border bg-white p-5 shadow-xs dark:border-border dark:bg-muted">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <PlugZap className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-bold text-foreground dark:text-white">
                  {t.metaTestTitle}
                </h2>
              </div>
              <div className="mt-3 space-y-1.5 text-xs text-foreground dark:text-muted-foreground">
                <p>
                  {status?.remote.checked
                    ? status.remote.ok
                      ? t.metaReturnedCount.replace(
                          "{count}",
                          String(status.remote.accountsCount ?? 0),
                        )
                      : safeStr(status.remote.error) || t.metaTestFailed
                    : t.metaTestPending}
                </p>
              </div>
              <div className="mt-3.5">
                <StatusPill
                  ok={Boolean(status?.remote.ok)}
                  label={status?.remote.ok ? t.metaApiValid : t.needsTest}
                />
              </div>
              {status?.remoteSources?.length ? (
                <div className="mt-3 space-y-1.5">
                  {status.remoteSources.map((sourceRemote) => {
                    const source = connectionSources.find(
                      (item) => item.id === sourceRemote.sourceId,
                    );
                    return (
                      <div
                        key={sourceRemote.sourceId}
                        className="flex items-center justify-between gap-2 rounded-lg bg-muted px-2.5 py-1.5 text-xs dark:bg-muted"
                      >
                        <span className="truncate font-medium text-foreground dark:text-muted-foreground">
                          {source?.facebookUserName ||
                            source?.facebookUserEmail ||
                            sourceRemote.sourceId}
                        </span>
                        <span
                          className={[
                            "font-semibold tabular-nums",
                            sourceRemote.ok
                              ? "text-emerald-700 dark:text-success"
                              : "text-amber-700 dark:text-warning",
                          ].join(" ")}
                        >
                          {sourceRemote.ok
                            ? `${sourceRemote.accountsCount ?? 0} ${t.fromMeta}`
                            : t.testFailed}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : null}
            </section>
          </aside>
        </main>
      </div>
    </div>
  );
};

export default FacebookAdsConnection;
