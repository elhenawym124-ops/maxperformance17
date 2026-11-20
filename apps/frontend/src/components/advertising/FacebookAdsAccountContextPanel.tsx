import React, { useEffect, useMemo, useState } from "react";
import {
  ArrowPathIcon,
  BanknotesIcon,
  BuildingOfficeIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
  FacebookAdsAccountContext,
} from "../../hooks/useFacebookAdsAccountContext";
import {
  facebookAdsService,
  FacebookPagesMeta,
  FacebookPixel,
} from "../../services/facebookAdsService";
import { formatCurrency } from "../../utils/facebookAdsHelpers";

interface FacebookAdsAccountContextPanelProps {
  context: FacebookAdsAccountContext;
  compact?: boolean;
}


const getAccountId = (account: { account_id?: string; id?: string }) =>
  account.account_id || account.id || "";

const getBusinessGroupKey = (
  account: FacebookAdsAccountContext["adAccounts"][number],
) => account.business?.id || "unassigned";

const getBusinessGroupLabel = (
  account: FacebookAdsAccountContext["adAccounts"][number],
) =>
  account.business?.name
    ? `${account.business.name} (${account.business.id || "بدون ID"})`
    : "حسابات بدون Business ظاهر من Meta";

const FacebookAdsAccountContextPanel: React.FC<
  FacebookAdsAccountContextPanelProps
