const { resolveAiKey, callChatCompletion, parseDraftResponse } = require('./radiologyAiDraftService');

const BASE_URL_MAP = {
  OPENROUTER: 'https://openrouter.ai/api/v1',
  OPENAI: 'https://api.openai.com/v1',
  GROQ: 'https://api.groq.com/openai/v1',
  DEEPSEEK: 'https://api.deepseek.com/v1',
  ANTHROPIC: 'https://api.anthropic.com/v1',
  GOOGLE: 'https://generativelanguage.googleapis.com/v1beta',
  MISTRAL: 'https://api.mistral.ai/v1',
  NVIDIA: 'https://integrate.api.nvidia.com/v1',
  HUGGINGFACE: 'https://router.huggingface.co/v1',
  OLLAMA: 'http://localhost:11434/v1',
};

const FALLBACK_MODELS_BY_PROVIDER = {
  GOOGLE: ['gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-1.5-flash'],
  OPENROUTER: ['openai/gpt-4o-mini', 'google/gemini-2.0-flash-001'],
  OPENAI: ['gpt-4o-mini'],
  GROQ: ['llama-3.3-70b-versatile', 'qwen/qwen3.8-27b'],
  DEEPSEEK: ['deepseek-chat'],
  ANTHROPIC: ['claude-3-5-haiku-latest'],
  MISTRAL: ['mistral-small-latest'],
  NVIDIA: ['nvidia/llama-3.1-nemotron-70b-instruct'],
  HUGGINGFACE: ['meta-llama/Meta-Llama-3.1-8B-Instruct'],
  OLLAMA: ['llama3.1'],
};

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
  healthFix: 2,
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

function normalizeBaseUrl(rawUrl, provider) {
  const fallback = BASE_URL_MAP[provider] || 'https://api.openai.com/v1';
  const cleaned = String(rawUrl || fallback).trim().replace(/\/+$/, '');
  return cleaned || fallback;
}

function buildAiCandidateList(rows, primaryFallback) {
  const candidates = [];
  const seen = new Set();
  const push = (provider, apiKey, baseUrl, model) => {
    if (!apiKey || !model) return;
    const prov = String(provider || 'GOOGLE').toUpperCase();
    const normUrl = normalizeBaseUrl(baseUrl, prov);
    const key = `${prov}:${apiKey}:${normUrl}:${model}`;
    if (seen.has(key)) return;
    seen.add(key);
    candidates.push({ provider: prov, apiKey, baseUrl: normUrl, model });
  };

  for (const row of rows || []) {
    const prov = String(row.provider || 'GOOGLE').toUpperCase();
    const enabledModels = Array.isArray(row.aiModelConfigs)
      ? row.aiModelConfigs.map((m) => m?.modelName).filter(Boolean)
      : [];
    const models = [...enabledModels, ...(FALLBACK_MODELS_BY_PROVIDER[prov] || ['gpt-4o-mini'])];
    for (const model of models) {
      push(prov, row.apiKey, row.baseUrl, model);
    }
  }

  if (primaryFallback?.apiKey) {
    const prov = String(primaryFallback.provider || 'GOOGLE').toUpperCase();
    push(prov, primaryFallback.apiKey, primaryFallback.baseUrl, primaryFallback.model);
    for (const model of FALLBACK_MODELS_BY_PROVIDER[prov] || []) {
      push(prov, primaryFallback.apiKey, primaryFallback.baseUrl, model);
    }
  }
  return candidates;
}

async function callVisionOrChat({ baseUrl, apiKey, model, system, user, imageDataUrl, maxTokens = 1500 }) {
  const cleanDataUrl = typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/') ? imageDataUrl : '';
  if (!cleanDataUrl) {
    return callChatCompletion({ baseUrl, apiKey, model, system, user, maxTokens });
  }

  const match = cleanDataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match) {
    return callChatCompletion({ baseUrl, apiKey, model, system, user, maxTokens });
  }
  const mimeType = match[1];
  const base64Data = match[2];
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 35000);

  try {
    if (baseUrl.includes('generativelanguage')) {
      const response = await fetch(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            role: 'user',
            parts: [
              { text: `${system}\n\n${user}` },
              { inlineData: { mimeType, data: base64Data } },
            ],
          }],
          generationConfig: { temperature: 0.3, maxOutputTokens: Math.max(maxTokens, 2048) },
        }),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
      const json = await response.json();
      return parseDraftResponse(json.candidates?.[0]?.content?.parts?.map((p) => p.text).join(''));
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        max_tokens: maxTokens,
        messages: [
          { role: 'system', content: system },
          {
            role: 'user',
            content: [
              { type: 'text', text: user },
              { type: 'image_url', image_url: { url: cleanDataUrl } },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`AI HTTP ${response.status}`);
    const json = await response.json();
    return parseDraftResponse(json.choices?.[0]?.message?.content);
  } finally {
    clearTimeout(timer);
  }
}

