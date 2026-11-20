import React from "react";
import { useTranslation } from "react-i18next";
import { Plus, Trash2, Sparkles, HelpCircle } from "lucide-react";
import type { TextVariation, HeadlineVariation } from "../types";

interface AdCopyVariationsEditorProps {
  primaryText: string;
  onPrimaryTextChange: (val: string) => void;
  textVariations: TextVariation[];
  onTextVariationsChange: (variations: TextVariation[]) => void;
  headline: string;
  onHeadlineChange: (val: string) => void;
  headlineVariations: HeadlineVariation[];
  onHeadlineVariationsChange: (variations: HeadlineVariation[]) => void;
  primaryTextError?: string;
}

const getPrimaryTextHookSuggestions = (isEn: boolean) =>
  isEn
    ? [
        {
          label: "Exclusive limited-time discount",
          text: "🔥 Special limited-time discount! Order now and take advantage of the offer before stocks run out.",
        },
        {
          label: "Solve the problem directly",
          text: "Looking for top quality and competitive pricing? We've got the ideal solution with full warranty.",
        },
        {
          label: "Fast shipping & cash on delivery",
          text: "🚚 Fast delivery to all regions with cash on delivery & inspection upon receipt!",
        },
      ]
    : [
        {
          label: "خصم حصري لفترة محدودة",
          text: "🔥 خصم خاص لفترة محدودة! اطلب الآن واستفد من العرض قبل نفاد الكمية.",
        },
        {
          label: "حل المشكلة مباشرة",
          text: "هل تبحث عن أفضل جودة وسعر منافس؟ وفرنا لك الحل الأمثل بضمان كامل.",
        },
        {
          label: "شحن سريع ودفع عند الاستلام",
          text: "🚚 التوصيل لجميع المحافظات مع إمكانية المعاينة والدفع عند الاستلام!",
        },
      ];

const getHeadlineSuggestions = (isEn: boolean) =>
  isEn
    ? [
        "30% Off Today Only ⚡",
        "Free Inspection & Cash on Delivery",
        "Best Seller - Order Now 🛒",
        "100% Guaranteed Original Quality",
      ]
    : [
        "خصم 30% اليوم فقط ⚡",
        "الدفع عند الاستلام والمعاينة مجاناً",
        "الأكثر مبيعاً - اطلب الآن 🛒",
        "جودة أصلية مضمونة 100%",
      ];

