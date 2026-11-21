'use strict';

/**
 * Education Demo Day Attribution & Registrar Helpers
 * Provides source channel normalization, [ATTR: ...] tag parsing/serialization,
 * and safe field truncation.
 */

const ALLOWED_CHANNELS = new Set([
  'WHATSAPP',
  'FACEBOOK',
  'INSTAGRAM',
  'MESSENGER',
  'WEBSITE',
  'PHONE',
  'WALK_IN',
  'REFERRAL',
  'OTHER'
]);

const ALLOWED_REGISTERED_BY_TYPES = new Set([
  'SELF',
  'EMPLOYEE',
  'IMPORT',
  'API'
]);

/**
 * Normalize raw input string into a standard sourceChannel enum value
 * and retain raw text for sourceRaw when appropriate.
 *
 * @param {string|null|undefined} rawInput
 * @param {string} defaultChannel - Fallback channel ('WEBSITE' for public, 'OTHER' for internal)
 * @returns {{ channel: string, raw: string|null }}
 */
function normalizeSourceChannel(rawInput, defaultChannel = 'WEBSITE') {
  if (!rawInput || typeof rawInput !== 'string') {
    return { channel: defaultChannel, raw: null };
  }

  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { channel: defaultChannel, raw: null };
  }

  const upper = trimmed.toUpperCase();

  // Exact enum match
  if (ALLOWED_CHANNELS.has(upper)) {
    return { channel: upper, raw: trimmed.slice(0, 500) };
  }

  // Common aliases & partial matches
  if (upper === 'FB' || upper.includes('FACEBOOK') || upper === 'META') {
    return { channel: 'FACEBOOK', raw: trimmed.slice(0, 500) };
  }
  if (upper === 'WA' || upper.includes('WHATSAPP')) {
    return { channel: 'WHATSAPP', raw: trimmed.slice(0, 500) };
  }
  if (upper === 'IG' || upper.includes('INSTA') || upper.includes('INSTAGRAM')) {
    return { channel: 'INSTAGRAM', raw: trimmed.slice(0, 500) };
  }
  if (upper === 'MSG' || upper.includes('MESSENGER')) {
    return { channel: 'MESSENGER', raw: trimmed.slice(0, 500) };
  }
  if (
    upper.includes('WEB') ||
    upper.includes('SITE') ||
    upper.includes('ORGANIC') ||
    upper.includes('DIRECT') ||
    upper.includes('LANDING') ||
    upper.includes('GOOGLE')
  ) {
    return { channel: 'WEBSITE', raw: trimmed.slice(0, 500) };
  }
  if (upper.includes('CALL') || upper.includes('PHONE') || upper.includes('TEL') || upper.includes('MOBILE')) {
    return { channel: 'PHONE', raw: trimmed.slice(0, 500) };
  }
  if (upper.includes('WALK') || upper.includes('BRANCH') || upper.includes('IN_PERSON') || upper.includes('VISIT')) {
    return { channel: 'WALK_IN', raw: trimmed.slice(0, 500) };
  }
  if (upper.includes('REF') || upper.includes('FRIEND') || upper.includes('RECOMMEND')) {
    return { channel: 'REFERRAL', raw: trimmed.slice(0, 500) };
  }

  // Any unrecognized value maps to 'OTHER', storing the original text in sourceRaw
  return {
    channel: 'OTHER',
    raw: trimmed.slice(0, 500)
  };
}

/**
 * Normalize registeredByType enum
 * @param {string|null|undefined} rawType
 * @param {string} fallback
 * @returns {string}
 */
function normalizeRegisteredByType(rawType, fallback = 'SELF') {
  if (!rawType || typeof rawType !== 'string') return fallback;
  const upper = rawType.trim().toUpperCase();
  return ALLOWED_REGISTERED_BY_TYPES.has(upper) ? upper : fallback;
}

/**
 * Extract structured attribution from legacy [ATTR: {...}] tag in notes
 * @param {string|null|undefined} notes
 * @returns {{ source?: string, campaign?: string, adId?: string|null, postId?: string|null }|null}
 */
function extractAttributionFromNotes(notes) {
  if (!notes || typeof notes !== 'string' || !notes.includes('[ATTR:')) {
    return null;
  }
  try {
    const match = notes.match(/\[ATTR:\s*({.*?})\]/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
  } catch (_) {}
  return null;
}

/**
 * Build the backward-compatible [ATTR: {...}] tag string
 * @param {{ source?: string, campaign?: string, adId?: string|null, postId?: string|null }} data
 * @returns {string}
 */
function buildAttributionTag(data = {}) {
  const payload = {
    source: data.source || 'WEBSITE',
    campaign: data.campaign || 'الموقع العام',
    adId: data.adId || null,
    postId: data.postId || null
  };
  return `[ATTR: ${JSON.stringify(payload)}]`;
}

/**
 * Human-readable Arabic label for channel
 */
function getChannelArabicLabel(channel) {
  switch (channel) {
    case 'WHATSAPP':
      return 'إعلانات ورسائل واتساب (Click-to-WhatsApp)';
    case 'FACEBOOK':
      return 'إعلانات وفيسبوك (Facebook Ads)';
    case 'MESSENGER':
      return 'إعلانات ماسنجر (Messenger Ads)';
    case 'INSTAGRAM':
      return 'إنستجرام (Instagram Direct)';
    case 'WEBSITE':
      return 'الموقع ولاندينج بيج (Website Direct)';
    case 'PHONE':
      return 'اتصال هاتفي (Phone)';
    case 'WALK_IN':
      return 'حضور مباشر للفرع (Walk-In)';
    case 'REFERRAL':
      return 'ترشيح وتوصية (Referral)';
    case 'OTHER':
    default:
      return 'أخرى / مباشر';
  }
}

/**
 * Human-readable Arabic label for registeredByType
 */
function getRegisteredByTypeArabicLabel(type, registeredByName) {
  switch (type) {
    case 'SELF':
      return 'العميل نفسه (تسجيل ذاتي)';
    case 'EMPLOYEE':
      return registeredByName ? `موظف (${registeredByName})` : 'موظف';
    case 'IMPORT':
      return 'استيراد ملف (IMPORT)';
    case 'API':
      return 'ربط وتكامل (API)';
    default:
      return 'غير محدد';
  }
}

module.exports = {
  ALLOWED_CHANNELS,
  ALLOWED_REGISTERED_BY_TYPES,
  normalizeSourceChannel,
  normalizeRegisteredByType,
  extractAttributionFromNotes,
  buildAttributionTag,
  getChannelArabicLabel,
  getRegisteredByTypeArabicLabel,
};
