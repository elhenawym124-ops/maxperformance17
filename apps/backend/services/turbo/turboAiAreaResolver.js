/**
 * Turbo AI Area Resolver
 * مهمته الوحيدة: تخمين المدينة/المنطقة من عنوان العميل بناءً على خريطة مناطق تربو،
 * تحديد المحافظة تلقائياً من المنطقة المختارة، ومراجعة صحة التطابق قبل الإرسال لتربو.
 */

const { getBestShippingAddressFields, cleanLocationName } = require('../../utils/turbo/addressParser');
const { getTurboGovernorateName, isUnspecified, normalizeArabic } = require('../../utils/turbo/governorateMapper');
const { resolveAiKey, callChatCompletion } = require('../radiologyAiDraftService');

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

function isGenericOrEmptyLocation(val) {
  const cleaned = normalizeArabic(cleanLocationName(val));
  return !cleaned || cleaned.length < 2 || GENERIC_LOCATION_TOKENS.has(cleaned);
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

  // 1. Direct match on candidateArea if it isn't a generic governorate name
  if (!candidateIsGeneric) {
    const exact = sorted.find((a) => normalizeArabic(a.name) === nCandidate);
    if (exact) return exact;

    const bareMatch = sorted.find((a) => {
      const na = normalizeArabic(a.name);
      const bare = na.startsWith('ال') ? na.slice(2) : na;
      return bare.length >= 3 && (nCandidate === bare || nCandidate.includes(bare));
    });
    if (bareMatch) return bareMatch;
  }

  // 2. Scan street address text for an explicit canonical Turbo area name
  if (fullAddressText) {
    const nAddress = normalizeArabic(fullAddressText).replace(/كوبري\s*(?:6\s*|السادس\s*من\s*)?اكتوبر/g, ' ');
    for (const area of sorted) {
      const na = normalizeArabic(area.name);
      if (!na || na === nGov || GENERIC_LOCATION_TOKENS.has(na)) continue;
      if (na.length >= 3 && nAddress.includes(na)) return area;

      const bare = na.startsWith('ال') ? na.slice(2) : na;
      if (bare.length >= 3 && bare !== nGov && !GENERIC_LOCATION_TOKENS.has(bare) && nAddress.includes(bare)) {
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
  const defaults = { aiEnabled: true, confidenceThreshold: 0.65, model: null };
  if (!prisma || !companyId) return defaults;

  let aiEnabled = defaults.aiEnabled;
  let explicitFlagFound = false;

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
      }
    }
  } catch {}

  // 2) Standalone toggle on Company.settings
  if (!explicitFlagFound) {
    try {
      if (prisma.company?.findUnique) {
        const comp = await prisma.company.findUnique({
          where: { id: companyId },
          select: { settings: true },
        });
        if (comp?.settings) {
          const parsed = typeof comp.settings === 'string' ? JSON.parse(comp.settings) : comp.settings;
          if (parsed && typeof parsed.turboAiAreaResolverEnabled === 'boolean') {
            aiEnabled = parsed.turboAiAreaResolverEnabled;
            explicitFlagFound = true;
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
          confidenceThreshold:
            typeof raw.confidenceThreshold === 'number' && raw.confidenceThreshold > 0 && raw.confidenceThreshold <= 1
              ? raw.confidenceThreshold
              : defaults.confidenceThreshold,
          model: typeof raw.model === 'string' && raw.model.trim() ? raw.model.trim() : null,
        };
      }
    }
  } catch {}

  return { ...defaults, aiEnabled };
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
async function resolveTurboLocation({ prisma, turboService, companyId, order = {}, orderData = {} }) {
  if (!turboService || typeof turboService.getGovernments !== 'function' || typeof turboService.getAreas !== 'function') {
    return { skipped: true, resolved: false, reason: 'NO_LOCATION_SERVICE' };
  }

  const govRes = await turboService.getGovernments().catch(() => null);
  const governments = Array.isArray(govRes?.governments) ? govRes.governments : [];
  if (governments.length === 0) {
    return { skipped: true, resolved: false, reason: 'NO_GOVERNMENTS' };
  }

  const { rawGov, rawCity, rawArea, streetText, fullAddressText } = buildOrderAddressContext(order, orderData);
  const inferredGovName = getTurboGovernorateName(rawGov, rawCity, fullAddressText);
  const initialGov = findMatchingGovernment(inferredGovName, governments);

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
  if (!config.aiEnabled) {
    return { skipped: true, resolved: false, reason: 'AI_DISABLED' };
  }

  const aiConfig = await resolveAiKey(prisma, companyId).catch(() => null);
  if (!aiConfig?.apiKey) {
    return { resolved: false, reason: 'NO_ACTIVE_AI_KEY' };
  }

  // Gather candidate governorates (explicit + Cairo/Giza/Outskirts siblings + searchAreaByText hits)
  const candidateGovsMap = new Map();
  const addCandidateGov = (g) => {
    if (g?.id && !candidateGovsMap.has(String(g.id))) {
      candidateGovsMap.set(String(g.id), g);
    }
  };

  if (initialGov) {
    addCandidateGov(initialGov);
    if (['القاهرة', 'الجيزة', 'أطراف القاهرة والجيزة'].includes(initialGov.name)) {
      addCandidateGov(findMatchingGovernment('أطراف القاهرة والجيزة', governments));
      addCandidateGov(findMatchingGovernment('الجيزة', governments));
      addCandidateGov(findMatchingGovernment('القاهرة', governments));
    }
  }

  if (typeof turboService.searchAreaByText === 'function' && fullAddressText.trim().length >= 3) {
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
    '4) أرجع JSON صالح فقط بدون أي شرح إضافي بالشكل التالي:',
    '{"area":"اسم المنطقة من القائمة","governorate":"اسم المحافظة من القائمة","confidence":0.85,"reason":"سبب مختصر"}',
  ].join('\n');

  const userPrompt = [
    `بيانات العميل:`,
    `- العنوان: ${streetText || 'غير متوفر'}`,
    `- المحافظة المكتوبة: ${rawGov || 'غير محدد'}`,
    `- المدينة/المنطقة المكتوبة: ${rawCity || rawArea || 'غير محدد'}`,
    '',
    `المحافظات الرسمية في تربو: ${govNamesList}`,
    '',
    candidateSections.length > 0
      ? `مناطق تربو المتاحة للمحافظات المرشحة:\n${candidateSections.join('\n')}`
      : 'ابحث في معرفتك الجغرافية بمصر واختر أقرب منطقة رسمية في تربو مع محافظتها.',
  ].join('\n');

  let aiRawText;
  try {
    aiRawText = await callChatCompletion({
      baseUrl: aiConfig.baseUrl,
      apiKey: aiConfig.apiKey,
      model: aiConfig.model,
      system: systemPrompt,
      user: userPrompt,
      maxTokens: 300,
      timeoutMs: 15000,
    });
  } catch (aiErr) {
    console.warn(`⚠️ [TURBO-AI-AREA] AI lookup failed: ${aiErr.message}`);
    return { resolved: false, reason: 'AI_CALL_FAILED', error: aiErr.message };
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
  const targetGov = findMatchingGovernment(guessedGov, governments) || initialGov;
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

  // Last review sweep via searchAreaByText across all governorates
  if (typeof turboService.searchAreaByText === 'function') {
    const verifySearch = await turboService.searchAreaByText(guessedArea, { limit: 3 }).catch(() => null);
    const top = verifySearch?.matches?.[0];
    if (top && top.area && top.governorate && top.confidence >= 0.75) {
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

/**
 * Resolve Turbo location, mutate orderData for dispatch, and persist resolved area/governorate on the order.
 */
async function resolveAndApplyTurboLocation({ prisma, turboService, companyId, order = {}, orderData = {} }) {
  const resolution = await resolveTurboLocation({ prisma, turboService, companyId, order, orderData });
  if (!resolution.resolved) return resolution;

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
          governorate: resolution.governorate,
          area: resolution.area,
          confidence: resolution.confidence,
          source: resolution.source,
          reason: resolution.reason,
          resolvedAt: new Date().toISOString(),
        },
      });

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
      }
    } catch (persistErr) {
      console.warn('⚠️ [TURBO-AI-AREA] Failed persisting resolved location:', persistErr.message);
    }
  }

  return resolution;
}

module.exports = {
  resolveTurboLocation,
  resolveAndApplyTurboLocation,
  isGenericOrEmptyLocation,
  matchAreaInList,
};
