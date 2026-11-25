import { apiClient } from './apiClient';

export type MarketplacePlatform = 'amazon' | 'noon' | 'jumia' | 'trendyol';
export type CountryCode = 'EGY' | 'KSA' | 'UAE';

export interface CountryMeta {
  code: CountryCode;
  nameAr: string;
  nameEn: string;
  currency: string;
  vatRate: number;
  amazonDomain: string;
  noonSlug: string;
  jumiaDomain: string | null;
}

export interface CategoryMeta {
  id: string;
  nameEn: string;
  nameAr: string;
  rate: number;
  types?: string[];
  subs?: string[];
}

export interface MarketplaceHubMetadata {
  countries: CountryMeta[];
  amazonCategories: CategoryMeta[];
  noonFamilies: CategoryMeta[];
  jumiaFamilies: CategoryMeta[];
  trendyolCategories: CategoryMeta[];
  trendyolProviders: string[];
}

export interface CalculateProfitPayload {
  platform: MarketplacePlatform;
  country: CountryCode;
  productCost: number;
  profitMarginPct: number;
  shipmentType?: 'EASY_SHIP' | 'SELLER_FLEX' | 'FBA';
  category?: string;
  weightGrams?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;
  fulfillmentType?: 'FBN' | 'FBP';
  packageType?: 'STANDARD' | 'OVERSIZE';
  productFamily?: string;
  productType?: string;
  weightKg?: number;
  productSize?: 'SMALL' | 'MEDIUM' | 'LARGE';
  warehouseType?: 'YOUR_WAREHOUSE' | 'JUMIA_EXPRESS';
  shippingProvider?: string;
  mainCategory?: string;
  subCategory?: string;
  isNewSeller?: boolean;
}

export interface ProfitCalculationResult {
  platform: MarketplacePlatform;
  country: CountryCode;
  currency: string;
  tierType: string;
  billableWeightKg: number;
  productCost: number;
  profitMarginPct: number;
  roiPct: number;
  basePrice: number;
  netProfit: number;
  finalSellingPrice: number;
  finalPriceExVat: number;
  commissionRatePct: number;
  feesBreakdown: {
    shippingFee: number;
    commissionFee: number;
    vatAmount: number;
    totalFees: number;
  };
  vatBreakdown: {
    vatRatePct: number;
    vatOnProduct: number;
    vatOnShippingAndReferral: number;
  };
}

export interface OpportunityCategory {
  id: string;
  nameEn: string;
  nameAr: string;
  country: CountryCode;
  currency: string;
  amazonUrl: string;
  noonUrl: string;
  jumiaUrl: string | null;
}

export interface WalletSummary {
  wallet: {
    id: string;
    balance: number;
    monthlyAllowance: number;
    planTier: string;
  };
  toolCosts: Record<string, number>;
  plans: Array<{
    id: string;
    name: string;
    priceUsd: number;
    credits: number;
    popular?: boolean;
    unlimitedTools: string[];
  }>;
  transactions: Array<{
    id: string;
    tool: string;
    creditsDelta: number;
    balanceAfter: number;
    description?: string;
    createdAt: string;
  }>;
}

export interface StudioDraft {
  id: string;
  workflow: string;
  title: string;
  status: string;
  updatedAt: string;
}

export interface VendorItem {
  id: string;
  country: CountryCode;
  category: string;
  name: string;
  city: string;
  notes: string;
  verified: boolean;
}

export interface ChannelConnection {
  id: string;
  platform: MarketplacePlatform;
  country: CountryCode;
  storeName: string | null;
  status: string;
  authMode: string;
  updatedAt: string;
}

export interface AmazonOAuthInfo {
  ready: boolean;
  reason?: string;
  sellerSignupUrl?: string;
  developerRegisterUrl?: string;
  oauthUrl?: string;
}

