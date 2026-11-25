const { resolveAiKey, callChatCompletion } = require('./radiologyAiDraftService');

let sharedDbModule = null;
function safeGetPrisma() {
  if (!sharedDbModule) {
    try {
      sharedDbModule = require('./sharedDatabase');
    } catch {
      return null;
    }
  }
  try {
    return sharedDbModule.getSharedPrismaClient ? sharedDbModule.getSharedPrismaClient() : null;
  } catch {
    return null;
  }
}

const TOOL_CREDIT_COSTS = {
  emma: 1,
  leo: 2,
  alphaSingle: 3,
  alphaPack5: 15,
  alphaRemoveBgStandard: 0,
  prefill: 3,
  studioStart: 17,
  bekam: 3,
};

// Local-only fallback store used strictly when Prisma models aren't generated yet
const memoryWallets = new Map();
const memoryTransactions = new Map();
const memoryDrafts = new Map();

async function getOrCreateWallet(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  if (prisma?.marketplaceCreditWallet?.upsert) {
    return prisma.marketplaceCreditWallet.upsert({
      where: { companyId: key },
      update: {},
      create: {
        companyId: key,
        balance: 30,
        monthlyAllowance: 30,
        planTier: 'FREE_TRIAL',
      },
    });
  }

  if (!memoryWallets.has(key)) {
    memoryWallets.set(key, {
      id: `mem-wallet-${key}`,
      companyId: key,
      balance: 30,
      monthlyAllowance: 30,
      planTier: 'FREE_TRIAL',
      updatedAt: new Date().toISOString(),
    });
  }
  return memoryWallets.get(key);
}

async function getWalletSummary(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const wallet = await getOrCreateWallet(key, prisma);

  let transactions = [];
  if (prisma?.marketplaceCreditTransaction?.findMany) {
    transactions = await prisma.marketplaceCreditTransaction.findMany({
      where: { companyId: key },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  } else {
    transactions = (memoryTransactions.get(key) || []).slice(0, 20);
  }

  return {
    wallet,
    toolCosts: TOOL_CREDIT_COSTS,
    plans: [
      { id: 'STARTER', name: 'Starter', priceUsd: 25, credits: 850, unlimitedTools: ['calculator', 'qr-barcode', 'dashboard'] },
      { id: 'PRO', name: 'Pro', priceUsd: 50, credits: 1700, popular: true, unlimitedTools: ['calculator', 'qr-barcode', 'dashboard', 'opportunities', 'tax-assistant'] },
    ],
    transactions,
  };
}

function calculateCustomPlan(usage = {}) {
  const studio = Math.max(0, Number(usage.studio || 0));
  const alpha = Math.max(0, Number(usage.alpha || 0));
  const leo = Math.max(0, Number(usage.leo || 0));
  const emma = Math.max(0, Number(usage.emma || 0));
  const bekam = Math.max(0, Number(usage.bekam || 0));

  const totalCredits = studio * 18 + alpha * 3 + leo * 2 + emma * 1 + bekam * 4;
  const listPriceUsd = Math.round(totalCredits * 0.0296 * 100) / 100;
  const discountedPriceUsd = Math.round(listPriceUsd * 0.8 * 100) / 100;

  return {
    breakdown: { studio, alpha, leo, emma, bekam },
    totalCredits,
    discountPct: 20,
    listPriceUsd,
    discountedPriceUsd,
    billingDays: 30,
  };
}

async function deductCredits(companyId, tool, amount, description, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const cost = Math.max(0, Number(amount || 0));
  const wallet = await getOrCreateWallet(key, prisma);

  if (cost === 0) {
    return { wallet, deducted: 0 };
  }

  if (wallet.balance < cost) {
    const err = new Error(`رصيد الكريدت غير كافٍ (المتاح: ${wallet.balance}، المطلوب: ${cost})`);
    err.statusCode = 402;
    throw err;
  }

  if (prisma?.$transaction && prisma?.marketplaceCreditWallet?.update) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.marketplaceCreditWallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: cost } },
      });
      await tx.marketplaceCreditTransaction.create({
        data: {
          walletId: wallet.id,
          companyId: key,
          tool,
          creditsDelta: -cost,
          balanceAfter: updated.balance,
          description: description || tool,
        },
      });
      return { wallet: updated, deducted: cost };
    });
  }

  wallet.balance -= cost;
  wallet.updatedAt = new Date().toISOString();
  const list = memoryTransactions.get(key) || [];
  list.unshift({
    id: `tx-${Date.now()}`,
    walletId: wallet.id,
    companyId: key,
    tool,
    creditsDelta: -cost,
    balanceAfter: wallet.balance,
    description: description || tool,
    createdAt: new Date().toISOString(),
  });
  memoryTransactions.set(key, list);
  return { wallet, deducted: cost };
}

