/**
 * @file aiCreditPricingService.js
 * @description Dynamic AI Agent, Token & Credit Pricing Engine for MaxP.
 *
 * - Reads/writes pricing configuration from `SystemSettings` (`ai_credit_pricing_settings`)
 *   with a short in-memory cache (editable live from Super Admin UI).
 * - Calculates token + agent-step credit costs from `modelCosts.js` + dynamic overrides.
 * - Supports BYOK (`public.ai_keys` keyType=COMPANY) at 0 token credits when enabled.
 * - Supports 3 merchant top-up channels: CompanyWallet instant debit, Kashier online,
 *   and manual wallet transfer receipt approval.
 */

const { MODEL_COSTS_PER_M } = require('../config/modelCosts');

const SETTINGS_NAME = 'ai_credit_pricing_settings';
const CACHE_TTL_MS = 30 * 1000;

const DEFAULT_PACKAGES = [
  {
    id: 'starter',
    nameAr: 'باقة البداية',
    nameEn: 'Starter',
    priceEgp: 100,
    credits: 2000,
    bonusCredits: 0,
    validityDays: 365,
    isPopular: false,
    isActive: true,
  },
  {
    id: 'growth',
    nameAr: 'باقة النمو',
    nameEn: 'Growth',
    priceEgp: 450,
    credits: 9000,
    bonusCredits: 1000,
    validityDays: 365,
    isPopular: true,
    isActive: true,
  },
  {
    id: 'business',
    nameAr: 'باقة الشركات',
    nameEn: 'Business',
    priceEgp: 1500,
    credits: 30000,
    bonusCredits: 10000,
    validityDays: 365,
    isPopular: false,
    isActive: true,
  },
  {
    id: 'enterprise',
    nameAr: 'باقة المؤسسات',
    nameEn: 'Enterprise',
    priceEgp: 5000,
    credits: 100000,
    bonusCredits: 50000,
    validityDays: 365,
    isPopular: false,
    isActive: true,
  },
];

const DEFAULT_PRICING_SETTINGS = {
  usdToEgp: 50,
  creditPriceEgp: 0.05,
  flashMarkupPercent: 80,
  proMarkupPercent: 40,
  minCreditsPerChat: 1,
  minCreditsPerAgentRun: 2,
  agentStepFeeCredits: 1,
  byokFreeTokens: true,
  enforcementMode: 'warn', // 'off' | 'warn' | 'enforce'
  trialBonusCredits: 200,
  defaultDailyCreditLimit: 5000,
  modelCostOverrides: {},
  packages: DEFAULT_PACKAGES,
};

let settingsCache = null;
let settingsCacheExpiresAt = 0;

// Fallback store when Prisma client hasn't generated AiCreditWallet yet or in unit tests
const memoryWallets = new Map();
const memoryTransactions = new Map();
let memorySettingsOverride = null;

