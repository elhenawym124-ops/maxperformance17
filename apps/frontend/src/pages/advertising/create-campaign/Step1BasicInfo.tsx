import React from "react";
import {
  CAMPAIGN_OBJECTIVES,
  FacebookAdAccount,
} from "../../../services/facebookAdsService";
import { CampaignFormData } from "./types";

interface Step1BasicInfoProps {
  formData: CampaignFormData;
  handleInputChange: (field: keyof CampaignFormData, value: any) => void;
  getObjectiveDescription: (objective: string) => string;
  adAccounts: FacebookAdAccount[];
  loadingAccounts: boolean;
}

export const Step1BasicInfo: React.FC<Step1BasicInfoProps> = ({
  formData,
  handleInputChange,
  getObjectiveDescription,
  adAccounts,
  loadingAccounts,
}) => {
  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">
        معلومات الحملة
      </h2>

      {/* Campaign Name */}
      <div>
        <label
          htmlFor="create-campaign-name"
          className="block text-sm font-medium text-foreground mb-2"
        >
          اسم الحملة *
        </label>
        <input
          id="create-campaign-name"
          name="campaignName"
          type="text"
          autoComplete="off"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="مثال: حملة صيف 2025"
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground placeholder-muted dark:placeholder-muted"
        />
      </div>

      {/* Description */}
      <div>
        <label
          htmlFor="create-campaign-description"
          className="block text-sm font-medium text-foreground mb-2"
        >
          الوصف (اختياري)
        </label>
        <textarea
          id="create-campaign-description"
          name="campaignDescription"
          autoComplete="off"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="وصف الحملة..."
          rows={3}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground placeholder-muted dark:placeholder-muted"
        />
      </div>

      {/* Campaign Objective */}
      <div>
        <label
          htmlFor="create-campaign-objective"
          className="block text-sm font-medium text-foreground mb-2"
        >
          هدف الحملة *
        </label>
        <select
          id="create-campaign-objective"
          name="objective"
          autoComplete="off"
          value={formData.objective}
          onChange={(e) => handleInputChange("objective", e.target.value)}
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
        >
          {CAMPAIGN_OBJECTIVES.map((obj) => (
            <option key={obj.value} value={obj.value}>
              {obj.label}
            </option>
          ))}
        </select>
        {formData.objective && (
          <p className="mt-2 text-sm text-muted-foreground">
            {getObjectiveDescription(formData.objective)}
          </p>
        )}
      </div>

      {/* Ad Account */}
      {loadingAccounts ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary dark:border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-foreground dark:text-muted-foreground">
            جاري تحميل حسابات Facebook Ads...
          </p>
        </div>
      ) : adAccounts.length > 0 ? (
        <div>
          <label
            htmlFor="create-campaign-ad-account"
            className="block text-sm font-medium text-foreground mb-2"
          >
            حساب Facebook Ads *
          </label>
          <select
            id="create-campaign-ad-account"
            name="adAccountId"
            autoComplete="off"
            value={formData.adAccountId}
            onChange={(e) => handleInputChange("adAccountId", e.target.value)}
            className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
            required
          >
            {adAccounts.map((account) => (
              <option
                key={account.id}
                value={account.account_id || account.id}
              >
                {account.name} ({account.currency})
                {account.isActive ? " - نشط" : ""}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="p-4 bg-warning/10 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg">
          <p className="text-sm text-warning dark:text-warning">
            لا توجد حسابات Facebook Ads متاحة. يرجى ربط حساب Facebook أولاً.
          </p>
        </div>
      )}

      {/* Campaign Status */}
      <div>
        <label
          htmlFor="create-campaign-status"
          className="block text-sm font-medium text-foreground mb-2"
        >
          حالة الحملة
        </label>
        <select
          id="create-campaign-status"
          name="status"
          autoComplete="off"
          value={formData.status}
          onChange={(e) =>
            handleInputChange("status", e.target.value as "ACTIVE" | "PAUSED")
          }
          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-card text-foreground"
        >
          <option value="PAUSED">متوقفة (سأفعلها لاحقاً)</option>
          <option value="ACTIVE">نشطة (تبدأ فوراً)</option>
        </select>
      </div>
    </div>
  );
};