async function requireResolvedAiKey(companyId, prisma = safeGetPrisma()) {
  const resolved = await resolveAiKey(prisma, companyId);
  if (!resolved || !resolved.apiKey) {
    const err = new Error('لا يوجد مفتاح AI نشط في جدول public.ai_keys لهذه الشركة أو للمنصة');
    err.statusCode = 422;
    throw err;
  }
  return resolved;
}

async function generateProductCopy({ companyId, mode = 'text', productInfo, contextLine, language = 'ar' }, prisma = safeGetPrisma()) {
  const textInput = String(productInfo || contextLine || '').trim();
  if (!textInput) {
    const err = new Error('يرجى إدخال وصف أو معلومات المنتج');
    err.statusCode = 400;
    throw err;
  }

  const aiConfig = await requireResolvedAiKey(companyId, prisma);
  const system = language === 'en'
    ? 'You are an expert Amazon/Noon/Jumia e-commerce SEO copywriter. Return clean JSON with keys: title, bulletPoints (array of 5), description, searchKeywords (array of 8).'
    : 'أنت كاتب محتوى تجارة إلكترونية محترف لمنصات أمازون ونون وجوميا. أرجع JSON فقط بالمفاتيح: title، bulletPoints (مصفوفة من 5 نقاط)، description، searchKeywords (مصفوفة من 8 كلمات مفتاحية) باللغة العربية الواضحة.';

  const user = `Mode: ${mode}\nProduct Info:\n${textInput}`;
  const raw = await callChatCompletion({ ...aiConfig, system, user, maxTokens: 1500 });

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      title: textInput.slice(0, 110),
      bulletPoints: [raw],
      description: raw,
      searchKeywords: [],
    };
  }

  const { wallet } = await deductCredits(companyId, 'leo', TOOL_CREDIT_COSTS.leo, 'توليد وصف منتج بالـ AI', prisma);
  return { copy: parsed, wallet, modelUsed: aiConfig.model };
}

async function generateImageBriefAndAsset({ companyId, action = 'image_to_image', prompt = '', style = 'Product Photo', removalMode = 'standard' }, prisma = safeGetPrisma()) {
  const isFreeBg = action === 'remove_bg' && removalMode === 'standard';
  const cost = isFreeBg ? 0 : action === 'pack5' ? TOOL_CREDIT_COSTS.alphaPack5 : TOOL_CREDIT_COSTS.alphaSingle;

  const aiConfig = await requireResolvedAiKey(companyId, prisma);
  const system = 'أنت مخرج فني لتصوير منتجات التجارة الإلكترونية. أنشئ وصفاً تصويرياً دقيقاً (Prompt) وإرشادات إضاءة وزوايا متوافقة مع شروط صور أمازون ونون بصيغة JSON بالمفاتيح: enhancedPrompt, lightingSetup, angles (array of strings), complianceChecklist (array of strings).';
  const user = `Action: ${action}\nStyle: ${style}\nMerchant Notes: ${prompt || 'تحسين مظهر المنتج بخلفية احترافية'}`;

  const raw = await callChatCompletion({ ...aiConfig, system, user, maxTokens: 1200 });
  let artDirection;
  try {
    artDirection = JSON.parse(raw);
  } catch {
    artDirection = {
      enhancedPrompt: raw,
      lightingSetup: 'Studio Softbox 5500K',
      angles: ['Front', 'Side', 'Environment', 'Infographic', 'In Use'],
      complianceChecklist: ['White background #FFFFFF for main image', 'Product fills 85% of frame'],
    };
  }

  const { wallet } = await deductCredits(companyId, 'alpha', cost, `استوديو الصور (${action})`, prisma);
  return { artDirection, creditsUsed: cost, wallet, modelUsed: aiConfig.model };
}