> = ({ context, compact = false }) => {
  const {
    adAccounts,
    selectedAdAccount,
    selectedAdAccountId,
    loading,
    error,
    refreshAdAccounts,
    setSelectedAdAccountId,
  } = context;
  const [pixels, setPixels] = useState<FacebookPixel[]>([]);
  const [pagesMeta, setPagesMeta] = useState<FacebookPagesMeta | null>(null);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const billingHealth = selectedAdAccount?.billingHealth;
  const currency =
    billingHealth?.currency || selectedAdAccount?.currency || "EGP";
  const selectedBusinessName =
    selectedAdAccount?.business?.name ||
    billingHealth?.business?.name ||
    "Business غير ظاهر";
  const selectedBusinessId =
    selectedAdAccount?.business?.id ||
    billingHealth?.business?.id ||
    null;
  const businessGroups = useMemo(() => {
    const groups = new Map<
      string,
      {
        label: string;
        accounts: typeof adAccounts;
      }
    >();

    adAccounts.forEach((account) => {
      const key = getBusinessGroupKey(account);
      const existingGroup = groups.get(key);

      if (existingGroup) {
        existingGroup.accounts.push(account);
        return;
      }

      groups.set(key, {
        label: getBusinessGroupLabel(account),
        accounts: [account],
      });
    });

    return Array.from(groups.entries()).sort(([, a], [, b]) =>
      a.label.localeCompare(b.label, "ar"),
    );
  }, [adAccounts]);
  const savedAccountsCount = adAccounts.filter((account) => account.isSaved).length;
  const usableAccountsCount = adAccounts.filter(
    (account) => account.billingHealth?.isAccountUsable !== false,
  ).length;

  useEffect(() => {
    let cancelled = false;

    const loadAssets = async () => {
      if (!selectedAdAccountId) {
        setPixels([]);
        setPagesMeta(null);
        return;
      }

      try {
        setAssetsLoading(true);
        const [pixelList, pageOptions] = await Promise.all([
          facebookAdsService.getFacebookPixels(selectedAdAccountId),
          facebookAdsService.getFacebookPageOptions(),
        ]);

        if (!cancelled) {
          setPixels(pixelList);
          setPagesMeta(pageOptions.meta || null);
        }
      } catch (assetError) {
        if (!cancelled) {
          setPixels([]);
          setPagesMeta(null);
        }
      } finally {
        if (!cancelled) {
          setAssetsLoading(false);
        }
      }
    };

    loadAssets();

    return () => {
      cancelled = true;
    };
  }, [selectedAdAccountId]);

  if (compact) {
    return (
      <section className="rounded-lg border border-border bg-white p-2 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-muted-foreground dark:text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <BuildingOfficeIcon className="h-4 w-4" />
                Meta Ads
              </span>
              {selectedAdAccount && (
                <>
                  <span className="truncate text-foreground dark:text-white">
                    {selectedAdAccount.name}
                  </span>
                  <span>Business: {selectedBusinessName}</span>
                  <span>Pixels: {assetsLoading ? "..." : pixels.length}</span>
                  <span>
                    Pages: {assetsLoading ? "..." : pagesMeta?.counts?.ready || 0}
                  </span>
                  {(billingHealth?.warnings || []).length > 0 && (
                    <span className="text-amber-700 dark:text-warning">
                      Warnings: {billingHealth?.warnings?.length || 0}
                    </span>
                  )}
                </>
              )}
            </div>
            {selectedBusinessId && (
              <p className="mt-1 truncate text-[11px] font-semibold text-muted-foreground">
                Business ID: {selectedBusinessId} / Account ID:{" "}
                {selectedAdAccountId}
              </p>
            )}
          </div>

          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <label className="sr-only" htmlFor="facebook-ad-account-select">
              الحساب الإعلاني
            </label>
            <select
              id="facebook-ad-account-select"
              value={selectedAdAccountId}
              onChange={(event) => setSelectedAdAccountId(event.target.value)}
              disabled={loading || adAccounts.length === 0}
              className="h-9 min-w-0 rounded-md border border-border bg-white px-3 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-border dark:bg-muted dark:text-white sm:w-[360px]"
            >
              <option value="">
                {loading ? "جاري تحميل الحسابات..." : "اختر حساباً إعلانياً"}
              </option>
              {businessGroups.map(([businessKey, group]) => (
                <optgroup key={businessKey} label={group.label}>
                  {group.accounts.map((account) => {
                    const accountId = getAccountId(account);
                    const accountCurrency =
                      account.currency ||
                      account.billingHealth?.currency ||
                      "غير محدد";
                    const statusLabel =
                      account.billingHealth?.accountStatusLabel ||
                      account.account_status ||
                      "حالة غير ظاهرة";

                    return (
                      <option key={account.id || accountId} value={accountId}>
                        {account.name} - {accountId} - {accountCurrency} -{" "}
                        {statusLabel}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            <button
              type="button"
              onClick={refreshAdAccounts}
              disabled={loading}
              title="تحديث الحسابات الإعلانية من Meta"
              aria-label="تحديث الحسابات الإعلانية من Meta"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-border bg-white text-foreground hover:bg-muted disabled:opacity-60 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-2 rounded-md border border-destructive bg-destructive/10 p-2 text-sm text-destructive">
            {typeof error === "string" ? error : String(error)}
          </div>
        )}

        {!loading && adAccounts.length === 0 && !error && (
          <div className="mt-2 rounded-md border border-warning bg-warning/10 p-2 text-sm text-warning">
            لا توجد حسابات إعلانية ظاهرة لهذا التوكن.
          </div>
        )}
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-white p-4 shadow-sm dark:border-border dark:bg-muted">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground dark:text-muted-foreground">
            <BuildingOfficeIcon className="h-5 w-5" />
            سياق Meta Ads الحالي
          </div>
          <h2 className="mt-2 text-xl font-bold text-foreground dark:text-white">
            {selectedAdAccount?.name || "اختر الحساب الإعلاني"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground dark:text-muted-foreground">
            كل المزامنة والتقارير على هذه الصفحة ستتم على الحساب المحدد فقط.
          </p>
          {selectedAdAccount && (
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold">
              <span className="rounded-full bg-muted px-3 py-1 text-foreground dark:bg-muted dark:text-muted-foreground">
                Business: {selectedBusinessName}
              </span>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700 dark:bg-blue-950/50 dark:text-blue-200">
                Ad Account: {selectedAdAccountId}
              </span>
              {selectedBusinessId && (
                <span className="rounded-full bg-muted px-3 py-1 text-foreground dark:bg-muted dark:text-muted-foreground">
                  Business ID: {selectedBusinessId}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1">
            <label
              htmlFor="facebook-ad-account-select"
              className="text-xs font-bold text-muted-foreground dark:text-muted-foreground"
            >
              الحساب الإعلاني
            </label>
            <div className="mb-1 flex flex-wrap gap-1 text-[11px] font-bold">
              <span className="rounded-full bg-muted px-2 py-0.5 text-foreground">
                Businesses: {businessGroups.length}
              </span>
              <span className="rounded-full bg-success/10 px-2 py-0.5 text-success">
                محفوظة: {savedAccountsCount}
              </span>
              <span className="rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
                قابلة للاستخدام: {usableAccountsCount}
              </span>
            </div>
            <select
              id="facebook-ad-account-select"
              value={selectedAdAccountId}
              onChange={(event) => setSelectedAdAccountId(event.target.value)}
              disabled={loading || adAccounts.length === 0}
              className="min-w-[280px] rounded-xl border border-border bg-white px-4 py-2.5 text-sm text-foreground shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 disabled:opacity-60 dark:border-border dark:bg-muted dark:text-white"
              aria-describedby="facebook-ad-account-help"
            >
              <option value="">
                {loading ? "جاري تحميل الحسابات..." : "اختر حساباً إعلانياً"}
              </option>
              {businessGroups.map(([businessKey, group]) => (
                <optgroup key={businessKey} label={group.label}>
                  {group.accounts.map((account) => {
                    const accountId = getAccountId(account);
                    const accountCurrency =
                      account.currency ||
                      account.billingHealth?.currency ||
                      "غير محدد";
                    const statusLabel =
                      account.billingHealth?.accountStatusLabel ||
                      account.account_status ||
                      "حالة غير ظاهرة";
                    const savedLabel = account.isSaved ? "محفوظ" : "غير محفوظ";
                    const activeLabel = account.isActive ? "افتراضي" : "اختياري";

                    return (
                      <option key={account.id || accountId} value={accountId}>
                        {account.name} - {accountId} - {accountCurrency} -{" "}
                        {statusLabel} - {savedLabel} - {activeLabel}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
            </select>
            <span id="facebook-ad-account-help" className="sr-only">
              اختيار الحساب الإعلاني يحدد الحملات والتقارير والمزامنة في هذه
              الصفحة.
            </span>
          </div>

          <button
            type="button"
            onClick={refreshAdAccounts}
            disabled={loading}
            aria-label="تحديث الحسابات الإعلانية من Meta"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60 dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:bg-muted"
          >
            <ArrowPathIcon className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
            تحديث الحسابات
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {typeof error === "string" ? error : String(error)}
        </div>
      )}

      {!loading && adAccounts.length === 0 && !error && (
        <div className="mt-4 rounded-xl border border-warning bg-warning/10 p-3 text-sm text-warning">
          لا توجد حسابات إعلانية ظاهرة لهذا التوكن. اربط حساب Facebook بصلاحيات
          `ads_read` و`ads_management` ثم أعد المحاولة.
        </div>
      )}

      {selectedAdAccount && (
        <div
          className={`mt-4 grid gap-3 ${
            compact ? "grid-cols-1 md:grid-cols-2" : "grid-cols-1 md:grid-cols-4"
          }`}
        >
          <div className="rounded-xl bg-muted p-4 dark:bg-muted">
            <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
              Business
            </p>
            <p className="mt-1 truncate text-sm font-bold text-foreground dark:text-white">
              {selectedAdAccount.business?.name ||
                billingHealth?.business?.name ||
                "غير ظاهر من Meta"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {selectedAdAccount.business?.id ||
                billingHealth?.business?.id ||
                "business_management قد يكون مطلوب"}
            </p>
          </div>

          <div className="rounded-xl bg-muted p-4 dark:bg-muted">
            <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
              حالة الحساب
            </p>
            <p className="mt-1 text-sm font-bold text-foreground dark:text-white">
              {billingHealth?.accountStatusLabel || "غير متاح"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              العملة: {currency}
            </p>
          </div>

          <div className="rounded-xl bg-muted p-4 dark:bg-muted">
            <div className="flex items-center gap-2">
              <CreditCardIcon className="h-5 w-5 text-blue-500" />
              <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                الدفع
              </p>
            </div>
            <p className="mt-1 text-sm font-bold text-foreground dark:text-white">
              {billingHealth?.hasFundingSource ? "وسيلة دفع ظاهرة" : "غير ظاهر"}
            </p>
            <p className="mt-1 truncate text-xs text-muted-foreground">
              {billingHealth?.fundingSourceDisplay || "لا نعرض بيانات بطاقة حساسة"}
            </p>
          </div>

          <div className="rounded-xl bg-muted p-4 dark:bg-muted">
            <div className="flex items-center gap-2">
              <BanknotesIcon className="h-5 w-5 text-success" />
              <p className="text-xs font-semibold text-muted-foreground dark:text-muted-foreground">
                الصرف والحدود
              </p>
            </div>
            <p className="mt-1 text-sm font-bold text-foreground dark:text-white">
              {formatCurrency(billingHealth?.amountSpent, currency)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              حد الحساب: {formatCurrency(billingHealth?.spendCap, currency)}
            </p>
          </div>
        </div>
      )}

      {selectedAdAccount && (
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          <span className="rounded-full bg-blue-50 px-3 py-1 font-medium text-blue-700">
            Pixels: {assetsLoading ? "..." : pixels.length}
          </span>
          <span className="rounded-full bg-success/10 px-3 py-1 font-medium text-success">
            Pages جاهزة: {assetsLoading ? "..." : pagesMeta?.counts?.ready || 0}
          </span>
          <span className="rounded-full bg-muted px-3 py-1 font-medium text-foreground">
            Account ID: {selectedAdAccountId}
          </span>
        </div>
      )}

      {(billingHealth?.warnings || []).length > 0 && (
        <div className="mt-4 space-y-2">
          {billingHealth?.warnings?.map((warning) => (
            <div
              key={warning.code}
              className="flex gap-2 rounded-xl border border-warning bg-warning/10 p-3 text-sm text-warning"
            >
              <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 flex-none" />
              <span>{warning.message}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default FacebookAdsAccountContextPanel;
