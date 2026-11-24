/**
 * Quantity Tier Variants Utility
 *
 * This utility detects when a product's variants represent volume/quantity tiers
 * (e.g. "كرتونة واحدة", "من 3 إلى 5 كراتين", "من 6 إلى 10 كراتين", "من 11 كرتونة فيما فوق")
 * and strictly confines product & cart quantities to that tier's range for Ahmed Gad's company.
 */

export const AHMED_GAD_COMPANY_ID = 'cmttxw3hg1wq4ju430g8muja0';
export const AHMED_GAD_SLUG = 'ahmedgad';

export interface QuantityTierRange {
  min: number;
  max: number;
}

export interface QuantityTierVariantInfo {
  variantId: string;
  name: string;
  price: number;
  comparePrice?: number;
  attributeKey: string;
  attributeVal: string;
  range: QuantityTierRange;
}

// Convert Eastern Arabic numerals (٠-٩) to Western Arabic (0-9)
export const normalizeArabicNumerals = (str: string): string => {
  return str.replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
};

/**
 * Check if the current tenant / store belongs to Ahmed Gad.
 * Guarantees 100% tenant isolation: only Ahmed Gad store is affected.
 */
export const isAhmedGadStore = (
  companyId?: string | null,
  companySlug?: string | null,
): boolean => {
  // If an explicit companyId is provided, evaluate strictly (zero ambient storage leakage)
  if (companyId) {
    return companyId === AHMED_GAD_COMPANY_ID;
  }
  // If an explicit companySlug is provided, evaluate strictly
  if (companySlug) {
    return companySlug === AHMED_GAD_SLUG;
  }

  if (typeof window !== 'undefined') {
    try {
      const hostname = window.location.hostname.toLowerCase();
      if (hostname.includes('ahmedgad')) return true;

      const params = new URLSearchParams(window.location.search);
      const queryCompanyId = params.get('companyId');
      const queryCompanySlug = params.get('company') || params.get('slug');
      if (queryCompanyId) {
        return queryCompanyId === AHMED_GAD_COMPANY_ID;
      }
      if (queryCompanySlug) {
        return queryCompanySlug === AHMED_GAD_SLUG;
      }

      const stored =
        localStorage.getItem('storefront_companyId') ||
        localStorage.getItem('companyId') ||
        sessionStorage.getItem('storefront_companyId');
      if (stored === AHMED_GAD_COMPANY_ID) return true;
    } catch {
      // Ignore window/storage access errors in sandbox/SSR
    }
  }

  return false;
};

/**
 * Parses a string to extract the quantity range it represents.
 */
export const parseQuantityRange = (rawText: string): QuantityTierRange | null => {
  if (!rawText || typeof rawText !== 'string') return null;

  const text = normalizeArabicNumerals(rawText.toLowerCase().trim());

  // 1. Check for "plus" / "and above" / "فيما فوق" / "فما فوق" / "فاكثر" / "11+"
  const plusPatterns = [
    /(?:من|أكثر من|اكثر من)\s*(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع)?\s*(?:فيما فوق|فما فوق|فاكثر|فأكثر|أو أكثر|او اكثر)/,
    /(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع)?\s*(?:فيما فوق|فما فوق|فاكثر|فأكثر|أو أكثر|او اكثر|\+)/,
    /(\d+)\s*\+/,
  ];

  for (const pat of plusPatterns) {
    const match = text.match(pat);
    if (match && match[1]) {
      const min = parseInt(match[1], 10);
      if (!isNaN(min) && min > 0) {
        return { min, max: Infinity };
      }
    }
  }

  // 2. Check for ranges like "من 3 إلى 5" / "من 3 الى 5" / "من 3 لـ 5" / "3 - 5" / "3-5" / "3 to 5"
  const rangePatterns = [
    /(?:من\s*)?(\d+)\s*(?:إلى|الى|لـ|ل|حتى|to|-)\s*(\d+)/,
  ];

  for (const pat of rangePatterns) {
    const match = text.match(pat);
    if (match && match[1] && match[2]) {
      const min = parseInt(match[1], 10);
      const max = parseInt(match[2], 10);
      if (!isNaN(min) && !isNaN(max) && min > 0 && max >= min) {
        return { min, max };
      }
    }
  }

  // 3. Single carton/piece or specific number:
  // "كرتونة واحدة" / "قطعة واحدة" / "واحدة"
  if (
    /^(?:كرتونة واحدة|قطعة واحدة|علبة واحدة|واحدة|1\s*(?:كرتونة|قطعة|علبة)?)/.test(text) ||
    /كرتونة واحدة|قطعة واحدة/.test(text)
  ) {
    return { min: 1, max: 2 };
  }

  // "كرتونتين" / "قطعتين" / "2 كرتونة"
  if (/^(?:كرتونتين|قطعتين|علبتين|2\s*(?:كرتونة|قطعة|علبة)?)/.test(text)) {
    return { min: 2, max: 2 };
  }

  // Pure single number at start: "5 كراتين", "10 قطع"
  const singleMatch = text.match(/^(\d+)\s*(?:كرتونة|كراتين|قطعة|قطع|علبة|علب)?/);
  if (singleMatch && singleMatch[1]) {
    const val = parseInt(singleMatch[1], 10);
    if (!isNaN(val) && val > 0) {
      return { min: val, max: val };
    }
  }

  return null;
};

