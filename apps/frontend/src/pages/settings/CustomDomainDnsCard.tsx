import React from "react";
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

  return (
    <div className="space-y-6">
      {/* Step 1: Explanation & Requirements */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="w-full text-start text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
              1
            </span>
            {t("customDomain.step1Title")}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3 py-2 sm:py-3 border-b md:border-b-0 md:border-e border-gray-100 dark:border-gray-700 pe-0 md:pe-4">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("customDomain.domainRegistered")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t("customDomain.domainRegisteredDesc", "يجب أن تكون اشتريت الدومين من مزود مثل Hostinger أو GoDaddy أو Namecheap.")}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 py-2 sm:py-3 ps-0 md:ps-2">
              <ArrowLeftRight className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {t("customDomain.dnsAccess")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                  {t("customDomain.dnsAccessDesc")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: DNS Configuration */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xs border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 sm:p-6">
          <h2 className="w-full text-start text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold">
              2
            </span>
            {t("customDomain.step2Title")}
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
            {t("customDomain.dnsStepDesc")}
          </p>

          <div className="space-y-4">
            {/* Record 1: CNAME for www / subdomain */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3.5 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  سجل CNAME (الموصى به للنطاق الفرعي مثل www أو store)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wider">
                    CNAME
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                    www
                  </span>
                </div>

                <div className="sm:col-span-5 min-w-0">
                  <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <code
                      dir="ltr"
                      className="w-full truncate text-left font-mono text-xs sm:text-sm text-gray-900 dark:text-white select-all"
                    >
                      {cnameTarget}
                    </code>
                  </div>
                </div>

                <div className="sm:col-span-3 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onCopy(cnameTarget, "cname")}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 min-h-9 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs sm:text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors shadow-xs active:scale-[0.97]"
                  >
                    {copied === "cname" ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          {t("customDomain.cnameCopied")}
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0 text-gray-400" />
                        <span>{t("customDomain.copyCname")}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Record 2: A Record for @ (Root/Apex domain) */}
            <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-3.5 sm:p-4">
              <div className="flex items-center gap-2 mb-2">
                <Server className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  سجل A (للنطاق المباشر الرئيسي مثل yourdomain.com بدون www)
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                <div className="sm:col-span-4 flex items-center gap-2.5">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wider">
                    A
                  </span>
                  <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 font-mono">
                    @
                  </span>
                </div>

                <div className="sm:col-span-5 min-w-0">
                  <div className="flex items-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <code
                      dir="ltr"
                      className="w-full truncate text-left font-mono text-xs sm:text-sm text-gray-900 dark:text-white select-all"
                    >
                      {serverIp}
                    </code>
                  </div>
                </div>

                <div className="sm:col-span-3 flex sm:justify-end">
                  <button
                    type="button"
                    onClick={() => onCopy(serverIp, "a_record")}
                    className="inline-flex w-full sm:w-auto items-center justify-center gap-1.5 min-h-9 px-3.5 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 text-xs sm:text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors shadow-xs active:scale-[0.97]"
                  >
                    {copied === "a_record" ? (
                      <>
                        <Check className="h-4 w-4 text-emerald-500 shrink-0" />
                        <span className="text-emerald-600 dark:text-emerald-400">
                          تم نسخ عنوان IP
                        </span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 shrink-0 text-gray-400" />
                        <span>نسخ عنوان IP</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Hostinger & Provider Guidance */}
            <div className="p-3.5 rounded-lg border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 text-xs text-indigo-900 dark:text-indigo-200 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <Info className="h-4 w-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>إرشاد لربط الدومين في لوحة Hostinger أو مزودي الـ DNS:</span>
              </p>
              <ul className="list-disc list-inside space-y-1 text-indigo-800 dark:text-indigo-300 ps-1 leading-relaxed">
                <li>في قسم <strong>Manage DNS records</strong>، اختر نوع السجل <strong>CNAME</strong>، واكتب في Name: <strong>www</strong>، وفي القيمة (Value): <strong>{cnameTarget}</strong> ثم اضغط Add Record.</li>
                <li>لتوجيه الدومين المباشر (مثل نطاقك الرئيسي بدون www)، أضف سجلاً من نوع <strong>A</strong>، واكتب في Name: <strong>@</strong>، وفي القيمة (Value): <strong>{serverIp}</strong> ثم اضغط Add Record.</li>
              </ul>
            </div>

            {/* DNS Propagation Note */}
            <div className="pt-2 flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Info className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                {t("customDomain.dnsNote")}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