async function runMarketplaceAiCompletion({ companyId, system, user, imageDataUrl, maxTokens = 1500 }, prisma = safeGetPrisma()) {
  let rows = [];
  if (prisma?.aiKey?.findMany) {
    rows = await prisma.aiKey.findMany({
      where: {
        isActive: true,
        OR: [{ companyId }, { keyType: 'CENTRAL' }],
      },
      include: {
        aiModelConfigs: {
          where: { isEnabled: true },
          orderBy: { priority: 'asc' },
        },
      },
      orderBy: { priority: 'asc' },
    }).catch(async () => prisma.aiKey.findMany({
      where: { isActive: true, OR: [{ companyId }, { keyType: 'CENTRAL' }] },
      orderBy: { priority: 'asc' },
    }).catch(() => []));
  }

  const primary = await resolveAiKey(prisma, companyId).catch(() => null);
  const candidates = buildAiCandidateList(rows, primary);

  if (candidates.length === 0) {
    const err = new Error('لا يوجد مفتاح AI نشط في جدول public.ai_keys لهذه الشركة أو للمنصة');
    err.statusCode = 422;
    throw err;
  }

  let lastError = null;
  for (const cfg of candidates) {
    try {
      const text = await callVisionOrChat({ ...cfg, system, user, imageDataUrl, maxTokens });
      return { text, modelUsed: cfg.model };
    } catch (err) {
      lastError = err;
    }
  }

  const finalErr = new Error(lastError?.message || 'تعذر الاتصال بمزود الذكاء الاصطناعي');
  finalErr.statusCode = 502;
  throw finalErr;
}

async function generateProductCopy({ companyId, mode = 'text', productInfo, contextLine, imageDataUrl, language = 'ar' }, prisma = safeGetPrisma()) {
  const textInput = String(productInfo || contextLine || '').trim();
  if (!textInput && !imageDataUrl) {
    const err = new Error('يرجى إدخال وصف أو معلومات المنتج');
    err.statusCode = 400;
    throw err;
  }

  const system = language === 'en'
    ? 'You are an expert Amazon/Noon/Jumia e-commerce SEO copywriter. Return clean JSON with keys: title, bulletPoints (array of 5), description, searchKeywords (array of 8).'
    : 'أنت كاتب محتوى تجارة إلكترونية محترف لمنصات أمازون ونون وجوميا. أرجع JSON فقط بالمفاتيح: title، bulletPoints (مصفوفة من 5 نقاط)، description، searchKeywords (مصفوفة من 8 كلمات مفتاحية) باللغة العربية الواضحة.';

  const user = `Mode: ${mode}\nProduct Info:\n${textInput || 'وصف المنتج من الصورة المرفقة'}`;
  const { text: raw, modelUsed } = await runMarketplaceAiCompletion({ companyId, system, user, imageDataUrl, maxTokens: 1500 }, prisma);

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {
      title: (textInput || 'منتج').slice(0, 110),
      bulletPoints: [raw],
      description: raw,
      searchKeywords: [],
    };
  }

  const { wallet } = await deductCredits(companyId, 'leo', TOOL_CREDIT_COSTS.leo, 'توليد وصف منتج بالـ AI', prisma);
  return { copy: parsed, wallet, modelUsed };
}

