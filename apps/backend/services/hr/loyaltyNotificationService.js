/**
 * Loyalty Points Expiry WhatsApp Notification Service
 * ╪«╪»┘à╪⌐ ╪Ñ╪┤╪╣╪º╪▒╪º╪¬ ╪º┘å╪¬┘ç╪º╪í ╪╡┘ä╪º╪¡┘è╪⌐ ┘å┘é╪º╪╖ ╪º┘ä┘ê┘ä╪º╪í ╪╣╪¿╪▒ ┘ê╪º╪¬╪│╪º╪¿
 *
 * ┘à╪│╪ñ┘ê┘ä╪⌐ ╪╣┘å ╪Ñ╪▒╪│╪º┘ä ╪¬╪░┘â┘è╪▒╪º╪¬ ┘ê╪»┘æ┘è╪⌐ (╪╣╪▒╪¿┘è/╪Ñ┘å╪¼┘ä┘è╪▓┘è) ┘ä┘ä╪╣┘à┘ä╪º╪í ┘é╪¿┘ä ╪º┘å╪¬┘ç╪º╪í ╪╡┘ä╪º╪¡┘è╪⌐ ┘å┘é╪º╪╖┘ç┘à
 * (┘é╪¿┘ä 7 ╪ú┘è╪º┘à ┘ê┘é╪¿┘ä 48 ╪│╪º╪╣╪⌐) ╪¿╪º╪│╪¬╪«╪»╪º┘à Meta Cloud WhatsApp API.
 */

const { getSharedPrismaClient } = require('../sharedDatabase');
const WhatsAppNotificationService = require('../whatsapp/WhatsAppNotificationService');
const customerLoyaltyService = require('./customerLoyaltyService');

/**
 * إرسال رسالة تذكير انتهاء نقاط الولاء عبر البوابة الموحدة WhatsAppNotificationService
 * مع احترام BotUnsubscribe وقواعد قوالب Meta Cloud وكتابة سجل الإشعارات.
 */
async function sendWhatsAppMessage(companyId, phone, text, meta = {}) {
    if (!companyId || !phone || !text) {
        console.warn('⚠️ [Loyalty Notify] sendWhatsAppMessage skipped: missing companyId/phone/text');
        return { sent: false, error: 'missing companyId/phone/text' };
    }

    try {
        const prisma = getSharedPrismaClient();
        if (meta.customerId) {
            const unsub = await prisma.botUnsubscribe.findFirst({
                where: { companyId, customerId: meta.customerId, channel: 'WHATSAPP' },
                select: { id: true }
            }).catch(() => null);
            if (unsub) {
                return { sent: false, error: 'unsubscribed' };
            }
        }

        const result = await WhatsAppNotificationService.sendNotification({
            companyId,
            deliveryStrategy: 'platform-fallback',
            recipientPhone: phone,
            recipientName: meta.customerName || 'عميلنا العزيز',
            recipientType: 'CUSTOMER',
            category: 'MARKETING',
            eventType: 'LOYALTY_POINTS_EXPIRY_WARNING',
            contentOverride: text,
            variables: {
                customerName: meta.customerName || '',
                points: String(meta.expiringPoints ?? 0),
                daysLeft: String(meta.daysLeft ?? 0),
                storeLink: meta.deepLink || ''
            },
            customerId: meta.customerId || null,
            priority: 3
        });

        if (result?.success) {
            return { sent: true, messageId: result.messageId || result.logId || null };
        }
        return { sent: false, error: result?.reason || result?.message || 'send_failed' };
    } catch (error) {
        console.error(`❌ [Loyalty Notify] Failed to send WhatsApp to ${phone}:`, error?.message || error);
        return { sent: false, error: error?.message || String(error) };
    }
}

/**
 * ╪¿┘å╪º╪í ┘å╪╡ ╪¬╪░┘â┘è╪▒ ╪½┘å╪º╪ª┘è ╪º┘ä┘ä╪║╪⌐ (╪╣╪▒╪¿┘è/╪Ñ┘å╪¼┘ä┘è╪▓┘è) ╪¿╪º┘å╪¬┘ç╪º╪í ╪╡┘ä╪º╪¡┘è╪⌐ ╪º┘ä┘å┘é╪º╪╖.
 */
function buildExpiryReminderText({ customerName, expiringPoints, daysLeft, deepLink }) {
    const name = customerName && customerName.trim() ? customerName.trim() : '';
    const greeting = name ? `مرحباً ${name} / Hello ${name}` : 'مرحباً / Hello';
    const points = Number(expiringPoints) || 0;
    const link = deepLink || '';

    const ar = `لديك ${points} نقطة ستنتهي صلاحيتها خلال ${daysLeft} أيام. افتح المتجر عبر الرابط لتستخدم خصمك قبل الفوات: ${link}`;
    const en = `You have ${points} point(s) expiring in ${daysLeft} day(s). Open the store via the link to use your discount before it expires: ${link}`;

    return `${greeting}\n\n${ar}\n\n${en}`;
}

