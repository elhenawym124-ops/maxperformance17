import React from "react";
import { useTranslation } from "react-i18next";
import { Instagram, CheckCircle2, Globe } from "lucide-react";

interface InstagramIdentitySelectorProps {
  pageName?: string;
  instagramActorId: string;
  onInstagramActorIdChange: (val: string) => void;
}

export const InstagramIdentitySelector: React.FC<InstagramIdentitySelectorProps> = ({
  pageName,
  instagramActorId,
  onInstagramActorIdChange,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));
  const isUsingPageIdentity = !instagramActorId;

  return (
    <div className="space-y-2 pt-1">
      <label className="block text-xs font-semibold text-foreground">
        {isEn
          ? "Instagram Account Identity"
          : "هوية الحساب على إنستجرام (Instagram Account Identity)"}
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => onInstagramActorIdChange("")}
          className={`p-2.5 rounded-xl border ${isEn ? "text-left" : "text-right"} transition-all flex items-center justify-between ${
            isUsingPageIdentity
              ? "border-pink-500 bg-primary/50 dark:bg-primary/30 text-foreground shadow-xs"
              : "border-gray-200 dark:border-border bg-card hover:border-border text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary dark:bg-primary/60 text-primary dark:text-primary">
              <Instagram className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                {isEn ? "Use Facebook Page" : "استخدام صفحة فيسبوك"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {pageName
                  ? `@${pageName.replace(/\s+/g, "_").toLowerCase()}`
                  : isEn
                    ? "Appear using Facebook Page identity on IG"
                    : "ظهور بهوية الصفحة على IG"}
              </div>
            </div>
          </div>
          {isUsingPageIdentity && (
            <CheckCircle2 className="w-4 h-4 text-primary dark:text-primary shrink-0" />
          )}
        </button>

        <button
          type="button"
          onClick={() => onInstagramActorIdChange(instagramActorId || "manual_ig")}
          className={`p-2.5 rounded-xl border ${isEn ? "text-left" : "text-right"} transition-all flex items-center justify-between ${
            !isUsingPageIdentity
              ? "border-pink-500 bg-primary/50 dark:bg-primary/30 text-foreground shadow-xs"
              : "border-gray-200 dark:border-border bg-card hover:border-border text-muted-foreground"
          }`}
        >
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-muted text-foreground">
              <Globe className="w-3.5 h-3.5" />
            </div>
            <div>
              <div className="text-xs font-bold text-foreground">
                {isEn ? "Custom Instagram Account" : "حساب إنستجرام مخصص"}
              </div>
              <div className="text-[10px] text-muted-foreground">
                {isEn ? "Enter connected IG Account ID" : "إدخال معرف حساب IG مربوط"}
              </div>
            </div>
          </div>
          {!isUsingPageIdentity && (
            <CheckCircle2 className="w-4 h-4 text-primary dark:text-primary shrink-0" />
          )}
        </button>
      </div>

      {!isUsingPageIdentity && (
        <div className="pt-1.5">
          <input
            type="text"
            value={instagramActorId === "manual_ig" ? "" : instagramActorId}
            onChange={(e) => onInstagramActorIdChange(e.target.value)}
            placeholder={
              isEn
                ? "Enter connected Instagram Actor ID"
                : "أدخل معرف حساب إنستجرام المربوط (Instagram Actor ID)"
            }
            className="w-full px-3 py-2 border border-border bg-card text-foreground placeholder-muted dark:placeholder-muted rounded-lg text-xs focus:ring-2 focus:ring-primary"
          />
        </div>
      )}
    </div>
  );
};