async function generateImageBriefAndAsset({ companyId, action = 'image_to_image', prompt = '', style = 'Product Photo', removalMode = 'standard', imageDataUrl }, prisma = safeGetPrisma()) {
  const isFreeBg = action === 'remove_bg' && removalMode === 'standard';
  const cost = isFreeBg ? 0 : action === 'pack5' ? TOOL_CREDIT_COSTS.alphaPack5 : TOOL_CREDIT_COSTS.alphaSingle;

  const system = 'أنت مخرج فني لتصوير منتجات التجارة الإلكترونية. أنشئ وصفاً تصويرياً دقيقاً (Prompt) وإرشادات إضاءة وزوايا متوافقة مع شروط صور أمازون ونون بصيغة JSON بالمفاتيح: enhancedPrompt, lightingSetup, angles (array of strings), complianceChecklist (array of strings).';
  const user = `Action: ${action}\nStyle: ${style}\nMerchant Notes: ${prompt || 'تحسين مظهر المنتج بخلفية احترافية'}`;

  const { text: raw, modelUsed } = await runMarketplaceAiCompletion({ companyId, system, user, imageDataUrl, maxTokens: 1200 }, prisma);
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
  return { artDirection, creditsUsed: cost, wallet, modelUsed };
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

  const system = 'أنت خبير إدراج منتجات على أمازون ونون وجوميا وترينديول وشوبيفاي وزد. أرجع JSON يحتوي على كائن لكل منصة مطلوبة بالحقول المقترحة: suggestedCategory، brandPlaceholder، bulletPoints، attributes (مصنف كمصفوفة كائنات { key, value, confidence } حيث confidence تكون High أو Medium أو Low).';
  const user = `Target Marketplaces: ${targets.join(', ')}\nTitle: ${cleanTitle}\nDescription: ${description || ''}`;
  const { text: raw } = await runMarketplaceAiCompletion({ companyId, system, user, maxTokens: 1600 }, prisma);

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

  const system = 'أنت مساعد عمليات البائعين الذكي (Seller Copilot) داخل منصة MaxP للتجارة الإلكترونية في مصر والخليج (أمازون، نون، جوميا، ترينديول). أجب بإيجاز عملي دقيق بالعربية حول التسعير، العمولات، الشحن (FBA / Easy Ship / FBN)، وإعداد الكتالوج.';
  const { text: reply } = await runMarketplaceAiCompletion({ companyId, system, user: cleanMsg, maxTokens: 1000 }, prisma);
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

  const selected = Array.isArray(platforms) && platforms.length > 0 ? platforms : ['amazon', 'noon', 'jumia'];
  const system = 'أنت محلل تسعير تجارة إلكترونية في مصر والخليج. أرجع JSON فقط بالمفاتيح: productTitle، estimatedRange ({ min, max, currency })، recommendedStrategy (string)، platformNotes (array of { platform, positioning, tip }).';
  const user = `Country: ${country}\nPlatforms: ${selected.join(', ')}\nProduct Query: ${cleanQuery}`;
  const { text: raw, modelUsed } = await runMarketplaceAiCompletion({ companyId, system, user, maxTokens: 1200 }, prisma);

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

  return { entry, wallet, modelUsed };
}

function getPriceCompareHistory(companyId) {
  return memoryPriceComparisons.get(String(companyId || 'default')) || [];
}