/**
 * Checks if a list of product variants represents a quantity tier scheme.
 * Returns the parsed tiers sorted by min quantity, with ranges normalized so there are no gaps.
 */
export const detectQuantityTierVariants = (
  variants: any[],
): { isTierScheme: boolean; tiers: QuantityTierVariantInfo[]; attributeKey: string } => {
  if (!Array.isArray(variants) || variants.length < 2) {
    return { isTierScheme: false, tiers: [], attributeKey: '' };
  }

  const candidates: Array<{
    variantId: string;
    name: string;
    price: number;
    comparePrice?: number;
    attributeKey: string;
    attributeVal: string;
    range: QuantityTierRange;
  }> = [];

  let detectedAttrKey = '';

  for (const v of variants) {
    if (!v) continue;
    let attrValues: Record<string, string> = {};

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

    // Check each attribute key
    let matchedRange: QuantityTierRange | null = null;
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

    // Fallback: check variant name directly if no attribute value matched
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

/**
 * Finds the matching tier variant for a given quantity.
 */
export const findMatchingTierVariant = (
  tiers: QuantityTierVariantInfo[],
  quantity: number,
): QuantityTierVariantInfo | null => {
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

/**
 * Extracts quantity range for a given variant or attributes map,
 * strictly gated for Ahmed Gad's store.
 */
export const getVariantQuantityRange = (
  variantOrAttributes: any,
  companyId?: string | null,
  companySlug?: string | null,
): QuantityTierRange | null => {
  const resolvedCompanyId = companyId || variantOrAttributes?.companyId;
  const resolvedCompanySlug = companySlug || variantOrAttributes?.companySlug;
  if (!isAhmedGadStore(resolvedCompanyId, resolvedCompanySlug)) {
    return null;
  }

  if (!variantOrAttributes) return null;

  if (
    variantOrAttributes.range &&
    typeof variantOrAttributes.range.min === 'number' &&
    typeof variantOrAttributes.range.max === 'number'
  ) {
    return {
      min: variantOrAttributes.range.min,
      max: Number.isFinite(variantOrAttributes.range.max) ? variantOrAttributes.range.max : 99,
    };
  }

  const textCandidates: string[] = [];
  if (variantOrAttributes.attributes && typeof variantOrAttributes.attributes === 'object') {
    textCandidates.push(...Object.values(variantOrAttributes.attributes).map(String));
  }
  if (variantOrAttributes.metadata) {
    try {
      const meta =
        typeof variantOrAttributes.metadata === 'string'
          ? JSON.parse(variantOrAttributes.metadata)
          : variantOrAttributes.metadata;
      if (meta?.attributeValues && typeof meta.attributeValues === 'object') {
        textCandidates.push(...Object.values(meta.attributeValues).map(String));
      }
    } catch {}
  }

  if (
    typeof variantOrAttributes === 'object' &&
    !variantOrAttributes.attributes &&
    !variantOrAttributes.name &&
    !variantOrAttributes.title
  ) {
    textCandidates.push(...Object.values(variantOrAttributes).map(String));
  }

  if (variantOrAttributes.name && typeof variantOrAttributes.name === 'string') {
    textCandidates.push(variantOrAttributes.name);
  }
  if (variantOrAttributes.title && typeof variantOrAttributes.title === 'string') {
    textCandidates.push(variantOrAttributes.title);
  }

  for (const candidate of textCandidates) {
    const range = parseQuantityRange(candidate);
    if (range) {
      return {
        min: range.min,
        max: Number.isFinite(range.max) ? range.max : 99,
      };
    }
  }

  return null;
};

/**
 * Extracts quantity range for a cart item, strictly gated for Ahmed Gad's store.
 */
export const getCartItemQuantityRange = (
  item: any,
  companyId?: string | null,
  companySlug?: string | null,
): QuantityTierRange | null => {
  const resolvedCompanyId = companyId || item?.companyId || item?.storefrontCompanyId;
  const resolvedCompanySlug = companySlug || item?.companySlug;
  if (!isAhmedGadStore(resolvedCompanyId, resolvedCompanySlug)) {
    return null;
  }

  if (!item) return null;

  if (
    typeof item.minQuantity === 'number' &&
    typeof item.maxQuantity === 'number' &&
    item.minQuantity > 0
  ) {
    return {
      min: item.minQuantity,
      max: Number.isFinite(item.maxQuantity) ? item.maxQuantity : 99,
    };
  }

  return getVariantQuantityRange(item, resolvedCompanyId, resolvedCompanySlug);
};
