import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ShieldCheck,
  ArrowLeftRight,
  Copy,
  Check,
  Info,
  Server,
  Layers,
} from "lucide-react";

interface CustomDomainDnsCardProps {
  cnameTarget: string;
  serverIp?: string;
  copied: string | null;
  onCopy: (text: string, key: string) => void;
}

export const CustomDomainDnsCard: React.FC<CustomDomainDnsCardProps> = ({
  cnameTarget,
  serverIp = "153.92.223.119",
  copied,
  onCopy,
}) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<"subdomain" | "root">("subdomain");

  return (
    <div className="space-y-4">
      {/* Requirements Strip */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border dark:border-border bg-card shadow-xs">
        <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2.5 flex items-center gap-2">
          <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
            1
          </span>
          {t("customDomain.step1Title")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
            <ShieldCheck className="h-4 w-4 text-success shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("customDomain.domainRegistered")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("customDomain.domainRegisteredDesc", "يجب أن تكون اشتريت الدومين من مزود مثل Hostinger أو GoDaddy أو Namecheap.")}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2.5 p-2.5 rounded-lg border border-border/50 bg-muted/20">
            <ArrowLeftRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-foreground">
                {t("customDomain.dnsAccess")}
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {t("customDomain.dnsAccessDesc")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* DNS Configuration Strip */}
      <div className="p-3.5 sm:p-4 rounded-xl border border-border dark:border-border bg-card shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <span className="shrink-0 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-mono">
              2
            </span>
            {t("customDomain.step2Title")}
          </h2>

          {/* Subdomain vs Root Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg border border-border/70 bg-muted/40 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab("subdomain")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "subdomain"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="h-3 w-3" />
              <span>{t("customDomain.subdomainOption", "نطاق فرعي (موصى به)")}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("root")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-md transition-all ${
                activeTab === "root"
                  ? "bg-card text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Server className="h-3 w-3" />
              <span>{t("customDomain.rootOption", "نطاق رئيسي (مباشر)")}</span>
            </button>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">
          {activeTab === "subdomain"
            ? t("customDomain.subdomainDesc", "مثال: shop أو store أو www - الأسهل والأسرع للتفعيل عبر سجل CNAME:")
            : t("customDomain.rootDesc", "مثال: yourdomain.com مباشرة بدون كلمة قبله عبر سجل A Record يشير للسيرفر:")}
        </p>

        {activeTab === "subdomain" ? (
          /* CNAME Subdomain Record Box */
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Record Type & Host */}
              <div className="sm:col-span-5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
                  CNAME
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Host: <strong className="text-foreground">shop</strong> أو <strong className="text-foreground">store</strong> أو <strong className="text-foreground">www</strong>
                </span>
              </div>

              {/* Value / Target */}
              <div className="sm:col-span-7 flex items-center gap-2">
                <code
                  dir="ltr"
                  className="flex-1 truncate px-2.5 py-1 text-xs font-mono rounded border border-border/80 bg-background text-foreground select-all"
                >
                  {cnameTarget}
                </code>
                <button
                  type="button"
                  onClick={() => onCopy(cnameTarget, "cname")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-[0.97] shrink-0"
                  title="نسخ القيمة"
                >
                  {copied === "cname" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span className="text-emerald-600 dark:text-success font-medium">تم النسخ</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{t("customDomain.copyCname", "نسخ")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* A Record Root Domain Box */
          <div className="p-3 rounded-lg border border-border/60 bg-muted/20 space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
              {/* Record Type & Host */}
              <div className="sm:col-span-5 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-warning/10 text-warning dark:text-warning border border-warning/20 shrink-0">
                  A Record
                </span>
                <span className="text-xs font-mono text-muted-foreground">
                  Host: <strong className="text-foreground">@</strong> (أو اتركه فارغاً)
                </span>
              </div>

              {/* Value / Server IP */}
              <div className="sm:col-span-7 flex items-center gap-2">
                <code
                  dir="ltr"
                  className="flex-1 truncate px-2.5 py-1 text-xs font-mono rounded border border-border/80 bg-background text-foreground select-all"
                >
                  {serverIp}
                </code>
                <button
                  type="button"
                  onClick={() => onCopy(serverIp, "serverIp")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-border/80 bg-card hover:bg-muted text-foreground transition-all active:scale-[0.97] shrink-0"
                  title="نسخ الـ IP"
                >
                  {copied === "serverIp" ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" />
                      <span className="text-emerald-600 dark:text-success font-medium">{t("customDomain.ipCopied", "تم النسخ")}</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{t("customDomain.copyIp", "نسخ الـ IP")}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-[11px] text-muted-foreground bg-muted/10 p-2 rounded-lg border border-border/40">
          <Info className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
          <p>{t("customDomain.dnsNote")}</p>
        </div>
      </div>
    </div>
  );
};