function safeGetPrisma() {
  try {
    const sharedDb = require('./sharedDatabase');
    return sharedDb.getSharedPrismaClient ? sharedDb.getSharedPrismaClient() : null;
  } catch {
    return null;
  }
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;
const round4 = (n) => Math.round((Number(n) || 0) * 10000) / 10000;

function inferModelTier(modelName, costEntry) {
  if (costEntry?.tier === 'pro' || costEntry?.tier === 'flash') {
    return costEntry.tier;
  }
  const lower = String(modelName || '').toLowerCase();
  if (
    /gpt-4o(?!-mini)|gpt-4-turbo|claude|opus|sonnet|mistral-large|gemini-.*pro/.test(lower) ||
    Number(costEntry?.output || 0) >= 5.0
  ) {
    return 'pro';
  }
  return 'flash';
}

function normalizePackages(packages) {
  if (!Array.isArray(packages) || packages.length === 0) {
    return DEFAULT_PACKAGES.map((p) => ({ ...p }));
  }
  return packages
    .filter((p) => p && typeof p === 'object' && p.id)
    .map((p) => ({
      id: String(p.id).trim(),
      nameAr: String(p.nameAr || p.name || p.id),
      nameEn: String(p.nameEn || p.name || p.id),
      priceEgp: Math.max(1, Number(p.priceEgp) || 100),
      credits: Math.max(1, Math.round(Number(p.credits) || 1000)),
      bonusCredits: Math.max(0, Math.round(Number(p.bonusCredits) || 0)),
      validityDays: Math.max(1, Math.round(Number(p.validityDays) || 365)),
      isPopular: Boolean(p.isPopular),
      isActive: p.isActive !== false,
    }));
}

function normalizeSettings(raw = {}) {
  const merged = { ...DEFAULT_PRICING_SETTINGS, ...(raw || {}) };
  merged.usdToEgp = Math.max(1, Number(merged.usdToEgp) || 50);
  merged.creditPriceEgp = Math.max(0.001, Number(merged.creditPriceEgp) || 0.05);
  merged.flashMarkupPercent = Math.max(0, Number(merged.flashMarkupPercent ?? 80));
  merged.proMarkupPercent = Math.max(0, Number(merged.proMarkupPercent ?? 40));
  merged.minCreditsPerChat = Math.max(0, Math.round(Number(merged.minCreditsPerChat ?? 1)));
  merged.minCreditsPerAgentRun = Math.max(0, Math.round(Number(merged.minCreditsPerAgentRun ?? 2)));
  merged.agentStepFeeCredits = Math.max(0, Math.round(Number(merged.agentStepFeeCredits ?? 1)));
  merged.byokFreeTokens = merged.byokFreeTokens !== false;
  merged.enforcementMode = ['off', 'warn', 'enforce'].includes(merged.enforcementMode)
    ? merged.enforcementMode
    : 'warn';
  merged.trialBonusCredits = Math.max(0, Math.round(Number(merged.trialBonusCredits ?? 200)));
  merged.defaultDailyCreditLimit = Math.max(
    0,
    Math.round(Number(merged.defaultDailyCreditLimit ?? 5000))
  );
  merged.modelCostOverrides =
    merged.modelCostOverrides && typeof merged.modelCostOverrides === 'object'
      ? merged.modelCostOverrides
      : {};
  merged.packages = normalizePackages(merged.packages);
  return merged;
}

function invalidateSettingsCache() {
  settingsCache = null;
  settingsCacheExpiresAt = 0;
}

async function getPricingSettings(prisma = safeGetPrisma(), { bypassCache = false } = {}) {
  if (!bypassCache && settingsCache && Date.now() < settingsCacheExpiresAt) {
    return settingsCache;
  }

  if (prisma?.systemSettings?.findUnique) {
    try {
      const row = await prisma.systemSettings.findUnique({ where: { systemName: SETTINGS_NAME } });
      if (row?.config) {
        const parsed = typeof row.config === 'string' ? JSON.parse(row.config) : row.config;
        const normalized = normalizeSettings(parsed);
        settingsCache = normalized;
        settingsCacheExpiresAt = Date.now() + CACHE_TTL_MS;
        return normalized;
      }
    } catch (err) {
      console.warn('[AI-CREDITS] Failed reading pricing settings:', err.message);
    }
  }

  const fallback = normalizeSettings(memorySettingsOverride || {});
  settingsCache = fallback;
  settingsCacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return fallback;
}

async function updatePricingSettings(patch, prisma = safeGetPrisma()) {
  const current = await getPricingSettings(prisma, { bypassCache: true });
  const next = normalizeSettings({ ...current, ...(patch || {}) });
  memorySettingsOverride = next;

  if (prisma?.systemSettings?.upsert) {
    const configJson = JSON.stringify(next);
    await prisma.systemSettings.upsert({
      where: { systemName: SETTINGS_NAME },
      update: { config: configJson },
      create: {
        systemName: SETTINGS_NAME,
        displayName: 'إعدادات تسعير الوكلاء والكريدت',
        description: 'سعر الصرف، قيمة الكريدت، هوامش الربح، أسعار الموديلات، وباقات الشحن',
        category: 'ai',
        config: configJson,
      },
    });
  }

  invalidateSettingsCache();
  settingsCache = next;
  settingsCacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return next;
}

function getEffectiveModelCatalog(settings) {
  const overrides = settings?.modelCostOverrides || {};
  const names = new Set([...Object.keys(MODEL_COSTS_PER_M), ...Object.keys(overrides)]);
  return Array.from(names).map((modelName) => {
    const base = MODEL_COSTS_PER_M[modelName] || { input: 0.15, output: 0.6 };
    const ov = overrides[modelName] || {};
    const input = ov.input !== undefined ? Number(ov.input) : Number(base.input);
    const output = ov.output !== undefined ? Number(ov.output) : Number(base.output);
    const tier = inferModelTier(modelName, { ...base, ...ov, input, output });
    return {
      modelName,
      inputPerM: Math.max(0, input),
      outputPerM: Math.max(0, output),
      tier,
      multiplier: Math.max(0.1, Number(ov.multiplier || 1)),
      enabled: ov.enabled !== false,
      isCustom: !MODEL_COSTS_PER_M[modelName],
    };
  });
}

function getEffectiveModelCost(modelName, settings) {
  const catalog = getEffectiveModelCatalog(settings);
  const clean = String(modelName || '').trim();
  const exact = catalog.find((m) => m.modelName === clean);
  if (exact) return exact;
  const partial = catalog.find((m) => clean.toLowerCase().includes(m.modelName.toLowerCase()));
  if (partial) return partial;
  return catalog.find((m) => m.modelName === 'deepseek-flash') || {
    modelName: clean || 'deepseek-flash',
    inputPerM: 0.15,
    outputPerM: 0.6,
    tier: 'flash',
    multiplier: 1,
    enabled: true,
  };
}

function quoteUsageCost(
  { modelName = 'deepseek-flash', inputTokens = 0, outputTokens = 0, agentSteps = 0, source = 'CHAT' } = {},
  settingsInput = DEFAULT_PRICING_SETTINGS
) {
  const settings = normalizeSettings(settingsInput);
  const model = getEffectiveModelCost(modelName, settings);
  const inTok = Math.max(0, Number(inputTokens) || 0);
  const outTok = Math.max(0, Number(outputTokens) || 0);
  const steps = Math.max(0, Math.round(Number(agentSteps) || 0));

  const costUsd = (inTok / 1_000_000) * model.inputPerM + (outTok / 1_000_000) * model.outputPerM;
  const rawCostEgp = costUsd * settings.usdToEgp;
  const markupPercent = model.tier === 'pro' ? settings.proMarkupPercent : settings.flashMarkupPercent;
  const markedUpEgp = rawCostEgp * (1 + markupPercent / 100);

  const tokenCredits = Math.ceil(markedUpEgp / settings.creditPriceEgp);
  const stepCredits = steps * settings.agentStepFeeCredits;
  const minCredits =
    source === 'AGENT_RUN' ? settings.minCreditsPerAgentRun : settings.minCreditsPerChat;
  const rawCredits = Math.max(minCredits, tokenCredits + stepCredits);
  const credits = Math.max(0, Math.ceil(rawCredits * (model.multiplier || 1)));
  const revenueEgp = round2(credits * settings.creditPriceEgp);
  const grossProfitEgp = round2(revenueEgp - rawCostEgp);

  return {
    modelName: model.modelName,
    tier: model.tier,
    inputTokens: inTok,
    outputTokens: outTok,
    agentSteps: steps,
    costUsd: round4(costUsd),
    rawCostEgp: round4(rawCostEgp),
    costEgp: round4(markedUpEgp),
    markupPercent,
    credits,
    revenueEgp,
    grossProfitEgp,
  };
}

async function hasCompanyByokKey(companyId, prisma = safeGetPrisma()) {
  if (!companyId || !prisma) return false;
  try {
    if (prisma.aiKey?.findFirst) {
      const key = await prisma.aiKey.findFirst({
        where: { companyId: String(companyId), isActive: true, keyType: 'COMPANY' },
        select: { id: true },
      });
      return Boolean(key);
    }
  } catch (err) {
    console.warn('[AI-CREDITS] BYOK check failed:', err.message);
  }
  return false;
}

async function getOrCreateWallet(companyId, prisma = safeGetPrisma(), settingsInput = null) {
  const key = String(companyId || 'default');
  const settings = settingsInput || (await getPricingSettings(prisma));
  const initialCredits = settings.trialBonusCredits;

  if (prisma?.aiCreditWallet?.upsert) {
    return prisma.aiCreditWallet.upsert({
      where: { companyId: key },
      update: {},
      create: {
        companyId: key,
        balance: initialCredits,
        includedBalance: 0,
        monthlyAllowance: 0,
        pricingMode: 'DEFAULT',
      },
    });
  }

  if (!memoryWallets.has(key)) {
    memoryWallets.set(key, {
      id: `mem-aic-${key}`,
      companyId: key,
      balance: initialCredits,
      includedBalance: 0,
      totalPurchased: 0,
      totalUsed: 0,
      monthlyAllowance: 0,
      dailyCreditLimit: null,
      pricingMode: 'DEFAULT',
      autoTopupEnabled: false,
      autoTopupPackageId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return memoryWallets.get(key);
}

async function getDailyCreditsUsed(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const dayStart = new Date();
  dayStart.setHours(0, 0, 0, 0);

  if (prisma?.aiCreditTransaction?.aggregate) {
    const agg = await prisma.aiCreditTransaction.aggregate({
      where: {
        companyId: key,
        status: 'COMPLETED',
        creditsDelta: { lt: 0 },
        createdAt: { gte: dayStart },
      },
      _sum: { creditsDelta: true },
    });
    return Math.abs(Number(agg?._sum?.creditsDelta || 0));
  }

  const list = memoryTransactions.get(key) || [];
  return list
    .filter((t) => t.status === 'COMPLETED' && t.creditsDelta < 0 && new Date(t.createdAt) >= dayStart)
    .reduce((sum, t) => sum + Math.abs(t.creditsDelta), 0);
}

async function getWalletSummary(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const settings = await getPricingSettings(prisma);
  const [wallet, byokActive, dailyUsed] = await Promise.all([
    getOrCreateWallet(key, prisma, settings),
    hasCompanyByokKey(key, prisma),
    getDailyCreditsUsed(key, prisma),
  ]);

  let transactions = [];
  if (prisma?.aiCreditTransaction?.findMany) {
    transactions = await prisma.aiCreditTransaction.findMany({
      where: { companyId: key },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  } else {
    transactions = (memoryTransactions.get(key) || []).slice(0, 30);
  }

  let companyWalletBalance = null;
  if (prisma?.companyWallet?.findUnique) {
    const cw = await prisma.companyWallet.findUnique({
      where: { companyId: key },
      select: { balance: true, currency: true },
    });
    companyWalletBalance = cw ? Number(cw.balance) : 0;
  }

  return {
    wallet: {
      ...wallet,
      totalAvailable: Number(wallet.balance || 0) + Number(wallet.includedBalance || 0),
      effectiveDailyLimit: wallet.dailyCreditLimit ?? settings.defaultDailyCreditLimit,
      dailyUsed,
    },
    byokActive,
    companyWalletBalance,
    pricing: {
      creditPriceEgp: settings.creditPriceEgp,
      minCreditsPerChat: settings.minCreditsPerChat,
      minCreditsPerAgentRun: settings.minCreditsPerAgentRun,
      agentStepFeeCredits: settings.agentStepFeeCredits,
      byokFreeTokens: settings.byokFreeTokens,
      enforcementMode: settings.enforcementMode,
    },
    packages: settings.packages.filter((p) => p.isActive),
    models: getEffectiveModelCatalog(settings).filter((m) => m.enabled),
    transactions,
  };
}

async function checkCreditAllowance({ companyId, estimatedCredits = 1 }, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const settings = await getPricingSettings(prisma);
  if (settings.enforcementMode === 'off') {
    return { allowed: true, billingMode: 'SHADOW', reason: 'enforcement_off' };
  }

  const [wallet, byokActive] = await Promise.all([
    getOrCreateWallet(key, prisma, settings),
    settings.byokFreeTokens ? hasCompanyByokKey(key, prisma) : false,
  ]);

  if (wallet.pricingMode === 'UNLIMITED') {
    return { allowed: true, billingMode: 'UNLIMITED', wallet };
  }
  if (byokActive && settings.byokFreeTokens) {
    return { allowed: true, billingMode: 'BYOK', wallet };
  }

  const effectiveDailyLimit = wallet.dailyCreditLimit ?? settings.defaultDailyCreditLimit;
  if (effectiveDailyLimit > 0) {
    const dailyUsed = await getDailyCreditsUsed(key, prisma);
    if (dailyUsed + estimatedCredits > effectiveDailyLimit) {
      if (settings.enforcementMode === 'enforce') {
        return {
          allowed: false,
          billingMode: 'PLATFORM',
          reason: 'DAILY_CREDIT_LIMIT_EXCEEDED',
          dailyUsed,
          dailyLimit: effectiveDailyLimit,
          wallet,
        };
      }
    }
  }

  let totalAvailable = Number(wallet.balance || 0) + Number(wallet.includedBalance || 0);
  if (totalAvailable < estimatedCredits && wallet.autoTopupEnabled && wallet.autoTopupPackageId) {
    try {
      const topup = await purchasePackageFromCompanyWallet(
        {
          companyId: key,
          packageId: wallet.autoTopupPackageId,
          isAutoTopup: true,
        },
        prisma
      );
      totalAvailable = Number(topup.wallet.balance || 0) + Number(topup.wallet.includedBalance || 0);
    } catch {
      // Auto-topup failed (e.g. insufficient CompanyWallet); fall through to normal check
    }
  }

  if (totalAvailable < estimatedCredits && settings.enforcementMode === 'enforce') {
    return {
      allowed: false,
      billingMode: 'PLATFORM',
      reason: 'INSUFFICIENT_AI_CREDITS',
      available: totalAvailable,
      required: estimatedCredits,
      wallet,
    };
  }

  return {
    allowed: true,
    billingMode: settings.enforcementMode === 'warn' && totalAvailable < estimatedCredits ? 'SHADOW' : 'PLATFORM',
    available: totalAvailable,
    wallet,
  };
}

async function meterAndDeductAiUsage(
  {
    companyId,
    source = 'CHAT',
    modelName = 'deepseek-flash',
    provider = null,
    inputTokens = 0,
    outputTokens = 0,
    agentSteps = 0,
    referenceId = null,
    description = null,
    metadata = null,
  },
  prisma = safeGetPrisma()
) {
  const key = String(companyId || 'default');
  const settings = await getPricingSettings(prisma);
  const quote = quoteUsageCost(
    { modelName, inputTokens, outputTokens, agentSteps, source },
    settings
  );

  const [wallet, byokActive] = await Promise.all([
    getOrCreateWallet(key, prisma, settings),
    settings.byokFreeTokens ? hasCompanyByokKey(key, prisma) : false,
  ]);

  // Idempotency check if referenceId is given
  if (referenceId && prisma?.aiCreditTransaction?.findFirst) {
    const existing = await prisma.aiCreditTransaction.findFirst({
      where: { companyId: key, referenceId: String(referenceId), status: 'COMPLETED' },
    });
    if (existing) {
      return { deduplicated: true, transaction: existing, wallet, quote };
    }
  }

  let billingMode = 'PLATFORM';
  let creditsToDeduct = quote.credits;

  if (wallet.pricingMode === 'UNLIMITED') {
    billingMode = 'UNLIMITED';
    creditsToDeduct = 0;
  } else if (byokActive && settings.byokFreeTokens) {
    billingMode = 'BYOK';
    creditsToDeduct = 0;
  } else if (settings.enforcementMode === 'off') {
    billingMode = 'SHADOW';
    creditsToDeduct = 0;
  }

  const txType =
    source === 'AGENT_RUN'
      ? 'USAGE_AGENT'
      : source === 'IMAGE'
        ? 'USAGE_IMAGE'
        : source === 'VOICE'
          ? 'USAGE_VOICE'
          : 'USAGE_CHAT';

  if (prisma?.$transaction && prisma?.aiCreditWallet?.update) {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.aiCreditWallet.findUnique({ where: { id: wallet.id } });
      let deductFromIncluded = Math.min(current.includedBalance || 0, creditsToDeduct);
      let deductFromBalance = creditsToDeduct - deductFromIncluded;

      // Never go negative in hard enforce mode; in warn mode clamp at 0 and mark SHADOW remainder
      const availableBalance = current.balance || 0;
      if (deductFromBalance > availableBalance) {
        if (settings.enforcementMode === 'warn') {
          deductFromBalance = availableBalance;
          if (deductFromIncluded + deductFromBalance === 0) {
            billingMode = 'SHADOW';
          }
        } else {
          deductFromBalance = availableBalance;
        }
      }

      const actualDeducted = deductFromIncluded + deductFromBalance;
      const updated = await tx.aiCreditWallet.update({
        where: { id: wallet.id },
        data: {
          includedBalance: { decrement: deductFromIncluded },
          balance: { decrement: deductFromBalance },
          totalUsed: { increment: actualDeducted },
        },
      });

      const txRow = await tx.aiCreditTransaction.create({
        data: {
          walletId: wallet.id,
          companyId: key,
          type: txType,
          status: 'COMPLETED',
          source,
          creditsDelta: -actualDeducted,
          balanceAfter: (updated.balance || 0) + (updated.includedBalance || 0),
          modelName: quote.modelName,
          provider,
          inputTokens: quote.inputTokens,
          outputTokens: quote.outputTokens,
          agentSteps: quote.agentSteps,
          costUsd: quote.costUsd,
          costEgp: quote.costEgp,
          amountEgp: round2(actualDeducted * settings.creditPriceEgp),
          billingMode,
          referenceId: referenceId ? String(referenceId) : null,
          description: description || `${source} (${quote.modelName})`,
          metadata: metadata || undefined,
        },
      });

      return { wallet: updated, transaction: txRow, deducted: actualDeducted };
    });
    return { ...result, quote, billingMode };
  }

  // Memory fallback for unit tests
  const deductFromIncluded = Math.min(wallet.includedBalance || 0, creditsToDeduct);
  const deductFromBalance = Math.min(wallet.balance || 0, creditsToDeduct - deductFromIncluded);
  const actualDeducted = deductFromIncluded + deductFromBalance;
  wallet.includedBalance -= deductFromIncluded;
  wallet.balance -= deductFromBalance;
  wallet.totalUsed += actualDeducted;
  wallet.updatedAt = new Date().toISOString();

  const txRow = {
    id: `mem-tx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    walletId: wallet.id,
    companyId: key,
    type: txType,
    status: 'COMPLETED',
    source,
    creditsDelta: -actualDeducted,
    balanceAfter: wallet.balance + wallet.includedBalance,
    modelName: quote.modelName,
    provider,
    inputTokens: quote.inputTokens,
    outputTokens: quote.outputTokens,
    agentSteps: quote.agentSteps,
    costUsd: quote.costUsd,
    costEgp: quote.costEgp,
    amountEgp: round2(actualDeducted * settings.creditPriceEgp),
    billingMode,
    referenceId,
    description: description || `${source} (${quote.modelName})`,
    createdAt: new Date().toISOString(),
  };
  const list = memoryTransactions.get(key) || [];
  list.unshift(txRow);
  memoryTransactions.set(key, list);
  return { wallet, transaction: txRow, deducted: actualDeducted, quote, billingMode };
}

function resolvePackage(settings, packageId) {
  const pkg = (settings.packages || []).find((p) => p.id === packageId && p.isActive !== false);
  if (!pkg) {
    const err = new Error('الباقة المحددة غير موجودة أو غير مفعلة');
    err.statusCode = 404;
    throw err;
  }
  return pkg;
}

async function purchasePackageFromCompanyWallet(
  { companyId, packageId, userId = null, isAutoTopup = false },
  prisma = safeGetPrisma()
) {
  const key = String(companyId || '');
  if (!key) throw Object.assign(new Error('يجب تحديد الشركة'), { statusCode: 400 });

  const settings = await getPricingSettings(prisma);
  const pkg = resolvePackage(settings, packageId);
  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
  const priceEgp = Number(pkg.priceEgp);

  if (!prisma?.$transaction || !prisma?.companyWallet) {
    throw Object.assign(new Error('خدمة المحفظة غير متاحة حالياً'), { statusCode: 503 });
  }

  return prisma.$transaction(async (tx) => {
    const cw = await tx.companyWallet.findUnique({ where: { companyId: key } });
    if (!cw || Number(cw.balance) < priceEgp) {
      const err = new Error(
        `رصيد محفظة الشركة غير كافٍ (المتاح: ${cw ? Number(cw.balance) : 0} ج.م، المطلوب: ${priceEgp} ج.م)`
      );
      err.statusCode = 402;
      throw err;
    }

    // Atomic conditional debit prevents race condition double-spend
    const debited = await tx.companyWallet.updateMany({
      where: { id: cw.id, balance: { gte: priceEgp } },
      data: {
        balance: { decrement: priceEgp },
        totalSpent: { increment: priceEgp },
      },
    });
    if (!debited || debited.count === 0) {
      throw Object.assign(new Error('رصيد محفظة الشركة غير كافٍ'), { statusCode: 402 });
    }

    const updatedCw = await tx.companyWallet.findUnique({ where: { id: cw.id } });
    const refCode = `AIC-WLT-${Date.now()}`;

    await tx.transaction.create({
      data: {
        walletId: cw.id,
        type: 'WITHDRAW',
        amount: priceEgp,
        status: 'COMPLETED',
        description: `شحن رصيد كريدت AI: ${pkg.nameAr} (${totalCredits.toLocaleString('en-US')} Credit)`,
        referenceId: refCode,
      },
    });

    if (tx.companyWalletTransaction?.create) {
      await tx.companyWalletTransaction.create({
        data: {
          companyId: key,
          walletId: cw.id,
          type: 'WITHDRAW',
          reason: 'AI_CREDITS_PURCHASE',
          code: refCode,
          amount: priceEgp,
          balanceAfter: updatedCw.balance,
          notes: `${pkg.nameAr} (+${totalCredits} Credit)`,
          createdBy: userId || undefined,
        },
      });
    }

    const aiWallet = await tx.aiCreditWallet.upsert({
      where: { companyId: key },
      update: {
        balance: { increment: totalCredits },
        totalPurchased: { increment: totalCredits },
      },
      create: {
        companyId: key,
        balance: settings.trialBonusCredits + totalCredits,
        totalPurchased: totalCredits,
      },
    });

    const aiTx = await tx.aiCreditTransaction.create({
      data: {
        walletId: aiWallet.id,
        companyId: key,
        type: isAutoTopup ? 'AUTO_TOPUP' : 'TOPUP_WALLET',
        status: 'COMPLETED',
        source: 'BILLING',
        creditsDelta: totalCredits,
        balanceAfter: (aiWallet.balance || 0) + (aiWallet.includedBalance || 0),
        amountEgp: priceEgp,
        billingMode: 'PLATFORM',
        referenceId: refCode,
        description: `${isAutoTopup ? 'شحن تلقائي' : 'شحن من المحفظة'}: ${pkg.nameAr}`,
        metadata: { packageId: pkg.id, baseCredits: pkg.credits, bonusCredits: pkg.bonusCredits || 0, userId },
      },
    });

    return {
      wallet: aiWallet,
      transaction: aiTx,
      companyWalletBalance: Number(updatedCw.balance),
      package: pkg,
    };
  });
}

async function createPendingExternalTopup(
  { companyId, packageId, referenceId, method = 'KASHIER', metadata = {} },
  prisma = safeGetPrisma()
) {
  const key = String(companyId);
  const settings = await getPricingSettings(prisma);
  const pkg = resolvePackage(settings, packageId);
  const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
  const wallet = await getOrCreateWallet(key, prisma, settings);

  if (prisma?.aiCreditTransaction?.create) {
    return prisma.aiCreditTransaction.create({
      data: {
        walletId: wallet.id,
        companyId: key,
        type: 'PENDING_TOPUP',
        status: 'PENDING',
        source: 'BILLING',
        creditsDelta: totalCredits,
        balanceAfter: (wallet.balance || 0) + (wallet.includedBalance || 0),
        amountEgp: pkg.priceEgp,
        billingMode: 'PLATFORM',
        referenceId: String(referenceId),
        description: `شحن كريدت قيد المعالجة (${method}): ${pkg.nameAr}`,
        metadata: { packageId: pkg.id, method, baseCredits: pkg.credits, bonusCredits: pkg.bonusCredits || 0, ...metadata },
      },
    });
  }
  return null;
}

async function fulfillExternalTopup(
  { companyId, referenceId, method = 'KASHIER', packageId = null, amountEgp = null, approvedBy = null },
  prisma = safeGetPrisma()
) {
  if (!prisma?.$transaction || !prisma?.aiCreditTransaction) {
    throw Object.assign(new Error('Database unavailable'), { statusCode: 503 });
  }
  const ref = String(referenceId || '');
  if (!ref) throw Object.assign(new Error('referenceId is required'), { statusCode: 400 });

  const settings = await getPricingSettings(prisma);

  return prisma.$transaction(async (tx) => {
    const existingCompleted = await tx.aiCreditTransaction.findFirst({
      where: {
        referenceId: ref,
        status: 'COMPLETED',
        type: { in: ['TOPUP_KASHIER', 'TOPUP_RECEIPT'] },
      },
    });
    if (existingCompleted) {
      const wallet = await tx.aiCreditWallet.findUnique({ where: { id: existingCompleted.walletId } });
      return { alreadyFulfilled: true, wallet, transaction: existingCompleted };
    }

    const pending = await tx.aiCreditTransaction.findFirst({
      where: { referenceId: ref, status: 'PENDING', type: 'PENDING_TOPUP' },
    });

    const resolvedCompanyId = String(companyId || pending?.companyId || '');
    if (!resolvedCompanyId) {
      throw Object.assign(new Error('Cannot identify companyId for AI credit topup'), { statusCode: 400 });
    }

    let totalCredits = Number(pending?.creditsDelta || 0);
    let finalAmountEgp = Number(amountEgp ?? pending?.amountEgp ?? 0);
    const resolvedPackageId = packageId || pending?.metadata?.packageId || null;

    if (!totalCredits && resolvedPackageId) {
      const pkg = resolvePackage(settings, resolvedPackageId);
      totalCredits = pkg.credits + (pkg.bonusCredits || 0);
      if (!finalAmountEgp) finalAmountEgp = pkg.priceEgp;
    } else if (!totalCredits && finalAmountEgp > 0) {
      totalCredits = Math.round(finalAmountEgp / settings.creditPriceEgp);
    }

    if (totalCredits <= 0) {
      throw Object.assign(new Error('Invalid credit amount for fulfillment'), { statusCode: 400 });
    }

    const wallet = await tx.aiCreditWallet.upsert({
      where: { companyId: resolvedCompanyId },
      update: {
        balance: { increment: totalCredits },
        totalPurchased: { increment: totalCredits },
      },
      create: {
        companyId: resolvedCompanyId,
        balance: settings.trialBonusCredits + totalCredits,
        totalPurchased: totalCredits,
      },
    });

    const completedType = method === 'RECEIPT' ? 'TOPUP_RECEIPT' : 'TOPUP_KASHIER';
    let txRow;
    if (pending) {
      txRow = await tx.aiCreditTransaction.update({
        where: { id: pending.id },
        data: {
          type: completedType,
          status: 'COMPLETED',
          balanceAfter: (wallet.balance || 0) + (wallet.includedBalance || 0),
          description: `تم شحن ${totalCredits.toLocaleString('en-US')} Credit (${method === 'RECEIPT' ? 'تحويل يدوي' : 'كاشير'})`,
          metadata: { ...(pending.metadata || {}), approvedBy, fulfilledAt: new Date().toISOString() },
        },
      });
    } else {
      txRow = await tx.aiCreditTransaction.create({
        data: {
          walletId: wallet.id,
          companyId: resolvedCompanyId,
          type: completedType,
          status: 'COMPLETED',
          source: 'BILLING',
          creditsDelta: totalCredits,
          balanceAfter: (wallet.balance || 0) + (wallet.includedBalance || 0),
          amountEgp: finalAmountEgp,
          billingMode: 'PLATFORM',
          referenceId: ref,
          description: `تم شحن ${totalCredits.toLocaleString('en-US')} Credit (${method === 'RECEIPT' ? 'تحويل يدوي' : 'كاشير'})`,
          metadata: { packageId: resolvedPackageId, approvedBy },
        },
      });
    }

    return { alreadyFulfilled: false, wallet, transaction: txRow };
  });
}

async function adminAdjustCompanyCredits(
  { companyId, creditsDelta = 0, reason = '', adminId = null, overrides = null },
  prisma = safeGetPrisma()
) {
  const key = String(companyId || '');
  if (!key) throw Object.assign(new Error('companyId مطلوب'), { statusCode: 400 });

  const settings = await getPricingSettings(prisma);
  const wallet = await getOrCreateWallet(key, prisma, settings);
  const delta = Math.round(Number(creditsDelta) || 0);

  if (prisma?.$transaction && prisma?.aiCreditWallet?.update) {
    return prisma.$transaction(async (tx) => {
      const updateData = {};
      if (delta !== 0) {
        const nextBalance = Math.max(0, (wallet.balance || 0) + delta);
        updateData.balance = nextBalance;
        if (delta > 0) updateData.totalPurchased = { increment: delta };
      }
      if (overrides && typeof overrides === 'object') {
        if (overrides.dailyCreditLimit !== undefined) {
          updateData.dailyCreditLimit =
            overrides.dailyCreditLimit === null || overrides.dailyCreditLimit === ''
              ? null
              : Math.max(0, Math.round(Number(overrides.dailyCreditLimit)));
        }
        if (overrides.pricingMode && ['DEFAULT', 'UNLIMITED', 'BYOK_ONLY'].includes(overrides.pricingMode)) {
          updateData.pricingMode = overrides.pricingMode;
        }
        if (overrides.monthlyAllowance !== undefined) {
          updateData.monthlyAllowance = Math.max(0, Math.round(Number(overrides.monthlyAllowance)));
        }
        if (overrides.autoTopupEnabled !== undefined) {
          updateData.autoTopupEnabled = Boolean(overrides.autoTopupEnabled);
        }
        if (overrides.autoTopupPackageId !== undefined) {
          updateData.autoTopupPackageId = overrides.autoTopupPackageId || null;
        }
      }

      const updated = Object.keys(updateData).length
        ? await tx.aiCreditWallet.update({ where: { id: wallet.id }, data: updateData })
        : wallet;

      let txRow = null;
      if (delta !== 0) {
        txRow = await tx.aiCreditTransaction.create({
          data: {
            walletId: wallet.id,
            companyId: key,
            type: delta > 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT',
            status: 'COMPLETED',
            source: 'ADMIN',
            creditsDelta: delta,
            balanceAfter: (updated.balance || 0) + (updated.includedBalance || 0),
            billingMode: 'PLATFORM',
            description: reason || (delta > 0 ? 'منحة رصيد من الإدارة' : 'خصم رصيد من الإدارة'),
            metadata: { adminId },
          },
        });
      }

      return { wallet: updated, transaction: txRow };
    });
  }

  wallet.balance = Math.max(0, (wallet.balance || 0) + delta);
  if (delta !== 0) {
    const txRow = {
      id: `mem-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      walletId: wallet.id,
      companyId: key,
      type: delta > 0 ? 'ADMIN_GRANT' : 'ADMIN_DEDUCT',
      status: 'COMPLETED',
      source: 'ADMIN',
      creditsDelta: delta,
      balanceAfter: (wallet.balance || 0) + (wallet.includedBalance || 0),
      modelName: null,
      inputTokens: 0,
      outputTokens: 0,
      agentSteps: 0,
      amountEgp: 0,
      billingMode: 'PLATFORM',
      referenceId: null,
      description: reason || (delta > 0 ? 'منحة رصيد من الإدارة' : 'خصم رصيد من الإدارة'),
      createdAt: new Date().toISOString(),
    };
    const list = memoryTransactions.get(key) || [];
    list.unshift(txRow);
    memoryTransactions.set(key, list);
    return { wallet, transaction: txRow };
  }
  return { wallet, transaction: null };
}

module.exports = {
  SETTINGS_NAME,
  DEFAULT_PACKAGES,
  DEFAULT_PRICING_SETTINGS,
  invalidateSettingsCache,
  getPricingSettings,
  updatePricingSettings,
  getEffectiveModelCatalog,
  getEffectiveModelCost,
  quoteUsageCost,
  hasCompanyByokKey,
  getOrCreateWallet,
  getWalletSummary,
  checkCreditAllowance,
  meterAndDeductAiUsage,
  purchasePackageFromCompanyWallet,
  createPendingExternalTopup,
  fulfillExternalTopup,
  adminAdjustCompanyCredits,
};
