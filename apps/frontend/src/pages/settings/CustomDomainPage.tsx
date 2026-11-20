import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Globe,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Loader2,
  HelpCircle,
  RefreshCw,
  Edit2,
  Trash2,
  Link2,
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
  const [disconnectingDomain, setDisconnectingDomain] = useState(false);
  const [verifyingDNS, setVerifyingDNS] = useState(false);
  const [dnsStatus, setDnsStatus] = useState<{
    success: boolean;
    message: string;
    record?: string;
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
    const cleanDomain = customDomain
      .trim()
      .replace(/^https?:\/\//i, "")
      .replace(/\/+$/, "")
      .toLowerCase();

    const domainRegex =
      /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/;
    if (cleanDomain && !domainRegex.test(cleanDomain)) {
      alert(t("customDomain.domainFormatError", "صيغة الدومين غير صحيحة. يجب أن يكون مثل: store.example.com أو example.com"));
      return;
    }

    try {
      setSavingDomain(true);
      const response = await fetch(
        `${getApiUrl()}/companies/${user?.companyId}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ customDomain: cleanDomain || null }),
        },
      );

      const data = await response.json();
      if (data?.success) {
        setCompany((prev: any) => ({
          ...prev,
          customDomain: cleanDomain || null,
        }));
        setCustomDomain(cleanDomain);
        setEditingDomain(false);
        setDnsStatus(null);
        alert(t("customDomain.domainUpdated", "تم حفظ وتحديث الدومين المخصص بنجاح!"));

        // Trigger automatic DNS check if a domain was provided
        if (cleanDomain) {
          setTimeout(() => {
            handleVerifyDNS();
          }, 800);
        }
      } else {
        alert(data.message || data.error || t("customDomain.domainUpdateFailed", "فشل في تحديث الدومين"));
      }
    } catch (error) {
      console.error("Error updating custom domain:", error);
      alert(t("customDomain.domainUpdateError", "حدث خطأ أثناء تحديث الدومين"));
    } finally {
      setSavingDomain(false);
    }
  };

  const handleDisconnectDomain = async () => {
    if (!window.confirm(t("customDomain.confirmDisconnect", "هل أنت متأكد من رغبتك في إلغاء ربط هذا الدومين من متجرك؟"))) {
      return;
    }

    try {
      setDisconnectingDomain(true);
      const response = await fetch(
        `${getApiUrl()}/companies/${user?.companyId}`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({ customDomain: null }),
        },
      );

      const data = await response.json();
      if (data?.success) {
        setCompany((prev: any) => ({
          ...prev,
          customDomain: null,
        }));
        setCustomDomain("");
        setEditingDomain(false);
        setDnsStatus(null);
        alert(t("customDomain.domainDisconnected", "تم إلغاء ربط الدومين بنجاح"));
      } else {
        alert(data.message || data.error || t("customDomain.domainUpdateFailed"));
      }
    } catch (error) {
      console.error("Error disconnecting domain:", error);
      alert(t("customDomain.domainUpdateError"));
    } finally {
      setDisconnectingDomain(false);
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
        record: data?.record,
      });
    } catch (error) {
      console.error("Error verifying DNS:", error);
      setDnsStatus({
        success: false,
        message: t("customDomain.dnsVerifyError", "حدث خطأ أثناء الاتصال بالسيرفر للتحقق من DNS"),
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

  const hasDomain = Boolean(company?.customDomain);

  return (
    <div className="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-background" dir={getDirection()}>
      {/* 1. TOP COMMAND BAR */}
      <header className="h-auto min-h-12 border-b border-border/70 px-3 sm:px-4 py-2 bg-card/95 backdrop-blur-md flex flex-wrap sm:flex-nowrap items-center justify-between gap-2.5 shrink-0 z-10">
        <div className="flex items-center gap-2 min-w-0">
          <Globe className="h-4 w-4 text-primary shrink-0" />
          <h1 className="text-xs sm:text-sm font-bold text-foreground truncate">
            {t("customDomain.pageTitle")}
          </h1>
          <span className="hidden md:inline-block text-[10px] text-muted-foreground font-mono">
            Custom Domain
          </span>
        </div>

        {hasDomain && !editingDomain && (
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleVerifyDNS}
              disabled={verifyingDNS}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold text-primary-foreground bg-primary hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${verifyingDNS ? "animate-spin" : ""}`} />
              <span>{verifyingDNS ? t("customDomain.checking") : t("customDomain.checkDns")}</span>
            </button>
          </div>
        )}
      </header>

      {/* 2. CHASSIS SURFACE BODY */}
      <main className="flex-1 overflow-y-auto min-h-0 bg-background divide-y divide-border/60">
        <div className="p-4 sm:p-5 max-w-4xl space-y-4">
          
          {/* Subcomponent: Steps 1 & 2 */}
          <CustomDomainDnsCard
            cnameTarget={cnameTarget}
            copied={copied}
            onCopy={copyToClipboard}
          />

          {/* Step 3: Domain Connection, Verification Tools & Diagnostics */}
          <div className="p-3.5 sm:p-4 rounded-xl border border-border dark:border-border bg-card shadow-xs space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
                  3
                </span>
                {t("customDomain.step3Title")}
              </h2>

              {hasDomain && !editingDomain && (
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
                    dnsStatus?.success
                      ? "bg-emerald-500/10 text-success dark:text-success border-success/20"
                      : dnsStatus && !dnsStatus.success
                        ? "bg-amber-500/10 text-warning dark:text-warning border-warning/20"
                        : "bg-muted text-muted-foreground border-border/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      dnsStatus?.success
                        ? "bg-emerald-500"
                        : dnsStatus && !dnsStatus.success
                          ? "bg-amber-500"
                          : "bg-muted-foreground"
                    }`}
                  />
                  {dnsStatus?.success
                    ? t("customDomain.statusConnected", "متصل ونشط")
                    : dnsStatus && !dnsStatus.success
                      ? t("customDomain.statusPending", "بانتظار مطابقة الـ DNS")
                      : t("customDomain.currentDomain", "الدومين المرتبط")}
                </span>
              )}
            </div>

            {/* A: Form Mode (When no domain connected OR user clicked edit) */}
            {(!hasDomain || editingDomain) ? (
              <div className="p-3.5 sm:p-4 rounded-xl border border-primary/20 bg-primary/[0.02] space-y-3">
                <div>
                  <label htmlFor="custom-domain-input" className="block text-xs font-semibold text-foreground mb-1">
                    {t("customDomain.customDomainLabel")}
                  </label>
                  <p className="text-[11px] text-muted-foreground">
                    {t("customDomain.enterDomainHelp", "أدخل النطاق الخاص بمتجرك (مثال: store.yourbrand.com أو yourbrand.com)")}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 start-0 flex items-center ps-2.5 pointer-events-none text-muted-foreground text-xs font-mono">
                      https://
                    </div>
                    <input
                      id="custom-domain-input"
                      name="customDomain"
                      type="text"
                      dir="ltr"
                      autoComplete="url"
                      value={customDomain}
                      onChange={(e) => setCustomDomain(e.target.value)}
                      placeholder="store.yourdomain.com"
                      className="w-full ps-16 pe-3 py-2 text-xs font-mono rounded-lg border border-border bg-card text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary shadow-xs"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleCustomDomainSave();
                        }
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCustomDomainSave}
                      disabled={savingDomain || !customDomain.trim()}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50 whitespace-nowrap shadow-xs"
                    >
                      {savingDomain ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>{t("customDomain.saving")}</span>
                        </>
                      ) : (
                        <>
                          <Link2 className="h-3.5 w-3.5" />
                          <span>{t("customDomain.saveAndConnect", "حفظ وربط الدومين")}</span>
                        </>
                      )}
                    </button>

                    {hasDomain && editingDomain && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDomain(false);
                          setCustomDomain(company?.customDomain || "");
                        }}
                        className="px-3.5 py-2 bg-muted text-muted-foreground text-xs font-medium rounded-lg hover:bg-accent transition-colors whitespace-nowrap"
                      >
                        {t("customDomain.cancel")}
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick suggestions */}
                <div className="pt-2 border-t border-border/50 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                  <span className="font-semibold text-foreground">خيارات مقترحة:</span>
                  <button
                    type="button"
                    onClick={() => setCustomDomain("shop.yourdomain.com")}
                    className="px-2 py-0.5 rounded border border-border/70 bg-card hover:bg-muted font-mono transition-colors"
                  >
                    shop.yourdomain.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDomain("store.yourdomain.com")}
                    className="px-2 py-0.5 rounded border border-border/70 bg-card hover:bg-muted font-mono transition-colors"
                  >
                    store.yourdomain.com
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomDomain("yourdomain.com")}
                    className="px-2 py-0.5 rounded border border-border/70 bg-card hover:bg-muted font-mono transition-colors"
                  >
                    yourdomain.com
                  </button>
                </div>
              </div>
            ) : (
              /* B: Domain Connected Card with Full Action Toolset */
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Globe className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[11px] text-muted-foreground block">
                        {t("customDomain.currentDomain")}
                      </span>
                      <div className="text-sm sm:text-base font-bold font-mono text-foreground truncate select-all" dir="ltr">
                        {company.customDomain}
                      </div>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleVerifyDNS}
                      disabled={verifyingDNS}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-all active:scale-[0.97] disabled:opacity-50 shadow-xs"
                      title={t("customDomain.checkDns")}
                    >
                      <RefreshCw className={`h-3.5 w-3.5 ${verifyingDNS ? "animate-spin" : ""}`} />
                      <span>{verifyingDNS ? t("customDomain.checking") : t("customDomain.checkDns", "فحص إعدادات الـ DNS")}</span>
                    </button>

                    <a
                      href={`https://${company.customDomain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-[0.97]"
                    >
                      <span>{t("customDomain.visitSite", "زيارة المتجر")}</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setEditingDomain(true)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-[0.97]"
                      title={t("customDomain.changeDomain")}
                    >
                      <Edit2 className="h-3 w-3" />
                      <span>{t("customDomain.changeDomain", "تعديل")}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDisconnectDomain}
                      disabled={disconnectingDomain}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-destructive/30 bg-destructive/5 hover:bg-destructive/15 text-destructive transition-all active:scale-[0.97] disabled:opacity-50"
                      title={t("customDomain.disconnectDomain")}
                    >
                      {disconnectingDomain ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                      <span>{t("customDomain.disconnectDomain", "إلغاء الربط")}</span>
                    </button>
                  </div>
                </div>

                {/* DNS Check Diagnostics Inspector */}
                {dnsStatus && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2 text-xs ${
                      dnsStatus.success
                        ? "bg-emerald-500/10 text-success dark:text-success border-success/25"
                        : "bg-amber-500/10 text-warning dark:text-warning border-warning/25"
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {dnsStatus.success ? (
                        <CheckCircle2 className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 space-y-1">
                        <p className="font-semibold text-xs">
                          {dnsStatus.success ? "تم التحقق من ربط الدومين بنجاح!" : "تنبيه التحقق من الـ DNS"}
                        </p>
                        <p className="text-[11px] leading-relaxed">
                          {dnsStatus.message}
                        </p>
                        {dnsStatus.record && (
                          <p className="text-[10px] font-mono opacity-80" dir="ltr">
                            Found: {dnsStatus.record}
                          </p>
                        )}
                        {!dnsStatus.success && (
                          <div className="pt-2 border-t border-warning/20 text-[11px] space-y-1">
                            <p className="font-semibold">نصائح سريعة لحل المشكلة:</p>
                            <ul className="list-disc list-inside space-y-0.5 opacity-90">
                              <li>تأكد من حفظ سجل DNS في لوحة تحكم مزود الدومين (Hostinger / GoDaddy / Namecheap / Cloudflare).</li>
                              <li>قد يستغرق انتشار سجلات الـ DNS من 5 إلى 30 دقيقة حول العالم.</li>
                              <li>إذا كنت تستخدم Cloudflare، يمكنك تفعيل الـ Proxy (الأيقونة البرتقالية) أو إيقافها كلاهما مدعوم.</li>
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Step 4: FAQ & Value Props */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="p-3.5 rounded-xl border border-border dark:border-border bg-card shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>{t("customDomain.whyCustomDomain")}</span>
              </h3>
              <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                <li>{t("customDomain.whyList1")}</li>
                <li>{t("customDomain.whyList2")}</li>
                <li>{t("customDomain.whyList3")}</li>
                <li>{t("customDomain.whyList4")}</li>
              </ul>
            </div>

            <div className="p-3.5 rounded-xl border border-border dark:border-border bg-card shadow-xs space-y-2">
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-3.5 w-3.5 text-primary" />
                <span>{t("customDomain.faqTitle")}</span>
              </h3>
              <div className="space-y-2 text-[11px]">
                <div>
                  <p className="font-semibold text-foreground">{t("customDomain.faq1q")}</p>
                  <p className="text-muted-foreground mt-0.5">{t("customDomain.faq1a")}</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">{t("customDomain.faq2q")}</p>
                  <p className="text-muted-foreground mt-0.5">{t("customDomain.faq2a")}</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default CustomDomainPage;