function evaluateListingRules(input = {}) {
  const titleAr = String(input.titleAr || '').trim();
  const titleEn = String(input.titleEn || '').trim();
  const descAr = String(input.descriptionAr || '').trim();
  const descEn = String(input.descriptionEn || '').trim();
  const brand = String(input.brand || '').trim();
  const bullets = Array.isArray(input.bulletPoints) ? input.bulletPoints.filter((b) => String(b || '').trim()) : [];
  const imageCount = Math.max(0, Number(input.imageCount || 0));
  const altPct = Math.min(100, Math.max(0, Number(input.imageAltCoveragePct || 0)));

  let attrsValid = false;
  let attrCount = 0;
  if (input.attributesJson && typeof input.attributesJson === 'string' && input.attributesJson.trim()) {
    try {
      const parsed = JSON.parse(input.attributesJson);
      if (parsed && typeof parsed === 'object') {
        attrsValid = true;
        attrCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length;
      }
    } catch {
      attrsValid = false;
    }
  } else if (input.attributesJson && typeof input.attributesJson === 'object') {
    attrsValid = true;
    attrCount = Object.keys(input.attributesJson).length;
  }

  const checks = [
    {
      id: 'title_length',
      label: 'طول العنوان الرئيسي والكلمات المفتاحية (40-180 حرف)',
      passed: Math.max(titleAr.length, titleEn.length) >= 30 && Math.max(titleAr.length, titleEn.length) <= 200,
      points: 20,
      severity: 'high',
      hint: 'يفضل أن يتضمن العنوان الماركة + الموديل + أبرز ميزة بطول 40-180 حرفاً.',
    },
    {
      id: 'bilingual_coverage',
      label: 'تغطية المحتوى ثنائي اللغة (العربية والإنجليزية)',
      passed: titleAr.length >= 10 && titleEn.length >= 10,
      points: 15,
      severity: 'medium',
      hint: 'منصات أمازون ونون في الخليج ومصر ترفع ظهور المنتج عند اكتمال النص العربي والإنجليزي.',
    },
    {
      id: 'description_depth',
      label: 'عمق الوصف التفصيلي (120+ حرفاً)',
      passed: Math.max(descAr.length, descEn.length) >= 120,
      points: 20,
      severity: 'high',
      hint: 'الوصف التفصيلي يزيد التحويل ويغطي أسئلة المشتري حول المقاس والخامة والضمان.',
    },
    {
      id: 'bullet_points',
      label: 'نقاط المميزات البيعية (3 نقاط على الأقل)',
      passed: bullets.length >= 3,
      points: 15,
      severity: 'medium',
      hint: 'أضف 3 إلى 5 نقاط تبرز الفوائد المباشرة بدلاً من السرد الطويل.',
    },
    {
      id: 'visual_alt',
      label: 'الصور والنص البديل SEO (3+ صور وتغطية Alt >= 80%)',
      passed: imageCount >= 3 && altPct >= 80,
      points: 15,
      severity: 'high',
      hint: 'استخدم 3+ صور عالية الدقة مع وصف بديل واضح لمحركات البحث.',
    },
    {
      id: 'attributes_brand',
      label: 'بيانات العلامة التجارية وخصائص الفئة JSON (2+ خصائص)',
      passed: brand.length >= 2 && attrsValid && attrCount >= 2,
      points: 15,
      severity: 'medium',
      hint: 'تأكد من تعبئة الماركة وكائن الخصائص بصيغة JSON صالحة (مثل color وmaterial).',
    },
  ];

  const score = checks.reduce((acc, c) => acc + (c.passed ? c.points : 0), 0);
  const grade = score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D';
  return { score, grade, checks };
}

async function assessAndFixListingHealth(input = {}, prisma = safeGetPrisma()) {
  const audit = evaluateListingRules(input);
  if (!input.fixWithAi) {
    return { audit, fixedListing: null, creditsUsed: 0, wallet: null, modelUsed: null };
  }

  const companyId = String(input.companyId || 'default');
  const failing = audit.checks.filter((c) => !c.passed).map((c) => c.label);
  const system = 'أنت خبير تحسين صفحات المنتجات في OmniSeller لمنصات أمازون ونون وشوبيفاي. أرجع JSON فقط بالمفاتيح: titleAr, titleEn, descriptionAr, descriptionEn, bulletPoints (array of 5), attributes (object key-value), seoKeywords (array of 6).';
  const user = `Fix failing checks: ${failing.join('; ') || 'Polish overall SEO'}\nCurrent Input:\n${JSON.stringify({
    titleAr: input.titleAr || '',
    titleEn: input.titleEn || '',
    descriptionAr: input.descriptionAr || '',
    descriptionEn: input.descriptionEn || '',
    brand: input.brand || '',
    category: input.category || '',
  })}`;

  const { text: raw, modelUsed } = await runMarketplaceAiCompletion({ companyId, system, user, maxTokens: 1500 }, prisma);
  let fixedListing;
  try {
    fixedListing = JSON.parse(raw);
  } catch {
    fixedListing = {
      titleAr: input.titleAr || raw.slice(0, 100),
      titleEn: input.titleEn || '',
      descriptionAr: raw,
      descriptionEn: input.descriptionEn || '',
      bulletPoints: [],
      attributes: {},
      seoKeywords: [],
    };
  }

  const { wallet } = await deductCredits(companyId, 'healthFix', TOOL_CREDIT_COSTS.healthFix, 'إصلاح صحة الإدراج بالـ AI', prisma);
  return { audit, fixedListing, creditsUsed: TOOL_CREDIT_COSTS.healthFix, wallet, modelUsed };
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
  buildAiCandidateList,
  evaluateListingRules,
  assessAndFixListingHealth,
};