/**
 * ╪Ñ╪▒╪│╪º┘ä ╪¬╪░┘â┘è╪▒ ╪º┘å╪¬┘ç╪º╪í ╪╡┘ä╪º╪¡┘è╪⌐ ╪º┘ä┘å┘é╪º╪╖ ┘ä╪╣┘à┘è┘ä ┘ê╪º╪¡╪».
 *
 * @param {Object} params
 * @param {string} params.companyId
 * @param {string} params.phone
 * @param {string} [params.customerName]
 * @param {number} params.expiringPoints
 * @param {number} params.daysLeft     (7 ╪ú┘ê 2)
 * @param {string} [params.deepLink]   ╪▒╪º╪¿╪╖ ╪º┘ä┘à╪¬╪¼╪▒ ╪º┘ä┘à╪¡┘à┘æ┘ä ╪¿╪º┘ä╪«╪╡┘à
 * @returns {Promise<{sent:Boolean, error?:string}>}
 */
async function sendPointsExpiryReminder({ companyId, customerId = null, phone, customerName, expiringPoints, daysLeft, deepLink }) {
    const text = buildExpiryReminderText({ customerName, expiringPoints, daysLeft, deepLink });
    const result = await sendWhatsAppMessage(companyId, phone, text, {
        customerId,
        customerName,
        expiringPoints,
        daysLeft,
        deepLink
    });
    return result;
}

/**
 * ╪¼┘ä╪¿ ╪º┘ä╪╣┘à┘ä╪º╪í ╪º┘ä╪░┘è┘å ╪│╪¬┘å╪¬┘ç┘è ┘å┘é╪º╪╖┘ç┘à ╪«┘ä╪º┘ä `days` ┘è┘ê┘à╪º┘ï ┘ê╪Ñ╪▒╪│╪º┘ä ╪¬╪░┘â┘è╪▒ ┘ê╪º╪¬╪│╪º╪¿ ┘ä┘â┘ä ┘à┘å┘ç┘à.
 * ╪¬╪│╪¬╪»╪╣┘è ╪º┘ä╪»╪º┘ä╪⌐ ╪º┘ä┘à┘Å╪╢╪º┘ü╪⌐ ┘ü┘è customerLoyaltyService.getExpiringPoints (┘è╪╢┘è┘ü┘ç╪º ┘ê┘â┘è┘ä ╪ó╪«╪▒).
 *
 * @param {string|null} companyId  ┘à╪╣╪▒┘æ┘ü ╪º┘ä╪┤╪▒┘â╪⌐ ╪ú┘ê null ┘ä┘â┘ä ╪º┘ä╪┤╪▒┘â╪º╪¬
 * @param {number} days             ╪╣╪»╪» ╪º┘ä╪ú┘è╪º┘à ╪º┘ä┘à╪¬╪¿┘é┘è╪⌐ (7 ╪ú┘ê 2)
 * @returns {Promise<number>}       ╪╣╪»╪» ╪º┘ä╪▒╪│╪º╪ª┘ä ╪º┘ä╪¬┘è ╪¬┘à ╪Ñ╪▒╪│╪º┘ä┘ç╪º ╪¿┘å╪¼╪º╪¡
 */
async function notifyExpiringCustomers(companyId, days) {
    let customers = [];
    try {
        customers = await customerLoyaltyService.getExpiringPoints({ companyId, days });
    } catch (error) {
        console.error(`Γ¥î [Loyalty Notify] getExpiringPoints failed (company=${companyId}, days=${days}):`, error?.message || error);
        return 0;
    }

    // ╪»┘ü╪º╪╣┘è: ┘å╪¬╪╣╪º┘à┘ä ┘à╪╣ undefined/┘é┘ê╪º╪ª┘à ┘ü╪º╪▒╪║╪⌐ ╪¿╪ú┘à╪º┘å
    if (!Array.isArray(customers) || customers.length === 0) {
        return 0;
    }

    let sentCount = 0;
    for (const c of customers) {
        if (!c || !c.phone) continue;
        const res = await sendPointsExpiryReminder({
            companyId: c.companyId || companyId,
            customerId: c.customerId || c.id || null,
            phone: c.phone,
            customerName: c.customerName,
            expiringPoints: c.expiringPoints,
            daysLeft: days,
            deepLink: c.deepLink
        });
        if (res && res.sent) sentCount += 1;
    }

    return sentCount;
}

module.exports = {
    sendWhatsAppMessage,
    sendPointsExpiryReminder,
    notifyExpiringCustomers
};
