import React from "react";
import { Loader2 } from "lucide-react";
import type { FacebookAdsSavedAdAccountStatus } from "../../../services/facebookAdsService";
import type { AdsConnectionTexts } from "../facebookAdsConnection.constants";

interface Props {
  accounts: FacebookAdsSavedAdAccountStatus[];
  loading: boolean;
  activatingAccountId?: string | null;
  onSetActive?: (account: FacebookAdsSavedAdAccountStatus) => void;
  t: AdsConnectionTexts;
}

export const FacebookAdsSavedAccountsTable: React.FC<Props> = ({
  accounts,
  loading,
  activatingAccountId,
  onSetActive,
  t,
}) => {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl border border-border dark:border-border">
      <table className="w-full text-start text-xs">
        <thead className="bg-slate-50/90 text-muted-foreground dark:bg-muted dark:text-muted-foreground">
          <tr>
            <th className="px-4 py-2.5 text-start font-semibold">{t.tableAccount}</th>
            <th className="px-4 py-2.5 text-start font-semibold">{t.tableSource}</th>
            <th className="px-4 py-2.5 text-start font-semibold">{t.tableCurrency}</th>
            <th className="px-4 py-2.5 text-start font-semibold">{t.tableStatus}</th>
            <th className="px-4 py-2.5 text-start font-semibold">{t.tableTokenType}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border dark:divide-border">
          {loading ? (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                <Loader2 className="me-2 inline-block h-4 w-4 animate-spin text-blue-600" />
                {t.loadingAccounts}
              </td>
            </tr>
          ) : accounts.length ? (
            accounts.map((account) => {
              const metaStatus = account.metaHealth?.accountStatus;
              const isMetaActive = metaStatus === "1";
              const isMetaDisabled = metaStatus === "2";
              const isMetaReview = metaStatus === "7";
              const isActivating = activatingAccountId === account.id;

              return (
                <tr
                  key={account.id}
                  className="transition-colors hover:bg-muted dark:hover:bg-muted"
                >
                  <td className="px-4 py-3">
                    <p className="font-bold text-foreground dark:text-white">
                      {account.name}
                    </p>
                    <p className="font-mono text-[11px] tabular-nums text-muted-foreground">
                      {account.accountId}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground dark:text-muted-foreground">
                    {account.connectionSource?.facebookUserName ||
                      account.connectionSource?.facebookUserEmail ||
                      (account.connectionSourceId ? t.facebookAccount : t.legacySource)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-md bg-muted px-2 py-0.5 font-mono font-semibold tabular-nums text-foreground dark:bg-muted dark:text-muted-foreground">
                      {account.currency}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isMetaDisabled ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive dark:bg-destructive/40 dark:text-destructive">
                          <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                          {t.statusMetaDisabled}
                        </span>
                      ) : isMetaReview ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-semibold text-warning dark:bg-warning/40 dark:text-warning">
                          <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                          {t.statusMetaReview}
                        </span>
                      ) : isMetaActive || account.isActive ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-0.5 text-[11px] font-semibold text-success dark:bg-success/40 dark:text-success">
                          <span className="h-1.5 w-1.5 rounded-full bg-success" />
                          {isMetaActive ? t.statusMetaActive : t.statusActive}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-foreground dark:bg-muted dark:text-muted-foreground">
                          <span className="h-1.5 w-1.5 rounded-full bg-muted" />
                          {t.statusSaved}
                        </span>
                      )}

                      {!account.isActive && onSetActive ? (
                        <button
                          type="button"
                          onClick={() => onSetActive(account)}
                          disabled={isActivating}
                          className="inline-flex h-6 items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-2 text-[10px] font-semibold text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300"
                        >
                          {isActivating ? (
                            <Loader2 className="h-2.5 w-2.5 animate-spin" />
                          ) : null}
                          {isActivating ? t.settingActive : t.setActive}
                        </button>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium text-foreground dark:text-muted-foreground">
                    {account.tokenSource === "facebook_account"
                      ? t.tokenFromSource
                      : account.hasIsolatedToken
                        ? t.tokenIsolated
                        : t.tokenMissing}
                  </td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={5} className="px-4 py-6 text-center text-muted-foreground">
                {t.noSavedAccounts}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
