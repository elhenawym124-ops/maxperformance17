import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Clock, ExternalLink, MapPin, MessageCircle, Phone } from "lucide-react";
import { useStorefrontSettings } from "../../hooks/useStorefrontSettings";
import { useStorefrontTheme } from "../../engine/ThemeProvider";
import { buildStorefrontPath } from "../../utils/paths";
import "../../styles/academy-stage.css";

interface BranchItem {
  code?: string;
  name: string;
  city?: string;
  address: string;
  hours?: string;
  labsSummary?: string;
  phone?: string;
  whatsapp?: string;
  mapUrl?: string;
  paneVariant?: string;
}

const DEFAULT_BRANCHES: BranchItem[] = [
  {
    code: "01",
    name: "المقر التعليمي المباشر",
    city: "حضور عملي",
    address: "معامل مجهزة بأجهزة الحاسب وأطقم Micro:bit و Arduino للتجربة المباشرة.",
    hours: "السبت – الخميس | 10:00 ص – 9:00 م",
    labsSummary: "مجموعات صغيرة 6–8 طلاب",
    paneVariant: "glazier-pane-cobalt",
  },
  {
    code: "02",
    name: "الأكاديمية التفاعلية أونلاين",
    city: "بث مباشر Zoom",
    address: "فصول تفاعلية أونلاين بمتابعة حية من المحاضر ومشاركة الشاشة والتطبيق الفوري.",
    hours: "مواعيد صباحية ومسائية طوال الأسبوع",
    labsSummary: "تقارير تقدم لولي الأمر بعد كل وحدة",
    paneVariant: "glazier-pane-emerald",
  },
];

const toWhatsAppHref = (rawPhone?: string, text?: string): string => {
  const digits = String(rawPhone || "").replace(/[^\d]/g, "");
  if (!digits) return "";
  const formatted = digits.startsWith("01") && digits.length === 11 ? `20${digits.slice(1)}` : digits;
  const query = text ? `?text=${encodeURIComponent(text)}` : "";
  return `https://wa.me/${formatted}${query}`;
};

export interface GlazierBranchesSectionProps {
  section?: {
    variant?: string;
    [key: string]: unknown;
  };
  settings?: {
    title?: string;
    subtitle?: string;
    body?: string;
    phone?: string;
    whatsappPhone?: string;
    facebookUrl?: string;
    branches?: BranchItem[];
    [key: string]: unknown;
  };
}

/**
 * Architectural Glazier Branches & Direct Contact grid for the /contact page.
 * Renders real branch addresses, hours, map links, phone lines, and WhatsApp channels cleanly.
 */
