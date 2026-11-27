/**
 * ≡ƒÜ¿ PRODUCTION-FIX (notifications-fix-plan ┬º5.1):
 * ┘à┘ê╪º╪▓┘å╪⌐ ╪º┘ä╪¼┘ä╪│╪º╪¬ + ╪¡┘ä ╪º┘ä╪¼┘ä╪│╪⌐ ╪╣┘å╪» ╪º┘ä╪Ñ╪▒╪│╪º┘ä (Sticky / Round-Robin / JIT init).
 * ┘à╪│╪¬╪«╪▒╪¼╪⌐ ┘à┘å WhatsAppNotificationService.js ┘ä╪¬┘é┘ä┘è┘ä ╪¡╪¼┘à ╪º┘ä┘à┘ä┘ü.
 */

const { getSharedPrismaClient, safeQuery } = require('../sharedDatabase');
const WhatsAppManager = require('./WhatsAppManager');
const { formatPhoneNumber } = require('../../utils/phoneFormat');
const { isSessionNotificationEligible } = require('./sessionChannelPolicy');

const sessionRotation = new Map();
const SESSION_ROTATION_MAX_SIZE = 5000;
function setSessionRotation(companyId, index) {
  if (sessionRotation.size >= SESSION_ROTATION_MAX_SIZE && !sessionRotation.has(companyId)) {
    const oldestKey = sessionRotation.keys().next().value;
    sessionRotation.delete(oldestKey);
  }
  sessionRotation.set(companyId, index);
}

const sessionInitializationInFlight = new Map();

function autoHealDefaultSession(companyId, sessionId) {
  if (!companyId || !sessionId) return;
  safeQuery(() => getSharedPrismaClient().whatsAppNotificationSettings.upsert({
    where: { companyId },
    update: { defaultSessionId: sessionId },
    create: { id: require('crypto').randomUUID(), companyId, defaultSessionId: sessionId }
  })).catch(err => {
    console.warn('⚠️ [SESSION-BALANCER] Could not auto-heal defaultSessionId:', err?.message);
  });
}

