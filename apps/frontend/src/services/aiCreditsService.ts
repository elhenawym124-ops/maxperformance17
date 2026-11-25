import { apiClient } from './apiClient';

export interface AiCreditPackage {
  id: string;
  nameAr: string;
  nameEn: string;
  priceEgp: number;
  credits: number;
  bonusCredits: number;
  validityDays: number;
  isPopular: boolean;
  isActive: boolean;
}

export interface ModelCostOverride {
  input?: number;
  output?: number;
  tier?: 'flash' | 'pro';
  multiplier?: number;
  enabled?: boolean;
}

export interface EffectiveModelCatalogItem {
  modelName: string;
  inputPerM: number;
  outputPerM: number;
  tier: 'flash' | 'pro';
  multiplier: number;
  enabled: boolean;
  isCustom?: boolean;
}

export interface AiCreditPricingSettings {
  usdToEgp: number;
  creditPriceEgp: number;
  flashMarkupPercent: number;
  proMarkupPercent: number;
  minCreditsPerChat: number;
  minCreditsPerAgentRun: number;
  agentStepFeeCredits: number;
  byokFreeTokens: boolean;
  enforcementMode: 'off' | 'warn' | 'enforce';
  trialBonusCredits: number;
  defaultDailyCreditLimit: number;
  modelCostOverrides: Record<string, ModelCostOverride>;
  packages: AiCreditPackage[];
}

export interface UsageQuoteResult {
  modelName: string;
  tier: 'flash' | 'pro';
  inputTokens: number;
  outputTokens: number;
  agentSteps: number;
  costUsd: number;
  rawCostEgp: number;
  costEgp: number;
  markupPercent: number;
  credits: number;
  revenueEgp: number;
  grossProfitEgp: number;
}

export interface CompanyCreditRow {
  companyId: string;
  name: string;
  email: string | null;
  isActive: boolean;
  byokActive: boolean;
  balance: number;
  includedBalance: number;
  totalPurchased: number;
  totalUsed: number;
  dailyCreditLimit: number | null;
  pricingMode: 'DEFAULT' | 'UNLIMITED' | 'BYOK_ONLY';
  autoTopupEnabled: boolean;
}

export interface AiCreditTransactionRow {
  id: string;
  type: string;
  status: string;
  source: string;
  creditsDelta: number;
  balanceAfter: number;
  modelName?: string | null;
  inputTokens: number;
  outputTokens: number;
  agentSteps: number;
  amountEgp: number;
  billingMode: string;
  referenceId?: string | null;
  description?: string | null;
  createdAt: string;
}

export interface MerchantAiCreditsSummary {
  wallet: {
    id: string;
    companyId: string;
    balance: number;
    includedBalance: number;
    totalPurchased: number;
    totalUsed: number;
    totalAvailable: number;
    effectiveDailyLimit: number;
    dailyUsed: number;
    dailyCreditLimit: number | null;
    pricingMode: string;
    autoTopupEnabled: boolean;
    autoTopupPackageId: string | null;
  };
  byokActive: boolean;
  companyWalletBalance: number | null;
  pricing: {
    creditPriceEgp: number;
    minCreditsPerChat: number;
    minCreditsPerAgentRun: number;
    agentStepFeeCredits: number;
    byokFreeTokens: boolean;
    enforcementMode: 'off' | 'warn' | 'enforce';
  };
  packages: AiCreditPackage[];
  models: EffectiveModelCatalogItem[];
  transactions: AiCreditTransactionRow[];
}

export interface WalletNumberOption {
  id: string;
  name: string;
  number: string;
  icon?: string | null;
  color?: string | null;
  isActive: boolean;
}

export const aiCreditsService = {
  // Merchant
  async getSummary(): Promise<MerchantAiCreditsSummary> {
    const res = await apiClient.get<{ success: boolean; data: MerchantAiCreditsSummary }>('/ai-credits/summary');
    return res.data.data;
  },

  async updatePreferences(payload: {
    autoTopupEnabled?: boolean;
    autoTopupPackageId?: string | null;
    dailyCreditLimit?: number | null;
  }) {
    const res = await apiClient.put('/ai-credits/preferences', payload);
    return res.data.data;
  },

  async topupFromWallet(packageId: string) {
    const res = await apiClient.post('/ai-credits/topup/wallet', { packageId });
    return res.data;
  },

  async createKashierTopupSession(packageId: string): Promise<{ sessionUrl: string; sessionId?: string; orderNumber: string }> {
    const res = await apiClient.post('/ai-credits/topup/kashier', { packageId });
    return res.data.data;
  },

  async verifyKashierTopup(orderId: string) {
    const res = await apiClient.post('/ai-credits/topup/kashier/verify', { orderId });
    return res.data;
  },

  async getWalletNumbers(): Promise<WalletNumberOption[]> {
    const res = await apiClient.get<{ success: boolean; data: WalletNumberOption[] }>('/wallet-payment/wallet-numbers');
    return res.data.data || [];
  },

  async submitReceiptTopup(packageId: string, walletNumberId: string, file: File) {
    const form = new FormData();
    form.append('packageId', packageId);
    form.append('walletNumberId', walletNumberId);
    form.append('receipt', file);
    const res = await apiClient.post('/ai-credits/topup/receipt', form);
    return res.data;
  },

  // Super Admin
  async getAdminSettings(): Promise<{ settings: AiCreditPricingSettings; modelCatalog: EffectiveModelCatalogItem[] }> {
    const res = await apiClient.get('/ai-credits/admin/settings');
    return res.data.data;
  },

  async updateAdminSettings(patch: Partial<AiCreditPricingSettings>): Promise<{
    settings: AiCreditPricingSettings;
    modelCatalog: EffectiveModelCatalogItem[];
  }> {
    const res = await apiClient.put('/ai-credits/admin/settings', patch);
    return res.data.data;
  },

  async simulateUsage(
    usage: { modelName: string; inputTokens: number; outputTokens: number; agentSteps: number; source: string },
    settings?: Partial<AiCreditPricingSettings>
  ): Promise<UsageQuoteResult> {
    const res = await apiClient.post('/ai-credits/admin/simulate', { usage, settings });
    return res.data.data;
  },

  async getAdminCompanies(search = ''): Promise<CompanyCreditRow[]> {
    const res = await apiClient.get('/ai-credits/admin/companies', { params: { search, limit: 50 } });
    return res.data.data || [];
  },

  async adjustCompanyCredits(
    companyId: string,
    payload: {
      creditsDelta?: number;
      reason?: string;
      overrides?: {
        dailyCreditLimit?: number | null;
        pricingMode?: 'DEFAULT' | 'UNLIMITED' | 'BYOK_ONLY';
      };
    }
  ) {
    const res = await apiClient.post(`/ai-credits/admin/companies/${companyId}/adjust`, payload);
    return res.data.data;
  },
};
