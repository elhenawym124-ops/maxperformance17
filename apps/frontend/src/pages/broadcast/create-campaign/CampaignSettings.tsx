import React from "react";
import { PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import type { CampaignFormData } from "./types";

interface CampaignSettingsProps {
  formData: CampaignFormData;
  newTag: string;
  onNewTagChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  onInputChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => void;
}

export const CampaignSettings: React.FC<CampaignSettingsProps> = ({
  formData,
  newTag,
  onNewTagChange,
  onAddTag,
  onRemoveTag,
  onInputChange,
}) => {
  return (
    <>
      {/* Priority */}
      <div>
        <label
          htmlFor="priority"
          className="block text-sm font-medium text-foreground"
        >
          أولوية الحملة
        </label>
        <select
          name="priority"
          id="priority"
          value={formData.priority}
          onChange={onInputChange}
          className="mt-1 block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
        >
          <option value="low">منخفضة</option>
          <option value="medium">متوسطة</option>
          <option value="high">عالية</option>
        </select>
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-foreground">
          العلامات (Tags)
        </label>
        <div className="mt-1 flex items-center space-x-2 space-x-reverse">
          <input
            type="text"
            value={newTag}
            onChange={(e) => onNewTagChange(e.target.value)}
            onKeyPress={(e) =>
              e.key === "Enter" && (e.preventDefault(), onAddTag())
            }
            className="flex-1 border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary sm:text-sm"
            placeholder="أضف علامة جديدة"
          />
          <button
            type="button"
            onClick={onAddTag}
            aria-label="إضافة علامة"
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-primary hover:bg-primary/90 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
          </button>
        </div>
        {formData.tags &&
          Array.isArray(formData.tags) &&
          formData.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary dark:bg-primary/60 text-primary dark:text-primary"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => onRemoveTag(tag)}
                    aria-label={`حذف علامة ${tag}`}
                    className="me-1 h-3 w-3 text-primary hover:text-primary dark:hover:text-primary"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            id="trackClicks"
            name="trackClicks"
            type="checkbox"
            checked={formData.trackClicks}
            onChange={onInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label
            htmlFor="trackClicks"
            className="me-2 block text-sm text-foreground dark:text-muted-foreground"
          >
            تتبع النقرات والتفاعل
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="includeImages"
            name="includeImages"
            type="checkbox"
            checked={formData.includeImages}
            onChange={onInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label
            htmlFor="includeImages"
            className="me-2 block text-sm text-foreground dark:text-muted-foreground"
          >
            تضمين صور في الرسالة
          </label>
        </div>
        <div className="flex items-center">
          <input
            id="autoResend"
            name="autoResend"
            type="checkbox"
            checked={formData.autoResend}
            onChange={onInputChange}
            className="h-4 w-4 text-primary focus:ring-primary border-border rounded"
          />
          <label
            htmlFor="autoResend"
            className="me-2 block text-sm text-foreground dark:text-muted-foreground"
          >
            إعادة الإرسال للذين لم يقرؤوا (بعد 6 ساعات)
          </label>
        </div>
      </div>
    </>
  );
};
