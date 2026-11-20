import React from "react";
import { Key, Webhook, FileCode2, Plus } from "lucide-react";
import { ShopifyPageHeader } from "../orders/ShopifyPageHeader";
import { Card, CardContent } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import type { HRApiTab, HRApiKey, HRWebhook } from "./hr-api-integrations/types";
import {
  HRApiKeysTab,
  HRApiWebhooksTab,
  HRApiDocsTab,
} from "./hr-api-integrations/index";

interface PolarisHRApiIntegrationsViewProps {
  activeTab: HRApiTab;
  setActiveTab: (tab: HRApiTab) => void;
  keys: HRApiKey[];
  webhooks: HRWebhook[];
  loading: boolean;
  onOpenCreateModal: () => void;
  onRevokeKey: (id: string) => void;
  newHookName: string;
  setNewHookName: (name: string) => void;
  newHookUrl: string;
  setNewHookUrl: (url: string) => void;
  isSubmittingHook: boolean;
  onCreateWebhook: () => void;
  isDownloadingSpec: boolean;
  onDownloadOpenApi: () => void;
}

export const PolarisHRApiIntegrationsView: React.FC<PolarisHRApiIntegrationsViewProps> = ({
  activeTab,
  setActiveTab,
  keys,
  webhooks,
  loading,
  onOpenCreateModal,
  onRevokeKey,
  newHookName,
  setNewHookName,
  newHookUrl,
  setNewHookUrl,
  isSubmittingHook,
  onCreateWebhook,
  isDownloadingSpec,
  onDownloadOpenApi,
}) => {
  const tabs: { id: HRApiTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: "keys", label: "مفاتيح الـ API", icon: Key, count: keys.length },
    { id: "webhooks", label: "الويب هوك (Webhooks)", icon: Webhook, count: webhooks.length },
    { id: "docs", label: "توثيق الواجهات (OpenAPI)", icon: FileCode2 },
  ];

  return (
    <div className="space-y-4 w-full max-w-full" dir="rtl">
      {/* Polaris Page Header */}
      <ShopifyPageHeader
        title="الربط البرمجي وواجهات API"
        subtitle="إدارة مفاتيح API الآمنة، Webhooks، واستقبال بصمات الأجهزة، والتكامل مع نماذج الذكاء الاصطناعي وأنظمة ERP"
        badges={[
          { label: `${keys.length} مفتاح API`, variant: "default" },
          { label: `${webhooks.length} Webhook`, variant: "secondary" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onOpenCreateModal}
              className="h-8 gap-1.5 text-xs bg-primary text-primary-foreground font-medium shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              إنشاء مفتاح جديد
            </Button>
          </div>
        }
      />

      {/* Main Single-Surface Polaris Card Chassis */}
      <Card className="rounded-2xl border border-border/70 bg-card shadow-xs overflow-hidden">
        {/* Segmented Navigation Tabs */}
        <div className="border-b border-border/70 bg-muted/20 px-3 pt-2">
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                    isActive
                      ? "bg-background text-foreground shadow-xs font-semibold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-muted text-muted-foreground">
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content Body */}
        <CardContent className="p-4 sm:p-6 [&>div.rounded-2xl]:border-0 [&>div.rounded-2xl]:shadow-none [&>div.rounded-2xl]:p-0">
          {activeTab === "keys" && (
            <HRApiKeysTab loading={loading} keys={keys} onRevokeKey={onRevokeKey} />
          )}

          {activeTab === "webhooks" && (
            <HRApiWebhooksTab
              webhooks={webhooks}
              newHookName={newHookName}
              onNewHookNameChange={setNewHookName}
              newHookUrl={newHookUrl}
              onNewHookUrlChange={setNewHookUrl}
              isSubmittingHook={isSubmittingHook}
              onCreateWebhook={onCreateWebhook}
            />
          )}

          {activeTab === "docs" && (
            <HRApiDocsTab
              isDownloadingSpec={isDownloadingSpec}
              onDownloadOpenApi={onDownloadOpenApi}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