export const marketplaceHubService = {
  async getMetadata(): Promise<MarketplaceHubMetadata> {
    const res = await apiClient.get<{ data: MarketplaceHubMetadata }>('/marketplace-hub/metadata');
    return res.data.data;
  },

  async calculateProfit(payload: CalculateProfitPayload): Promise<ProfitCalculationResult> {
    const res = await apiClient.post<{ data: ProfitCalculationResult }>('/marketplace-hub/calculate', payload);
    return res.data.data;
  },

  async getOpportunities(country: CountryCode, search = ''): Promise<OpportunityCategory[]> {
    const res = await apiClient.get<{ data: OpportunityCategory[] }>('/marketplace-hub/opportunities', {
      params: { country, search },
    });
    return res.data.data;
  },

  async getWallet(): Promise<WalletSummary> {
    const res = await apiClient.get<{ data: WalletSummary }>('/marketplace-hub/wallet');
    return res.data.data;
  },

  async calculateCustomPlan(usage: { studio: number; alpha: number; leo: number; emma: number; bekam: number }) {
    const res = await apiClient.post<{
      data: {
        totalCredits: number;
        discountPct: number;
        listPriceUsd: number;
        discountedPriceUsd: number;
        billingDays: number;
      };
    }>('/marketplace-hub/wallet/calculate-plan', usage);
    return res.data.data;
  },

  async generateCopy(payload: { mode: 'text' | 'image'; productInfo: string; contextLine?: string; language?: 'ar' | 'en' }) {
    const res = await apiClient.post<{
      data: {
        copy: { title: string; bulletPoints: string[]; description: string; searchKeywords: string[] };
        wallet: WalletSummary['wallet'];
        modelUsed: string;
      };
    }>('/marketplace-hub/ai/copy', payload);
    return res.data.data;
  },

  async generateImageBrief(payload: {
    action: 'image_to_image' | 'text_to_image' | 'remove_text' | 'remove_bg' | 'enhance' | 'pack5';
    prompt?: string;
    style?: string;
    removalMode?: 'standard' | 'ai_premium';
  }) {
    const res = await apiClient.post<{
      data: {
        artDirection: {
          enhancedPrompt: string;
          lightingSetup: string;
          angles: string[];
          complianceChecklist: string[];
        };
        creditsUsed: number;
        wallet: WalletSummary['wallet'];
        modelUsed: string;
      };
    }>('/marketplace-hub/ai/image', payload);
    return res.data.data;
  },

  async generatePrefill(payload: { title: string; description: string; marketplaces: MarketplacePlatform[] }) {
    const res = await apiClient.post<{
      data: { payloads: Record<string, unknown>; creditsUsed: number; wallet: WalletSummary['wallet'] };
    }>('/marketplace-hub/ai/prefill', payload);
    return res.data.data;
  },

  async sellerCopilot(message: string) {
    const res = await apiClient.post<{
      data: { reply: string; wallet: WalletSummary['wallet'] };
    }>('/marketplace-hub/ai/copilot', { message });
    return res.data.data;
  },

  async listDrafts(): Promise<StudioDraft[]> {
    const res = await apiClient.get<{ data: StudioDraft[] }>('/marketplace-hub/studio/drafts');
    return res.data.data;
  },

  async saveDraft(payload: {
    workflow: string;
    title: string;
    seoContent?: unknown;
    marketplacePayloads?: unknown;
  }): Promise<StudioDraft> {
    const res = await apiClient.post<{ data: StudioDraft }>('/marketplace-hub/studio/drafts', payload);
    return res.data.data;
  },

  async getVendors(country: CountryCode, category = '', search = '') {
    const res = await apiClient.get<{ data: { categories: string[]; vendors: VendorItem[] } }>('/marketplace-hub/vendors', {
      params: { country, category, search },
    });
    return res.data.data;
  },

  async importCsv(platform: MarketplacePlatform, csvText: string) {
    const res = await apiClient.post<{
      data: {
        platform: string;
        totalRowsParsed: number;
        headers: string[];
        previewRows: Array<{ rowNumber: number; sku: string; title: string; price: number; stock: number }>;
      };
    }>('/marketplace-hub/import-csv', { platform, csvText });
    return res.data.data;
  },

  async getConnections(country: CountryCode = 'EGY') {
    const res = await apiClient.get<{ data: { connections: ChannelConnection[]; amazonOAuth: AmazonOAuthInfo } }>(
      '/marketplace-hub/connections',
      { params: { country } },
    );
    return res.data.data;
  },

  async saveConnection(payload: {
    platform: MarketplacePlatform;
    country: CountryCode;
    storeName: string;
    authMode: string;
    credentials: Record<string, string>;
  }): Promise<ChannelConnection> {
    const res = await apiClient.post<{ data: ChannelConnection }>('/marketplace-hub/connections', payload);
    return res.data.data;
  },

  async deleteConnection(platform: MarketplacePlatform, country: CountryCode) {
    const res = await apiClient.delete<{ data: { removed: boolean } }>(
      `/marketplace-hub/connections/${platform}/${country}`,
    );
    return res.data.data;
  },

  async testAmazonSandbox(payload: {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    region?: 'na' | 'eu' | 'fe';
  }) {
    const res = await apiClient.post<{
      data: {
        connected: boolean;
        region: string;
        marketplaceId: string;
        tokenExpiresIn: number;
        ordersCount: number;
        sampleOrders: Array<Record<string, unknown>>;
      };
    }>('/marketplace-hub/connections/test-amazon-sandbox', payload);
    return res.data.data;
  },
};
