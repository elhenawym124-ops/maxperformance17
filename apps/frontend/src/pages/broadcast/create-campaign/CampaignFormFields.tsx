import React from "react";
import type { CampaignFormData, CustomerList } from "./types";

interface CampaignFormFieldsProps {
  formData: CampaignFormData;
  customerLists: CustomerList[];
  selectedList?: CustomerList;
  loading: boolean;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
  onInsertVariable: (variable: string) => void;
  setMessageTextareaRef: (ref: HTMLTextAreaElement | null) => void;
}

export const CampaignFormFields: React.FC<CampaignFormFieldsProps> = ({
  formData,
  customerLists,
  selectedList,
  loading,
  onInputChange,
  onInsertVariable,
  setMessageTextareaRef,
}) => {
  return (
    <>
      {/* Campaign Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-foreground"
        >
          اسم الحملة *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={onInputChange}
          className="mt-1 block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="مثال: عرض الجمعة البيضاء"
          required
        />
      </div>

      {/* Target Audience */}
      <div>
        <label
          htmlFor="targetAudience"
          className="block text-sm font-medium text-foreground"
        >
          الجمهور المستهدف *
        </label>
        <select
          name="targetAudience"
          id="targetAudience"
          value={formData.targetAudience}
          onChange={onInputChange}
          className="mt-1 block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          required
          disabled={loading}
        >
          <option value="">
            {loading ? "جاري التحميل..." : "اختر قائمة العملاء"}
          </option>
          {customerLists.map((list) => (
            <option key={list.id} value={list.id}>
              {list.name} ({list.count.toLocaleString()} عميل)
            </option>
          ))}
        </select>
        {selectedList && (
          <p className="mt-1 text-sm text-muted-foreground">
            {selectedList.description}
          </p>
        )}
        {formData.targetAudience && formData.recipientCount > 0 && (
          <p className="mt-1 text-sm font-medium text-primary tabular-nums">
            ✓ سيتم الإرسال إلى {formData.recipientCount.toLocaleString()} عميل
          </p>
        )}
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="message"
          className="block text-sm font-medium text-foreground"
        >
          نص الرسالة *
        </label>
        <textarea
          ref={(ref) => setMessageTextareaRef(ref)}
          name="message"
          id="message"
          rows={4}
          value={formData.message}
          onChange={onInputChange}
          className="mt-1 block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
          placeholder="اكتب رسالتك هنا... يمكنك استخدام المتغيرات لتخصيص الرسالة"
          required
        />

        {/* Variables Buttons */}
        <div className="mt-2 p-3 bg-primary/10 dark:bg-primary/30 rounded-md border border-primary dark:border-primary">
          <p className="text-xs font-medium text-primary dark:text-primary mb-2">
            إدراج متغيرات:
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onInsertVariable("{customerName}")}
              className="inline-flex items-center px-2.5 py-1 border border-primary dark:border-primary text-xs font-medium rounded text-primary dark:text-primary bg-card hover:bg-primary dark:hover:bg-primary transition-colors"
              title="إدراج اسم العميل الكامل"
            >
              <span className="ms-1">👤</span>
              اسم العميل
            </button>
            <button
              type="button"
              onClick={() => onInsertVariable("{firstName}")}
              className="inline-flex items-center px-2.5 py-1 border border-primary dark:border-primary text-xs font-medium rounded text-primary dark:text-primary bg-card hover:bg-primary dark:hover:bg-primary transition-colors"
              title="إدراج الاسم الأول"
            >
              <span className="ms-1">✨</span>
              الاسم الأول
            </button>
            <button
              type="button"
              onClick={() => onInsertVariable("{lastName}")}
              className="inline-flex items-center px-2.5 py-1 border border-primary dark:border-primary text-xs font-medium rounded text-primary dark:text-primary bg-card hover:bg-primary dark:hover:bg-primary transition-colors"
              title="إدراج الاسم الأخير"
            >
              <span className="ms-1">✨</span>
              الاسم الأخير
            </button>
          </div>
          <p className="text-xs text-primary dark:text-primary mt-2">
            💡 مثال: &quot;مرحباً &#123;customerName&#125;، نذكرك بالعرض الخاص!&quot;
          </p>
        </div>

        <p className="mt-1 text-sm text-muted-foreground tabular-nums">
          عدد الأحرف: {formData.message.length} / 1000
        </p>
      </div>
    </>
  );
};