async function generateMarketplacePrefill({ companyId, title, description, marketplaces = ['amazon'] }, prisma = safeGetPrisma()) {
  const cleanTitle = String(title || '').trim();
  if (!cleanTitle) {
    const err = new Error('عنوان المنتج مطلوب');
    err.statusCode = 400;
    throw err;
  }

  const targets = Array.isArray(marketplaces) && marketplaces.length > 0 ? marketplaces : ['amazon'];
  const cost = targets.length * TOOL_CREDIT_COSTS.prefill;
  const aiConfig = await requireResolvedAiKey(companyId, prisma);

  const system = 'أنت خبير إدراج منتجات على أمازون ونون وجوميا وترينديول. أرجع JSON يحتوي على كائن لكل منصة مطلوبة بالحقول المقترحة: suggestedCategory, brandPlaceholder, bulletPoints, attributes (key-value).';
  const user = `Target Marketplaces: ${targets.join(', ')}\nTitle: ${cleanTitle}\nDescription: ${description || ''}`;
  const raw = await callChatCompletion({ ...aiConfig, system, user, maxTokens: 1600 });

  let payloads;
  try {
    payloads = JSON.parse(raw);
  } catch {
    payloads = { raw };
  }

  const { wallet } = await deductCredits(companyId, 'prefill', cost, `تعبئة خصائص (${targets.join(', ')})`, prisma);
  return { payloads, creditsUsed: cost, wallet };
}

async function sellerCopilotChat({ companyId, message }, prisma = safeGetPrisma()) {
  const cleanMsg = String(message || '').trim();
  if (!cleanMsg) {
    const err = new Error('الرسالة مطلوبة');
    err.statusCode = 400;
    throw err;
  }

  const aiConfig = await requireResolvedAiKey(companyId, prisma);
  const system = 'أنت مساعد عمليات البائعين الذكي (Seller Copilot) داخل منصة MaxP للتجارة الإلكترونية في مصر والخليج (أمازون، نون، جوميا، ترينديول). أجب بإيجاز عملي دقيق بالعربية حول التسعير، العمولات، الشحن (FBA / Easy Ship / FBN)، وإعداد الكتالوج.';
  const reply = await callChatCompletion({ ...aiConfig, system, user: cleanMsg, maxTokens: 1000 });
  const { wallet } = await deductCredits(companyId, 'emma', TOOL_CREDIT_COSTS.emma, 'استشارة مساعد التاجر', prisma);
  return { reply, wallet };
}

async function listStudioDrafts(companyId, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  if (prisma?.marketplaceStudioDraft?.findMany) {
    return prisma.marketplaceStudioDraft.findMany({
      where: { companyId: key },
      orderBy: { updatedAt: 'desc' },
      take: 25,
    });
  }
  return memoryDrafts.get(key) || [];
}