export const GlazierBranchesSection: React.FC<GlazierBranchesSectionProps> = ({
  settings,
}) => {
  const location = useLocation();
  const { theme } = useStorefrontTheme();
  const isGenericEdu = theme?.id === "edu-academy-pro";
  const { settings: storefrontSettings } = useStorefrontSettings();

  const companyPhone =
    (typeof settings?.phone === "string" && settings.phone.trim()) ||
    storefrontSettings?.company?.phone ||
    "";
  const whatsappNumber =
    (typeof settings?.whatsappPhone === "string" && settings.whatsappPhone.trim()) ||
    (storefrontSettings?.storefront?.settings?.["whatsappPhone"] as string) ||
    companyPhone;
  const facebookUrl =
    (typeof settings?.facebookUrl === "string" && settings.facebookUrl.trim()) || "";

  const configuredBranches = Array.isArray(settings?.branches) && settings.branches.length > 0
    ? settings.branches
    : null;

  const branches: BranchItem[] = configuredBranches
    ? configuredBranches
    : storefrontSettings?.company?.address
      ? [
          {
            code: "01",
            name: storefrontSettings.company.name || "المقر الرئيسي",
            city: "حضور مباشر",
            address: storefrontSettings.company.address,
            phone: companyPhone,
            whatsapp: whatsappNumber,
            hours: "السبت – الخميس | 10:00 ص – 9:00 م",
            paneVariant: "glazier-pane-cobalt",
          },
          DEFAULT_BRANCHES[1],
        ]
      : DEFAULT_BRANCHES;

  const primaryWaHref = toWhatsAppHref(
    whatsappNumber,
    `مرحباً فريق ${storefrontSettings?.company?.name || "الأكاديمية"}، أرغب في الاستفسار عن المواعيد والمستويات.`,
  );

  const title =
    typeof settings?.title === "string" && settings.title.trim()
      ? settings.title.trim()
      : "تواصل مع الأكاديمية ومقار الحضور";
  const subtitle =
    typeof settings?.subtitle === "string" && settings.subtitle.trim()
      ? settings.subtitle.trim()
      : "فريقنا جاهز للإجابة عن استفسارات أولياء الأمور وتحديد أنسب فرع أو موعد أونلاين.";

  return (
    <section aria-label={title} className="glazier-scope glazier-b w-full" dir="rtl">
      <div className="max-w-7xl mx-auto glazier-xl-x">
        {/* Header Bay */}
        <div className="glazier-b glazier-seeded p-6 sm:p-10 lg:p-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
            <div className="lg:col-span-8 space-y-3">
              <h1 className="glazier-heading text-2xl sm:text-3xl lg:text-4xl font-bold leading-snug">
                {title}
              </h1>
              <p className="glazier-muted text-sm sm:text-base leading-relaxed max-w-2xl">
                {subtitle}
              </p>
            </div>
            <div className="lg:col-span-4 flex flex-wrap lg:justify-end gap-2">
              {primaryWaHref ? (
                <a
                  href={primaryWaHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glazier-pane-emerald glazier-frame inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  <span>تحدث عبر واتساب</span>
                </a>
              ) : null}
              <Link
                to={buildStorefrontPath(location.pathname, "/registration", location.search)}
                className="glazier-pane-cobalt glazier-frame inline-flex min-h-[46px] items-center gap-2 px-5 py-2.5 text-sm font-bold whitespace-nowrap"
              >
                <span>احجز تقييم مجاني</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        {/* Steel-Mullioned Branch Grid */}
        <div
          className={`glazier-b grid grid-cols-1 ${
            branches.length >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2"
          }`}
        >
          {branches.map((branch, idx) => {
            const branchWa = toWhatsAppHref(
              branch.whatsapp || whatsappNumber,
              `استفسار بخصوص ${branch.name}`,
            );
            const branchPhone = branch.phone || companyPhone;

            return (
              <article
                key={`${branch.name}-${idx}`}
                className={`glazier-clear p-6 sm:p-8 flex flex-col justify-between gap-6 ${
                  idx < branches.length - 1 ? "glazier-b lg:border-b-0 glazier-lg-e" : ""
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`${
                        branch.paneVariant || "glazier-pane-cobalt"
                      } glazier-frame px-2.5 py-1 text-xs font-mono tabular-nums font-bold`}
                    >
                      <bdi dir="ltr">{branch.code || `0${idx + 1}`}</bdi>
                    </span>
                    {branch.city ? (
                      <span className="glazier-muted text-xs font-bold">{branch.city}</span>
                    ) : null}
                  </div>

                  <h2 className="glazier-heading text-xl font-bold leading-snug">
                    {branch.name}
                  </h2>

                  <div className="space-y-2.5 text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="h-4 w-4 shrink-0 mt-1 glazier-muted" aria-hidden="true" />
                      <p className="glazier-muted leading-relaxed">{branch.address}</p>
                    </div>
                    {branch.hours ? (
                      <div className="flex items-start gap-2.5">
                        <Clock className="h-4 w-4 shrink-0 mt-1 glazier-muted" aria-hidden="true" />
                        <p className="glazier-muted leading-relaxed">{branch.hours}</p>
                      </div>
                    ) : null}
                    {branch.labsSummary ? (
                      <div className="glazier-seeded glazier-frame px-3 py-2 text-xs font-bold">
                        {branch.labsSummary}
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  {branch.mapUrl ? (
                    <a
                      href={branch.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glazier-seeded glazier-frame inline-flex min-h-[42px] items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                    >
                      <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>الخريطة</span>
                    </a>
                  ) : null}
                  {branchPhone ? (
                    <a
                      href={`tel:${branchPhone.replace(/[^\d+]/g, "")}`}
                      className="glazier-clear glazier-frame inline-flex min-h-[42px] items-center gap-1.5 px-3.5 py-2 text-xs font-mono tabular-nums font-bold"
                    >
                      <Phone className="h-3.5 w-3.5" aria-hidden="true" />
                      <bdi dir="ltr">{branchPhone}</bdi>
                    </a>
                  ) : null}
                  {branchWa ? (
                    <a
                      href={branchWa}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="glazier-pane-cobalt glazier-frame inline-flex min-h-[42px] items-center gap-1.5 px-3.5 py-2 text-xs font-bold"
                    >
                      <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>واتساب الفرع</span>
                    </a>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>

        {/* Bottom Direct Channels Strip */}
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="glazier-seeded p-6 sm:p-8 glazier-b md:border-b-0 glazier-md-e flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <h3 className="glazier-heading text-lg font-bold">استشارة اختيار المستوى مجاناً</h3>
              <p className="glazier-muted text-sm leading-relaxed">
                {isGenericEdu
                  ? "أخبرنا بعمر الطالب وخلفيته الدراسية لنرشح لك أنسب مسار ومجموعة."
                  : "أخبرنا بعمر الطالب وهل لديه تجربة سابقة في Scratch أو Python لنرشح لك أنسب مجموعة."}
              </p>
            </div>
            <div>
              <Link
                to={buildStorefrontPath(location.pathname, "/registration", location.search)}
                className="glazier-pane-berry glazier-frame inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold"
              >
                <span>انتقل لنموذج الحجز السريع</span>
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="glazier-clear p-6 sm:p-8 flex flex-col justify-between gap-4">
            <div className="space-y-1">
              <h3 className="glazier-heading text-lg font-bold">متابعة أعمال الطلاب والصفحة الرسمية</h3>
              <p className="glazier-muted text-sm leading-relaxed">
                {isGenericEdu
                  ? "تابع أنشطة الطلاب، جدول الدورات، وورش العمل الأسبوعية في الفروع وأونلاين."
                  : "تابع مشروعات Demo Day، جدول المسابقات، وورش العمل الأسبوعية في مقار الأكاديمية وأونلاين."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {facebookUrl ? (
                <a
                  href={facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="glazier-frame glazier-seeded inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold"
                >
                  <span>صفحة فيسبوك الرسمية</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              ) : null}
              <Link
                to={buildStorefrontPath(location.pathname, "/shop", location.search)}
                className="glazier-frame glazier-clear inline-flex min-h-[44px] items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold"
              >
                <span>{isGenericEdu ? "تصفح البرامج والباقات" : "تصفح الـ 15 مستوى والباقات"}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
