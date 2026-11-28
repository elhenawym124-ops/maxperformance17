/**
 * Turbo AI Area Resolver
 * مهمته الوحيدة: تخمين المدينة/المنطقة من عنوان العميل بناءً على خريطة مناطق تربو،
 * تحديد المحافظة تلقائياً من المنطقة المختارة، ومراجعة صحة التطابق قبل الإرسال لتربو.
 */

const { getBestShippingAddressFields, cleanLocationName } = require('../../utils/turbo/addressParser');
const { getTurboGovernorateName, isUnspecified, normalizeArabic } = require('../../utils/turbo/governorateMapper');
const { resolveAiKey, callChatCompletion } = require('../radiologyAiDraftService');
const { logOrderEvent, ORDER_EVENT_ACTIONS } = require('../orderEventLogger');

const AI_PROVIDER_PREFERENCE = ['GOOGLE', 'OPENROUTER', 'OPENAI', 'GROQ', 'ANTHROPIC', 'DEEPSEEK', 'MISTRAL', 'NVIDIA', 'HUGGINGFACE', 'OLLAMA'];
const AI_BASE_URLS = {
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
const AI_MODEL_DEFAULTS = {
  OPENROUTER: 'openai/gpt-4o-mini',
  OPENAI: 'gpt-4o-mini',
  GROQ: 'qwen/qwen3.8-27b',
  DEEPSEEK: 'deepseek-chat',
  ANTHROPIC: 'claude-3-5-haiku-latest',
  GOOGLE: 'gemini-2.5-flash',
  MISTRAL: 'mistral-small-latest',
  NVIDIA: 'nvidia/llama-3.1-nemotron-70b-instruct',
  HUGGINGFACE: 'meta-llama/Meta-Llama-3.1-8B-Instruct',
  OLLAMA: 'llama3.1',
};

async function resolveAiCandidates(prisma, companyId) {
  const candidates = [];
  const seen = new Set();
  const pushCandidate = (cfg) => {
    if (!cfg?.apiKey) return;
    const provider = String(cfg.provider || '').toUpperCase();
    const dedupKey = `${provider}:${cfg.apiKey}:${cfg.model || ''}`;
    if (seen.has(dedupKey)) return;
    seen.add(dedupKey);
    candidates.push({
      provider,
      apiKey: cfg.apiKey,
      baseUrl: cfg.baseUrl || AI_BASE_URLS[provider] || 'https://api.openai.com/v1',
      model: cfg.model || AI_MODEL_DEFAULTS[provider] || 'gpt-4o-mini',
    });
  };

  const primary = await resolveAiKey(prisma, companyId).catch(() => null);
  pushCandidate(primary);

  if (prisma?.aiKey && typeof prisma.aiKey.findMany === 'function') {
    const rows = await prisma.aiKey.findMany({
      where: {
        isActive: true,
        OR: [{ companyId }, { keyType: 'CENTRAL' }],
      },
      orderBy: { priority: 'asc' },
    }).catch(() => []);
    if (Array.isArray(rows) && rows.length > 0) {
      const sorted = [...rows].sort((a, b) => {
        const idxA = AI_PROVIDER_PREFERENCE.indexOf(String(a.provider || '').toUpperCase());
        const idxB = AI_PROVIDER_PREFERENCE.indexOf(String(b.provider || '').toUpperCase());
        const rankA = idxA === -1 ? 999 : idxA;
        const rankB = idxB === -1 ? 999 : idxB;
        if (rankA !== rankB) return rankA - rankB;
        return Number(a.priority || 0) - Number(b.priority || 0);
      });
      for (const row of sorted) pushCandidate(row);
    }
  }

  return candidates;
}

const GENERIC_LOCATION_TOKENS = new Set([
  'cairo', 'giza', 'alexandria', 'alex', 'dakahlia', 'sharqia', 'sharkia', 'gharbia',
  'qalyubia', 'qaliubiya', 'monufia', 'menofia', 'beheira', 'behira', 'ismailia',
  'suez', 'damietta', 'port said', 'fayoum', 'faiyum', 'beni suef', 'minya', 'menia',
  'asyut', 'assiut', 'sohag', 'qena', 'luxor', 'aswan', 'red sea', 'matrouh', 'matruh',
  'north sinai', 'south sinai', 'new valley', 'egypt', 'مصر',
  'القاهرة', 'القاهره', 'الجيزة', 'الجيزه', 'الإسكندرية', 'الاسكندرية', 'الاسكندريه',
  'الدقهلية', 'الدقهليه', 'الشرقية', 'الشرقيه', 'الغربية', 'الغربيه', 'القليوبية', 'القليوبيه',
  'المنوفية', 'المنوفيه', 'البحيرة', 'البحيره', 'كفر الشيخ', 'دمياط', 'بورسعيد',
  'الإسماعيلية', 'الاسماعيليه', 'السويس', 'الفيوم', 'بني سويف', 'بنى سويف',
  'المنيا', 'أسيوط', 'اسيوط', 'سوهاج', 'قنا', 'الأقصر', 'الاقصر', 'أسوان', 'اسوان',
  'البحر الأحمر', 'البحر الاحمر', 'مطروح', 'شمال سيناء', 'جنوب سيناء', 'الوادي الجديد',
  'أطراف القاهرة والجيزة', 'اطراف القاهرة والجيزة',
  'غير محدد', 'غير معروف', 'غيرمعروف', 'unknown', 'none', 'null', 'undefined',
]);

function isStreetLikeName(val) {
  const cleaned = normalizeArabic(cleanLocationName(val));
  if (!cleaned) return false;
  return /^(?:شارع|ش|طريق|محور|ميدان|كوبري|كوبرى|حاره|حارة|زقاق|عزبه|عزبة)\s+/i.test(cleaned);
}

function isGenericOrEmptyLocation(val) {
  const cleaned = normalizeArabic(cleanLocationName(val));
  return !cleaned || cleaned.length < 2 || GENERIC_LOCATION_TOKENS.has(cleaned);
}

function detectExplicitGovInText(text, governments) {
  if (!text || !Array.isArray(governments) || governments.length === 0) return null;
  const nText = normalizeArabic(text);
  const sortedGovs = [...governments].sort((a, b) => String(b.name || '').length - String(a.name || '').length);
  for (const g of sortedGovs) {
    const ng = normalizeArabic(g.name);
    if (!ng || ng.length < 3) continue;
    const bare = ng.startsWith('ال') ? ng.slice(2) : ng;
    if (nText.includes(ng) || (bare.length >= 4 && nText.includes(bare))) {
      return g;
    }
  }
  return null;
}

function findMatchingGovernment(govName, governments) {
  if (!govName || !Array.isArray(governments) || governments.length === 0) return null;
  const target = normalizeArabic(govName);
  return (
    governments.find((g) => normalizeArabic(g.name) === target) ||
    governments.find((g) => normalizeArabic(g.name).includes(target)) ||
    [...governments]
      .sort((a, b) => String(b.name || '').length - String(a.name || '').length)
      .find((g) => target.includes(normalizeArabic(g.name))) ||
    null
  );
}

function matchAreaInList(areas, candidateArea, fullAddressText = '', govName = '') {
  if (!Array.isArray(areas) || areas.length === 0) return null;

  const nGov = normalizeArabic(govName);
  const nCandidate = normalizeArabic(cleanLocationName(candidateArea));
  const candidateIsGeneric = isGenericOrEmptyLocation(candidateArea) || nCandidate === nGov;
  const sorted = [...areas].sort((a, b) => String(b.name || '').length - String(a.name || '').length);

  // 1. Direct match on candidateArea if it isn't a generic governorate name or street-like token
  if (!candidateIsGeneric && !isStreetLikeName(nCandidate)) {
    const exact = sorted.find((a) => normalizeArabic(a.name) === nCandidate);
    if (exact) return exact;

    const bareMatch = sorted.find((a) => {
      const na = normalizeArabic(a.name);
      if (isStreetLikeName(na)) return false;
      const bare = na.startsWith('ال') ? na.slice(2) : na;
      return (
        bare.length >= 3 &&
        bare !== nGov &&
        !GENERIC_LOCATION_TOKENS.has(bare) &&
        (nCandidate === bare || nCandidate.includes(bare))
      );
    });
    if (bareMatch) return bareMatch;

    // 1b. Reverse inclusion / token overlap for composite Turbo area names
    // (e.g. candidate "مدينة نصر" or "الحي العاشر" vs Turbo area "مدينة نصر - الحي العاشر")
    const bareCandidate = nCandidate.startsWith('ال') ? nCandidate.slice(2) : nCandidate;
    if (bareCandidate.length >= 4 && !GENERIC_LOCATION_TOKENS.has(bareCandidate)) {
      const candidateTokens = nCandidate
        .split(/\s+/)
        .map((t) => (t.startsWith('ال') && t.length > 4 ? t.slice(2) : t))
        .filter((t) => t.length >= 3 && !GENERIC_LOCATION_TOKENS.has(t));

      let bestReverse = null;
      let bestScore = 0;
      for (const area of sorted) {
        const na = normalizeArabic(area.name);
        if (!na || na === nGov || GENERIC_LOCATION_TOKENS.has(na) || isStreetLikeName(na)) continue;
        const areaTokens = na
          .split(/\s+/)
          .map((t) => (t.startsWith('ال') && t.length > 4 ? t.slice(2) : t))
          .filter((t) => t.length >= 3);
        if (areaTokens.length === 0) continue;

        const exactPhraseInArea = na.includes(nCandidate) || na.includes(bareCandidate);
        const sharedCount = candidateTokens.filter((ct) => areaTokens.includes(ct)).length;
        const allCandidateTokensInArea = candidateTokens.length >= 2 && sharedCount === candidateTokens.length;

        if (exactPhraseInArea || allCandidateTokensInArea) {
          // Prefer higher token coverage and shorter (more direct) area names
          const score = (allCandidateTokensInArea ? 10 : 0) + sharedCount * 2 + (exactPhraseInArea ? 3 : 0) - areaTokens.length * 0.1;
          if (score > bestScore) {
            bestScore = score;
            bestReverse = area;
          }
        }
      }
      if (bestReverse) return bestReverse;
    }
  }

  // 2. Scan street address text for an explicit canonical Turbo area name
  if (fullAddressText) {
    const nAddress = normalizeArabic(fullAddressText).replace(/كوبري\s*(?:6\s*|السادس\s*من\s*)?اكتوبر/g, ' ');
    for (const area of sorted) {
      const na = normalizeArabic(area.name);
      if (!na || na === nGov || GENERIC_LOCATION_TOKENS.has(na) || isStreetLikeName(na)) continue;
      if (na.length >= 3 && nAddress.includes(na)) return area;

      const bare = na.startsWith('ال') ? na.slice(2) : na;
      if (bare.length >= 3 && bare !== nGov && !GENERIC_LOCATION_TOKENS.has(bare) && nAddress.includes(bare)) {
        return area;
      }
    }

    // 2b. Composite multi-token Turbo area match in address text
    // (e.g. Turbo area "مدينة نصر - الحي العاشر" matching "مدينة نصر الحي العاشر المشروع السويسري")
    const addressWords = new Set(
      nAddress
        .split(/\s+/)
        .flatMap((w) => (w.startsWith('ال') && w.length > 4 ? [w, w.slice(2)] : [w]))
        .filter((w) => w.length >= 2)
    );
    for (const area of sorted) {
      const na = normalizeArabic(area.name);
      if (!na || na === nGov || GENERIC_LOCATION_TOKENS.has(na) || isStreetLikeName(na)) continue;
      const tokens = na
        .split(/\s+/)
        .map((t) => (t.startsWith('ال') && t.length > 4 ? t.slice(2) : t))
        .filter((t) => t.length >= 2 && !GENERIC_LOCATION_TOKENS.has(t));
      if (tokens.length >= 2 && tokens.every((t) => addressWords.has(t))) {
        return area;
      }
    }
  }

  return null;
}

function parseJsonResponse(rawText) {
  const text = String(rawText || '').trim();
  const match = text.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch {
    return null;
  }
}

async function loadTurboAiResolverConfig(prisma, companyId) {
  const defaults = { aiEnabled: true, aiOnCreateEnabled: false, confidenceThreshold: 0.65, model: null };
  if (!prisma || !companyId) return defaults;

  let aiEnabled = defaults.aiEnabled;
  let aiOnCreateEnabled = defaults.aiOnCreateEnabled;
  let explicitFlagFound = false;
  let explicitOnCreateFound = false;

  // 1) Standalone toggle on ShippingCompany (TURBO) settings
  try {
    if (prisma.shippingCompany?.findFirst) {
      const carrier = await prisma.shippingCompany.findFirst({
        where: { companyId, providerKey: 'TURBO' },
        select: { settings: true },
      });
      if (carrier?.settings) {
        const parsed = typeof carrier.settings === 'string' ? JSON.parse(carrier.settings) : carrier.settings;
        if (parsed && typeof parsed.aiAreaResolverEnabled === 'boolean') {
          aiEnabled = parsed.aiAreaResolverEnabled;
          explicitFlagFound = true;
        }
        if (parsed && typeof parsed.aiAreaResolverOnCreate === 'boolean') {
          aiOnCreateEnabled = parsed.aiAreaResolverOnCreate;
          explicitOnCreateFound = true;
        }
      }
    }
  } catch {}

  // 2) Standalone toggle on Company.settings
  if (!explicitFlagFound || !explicitOnCreateFound) {
    try {
      if (prisma.company?.findUnique) {
        const comp = await prisma.company.findUnique({
          where: { id: companyId },
          select: { settings: true },
        });
        if (comp?.settings) {
          const parsed = typeof comp.settings === 'string' ? JSON.parse(comp.settings) : comp.settings;
          if (!explicitFlagFound && parsed && typeof parsed.turboAiAreaResolverEnabled === 'boolean') {
            aiEnabled = parsed.turboAiAreaResolverEnabled;
            explicitFlagFound = true;
          }
          if (!explicitOnCreateFound && parsed && typeof parsed.turboAiAreaResolverOnCreate === 'boolean') {
            aiOnCreateEnabled = parsed.turboAiAreaResolverOnCreate;
            explicitOnCreateFound = true;
          }
        }
      }
    } catch {}
  }

  // 3) Threshold & optional StorefrontSettings fallback
  try {
    if (prisma.storefrontSettings && typeof prisma.storefrontSettings.findUnique === 'function') {
      const row = await prisma.storefrontSettings.findUnique({
        where: { companyId },
        select: { checkoutAddressSettings: true },
      });
      const raw = row?.checkoutAddressSettings;
      if (raw && typeof raw === 'object') {
        if (!explicitFlagFound && typeof raw.aiEnabled === 'boolean') {
          aiEnabled = raw.aiEnabled;
        }
        return {
          aiEnabled,
          aiOnCreateEnabled,
          confidenceThreshold:
            typeof raw.confidenceThreshold === 'number' && raw.confidenceThreshold > 0 && raw.confidenceThreshold <= 1
              ? raw.confidenceThreshold
              : defaults.confidenceThreshold,
          model: typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : null,
        };
      }
    }
  } catch {}

  return { ...defaults, aiEnabled, aiOnCreateEnabled };
}

function extractCustomerLocationCoords(order = {}) {
  const candidates = [];
  try {
    const meta = typeof order.metadata === 'string' ? JSON.parse(order.metadata || '{}') : order.metadata;
    if (meta?.customerLocation) candidates.push(meta.customerLocation);
  } catch {}
  try {
    const sa = typeof order.shippingAddress === 'string' && order.shippingAddress.trim().startsWith('{')
      ? JSON.parse(order.shippingAddress)
      : order.shippingAddress;
    if (sa && typeof sa === 'object' && sa.location) candidates.push(sa.location);
  } catch {}

  for (const loc of candidates) {
    if (!loc || typeof loc !== 'object') continue;
    const lat = Number(loc.lat ?? loc.latitude);
    const lng = Number(loc.lng ?? loc.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
      return { lat, lng, label: loc.label ? String(loc.label).trim() : null };
    }
  }
  return null;
}

async function reverseGeocodeCoords(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lng)}&accept-language=ar`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'MaxP-TurboAreaResolver/1.0' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data?.address || {};
    const parts = [
      addr.neighbourhood,
      addr.suburb,
      addr.city_district,
      addr.quarter,
      addr.village,
      addr.town,
      addr.city,
      addr.state,
    ]
      .map((p) => (p ? String(p).trim() : ''))
      .filter(Boolean);
    const unique = [...new Set(parts)];
    return unique.length > 0 ? unique.join('، ') : null;
  } catch {
    return null;
  }
}

function buildOrderAddressContext(order = {}, orderData = {}) {
  const fields = getBestShippingAddressFields(
    orderData.shippingAddress || order.shippingAddress,
    orderData.customerAddress || order.customerAddress
  );
  const rawGov = orderData.governorate || order.governorate || fields.governorate || '';
  const rawCity = orderData.city || order.city || fields.city || '';
  const rawArea = orderData.area || fields.area || fields.parsedAddress?.area || '';
  const streetText = fields.formattedAddress || fields.primaryAddress || orderData.shippingAddress || order.customerAddress || '';
  const fullAddressText = [streetText, rawArea, rawCity, rawGov].filter(Boolean).join(' - ');
  return { fields, rawGov, rawCity, rawArea, streetText, fullAddressText };
}

/**
 * Resolve & review (governorate, area) against Turbo's map.
 * Step 1: Deterministic exact check on Turbo's cached map (0 AI calls if matched).
 * Step 2: AI guesses the closest Turbo area from Turbo's map, auto-determines governorate, and verifies both against Turbo's area list.
 */
async function resolveTurboLocation({ prisma, turboService, companyId, order = {}, orderData = {}, bypassEnableCheck = false }) {
  if (!turboService || typeof turboService.getGovernments !== 'function' || typeof turboService.getAreas !== 'function') {
    return { skipped: true, resolved: false, reason: 'NO_LOCATION_SERVICE' };
  }

  const govRes = await turboService.getGovernments().catch(() => null);
  const governments = Array.isArray(govRes?.governments) ? govRes.governments : [];
  if (governments.length === 0) {
    return { skipped: true, resolved: false, reason: 'NO_GOVERNMENTS' };
  }

  const { rawGov, rawCity, rawArea, streetText, fullAddressText } = buildOrderAddressContext(order, orderData);
  const explicitGovInStreet = detectExplicitGovInText(streetText, governments);
  const inferredGovName = getTurboGovernorateName(rawGov, rawCity, fullAddressText);
  const initialGov = explicitGovInStreet || findMatchingGovernment(inferredGovName, governments);

  const areaCacheByGovId = new Map();
  const getAreasForGov = async (gov) => {
    if (!gov?.id) return [];
    const key = String(gov.id);
    if (areaCacheByGovId.has(key)) return areaCacheByGovId.get(key);
    const res = await turboService.getAreas(gov.id).catch(() => null);
    const list = Array.isArray(res?.areas) ? res.areas : [];
    areaCacheByGovId.set(key, list);
    return list;
  };

  // 1) Deterministic exact/keyword match on Turbo's map first (zero AI cost)
  if (initialGov) {
    const areas = await getAreasForGov(initialGov);
    if (areas.length === 0) {
      return { skipped: true, resolved: false, reason: 'NO_TURBO_AREAS_AVAILABLE' };
    }
    const directArea = matchAreaInList(areas, rawArea || rawCity, fullAddressText, initialGov.name);
    if (directArea) {
      return {
        resolved: true,
        governorate: initialGov.name,
        governorateId: String(initialGov.id),
        area: directArea.name,
        areaId: String(directArea.id || directArea.name),
        confidence: 1.0,
        source: 'direct_map',
        reason: 'تطابق مباشر مع خريطة مناطق تربو',
      };
    }
  }

  // 2) AI Map Guessing + Auto-Governorate + Review
  const config = await loadTurboAiResolverConfig(prisma, companyId);
  if (!bypassEnableCheck && !config.aiEnabled) {
    return { skipped: true, resolved: false, reason: 'AI_DISABLED' };
  }

  const aiCandidates = await resolveAiCandidates(prisma, companyId);
  if (aiCandidates.length === 0) {
    return { skipped: true, resolved: false, transientAiFailure: true, reason: 'NO_ACTIVE_AI_KEY' };
  }

const GREATER_CAIRO_GOVS = new Set(['القاهرة', 'الجيزة', 'أطراف القاهرة والجيزة']);

function isAllowedGovForExplicit(govObj, explicitGov) {
  if (!explicitGov) return true;
  if (!govObj) return false;
  if (govObj.id && explicitGov.id && String(govObj.id) === String(explicitGov.id)) return true;
  if (normalizeArabic(govObj.name) === normalizeArabic(explicitGov.name)) return true;
  return GREATER_CAIRO_GOVS.has(explicitGov.name) && GREATER_CAIRO_GOVS.has(govObj.name);
}

  // Gather candidate governorates (explicit + Cairo/Giza/Outskirts siblings + searchAreaByText hits)
  const candidateGovsMap = new Map();
  const addCandidateGov = (g) => {
    if (g?.id && !candidateGovsMap.has(String(g.id)) && isAllowedGovForExplicit(g, explicitGovInStreet)) {
      candidateGovsMap.set(String(g.id), g);
    }
  };

  if (initialGov) {
    addCandidateGov(initialGov);
    if (GREATER_CAIRO_GOVS.has(initialGov.name)) {
      addCandidateGov(findMatchingGovernment('أطراف القاهرة والجيزة', governments));
      addCandidateGov(findMatchingGovernment('الجيزة', governments));
      addCandidateGov(findMatchingGovernment('القاهرة', governments));
    }
  }

  if (!explicitGovInStreet && typeof turboService.searchAreaByText === 'function' && fullAddressText.trim().length >= 3) {
    const searchRes = await turboService.searchAreaByText(fullAddressText, { limit: 10 }).catch(() => null);
    for (const m of searchRes?.matches || []) {
      addCandidateGov(findMatchingGovernment(m.governorate, governments));
    }
  }

  if (candidateGovsMap.size === 0) {
    for (const fallbackName of ['القاهرة', 'الجيزة', 'أطراف القاهرة والجيزة', 'الإسكندرية']) {
      addCandidateGov(findMatchingGovernment(fallbackName, governments));
    }
  }

  const coords = extractCustomerLocationCoords(order);
  let gpsHint = coords?.label || null;
  if (coords && !gpsHint && process.env.NODE_ENV !== 'test') {
    gpsHint = await reverseGeocodeCoords(coords.lat, coords.lng);
  }
  if (gpsHint && !explicitGovInStreet) {
    const gpsGov = detectExplicitGovInText(gpsHint, governments);
    if (gpsGov) addCandidateGov(gpsGov);
  }

  const candidateSections = [];
  for (const g of Array.from(candidateGovsMap.values()).slice(0, 4)) {
    const areas = await getAreasForGov(g);
    if (areas.length > 0) {
      candidateSections.push(`- ${g.name}: ${areas.map((a) => a.name).join('، ')}`);
    }
  }

  const govNamesList = governments.map((g) => g.name).join('، ');
  const systemPrompt = [
    'أنت خبير جغرافيا مصر وخريطة مناطق شركة شحن Turbo Express.',
    'مهمتك الوحيدة: قراءة عنوان العميل، تخمين المنطقة/الحي الحقيقي بناءً على خريطة تربو، اختيار أدق مدينة/منطقة (area) من القائمة الرسمية لتربو، ثم تحديد المحافظة (governorate) تلقائياً تبعاً للمنطقة المختارة، ومراجعة صحة الاختيار.',
    'قواعد صارمة:',
    '1) إذا كان العنوان بالإنجليزية أو الفرانكو (مثل Wahba Al Refiy Street أو Faisal أو Mohandessin)، حدد الحي المصري الصحيح واختر اسمه الرسمي بالعربية من قائمة تربو.',
    '2) يجب اختيار اسم (area) مطابق حرفياً لقائمة مناطق تربو المرفقة، ويجب أن تكون (governorate) هي المحافظة المالكة لهذه المنطقة في الخريطة (مثال: حدائق الأهرام / 6 أكتوبر / الشيخ زايد / التجمع / مدينتي تتبع «أطراف القاهرة والجيزة»؛ شارع العشرين فيصل / العمرانية / جزيرة الدهب تتبع «الجيزة»).',
    '3) إذا كان العنوان مبهماً تماماً ولا يدل على أي حي أو منطقة (مثل كلمة واحدة ناقصة)، أرجع confidence أقل من 0.4 وarea فارغة.',
    '4) لا تختر أبداً اسم شارع أو ميدان فرعي (مثل "شارع 25" أو "شارع الهرم" أو "ميدان الجيزة") بل اختر دائماً الحي أو المنطقة الرسمية الأوسع.',
    '5) إذا ذُكرت محافظة صراحةً في نص العنوان (مثل "القليوبية") فيجب الالتزام بها وعدم توجيه الشحنة لمحافظة بعيدة.',
    '6) أرجع JSON صالح فقط بدون أي شرح إضافي بالشكل التالي:',
    '{"area":"اسم المنطقة من القائمة","governorate":"اسم المحافظة من القائمة","confidence":0.85,"reason":"سبب مختصر"}',
  ].join('\n');

  const userPrompt = [
    `بيانات العميل:`,
    `- العنوان: ${streetText || 'غير متوفر'}`,
    `- المحافظة المكتوبة: ${rawGov || 'غير محدد'}`,
    `- المدينة/المنطقة المكتوبة: ${rawCity || rawArea || 'غير محدد'}`,
    ...(gpsHint ? [`- إشارة من إحداثيات اللوكيشن (GPS): ${gpsHint} (استخدمها كدليل مرجّح إذا كان العنوان النصي غامضاً)`] : []),
    '',
    `المحافظات الرسمية في تربو: ${govNamesList}`,
    '',
    candidateSections.length > 0
      ? `مناطق تربو المتاحة للمحافظات المرشحة:\n${candidateSections.join('\n')}`
      : 'ابحث في معرفتك الجغرافية بمصر واختر أقرب منطقة رسمية في تربو مع محافظتها.',
  ].join('\n');

  let aiRawText = null;
  let lastAiError = null;
  for (const aiConfig of aiCandidates) {
    try {
      aiRawText = await callChatCompletion({
        baseUrl: aiConfig.baseUrl,
        apiKey: aiConfig.apiKey,
        model: config.model || aiConfig.model,
        system: systemPrompt,
        user: userPrompt,
        maxTokens: 300,
        timeoutMs: 15000,
      });
      if (aiRawText) break;
    } catch (aiErr) {
      lastAiError = aiErr;
      console.warn(`⚠️ [TURBO-AI-AREA] AI lookup failed (${aiConfig.provider || 'UNKNOWN'}): ${aiErr.message}`);
    }
  }
  if (!aiRawText) {
    return { skipped: true, resolved: false, transientAiFailure: true, reason: 'AI_CALL_FAILED', error: lastAiError?.message || 'AI lookup failed' };
  }

  const parsed = parseJsonResponse(aiRawText);
  const guessedArea = String(parsed?.area || '').trim();
  const guessedGov = String(parsed?.governorate || '').trim();
  const confidence = Number(parsed?.confidence ?? 0);
  const reason = String(parsed?.reason || '').trim();

  if (!guessedArea || isGenericOrEmptyLocation(guessedArea) || confidence < config.confidenceThreshold) {
    return {
      resolved: false,
      reason: 'LOW_CONFIDENCE_OR_EMPTY',
      confidence,
      aiGuess: { area: guessedArea || null, governorate: guessedGov || null, reason },
    };
  }

  // 3) Programmatic Review: verify guessedArea exists in Turbo's map & auto-resolve governorate from the area's owner
  const guessedGovObj = findMatchingGovernment(guessedGov, governments);
  const targetGov =
    (guessedGovObj && isAllowedGovForExplicit(guessedGovObj, explicitGovInStreet) ? guessedGovObj : null) || initialGov;
  if (targetGov) {
    const targetAreas = await getAreasForGov(targetGov);
    const verifiedArea = matchAreaInList(targetAreas, guessedArea, '', targetGov.name);
    if (verifiedArea) {
      return {
        resolved: true,
        governorate: targetGov.name,
        governorateId: String(targetGov.id),
        area: verifiedArea.name,
        areaId: String(verifiedArea.id || verifiedArea.name),
        confidence,
        source: 'ai_turbo_map',
        reason: reason || `تم تخمين المنطقة (${verifiedArea.name}) وتحديد المحافظة (${targetGov.name}) تلقائياً`,
      };
    }
  }

  // Auto-correct governorate if AI picked a valid area that belongs to an adjacent/candidate governorate
  for (const g of candidateGovsMap.values()) {
    if (!isAllowedGovForExplicit(g, explicitGovInStreet)) continue;
    const areas = await getAreasForGov(g);
    const verifiedArea = matchAreaInList(areas, guessedArea, '', g.name);
    if (verifiedArea) {
      return {
        resolved: true,
        governorate: g.name,
        governorateId: String(g.id),
        area: verifiedArea.name,
        areaId: String(verifiedArea.id || verifiedArea.name),
        confidence,
        source: 'ai_turbo_map',
        reason: reason || `تمت مراجعة المنطقة (${verifiedArea.name}) وتصحيح المحافظة تلقائياً إلى (${g.name})`,
      };
    }
  }

  // Last review sweep via searchAreaByText across all governorates (respecting explicit governorate lock)
  if (typeof turboService.searchAreaByText === 'function') {
    const verifySearch = await turboService.searchAreaByText(guessedArea, { limit: 3 }).catch(() => null);
    const top = verifySearch?.matches?.[0];
    if (
      top &&
      top.area &&
      top.governorate &&
      top.confidence >= 0.75 &&
      isAllowedGovForExplicit({ id: top.governorateId, name: top.governorate }, explicitGovInStreet)
    ) {
      return {
        resolved: true,
        governorate: top.governorate,
        governorateId: String(top.governorateId || ''),
        area: top.area,
        areaId: String(top.areaId || top.area),
        confidence,
        source: 'ai_turbo_map',
        reason: reason || `تمت المطابقة عبر بحث خريطة تربو (${top.governorate} - ${top.area})`,
      };
    }
  }

  return {
    resolved: false,
    reason: 'AI_AREA_NOT_IN_TURBO_MAP',
    confidence,
    aiGuess: { area: guessedArea, governorate: guessedGov, reason },
  };
}

async function persistUnresolvedTurboLocation({ prisma, companyId, order, resolution }) {
  if (!prisma || (!order?.id && !order?.orderNumber)) return;
  try {
    let existingMeta = {};
    try {
      existingMeta = typeof order.metadata === 'string'
        ? JSON.parse(order.metadata || '{}')
        : (order.metadata && typeof order.metadata === 'object' ? order.metadata : {});
    } catch {}

    const updatedMeta = JSON.stringify({
      ...existingMeta,
      turboAreaResolution: {
        status: 'needs_details',
        reason: resolution.reason || 'UNRESOLVED',
        confidence: resolution.confidence ?? 0,
        aiGuess: resolution.aiGuess || null,
        message: 'العنوان غير واضح أو يحتاج تفاصيل لتحديد منطقة تربو',
        checkedAt: new Date().toISOString(),
      },
    });
    order.metadata = updatedMeta;

    if (order.tableType === 'GuestOrder') {
      if (prisma.guestOrder?.updateMany && order.orderNumber) {
        await prisma.guestOrder.updateMany({ where: { orderNumber: order.orderNumber, companyId }, data: { metadata: updatedMeta } }).catch(() => {});
      }
    } else if (order.id && prisma.order?.update) {
      await prisma.order.update({ where: { id: order.id }, data: { metadata: updatedMeta } }).catch(() => {});
      if (order.orderNumber && prisma.guestOrder?.updateMany) {
        await prisma.guestOrder.updateMany({ where: { orderNumber: order.orderNumber, companyId }, data: { metadata: updatedMeta } }).catch(() => {});
      }
      await logOrderEvent({
        prisma,
        companyId,
        orderId: order.id,
        orderNumber: order.orderNumber || null,
        action: ORDER_EVENT_ACTIONS.ORDER_UPDATED,
        userId: 'AI',
        actorId: 'AI',
        userName: 'الذكاء الاصطناعي (Turbo Area Resolver)',
        description: `العنوان غير واضح أو يحتاج تفاصيل لتحديد منطقة تربو (${resolution.reason || 'UNRESOLVED'})`,
        metadata: {
          source: 'ai_turbo_map',
          status: 'needs_details',
          reason: resolution.reason || 'UNRESOLVED',
        },
      });
    }
  } catch (err) {
    console.warn('⚠️ [TURBO-AI-AREA] Failed persisting needs_details status:', err.message);
  }
}

/**
 * Resolve Turbo location, mutate orderData for dispatch, and persist resolved area/governorate on the order.
 */
async function resolveAndApplyTurboLocation({ prisma, turboService, companyId, order = {}, orderData = {}, bypassEnableCheck = false }) {
  const resolution = await resolveTurboLocation({ prisma, turboService, companyId, order, orderData, bypassEnableCheck });
  if (!resolution.resolved) {
    if (!resolution.skipped) {
      await persistUnresolvedTurboLocation({ prisma, companyId, order, resolution });
    }
    return resolution;
  }

  orderData.governorate = resolution.governorate;
  orderData.area = resolution.area;
  orderData.city = resolution.area;
  orderData.verifiedTurboArea = resolution.area;

  // Persist resolved fields back to Order / GuestOrder so merchant sees the updated area & governorate
  if (prisma && (order?.id || order?.orderNumber)) {
    try {
      let existingMeta = {};
      try {
        existingMeta = typeof order.metadata === 'string'
          ? JSON.parse(order.metadata || '{}')
          : (order.metadata && typeof order.metadata === 'object' ? order.metadata : {});
      } catch {}

      const updatedMeta = JSON.stringify({
        ...existingMeta,
        turboAreaResolution: {
          status: 'resolved',
          governorate: resolution.governorate,
          area: resolution.area,
          confidence: resolution.confidence,
          source: resolution.source,
          reason: resolution.reason,
          resolvedAt: new Date().toISOString(),
        },
      });

      const prevGovernorate = order.governorate || null;
      const prevCity = order.city || null;
      const persistData = { metadata: updatedMeta };
      if (isUnspecified(order.governorate) || normalizeArabic(order.governorate) !== normalizeArabic(resolution.governorate)) {
        persistData.governorate = resolution.governorate;
        order.governorate = resolution.governorate;
      }
      if (isGenericOrEmptyLocation(order.city) || normalizeArabic(order.city) !== normalizeArabic(resolution.area)) {
        persistData.city = resolution.area;
        order.city = resolution.area;
      }
      order.metadata = updatedMeta;

      if (order.tableType === 'GuestOrder') {
        if (prisma.guestOrder?.updateMany && order.orderNumber) {
          await prisma.guestOrder.updateMany({ where: { orderNumber: order.orderNumber, companyId }, data: persistData }).catch(() => {});
        }
      } else if (order.id && prisma.order?.update) {
        await prisma.order.update({ where: { id: order.id }, data: persistData }).catch(() => {});
        if (order.orderNumber && prisma.guestOrder?.updateMany) {
          await prisma.guestOrder.updateMany({ where: { orderNumber: order.orderNumber, companyId }, data: persistData }).catch(() => {});
        }
        if (persistData.governorate !== undefined || persistData.city !== undefined) {
          await logOrderEvent({
            prisma,
            companyId,
            orderId: order.id,
            orderNumber: order.orderNumber || null,
            action: ORDER_EVENT_ACTIONS.ORDER_UPDATED,
            userId: 'AI',
            actorId: 'AI',
            userName: resolution.source === 'direct_map' ? 'خريطة تربو (Turbo Area Resolver)' : 'الذكاء الاصطناعي (Turbo Area Resolver)',
            description: resolution.source === 'direct_map'
              ? `تحديد منطقة/محافظة الطلب ${order.orderNumber || ''} تلقائياً من خريطة تربو (${prevCity || 'غير محدد'} ← ${resolution.area})`
              : `تعديل منطقة/محافظة الطلب ${order.orderNumber || ''} تلقائياً عبر الذكاء الاصطناعي (${prevCity || 'غير محدد'} ← ${resolution.area})`,
            before: { governorate: prevGovernorate, city: prevCity },
            after: { governorate: resolution.governorate, city: resolution.area },
            metadata: {
              source: resolution.source || 'ai_turbo_map',
              confidence: resolution.confidence,
              reason: resolution.reason,
            },
          });
        }
      }
    } catch (persistErr) {
      console.warn('⚠️ [TURBO-AI-AREA] Failed persisting resolved location:', persistErr.message);
    }
  }

  return resolution;
}

async function resolveTurboApiKey(prisma, companyId) {
  let turboApiKey = null;
  try {
    const company = await prisma.company?.findUnique?.({
      where: { id: companyId },
      select: { turboApiKey: true },
    });
    turboApiKey = company?.turboApiKey || null;
    if (!turboApiKey && prisma.shippingCompany?.findFirst) {
      const carrier = await prisma.shippingCompany.findFirst({
        where: { companyId, providerKey: 'TURBO', isActive: true },
        select: { apiKey: true },
      });
      turboApiKey = carrier?.apiKey || null;
    }
  } catch {}
  return turboApiKey;
}

function buildManualOrderData(order = {}) {
  return {
    governorate: order.governorate || '',
    city: order.city || '',
    shippingAddress: order.shippingAddress || order.customerAddress || '',
    customerAddress: order.customerAddress || order.shippingAddress || '',
  };
}

/**
 * Optional hook for newly created orders (when merchant enables aiAreaResolverOnCreate / turboAiAreaResolverOnCreate).
 */
async function resolveTurboLocationOnOrderCreate({ prisma, companyId, order } = {}) {
  if (!prisma || !companyId || !order) return { skipped: true, reason: 'MISSING_ARGS' };
  const config = await loadTurboAiResolverConfig(prisma, companyId);
  if (!config.aiEnabled || !config.aiOnCreateEnabled) {
    return { skipped: true, reason: 'AI_ON_CREATE_DISABLED' };
  }

  const turboApiKey = await resolveTurboApiKey(prisma, companyId);
  if (!turboApiKey) {
    return { skipped: true, reason: 'NO_TURBO_API_KEY' };
  }

  const TurboService = require('../turboService');
  const turboService = new TurboService(turboApiKey, companyId);
  return resolveAndApplyTurboLocation({
    prisma,
    turboService,
    companyId,
    order,
    orderData: buildManualOrderData(order),
  });
}

/**
 * Explicit manual AI area resolution triggered from Order Details UI.
 */
async function resolveOrderAreaManually({ prisma, companyId, order } = {}) {
  if (!prisma || !companyId || !order) return { skipped: true, reason: 'MISSING_ARGS' };
  const turboApiKey = await resolveTurboApiKey(prisma, companyId);
  if (!turboApiKey) {
    return { skipped: true, reason: 'NO_TURBO_API_KEY' };
  }

  const TurboService = require('../turboService');
  const turboService = new TurboService(turboApiKey, companyId);
  return resolveAndApplyTurboLocation({
    prisma,
    turboService,
    companyId,
    order,
    orderData: buildManualOrderData(order),
    bypassEnableCheck: true,
  });
}

module.exports = {
  resolveTurboLocation,
  resolveAndApplyTurboLocation,
  resolveTurboLocationOnOrderCreate,
  resolveOrderAreaManually,
  loadTurboAiResolverConfig,
  isGenericOrEmptyLocation,
  matchAreaInList,
};
