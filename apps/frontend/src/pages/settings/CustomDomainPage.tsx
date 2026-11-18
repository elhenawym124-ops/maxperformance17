import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  HelpCircle,
  RefreshCw,
  Plus,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuthSimple";
import { getApiUrl } from "../../config/environment";
import tokenManager from "../../utils/tokenManager";
import { getDirection } from "../../i18n";
import { CustomDomainDnsCard } from "./CustomDomainDnsCard";

const getAuthHeaders = (additionalHeaders: Record<string, string> = {}) =>
  tokenManager.createAuthHeaders(additionalHeaders);

export const CustomDomainPage: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [company, setCompany] = useState<any>(user?.company || null);
  const [customDomain, setCustomDomain] = useState(user?.company?.customDomain || "");
  const [editingDomain, setEditingDomain] = useState(false);
  const [savingDomain, setSavingDomain] = useState(false);
  const [verifyingDNS, setVerifyingDNS] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const cnameTarget =
    typeof window !== "undefined" && window.location.hostname
      ? (window.location.hostname.includes("maxp.online")
          ? "maxp.online"
          : window.location.hostname.includes("mokhtarelhenawy.online")
            ? "mokhtarelhenawy.online"
            : window.location.hostname.replace(/^(app|dashboard|admin)\./, ""))
      : "maxp.online";

  useEffect(() => {
    if (user?.company) {
      setCompany(user.company);
      if (!editingDomain) {
        setCustomDomain(user.company.customDomain || "");
      }
    }
  }, [user?.company, editingDomain]);

  useEffect(() => {
    if (user?.companyId) {
      fetchCompanyData();
    }
  }, [user?.companyId]);

  const fetchCompanyData = async () => {
    if (!user?.companyId) return;
    try {
      const response = await fetch(
        `${getApiUrl()}/companies/${user.companyId}`,
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await response.json();
      if (data?.success && data?.data) {
        setCompany(data.data);
        if (!editingDomain) {
          setCustomDomain(data.data.customDomain || "");
        }
      }
    } catch (error) {
      console.error("Error fetching company:", error);
    }
  };

  const handleCustomDomainSave = async () => {
    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (customDomain && !domainRegex.test(customDomain)) {
      alert(t("customDomain.domainFormatError"));
      return;
    }

    try {
      setSavingDomain(true);
      const response = await fetch(
        `${getApiUrl()}/companies/${user?.companyId}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ customDomain: customDomain || null }),
        },
      );

      const data = await response.json();
      if (data?.success) {
        setCompany((prev: any) => ({
          ...prev,
          customDomain: customDomain || null,
        }));
        setEditingDomain(false);
        setDnsStatus(null);
        alert(t("customDomain.domainUpdated"));
      } else {
        alert(data.message || data.error || t("customDomain.domainUpdateFailed"));
      }
    } catch (error) {
      console.error("Error updating custom domain:", error);
      alert(t("customDomain.domainUpdateError"));
    } finally {
      setSavingDomain(false);
    }
  };

  const handleVerifyDNS = async () => {
    if (!user?.companyId) return;

    try {
      setVerifyingDNS(true);
      setDnsStatus(null);
      const response = await fetch(
        `${getApiUrl()}/companies/${user?.companyId}/verify-dns`,
        {
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json();
      setDnsStatus({
        success: Boolean(data?.success),
        message: data?.message || (data?.success ? "تم التحقق بنجاح" : "فشل التحقق من DNS"),
      });
    } catch (error) {
      console.error("Error verifying DNS:", error);
      setDnsStatus({
        success: false,
        message: t("customDomain.dnsVerifyError"),
      });
    } finally {
      setVerifyingDNS(false);
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 sm:py-8" dir={getDirection()}>
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
            <Globe className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t("customDomain.pageTitle")}
          </h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {t("customDomain.pageDescription")}
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1 & 2: DNS Cards */}
        <CustomDomainDnsCard
          cnameTarget={cnameTarget}
          serverIp="153.92.223.119"
          copied={copied}
          onCopy={copyToClipboard}
        />

        {/* Step 3: Domain Addition & Verification */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6">
            <h2 className="w-full text-start text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
                3
              </span>
              {t("customDomain.step3Title")}
            </h2>

            <div className="space-y-4">
              <div>
                {editingDomain ? (
                  <label
                    htmlFor="custom-domain-input"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    {t("customDomain.customDomainLabel")}
                  </label>
                ) : (
                  <span className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t("customDomain.customDomainLabel")}
                  </span>
                )}
                {editingDomain ? (
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      id="custom-domain-input"
                      name="customDomain"
                      type="text"
                      autoComplete="url"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="example.com"
                      className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white outline-none text-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCustomDomainSave}
                        disabled={savingDomain}
                        className="flex-1 sm:flex-initial px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors whitespace-nowrap shadow-xs active:scale-[0.97]"
                      >
                        {savingDomain ? t("customDomain.saving") : t("customDomain.save")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDomain(false);
                          setCustomDomain(company?.customDomain || "");
                        }}
                        className="flex-1 sm:flex-initial px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors whitespace-nowrap"
                      >
                        {t("customDomain.cancel")}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3.5 rounded-lg border border-gray-100 dark:border-gray-700/60 bg-gray-50/70 dark:bg-gray-900/40">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                        {t("customDomain.currentDomain")}
                      </p>
                      <p className="text-base sm:text-lg font-bold font-mono text-gray-900 dark:text-white">
                        {company?.customDomain || t("customDomain.noDomainConnected")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditingDomain(true)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-indigo-600 dark:text-indigo-400 font-medium text-sm hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800/50 bg-white dark:bg-gray-800 shadow-xs active:scale-[0.97]"
                    >
                      <Plus className="h-4 w-4" />
                      <span>{company?.customDomain ? t("customDomain.changeDomain") : t("customDomain.addDomain")}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* In-Place DNS Verification Controls */}
              {company?.customDomain && !editingDomain && (
                <div className="pt-4 border-t border-gray-100 dark:border-gray-700 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <button
                      type="button"
                      onClick={handleVerifyDNS}
                      disabled={verifyingDNS}
                      className="flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg disabled:opacity-50 transition-all shadow-xs active:scale-[0.97]"
                    >
                      <RefreshCw className={`h-4 w-4 ${verifyingDNS ? "animate-spin" : ""}`} />
                      <span>
                        {verifyingDNS
                          ? t("customDomain.checking")
                          : t("customDomain.checkDns")}
                      </span>
                    </button>

                    {dnsStatus && (
                      <div
                        className={`flex items-center gap-2 text-sm font-medium ${
                          dnsStatus.success
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {dnsStatus.success ? (
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                        ) : (
                          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0" />
                        )}
                        <span>{dnsStatus.message}</span>
                      </div>
                    )}
                  </div>

                  {/* Prominent Success Banner with Visit Link */}
                  {dnsStatus?.success && (
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
                              {t("customDomain.dnsVerified")}
                            </p>
                            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">
                              {t("customDomain.dnsVerifiedDesc", { domain: company?.customDomain })}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`https://${company?.customDomain}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap self-start sm:self-auto active:scale-[0.97]"
                        >
                          <span>{t("customDomain.visitSite")}</span>
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Helpful Tips & FAQ Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>{t("customDomain.whyCustomDomain")}</span>
            </h3>
            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-2.5">
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{t("customDomain.whyList1")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{t("customDomain.whyList2")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{t("customDomain.whyList3")}</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                <span>{t("customDomain.whyList4")}</span>
              </li>
            </ul>
          </div>

          <div className="p-5 sm:p-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xs space-y-3">
            <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2 text-sm">
              <HelpCircle className="h-5 w-5 text-indigo-500 shrink-0" />
              <span>{t("customDomain.faqTitle")}</span>
            </h3>
            <div className="space-y-3.5">
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {t("customDomain.faq1q")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t("customDomain.faq1a")}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {t("customDomain.faq2q")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t("customDomain.faq2a")}
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CustomDomainPage;
