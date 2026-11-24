const normalizeArabicNumerals = (str) => {
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

const parseQuantityRange = (rawText) => {
  if (!rawText || typeof rawText !== 'string') return null;
  const text = normalizeArabicNumerals(rawText.toLowerCase().trim());

  const plusPatterns = [
    /(?:من|أكثر من|اكثر من)\s*(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع)?\s*(?:فيما فوق|فما فوق|فاكثر|فأكثر|أو أكثر|او اكثر)/,
    /(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع)?\s*(?:فيما فوق|فما فوق|فاكثر|فأكثر|أو أكثر|او اكثر|\+)/,
    /(\d+)\s*\+/,
  ];

  for (const pat of plusPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const min = parseInt(match[1], 10);
      if (!isNaN(min) && min > 0) return { min, max: Infinity };
    }
  }

  const rangePatterns = [
    /(?:من\s*)?(\d+)\s*(?:إلى|الى|لـ|ل|حتى|to|-)\s*(\d+)/,
  ];

  for (const pat of rangePatterns) {
    const match = text.match(pat);
    if (match && match[1] && match[2]) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) return { min, max };
    }
  }

  if (
    /^(?:كرتونة واحدة|قطعة واحدة|علبة واحدة|واحدة|1\s*(?:كرتونة|قطعة|علبة)?)/.test(text) ||
    /كرتونة واحدة|قطعة واحدة/.test(text)
  ) {
    return { min: 1, max: 2 };
  }

  if (/^(?:كرتونتين|قطعتين|علبتين|2\s*(?:كرتونة|قطعة|علبة)?)/.test(text)) {
    return { min: 2, max: 2 };
  }

  const singleMatch = text.match(/^(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع|علبة|علب)?/);
  if (singleMatch && singleMatch[1]) {
    const val = parseInt(singleMatch[1], 10);
    if (!isNaN(val) && val > 0) return { min: val, max: val };
  }

  return null;
};

const detectQuantityTierVariants = (variants) => {
  if (!Array.isArray(variants) || variants.length < 2) {
    return { isTierScheme: false, tiers: [], attributeKey: '' };
  }

  const candidates = [];
  let detectedAttrKey = '';

  for (const v of variants) {
    if (!v) continue;
    let attrValues = {};

    if (v.attributes && typeof v.attributes === 'object') {
      attrValues = v.attributes;
    } else if (v.metadata) {
      try {
        const meta = typeof v.metadata === 'string' ? JSON.parse(v.metadata) : v.metadata;
        if (meta?.attributeValues && typeof meta.attributeValues === 'object') {
          attrValues = meta.attributeValues;
        }
      } catch (_) {}
    }

    let matchedRange = null;
    let matchedKey = '';
    let matchedVal = '';

    for (const [k, val] of Object.entries(attrValues)) {
      if (typeof val === 'string') {
        const range = parseQuantityRange(val);
        if (range) {
          matchedRange = range;
          matchedKey = k;
          matchedVal = val;
          break;
        }
      }
    }

    if (!matchedRange && v.name && typeof v.name === 'string') {
      const range = parseQuantityRange(v.name);
      if (range) {
        matchedRange = range;
        matchedKey = 'الكمية';
        matchedVal = v.name;
      }
    }

    if (matchedRange && matchedVal) {
      candidates.push({
        variantId: String(v.id),
        name: String(v.name || matchedVal),
        price: Number(v.price),
        comparePrice: v.comparePrice ? Number(v.comparePrice) : undefined,
        attributeKey: matchedKey,
        attributeVal: matchedVal,
        range: matchedRange,
      });
      if (!detectedAttrKey) detectedAttrKey = matchedKey;
    }
  }

  if (candidates.length < 2) {
    return { isTierScheme: false, tiers: [], attributeKey: '' };
  }

  candidates.sort((a, b) => a.range.min - b.range.min);

  for (let i = 0; i < candidates.length - 1; i++) {
    const nextMin = candidates[i + 1].range.min;
    if (nextMin > candidates[i].range.min) {
      candidates[i].range.max = Math.max(candidates[i].range.max, nextMin - 1);
    }
  }

  const lastTier = candidates[candidates.length - 1];
  if (lastTier.range.max !== Infinity) {
    lastTier.range.max = Infinity;
  }

  return {
    isTierScheme: true,
    tiers: candidates,
    attributeKey: detectedAttrKey || 'الكمية',
  };
};

const findMatchingTierVariant = (tiers, quantity) => {
  if (!tiers || tiers.length === 0) return null;
  const q = Math.max(1, Math.floor(quantity));

  for (const tier of tiers) {
    if (q >= tier.range.min && q <= tier.range.max) {
      return tier;
    }
  }

  if (q > tiers[tiers.length - 1].range.max) {
    return tiers[tiers.length - 1];
  }
  return tiers[0];
};

const AHMED_GAD_COMPANY_ID = 'cmttxw3hg1wq4ju430g8muja0';
const AHMED_GAD_SLUG = 'ahmedgad';

const isAhmedGadStore = (companyId, companySlug) => {
  if (companyId) return companyId === AHMED_GAD_COMPANY_ID;
  if (companySlug) return companySlug === AHMED_GAD_SLUG;
  return false;
};

module.exports = {
  AHMED_GAD_COMPANY_ID,
  AHMED_GAD_SLUG,
  isAhmedGadStore,
  normalizeArabicNumerals,
  parseQuantityRange,
  detectQuantityTierVariants,
  findMatchingTierVariant,
};
