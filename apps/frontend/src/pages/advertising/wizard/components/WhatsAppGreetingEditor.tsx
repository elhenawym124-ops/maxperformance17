import React from "react";
import { useTranslation } from "react-i18next";
import { MessageCircle, Plus, Trash2 } from "lucide-react";

interface WhatsAppGreetingEditorProps {
  greeting: string;
  onGreetingChange: (val: string) => void;
  quickFaqs: string[];
  onQuickFaqsChange: (faqs: string[]) => void;
}

const getDefaultFaqSuggestions = (isEn: boolean): string[] =>
  isEn
    ? [
        "I want to order this product, what are the confirmation steps?",
        "What is the delivery time and shipping cost?",
        "Can I inspect the product before paying on delivery?",
        "Are there other colors or sizes available?",
      ]
    : [
        "أرغب بطلب هذا المنتج، ما هي خطوات التأكيد؟",
        "ما هي مدة وتكلفة الشحن لمحافظتي؟",
        "هل يمكنني معاينة المنتج قبل الدفع عند الاستلام؟",
        "هل يوجد ألوان أو مقاسات أخرى متوفرة؟",
      ];

export const WhatsAppGreetingEditor: React.FC<WhatsAppGreetingEditorProps> = ({
  greeting,
  onGreetingChange,
  quickFaqs,
  onQuickFaqsChange,
}) => {
  const { i18n } = useTranslation();
  const isEn = Boolean(i18n.language && i18n.language.startsWith("en"));
  const defaultFaqSuggestions = React.useMemo(
    () => getDefaultFaqSuggestions(isEn),
    [isEn],
  );

  const handleAddFaq = (text = "") => {
    if (quickFaqs.length >= 3) return;
    onQuickFaqsChange([...quickFaqs, text]);
  };

  const handleUpdateFaq = (index: number, text: string) => {
    const updated = [...quickFaqs];
    updated[index] = text;
    onQuickFaqsChange(updated);
  };

  const handleRemoveFaq = (index: number) => {
    onQuickFaqsChange(quickFaqs.filter((_, i) => i !== index));
  };

  return (
    <div className="p-4 bg-success/70 dark:bg-success/20 border border-success dark:border-success/40 rounded-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center text-white shadow-sm">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-success dark:text-success">
              {isEn
                ? "WhatsApp Conversation Starter Template"
                : "قالب بدء المحادثة على WhatsApp"}
            </h4>
            <p className="text-[11px] text-success dark:text-success">
              {isEn
                ? "Automated greeting message and quick questions shown to the customer when clicking the ad"
                : "الرسالة التلقائية والأسئلة السريعة التي تظهر للعميل عند النقر على الإعلان"}
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 bg-success dark:bg-success/60 text-success dark:text-success rounded-full border border-success dark:border-success/50">
          Click-to-WhatsApp
        </span>
      </div>

      {/* Greeting Message */}
      <div>
        <label className="block text-xs font-semibold text-success dark:text-success mb-1.5">
          {isEn
            ? "Automated Greeting Message"
            : "رسالة الترحيب التلقائية (Greeting Message)"}
        </label>
        <textarea
          value={greeting}
          onChange={(e) => onGreetingChange(e.target.value)}
          placeholder={
            isEn
              ? "Hello! Thank you for reaching out about this product. How can we help you today?"
              : "أهلاً بك! يسعدنا تواصلك معنا بخصوص هذا المنتج. كيف يمكننا مساعدتك اليوم؟"
          }
          rows={2}
          maxLength={140}
          className="w-full px-3 py-2 border border-success dark:border-success rounded-lg text-sm bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-success"
        />
        <p className={`text-[10px] text-success dark:text-success mt-1 ${isEn ? "text-right" : "text-left"}`}>
          {greeting.length}/140
        </p>
      </div>

      {/* Quick FAQs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-success dark:text-success">
            {isEn
              ? "Suggested Quick Questions for Customer"
              : "الأسئلة السريعة المقترحة للعميل (Quick Questions)"}
          </label>
          <span className="text-[11px] text-success dark:text-success">
            {quickFaqs.length} {isEn ? "of 3 questions" : "من 3 أسئلة"}
          </span>
        </div>

        {quickFaqs.map((faq, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs text-success dark:text-success font-bold shrink-0">
              {isEn ? `Q ${index + 1}:` : `س ${index + 1}:`}
            </span>
            <input
              type="text"
              value={faq}
              onChange={(e) => handleUpdateFaq(index, e.target.value)}
              placeholder={
                isEn
                  ? "Type a quick question button for the customer..."
                  : "اكتب سؤالاً يظهر كزر سريع للعميل..."
              }
              maxLength={80}
              className="flex-1 px-3 py-1.5 border border-success dark:border-success rounded-lg text-xs bg-card text-foreground placeholder-muted dark:placeholder-muted focus:ring-2 focus:ring-success"
            />
            <button
              type="button"
              onClick={() => handleRemoveFaq(index)}
              className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg transition-colors"
              title={isEn ? "Remove this question" : "حذف هذا السؤال"}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}

        {quickFaqs.length < 3 && (
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleAddFaq()}
              className="w-full py-2 border border-dashed border-success dark:border-success hover:border-success dark:hover:border-success bg-success/40 dark:bg-success/30 hover:bg-success/70 dark:hover:bg-success/50 rounded-lg text-success dark:text-success text-xs font-medium flex items-center justify-center gap-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              {isEn ? "+ Add one-click suggested question" : "+ إضافة سؤال مقترح بنقرة واحدة"}
            </button>

            {/* Suggestions */}
            <div className="flex flex-wrap items-center gap-1">
              <span className="text-[10px] text-success dark:text-success font-medium">
                {isEn ? "Common suggestions:" : "مقترحات شائعة:"}
              </span>
              {defaultFaqSuggestions.filter((s) => !quickFaqs.includes(s)).map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleAddFaq(s)}
                  className="text-[10px] px-2 py-0.5 bg-card border border-success dark:border-success/50 text-success dark:text-success rounded hover:bg-success dark:hover:bg-success/50 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mini Preview Box */}
      <div className="p-3 bg-white/80 dark:bg-muted border border-success dark:border-success/40 rounded-lg space-y-2">
        <span className="text-[10px] font-bold text-success dark:text-success block">
          {isEn
            ? "Customer WhatsApp conversation preview:"
            : "معاينة تجربة العميل عند فتح المحادثة:"}
        </span>
        <div className={`bg-[#EFEAE2] dark:bg-[#111b21] p-3 rounded-lg ${isEn ? "text-left" : "text-right"} space-y-2`}>
          <div className="bg-white dark:bg-[#202c33] p-2 rounded-lg shadow-sm max-w-[85%] inline-block text-xs text-foreground dark:text-muted-foreground">
            {greeting || (isEn ? "Hello! Thank you for contacting us..." : "أهلاً بك! يسعدنا تواصلك معنا...")}
            <span className={`text-[9px] text-muted-foreground dark:text-muted-foreground block ${isEn ? "text-right" : "text-left"} mt-0.5`}>
              {isEn ? "Just now ✓✓" : "الآن ✓✓"}
            </span>
          </div>
          {quickFaqs.length > 0 && (
            <div className="space-y-1 pt-1">
              <span className="text-[9px] text-muted-foreground block">
                {isEn
                  ? "One-click questions customer can send:"
                  : "أسئلة يمكن للعميل إرسالها بنقرة واحدة:"}
              </span>
              {quickFaqs.filter(Boolean).map((faq, i) => (
                <div
                  key={i}
                  className="px-2.5 py-1 bg-white dark:bg-[#202c33] border border-success dark:border-success text-success dark:text-success rounded-full text-[11px] inline-block shadow-xs me-1 mb-1"
                >
                  {faq}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
