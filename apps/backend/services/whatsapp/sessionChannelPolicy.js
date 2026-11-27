/**
 * 🚦 WhatsApp Session Channel Policy
 * إدارة صلاحيات كل قناة واتساب (الاستقبال، الإرسال، وإرسال الإشعارات التلقائية).
 *
 * تُخزّن داخل WhatsAppSession.metadata JSON لتجنّب كسر أي استعلامات قديمة
 * أو الحاجة لميجريشن معقّد، وتُفترض القيمة true افتراضياً لكل الجلسات القائمة.
 */

const CHANNEL_POLICY_DEFAULTS = Object.freeze({
  inboundEnabled: true,
  outboundEnabled: true,
  notificationsEnabled: true
});

function parseSessionMetadata(metadata) {
  if (!metadata) return {};
  if (typeof metadata === 'object' && !Array.isArray(metadata)) {
    return metadata;
  }
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function resolveBooleanFlag(directValue, metadataValue, defaultValue = true) {
  if (typeof directValue === 'boolean') return directValue;
  if (typeof metadataValue === 'boolean') return metadataValue;
  return defaultValue;
}

/**
 * استخراج سياسة القناة من كائن الجلسة (سواء من DB أو الذاكرة أو استجابة API).
 * @param {object|null|undefined} session
 * @returns {{ inboundEnabled: boolean, outboundEnabled: boolean, notificationsEnabled: boolean }}
 */
function getSessionChannelPolicy(session) {
  if (!session || typeof session !== 'object') {
    return { ...CHANNEL_POLICY_DEFAULTS };
  }

  const meta = parseSessionMetadata(session.metadata);
  const inboundEnabled = resolveBooleanFlag(
    session.inboundEnabled,
    meta.inboundEnabled,
    CHANNEL_POLICY_DEFAULTS.inboundEnabled
  );
  const outboundEnabled = resolveBooleanFlag(
    session.outboundEnabled,
    meta.outboundEnabled,
    CHANNEL_POLICY_DEFAULTS.outboundEnabled
  );
  const notificationsEnabled = resolveBooleanFlag(
    session.notificationsEnabled,
    meta.notificationsEnabled,
    CHANNEL_POLICY_DEFAULTS.notificationsEnabled
  );

  return {
    inboundEnabled,
    outboundEnabled,
    notificationsEnabled
  };
}

function isSessionInboundEnabled(session) {
  return getSessionChannelPolicy(session).inboundEnabled;
}

function isSessionOutboundEnabled(session) {
  return getSessionChannelPolicy(session).outboundEnabled;
}

/**
 * الجلسة صالحة لإرسال الإشعارات التلقائية فقط إذا كان الإرسال مفعّلاً والإشعارات مفعّلة معاً.
 */
function isSessionNotificationEligible(session) {
  const policy = getSessionChannelPolicy(session);
  return policy.outboundEnabled && policy.notificationsEnabled;
}

/**
 * يتحقق من السماح بالإرسال على القناة، ويرمي خطأ منظماً عند الإيقاف.
 */
function assertSessionOutboundAllowed(session, sessionId = null) {
  if (!session) return;
  if (!isSessionOutboundEnabled(session)) {
    const error = new Error('الإرسال موقوف على هذه القناة من إعدادات جلسات واتساب');
    error.code = 'WA_SESSION_OUTBOUND_DISABLED';
    error.statusCode = 403;
    error.sessionId = session.id || sessionId || null;
    throw error;
  }
}

/**
 * دمج مفاتيح السياسة القادمة في body داخل كائن metadata.
 */
function applyChannelPolicyToMetadata(existingMeta = {}, payload = {}) {
  const nextMeta = { ...parseSessionMetadata(existingMeta) };
  let changed = false;

  if (typeof payload.inboundEnabled === 'boolean') {
    nextMeta.inboundEnabled = payload.inboundEnabled;
    changed = true;
  }
  if (typeof payload.outboundEnabled === 'boolean') {
    nextMeta.outboundEnabled = payload.outboundEnabled;
    changed = true;
  }
  if (typeof payload.notificationsEnabled === 'boolean') {
    nextMeta.notificationsEnabled = payload.notificationsEnabled;
    changed = true;
  }

  return { metadata: nextMeta, changed };
}

module.exports = {
  CHANNEL_POLICY_DEFAULTS,
  parseSessionMetadata,
  getSessionChannelPolicy,
  isSessionInboundEnabled,
  isSessionOutboundEnabled,
  isSessionNotificationEligible,
  assertSessionOutboundAllowed,
  applyChannelPolicyToMetadata
};