export const AdCopyVariationsEditor: React.FC<AdCopyVariationsEditorProps> = ({
  primaryText,
  onPrimaryTextChange,
  textVariations,
  onTextVariationsChange,
  headline,
  onHeadlineChange,
  headlineVariations,
  onHeadlineVariationsChange,
  primaryTextError,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));

  const primaryTextHookSuggestions = React.useMemo(
    () => getPrimaryTextHookSuggestions(isEn),
    [isEn],
  );
  const headlineSuggestions = React.useMemo(
    () => getHeadlineSuggestions(isEn),
    [isEn],
  );

  const MAX_VARIATIONS = 4; // 1 base + 4 variations = 5 total (Meta standard)

  const handleAddTextVariation = (prefill = "") => {
    if (textVariations.length >= MAX_VARIATIONS) return;
    const newVariation: TextVariation = {
      id: `text_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: prefill,
    };
    onTextVariationsChange([...textVariations, newVariation]);
  };

  const handleUpdateTextVariation = (id: string, text: string) => {
    onTextVariationsChange(
      textVariations.map((v) => (v.id === id ? { ...v, text } : v)),
    );
  };

  const handleRemoveTextVariation = (id: string) => {
    onTextVariationsChange(textVariations.filter((v) => v.id !== id));
  };

  const handleAddHeadlineVariation = (prefill = "") => {
    if (headlineVariations.length >= MAX_VARIATIONS) return;
    const newVariation: HeadlineVariation = {
      id: `hl_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      text: prefill,
    };
    onHeadlineVariationsChange([...headlineVariations, newVariation]);
  };

  const handleUpdateHeadlineVariation = (id: string, text: string) => {
    onHeadlineVariationsChange(
      headlineVariations.map((v) => (v.id === id ? { ...v, text } : v)),
    );
  };

  const handleRemoveHeadlineVariation = (id: string) => {
    onHeadlineVariationsChange(headlineVariations.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* Primary Text Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-foreground dark:text-muted-foreground">
            {isEn ? "Primary Text" : "النص الأساسي (Primary Text)"} <span className="text-red-500">*</span>
          </label>
          <span className="text-xs text-primary dark:text-primary font-medium">
            {textVariations.length + 1} {isEn ? "of 5 texts" : "من 5 نصوص"}
          </span>
        </div>

        {/* Base Primary Text */}
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {isEn ? "Text 1 (Primary)" : "النص 1 (الرئيسي)"}
            </span>
            <span className="text-xs text-muted-foreground/80">{primaryText.length}/125</span>
          </div>
          <textarea
            value={primaryText}
            onChange={(e) => onPrimaryTextChange(e.target.value)}
            placeholder={
              isEn
                ? "Write an engaging primary text for your ad..."
                : "اكتب النص الرئيسي الجذاب لإعلانك..."
            }
            rows={3}
            maxLength={160}
            className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary transition-colors text-sm bg-card text-foreground placeholder-muted dark:placeholder-muted ${
              primaryTextError ? "border-red-500" : "border-border"
            }`}
          />
          {primaryTextError && (
            <p className="mt-1 text-xs text-destructive">{primaryTextError}</p>
          )}
        </div>

        {/* Quick Hook Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-warning" />
            {isEn ? "Quick angles:" : "زوايا سريعة:"}
          </span>
          {primaryTextHookSuggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!primaryText.trim()) {
                  onPrimaryTextChange(s.text);
                } else if (textVariations.length < MAX_VARIATIONS) {
                  handleAddTextVariation(s.text);
                }
              }}
              className="text-[11px] px-2.5 py-1 bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground rounded-lg transition-colors"
            >
              + {s.label}
            </button>
          ))}
        </div>

        {/* Additional Text Variations */}
        {textVariations.map((variation, index) => (
          <div
            key={variation.id}
            className="p-3 bg-primary/50 dark:bg-primary/30 border border-primary/70 dark:border-primary/60 rounded-xl space-y-2 relative group"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary dark:text-primary">
                {isEn
                  ? `Text ${index + 2} (Alternative angle test)`
                  : `النص ${index + 2} (اختبار زاوية بديلة)`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/80">
                  {variation.text.length}/125
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveTextVariation(variation.id)}
                  className="p-1 text-destructive hover:bg-destructive dark:hover:bg-destructive/40 rounded-lg transition-colors"
                  title={isEn ? "Delete this text" : "حذف هذا النص"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <textarea
              value={variation.text}
              onChange={(e) =>
                handleUpdateTextVariation(variation.id, e.target.value)
              }
              placeholder={
                isEn
                  ? "Write an additional text angle (e.g., focus on price, shipping, or customer reviews)..."
                  : "اكتب زاوية نص إضافية (مثال: التركيز على السعر، التوصيل، أو آراء العملاء)..."
              }
              rows={2}
              maxLength={160}
              className="w-full px-3 py-2 border border-primary dark:border-primary rounded-lg text-sm bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}

        {textVariations.length < MAX_VARIATIONS && (
          <button
            type="button"
            onClick={() => handleAddTextVariation()}
            className="w-full py-2.5 border border-dashed border-primary dark:border-primary hover:border-primary bg-primary/30 dark:bg-primary/20 hover:bg-primary/10 dark:hover:bg-primary/40 rounded-xl text-primary dark:text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isEn
              ? "+ Add another primary text option (up to 5 texts to test multiple angles)"
              : "+ إضافة خيار نص أساسي آخر (حتى 5 نصوص لتجربة زوايا متعددة)"}
          </button>
        )}
      </div>

      {/* Headline Section */}
      <div className="space-y-3 border-t border-border dark:border-border pt-4">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-semibold text-foreground dark:text-muted-foreground">
            {isEn ? "Headline" : "العنوان الرئيسي (Headline)"}
          </label>
          <span className="text-xs text-primary dark:text-primary font-medium">
            {headlineVariations.length + 1} {isEn ? "of 5 headlines" : "من 5 عناوين"}
          </span>
        </div>

        {/* Base Headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground font-medium">
              {isEn ? "Headline 1 (Primary)" : "العنوان 1 (الرئيسي)"}
            </span>
            <span className="text-xs text-muted-foreground/80">{headline.length}/40</span>
          </div>
          <input
            type="text"
            value={headline}
            onChange={(e) => onHeadlineChange(e.target.value)}
            placeholder={
              isEn
                ? "Catchy headline displayed next to call-to-action button..."
                : "عنوان جذاب يظهر بجانب زر الإجراء..."
            }
            maxLength={50}
            className="w-full px-4 py-2.5 border border-border bg-card text-foreground placeholder-muted dark:placeholder-muted rounded-xl text-sm focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Headline Suggestions */}
        <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
          <span className="text-[11px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-primary" />
            {isEn ? "Suggested headlines:" : "عناوين مقترحة:"}
          </span>
          {headlineSuggestions.map((h, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (!headline.trim()) {
                  onHeadlineChange(h);
                } else if (headlineVariations.length < MAX_VARIATIONS) {
                  handleAddHeadlineVariation(h);
                }
              }}
              className="text-[11px] px-2.5 py-1 bg-primary/10 dark:bg-primary/40 hover:bg-primary dark:hover:bg-primary/40 text-primary dark:text-primary rounded-lg transition-colors"
            >
              + {h}
            </button>
          ))}
        </div>

        {/* Additional Headline Variations */}
        {headlineVariations.map((variation, index) => (
          <div
            key={variation.id}
            className="p-3 bg-primary/40 dark:bg-primary/30 border border-primary/70 dark:border-primary/60 rounded-xl space-y-1.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-primary dark:text-primary">
                {isEn ? `Headline ${index + 2}` : `العنوان ${index + 2}`}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground/80">
                  {variation.text.length}/40
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveHeadlineVariation(variation.id)}
                  className="p-1 text-destructive hover:bg-destructive dark:hover:bg-destructive/40 rounded-lg transition-colors"
                  title={isEn ? "Delete this headline" : "حذف هذا العنوان"}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            <input
              type="text"
              value={variation.text}
              onChange={(e) =>
                handleUpdateHeadlineVariation(variation.id, e.target.value)
              }
              placeholder={
                isEn
                  ? "Write an alternative headline..."
                  : "اكتب خيار عنوان بديل..."
              }
              maxLength={50}
              className="w-full px-3 py-2 border border-primary dark:border-primary rounded-lg text-sm bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-primary"
            />
          </div>
        ))}

        {headlineVariations.length < MAX_VARIATIONS && (
          <button
            type="button"
            onClick={() => handleAddHeadlineVariation()}
            className="w-full py-2.5 border border-dashed border-primary dark:border-primary hover:border-primary bg-primary/30 dark:bg-primary/20 hover:bg-primary/10 dark:hover:bg-primary/40 rounded-xl text-primary dark:text-primary text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            {isEn
              ? "+ Add another headline option (up to 5 headlines to test audience engagement)"
              : "+ إضافة خيار عنوان آخر (حتى 5 عناوين لاختبار تفاعل الجمهور)"}
          </button>
        )}
      </div>

      <div className="p-3 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl flex items-start gap-2 text-[11px] text-foreground dark:text-muted-foreground">
        <HelpCircle className="w-4 h-4 text-muted-foreground dark:text-muted-foreground shrink-0 mt-0.5" />
        <span>
          {isEn ? (
            <><strong>How do copy variations work?</strong> Facebook automatically rotates texts and headlines among ad viewers to discover the combination that delivers the highest CTR and ROAS at the lowest cost.</>
          ) : (
            <><strong>كيف تعمل تنويعات النصوص والعناوين؟</strong> يقوم Facebook بتدوير النصوص والعناوين تلقائياً بين مستخدمي الإعلان لاكتشاف التركيبة التي تحقق أعلى معدل نقر ومبيعات بأقل تكلفة.</>
          )}
        </span>
      </div>
    </div>
  );
};
