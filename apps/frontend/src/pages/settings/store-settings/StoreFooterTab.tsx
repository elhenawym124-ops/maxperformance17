import React from "react";
import { FooterSettingsSection } from "../../../components/store/FooterSettingsSection";
import { FloatingContactSettingsEditor } from "../../../components/store/FloatingContactSettingsEditor";
import { FooterSettings } from "../../../services/footerSettingsService";

interface StoreFooterTabProps {
  footerSettings: Partial<FooterSettings>;
  setFooterSettings: React.Dispatch<
    React.SetStateAction<Partial<FooterSettings>>
  >;
  socialLinks: Record<string, string>;
  onSocialLinksChange: (links: Record<string, string>) => void;
  designTokens?: Record<string, unknown>;
  onDesignTokensChange?: (nextTokens: Record<string, unknown>) => void;
  onSave: () => void;
  onReset: () => void;
  loading: boolean;
}

export const StoreFooterTab: React.FC<StoreFooterTabProps> = ({
  footerSettings,
  setFooterSettings,
  socialLinks,
  onSocialLinksChange,
  designTokens,
  onDesignTokensChange,
  onSave,
  onReset,
  loading,
}) => {
  return (
    <div className="space-y-6">
      {onDesignTokensChange && (
        <FloatingContactSettingsEditor
          designTokens={designTokens}
          onUpdateDesignTokens={onDesignTokensChange}
        />
      )}
      <FooterSettingsSection
        settings={footerSettings}
        onChange={setFooterSettings}
        socialLinks={socialLinks}
        onSocialLinksChange={onSocialLinksChange}
        onSave={onSave}
        onReset={onReset}
        loading={loading}
      />
    </div>
  );
};