async function getOrAssignSession({ companyId, customerId, recipientPhone, connectedSessions, settings }) {
  const prisma = getSharedPrismaClient();
  const rawLiveBaileys = Array.isArray(connectedSessions) ? connectedSessions : [];

  // تصفية جلسات Baileys الحية حسب سياسة الإشعارات/الإرسال (مع إثراء metadata من DB إن أمكن)
  let liveBaileys = rawLiveBaileys;
  if (rawLiveBaileys.length > 0) {
    let metaById = null;
    const needsDbMeta = rawLiveBaileys.some((s) => s.metadata === undefined || s.metadata === null);
    if (needsDbMeta && typeof prisma.whatsAppSession?.findMany === 'function') {
      try {
        const dbRows = await safeQuery(() => prisma.whatsAppSession.findMany({
          where: { id: { in: rawLiveBaileys.map((s) => s.sessionId) } },
          select: { id: true, metadata: true }
        }));
        if (Array.isArray(dbRows)) {
          metaById = new Map(dbRows.map((row) => [row.id, row.metadata]));
        }
      } catch {}
    }

    liveBaileys = rawLiveBaileys.filter((s) => {
      const merged = metaById && metaById.has(s.sessionId)
        ? { ...s, metadata: metaById.get(s.sessionId) }
        : s;
      return isSessionNotificationEligible(merged);
    });
  }

  // 0. احترام القناة الأساسية المحددة صراحةً في إعدادات الإشعارات (defaultSessionId)
  // بشرط ألا تكون الإشعارات أو الإرسال موقوفة عليها.
  if (settings?.defaultSessionId) {
    const inLiveBaileys = liveBaileys.some((s) => s.sessionId === settings.defaultSessionId);
    if (inLiveBaileys) {
      return settings.defaultSessionId;
    }

    const explicitDefault = await safeQuery(() => prisma.whatsAppSession.findFirst({
      where: {
        id: settings.defaultSessionId,
        ...(companyId ? { companyId } : {})
      },
      select: { id: true, provider: true, status: true, metadata: true }
    }));

    if (explicitDefault && !isSessionNotificationEligible(explicitDefault)) {
      console.warn(`🔇 [SESSION-BALANCER] Explicit defaultSessionId=${settings.defaultSessionId} has notifications/outbound disabled; skipping.`);
    } else {
      if (explicitDefault?.provider === 'META_CLOUD' && explicitDefault.status === 'CONNECTED') {
        return explicitDefault.id;
      }

      if (explicitDefault && explicitDefault.provider !== 'META_CLOUD') {
        const mem = WhatsAppManager.getSession(explicitDefault.id);
        if (mem && mem.status === 'connected') {
          return explicitDefault.id;
        }
      }

      if (liveBaileys.length === 0 && (!explicitDefault || isSessionNotificationEligible(explicitDefault))) {
        return settings.defaultSessionId;
      }

      console.warn(`⚠️ [SESSION-BALANCER] Explicit defaultSessionId=${settings.defaultSessionId} is not connected; falling back to available connected sessions.`);
    }
  }

  if (liveBaileys.length === 0) {
    const defaultSession = await safeQuery(() => prisma.whatsAppSession.findFirst({
      where: { companyId, isDefault: true },
      select: { id: true, metadata: true }
    }));
    if (defaultSession?.id && isSessionNotificationEligible(defaultSession)) {
      autoHealDefaultSession(companyId, defaultSession.id);
      return defaultSession.id;
    }

    if (typeof prisma.whatsAppSession?.findMany === 'function') {
      const connectedCandidates = await safeQuery(() => prisma.whatsAppSession.findMany({
        where: { companyId, status: 'CONNECTED' },
        orderBy: [{ lastConnectedAt: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, metadata: true }
      }));
      const eligibleConnected = (connectedCandidates || []).find(isSessionNotificationEligible);
      if (eligibleConnected?.id) {
        autoHealDefaultSession(companyId, eligibleConnected.id);
        return eligibleConnected.id;
      }

      const anyCandidates = await safeQuery(() => prisma.whatsAppSession.findMany({
        where: { companyId },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
        select: { id: true, metadata: true }
      }));
      const eligibleAny = (anyCandidates || []).find(isSessionNotificationEligible);
      if (eligibleAny?.id) {
        autoHealDefaultSession(companyId, eligibleAny.id);
        return eligibleAny.id;
      }
      return null;
    }

    const singleConnected = await safeQuery(() => prisma.whatsAppSession.findFirst({
      where: { companyId, status: 'CONNECTED' },
      orderBy: [{ lastConnectedAt: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, metadata: true }
    }));
    if (singleConnected?.id && isSessionNotificationEligible(singleConnected)) {
      autoHealDefaultSession(companyId, singleConnected.id);
      return singleConnected.id;
    }

    const anySession = await safeQuery(() => prisma.whatsAppSession.findFirst({
      where: { companyId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      select: { id: true, metadata: true }
    }));
    if (anySession?.id && isSessionNotificationEligible(anySession)) {
      autoHealDefaultSession(companyId, anySession.id);
      return anySession.id;
    }
    return null;
  }

  // 1. البحث عن جلسة مثبتة (Sticky Session Affinity) — فقط من الجلسات المؤهلة للإشعارات
  if (settings?.stickySessionEnabled !== false) {
    const connectedSessionIds = liveBaileys.map(s => s.sessionId);

    try {
      let existingSessionId = null;

      if (customerId) {
        const contact = await safeQuery(() => prisma.whatsAppContact.findFirst({
          where: {
            customerId,
            sessionId: { in: connectedSessionIds }
          },
          orderBy: { lastMessageAt: 'desc' },
          select: { sessionId: true }
        }));
        if (contact) existingSessionId = contact.sessionId;
      }

      if (!existingSessionId && recipientPhone) {
        const formattedPhone = formatPhoneNumber(recipientPhone);
        const contact = await safeQuery(() => prisma.whatsAppContact.findFirst({
          where: {
            phoneNumber: formattedPhone,
            sessionId: { in: connectedSessionIds }
          },
          orderBy: { lastMessageAt: 'desc' },
          select: { sessionId: true }
        }));
        if (contact) existingSessionId = contact.sessionId;
      }

      if (existingSessionId) {
        console.log(`🔗 [WHATSAPP-AFFINITY] Sticky session matched: ${existingSessionId}`);
        return existingSessionId;
      }
    } catch (err) {
      console.error('❌ [WHATSAPP-AFFINITY] Error checking affinity:', err);
    }
  } else {
    console.log(`⚖️ [WHATSAPP-LB] Sticky sessions disabled, forcing load balancing for every message.`);
  }

  // 2. التوزيع الموزون (Weighted Round Robin) على الجلسات المؤهلة فقط
  if (liveBaileys.length > 1) {
    let weightedPool = [];
    liveBaileys.forEach(s => {
      const weight = s.loadBalanceWeight || (s.isDefault ? 3 : 1);
      for (let i = 0; i < weight; i++) {
        weightedPool.push(s.sessionId);
      }
    });

    let lastIndex = sessionRotation.get(companyId) || 0;
    let nextIndex = (lastIndex + 1) % weightedPool.length;
    setSessionRotation(companyId, nextIndex);

    const pickedId = weightedPool[nextIndex];
    console.log(`⚖️ [LOAD-BALANCER] New assignment via Weighted Round-Robin (Weight Strategy): ${pickedId} (Step ${nextIndex + 1}/${weightedPool.length})`);
    return pickedId;
  }

  // إذا كان هناك رقم واحد فقط متصل ومؤهل
  const singleSessionId = liveBaileys[0].sessionId;
  if (!settings?.defaultSessionId) {
    autoHealDefaultSession(companyId, singleSessionId);
  }
  return singleSessionId;
}

/**
 * ┘è┘à┘è┘æ╪▓ ╪ú╪«╪╖╪º╪í ┘à┘è╪¬╪º ╪º┘ä┘à╪¬╪╣┘ä┘é╪⌐ ╪¿┘å╪º┘ü╪░╪⌐ 24 ╪│╪º╪╣╪⌐ / ╪º┘ä┘é╪º┘ä╪¿ ╪╣┘å ╪º┘ä╪ú╪«╪╖╪º╪í ╪º┘ä╪¬╪º┘å┘è╪⌐
 * (┘ü┘é╪╖ ┘ç╪░┘ç ╪º┘ä╪ú╪«╪╖╪º╪í ╪¬╪│╪¬╪¡┘é fallback ┘ä┘Ç Baileys).
 *
 * @param {{code?: string, message?: string}} metaError
 * @returns {boolean}
 */
function isMetaWindowError(metaError) {
  if (!metaError) return false;
  const code = metaError.code;
  const message = metaError.message || '';
  return (
    code === 'RECIPIENT_CANNOT_SEND' ||
    code === 'TEMPLATE_NOT_APPROVED' ||
    code === 'META_TEMPLATE_NOT_FOUND' ||
    code === 131047 ||
    code === '131047' ||
    code === 131026 ||
    code === '131026' ||
    /24\s*hour|outside.*window|template.*window/i.test(message)
  );
}

/**
 * ┘è╪¿╪¡╪½ ╪╣┘å Baileys session ┘à╪¬╪╡┘ä╪⌐ ┘ü┘è ╪º┘ä╪┤╪▒┘â╪⌐ (┘à╪│╪¬╪½┘å┘è╪⌐ session ╪º┘ä┘à┘è╪¬╪º ╪º┘ä┘ü╪º╪┤┘ä╪⌐)
 * ΓÇö ┘è╪│╪¬╪«╪»┘à┘ç╪º sendNotification ┘â┘Ç fallback ┘ä┘à╪º ┘à┘è╪¬╪º ╪¬╪▒┘ü╪╢ ╪º┘ä╪Ñ╪▒╪│╪º┘ä ╪«╪º╪▒╪¼ ┘å╪º┘ü╪░╪⌐ 24 ╪│╪º╪╣╪⌐.
 *
 * @param {string} companyId - ╪º┘ä╪┤╪▒┘â╪⌐
 * @param {string} excludeSessionId - ╪º┘ä╪¼┘ä╪│╪⌐ ╪º┘ä┘à╪│╪¬╪½┘å╪º╪⌐ (╪º┘ä┘à┘è╪¬╪º ╪º┘ä┘ü╪º╪┤┘ä╪⌐)
 * @returns {Promise<{sessionId: string, name: string, phoneNumber: string}|null>}
 */
async function findAlternativeBaileysSession(companyId, excludeSessionId) {
  const prisma = getSharedPrismaClient();
  const candidates = await safeQuery(() => prisma.whatsAppSession.findMany({
    where: {
      companyId,
      provider: 'BAILEYS',
      status: 'CONNECTED',
      id: { not: excludeSessionId },
    },
    select: { id: true, name: true, phoneNumber: true, metadata: true },
  }));

  if (!candidates || candidates.length === 0) return null;

  for (const c of candidates) {
    if (!isSessionNotificationEligible(c)) continue;
    const live = WhatsAppManager.getSession(c.id);
    if (live && live.status === 'connected') {
      return { sessionId: c.id, name: c.name, phoneNumber: c.phoneNumber };
    }
  }
  return null;
}

async function ensureRuntimeSessionConnected(sessionId, companyId) {
  let pendingInitialization = sessionInitializationInFlight.get(sessionId);

  if (!pendingInitialization) {
    pendingInitialization = (async () => {
      let session = WhatsAppManager.getSession(sessionId);
      if (session && session.status === 'connected') {
        return session;
      }

      const dbSession = await safeQuery(() => getSharedPrismaClient().whatsAppSession.findUnique({
        where: { id: sessionId },
        select: { status: true, authState: true }
      }));

      if (!dbSession || dbSession.status !== 'CONNECTED' || !dbSession.authState) {
        return session;
      }

      console.log(`≡ƒöä [WHATSAPP-JIT] Session ${sessionId} is CONNECTED in DB but null in memory. Initializing...`);

      try {
        await WhatsAppManager.createSession(sessionId, companyId);

        let waitTime = 0;
        while (waitTime < 5000) {
          session = WhatsAppManager.getSession(sessionId);
          if (session && session.status === 'connected') {
            console.log(`Γ£à [WHATSAPP-JIT] Session ${sessionId} initialized and connected successfully via JIT`);
            return session;
          }

          await new Promise((resolve) => setTimeout(resolve, 1000));
          waitTime += 1000;
        }
      } catch (err) {
        console.error(`Γ¥î [WHATSAPP-JIT] Failed to initialize session ${sessionId}:`, err.message);
      }

      return WhatsAppManager.getSession(sessionId);
    })().finally(() => {
      sessionInitializationInFlight.delete(sessionId);
    });

    sessionInitializationInFlight.set(sessionId, pendingInitialization);
  } else {
    console.log(`ΓÅ│ [WHATSAPP-JIT] Awaiting in-flight initialization for session ${sessionId}`);
  }

  return pendingInitialization;
}

module.exports = { getOrAssignSession, ensureRuntimeSessionConnected, findAlternativeBaileysSession, isMetaWindowError };