async function saveStudioDraft({ companyId, workflow = 'AI_COMPLETE', title, sourceImageUrl, generatedImages, seoContent, marketplacePayloads, status = 'DRAFT' }, prisma = safeGetPrisma()) {
  const key = String(companyId || 'default');
  const cleanTitle = String(title || 'مسودة منتج جديدة').trim();

  if (prisma?.marketplaceStudioDraft?.create) {
    return prisma.marketplaceStudioDraft.create({
      data: {
        companyId: key,
        workflow,
        title: cleanTitle,
        sourceImageUrl: sourceImageUrl || null,
        generatedImagesJson: generatedImages ? JSON.stringify(generatedImages) : null,
        seoContentJson: seoContent ? JSON.stringify(seoContent) : null,
        marketplacePayloadsJson: marketplacePayloads ? JSON.stringify(marketplacePayloads) : null,
        status,
      },
    });
  }

  const draft = {
    id: `draft-${Date.now()}`,
    companyId: key,
    workflow,
    title: cleanTitle,
    sourceImageUrl: sourceImageUrl || null,
    generatedImagesJson: generatedImages ? JSON.stringify(generatedImages) : null,
    seoContentJson: seoContent ? JSON.stringify(seoContent) : null,
    marketplacePayloadsJson: marketplacePayloads ? JSON.stringify(marketplacePayloads) : null,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const existing = memoryDrafts.get(key) || [];
  existing.unshift(draft);
  memoryDrafts.set(key, existing);
  return draft;
}

const memoryPriceComparisons = new Map();

function buildMarketplaceSearchUrls(country, query) {
  const q = encodeURIComponent(String(query || '').trim());
  const c = String(country || 'EGY').toUpperCase();
  const amazonHost = c === 'KSA' ? 'amazon.sa' : c === 'UAE' ? 'amazon.ae' : 'amazon.eg';
  const noonSlug = c === 'KSA' ? 'saudi-en' : c === 'UAE' ? 'uae-en' : 'egypt-en';
  return {
    amazon: `https://www.${amazonHost}/s?k=${q}`,
    noon: `https://www.noon.com/${noonSlug}/search/?q=${q}`,
    jumia: c === 'EGY' ? `https://www.jumia.com.eg/catalog/?q=${q}` : null,
  };
}

async function compareMarketplacePrices({ companyId, country = 'EGY', platforms = ['amazon', 'noon', 'jumia'], query }, prisma = safeGetPrisma()) {
  const cleanQuery = String(query || '').trim();
  if (!cleanQuery) {
    const err = new Error('أدخل اسم المنتج أو رابط المنتج للمقارنة');
    err.statusCode = 400;
    throw err;
  }

  const aiConfig = await requireResolvedAiKey(companyId, prisma);
  const selected = Array.isArray(platforms) && platforms.length > 0 ? platforms : ['amazon', 'noon', 'jumia'];
  const system = 'أنت محلل تسعير تجارة إلكترونية في مصر والخليج. أرجع JSON فقط بالمفاتيح: productTitle، estimatedRange ({ min, max, currency })، recommendedStrategy (string)، platformNotes (array of { platform, positioning, tip }).';
  const user = `Country: ${country}\nPlatforms: ${selected.join(', ')}\nProduct Query: ${cleanQuery}`;
  const raw = await callChatCompletion({ ...aiConfig, system, user, maxTokens: 1200 });

  let analysis;
  try {
    analysis = JSON.parse(raw);
  } catch {
    analysis = {
      productTitle: cleanQuery,
      estimatedRange: { min: 0, max: 0, currency: country === 'KSA' ? 'SAR' : country === 'UAE' ? 'AED' : 'EGP' },
      recommendedStrategy: raw,
      platformNotes: [],
    };
  }

  const { wallet } = await deductCredits(companyId, 'bekam', TOOL_CREDIT_COSTS.bekam, `مقارنة أسعار: ${cleanQuery.slice(0, 40)}`, prisma);
  const entry = {
    id: `cmp-${Date.now()}`,
    country,
    platforms: selected,
    query: cleanQuery,
    searchUrls: buildMarketplaceSearchUrls(country, cleanQuery),
    analysis,
    createdAt: new Date().toISOString(),
  };

  const key = String(companyId || 'default');
  const hist = memoryPriceComparisons.get(key) || [];
  hist.unshift(entry);
  memoryPriceComparisons.set(key, hist.slice(0, 20));

  return { entry, wallet, modelUsed: aiConfig.model };
}

function getPriceCompareHistory(companyId) {
  return memoryPriceComparisons.get(String(companyId || 'default')) || [];
}

module.exports = {
  TOOL_CREDIT_COSTS,
  getWalletSummary,
  calculateCustomPlan,
  deductCredits,
  generateProductCopy,
  generateImageBriefAndAsset,
  generateMarketplacePrefill,
  sellerCopilotChat,
  listStudioDrafts,
  saveStudioDraft,
  compareMarketplacePrices,
  getPriceCompareHistory,
  buildMarketplaceSearchUrls,
};
