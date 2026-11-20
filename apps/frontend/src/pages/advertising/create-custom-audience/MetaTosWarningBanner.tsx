import React from "react";
import {
  ExclamationTriangleIcon,
  ArrowTopRightOnSquareIcon,
} from "@heroicons/react/24/outline";

interface MetaTosWarningBannerProps {
  tosErrorUrl: string | null;
  onDismiss: () => void;
}

export const MetaTosWarningBanner: React.FC<MetaTosWarningBannerProps> = ({
  tosErrorUrl,
  onDismiss,
}) => {
  if (!tosErrorUrl) return null;

  return (
    <div className="rounded-xl border border-warning/80 bg-warning/90 p-4 text-warning shadow-sm">
      <div className="flex items-start gap-3">
        <ExclamationTriangleIcon className="h-6 w-6 text-warning flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-sm">
          <h3 className="font-semibold text-warning">
            مطلوب قبول شروط الجماهير المخصصة (Meta TOS) لهذا الحساب
          </h3>
          <p className="mt-1 text-warning leading-relaxed">
            تفرض سياسة Meta على مدير الحساب الإعلاني قبول اتفاقية شروط خدمة الجماهير المخصصة
            (Custom Audiences Terms of Service) مرة واحدة قبل السماح بإنشاء أو رفع قوائم العملاء عبر واجهة البرمجة (API).
          </p>
          <div className="mt-3 flex items-center gap-3">
            <a
              href={tosErrorUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-warning hover:bg-warning rounded-lg shadow-sm transition-colors"
            >
              <span>قبول الشروط في مدير إعلانات Meta</span>
              <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            </a>
            <button
              type="button"
              onClick={onDismiss}
              className="text-xs text-warning hover:text-warning underline"
            >
              إخفاء التنبيه
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
