/**
 * 🧭 WhatsApp Unified Journey & Automation Service
 * طبقة التناغم الموحدة: تجمع مسارات ما بعد الاستلام، حالات الطلب، الليدز، السلة المتروكة،
 * الولاء والدورية، أعياد الميلاد، والمناسبات في خريطة حية واحدة مع فحص صحة قوالب ميتا.
 */
const { getSharedPrismaClient, safeQuery } = require('../sharedDatabase');
const retentionCadenceService = require('../hr/retentionCadenceService');
const WhatsAppNotificationService = require('./WhatsAppNotificationService');

const META_APPROVED_STATUS = 'APPROVED';

function safeJsonParse(raw, fallback) {
  if (!raw) return fallback;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function resolveTemplateHealth(tpl) {
  if (!tpl) return 'UNBOUND';
  const status = String(tpl.metaTemplateStatus || '').toUpperCase();
  if (tpl.metaTemplateName && status === META_APPROVED_STATUS) return 'APPROVED';
  if (status === 'REJECTED') return 'REJECTED';
  if (status === 'PENDING' || status === 'PENDING_DELETION') return status;
  return tpl.metaTemplateName ? status || 'UNKNOWN' : 'UNBOUND';
}

function summarizeLogs(logs) {
  const byEvent = new Map();
  const totals = { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 };

  for (const log of logs) {
    const key = String(log.rawEventType || log.eventType || 'UNKNOWN').toUpperCase();
    if (!byEvent.has(key)) {
      byEvent.set(key, { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 });
    }
    const bucket = byEvent.get(key);
    const st = String(log.status || '').toUpperCase();
    if (st === 'FAILED') {
      bucket.failed++;
      totals.failed++;
    } else {
      bucket.sent++;
      totals.sent++;
      if (st === 'DELIVERED' || st === 'READ') {
        bucket.delivered++;
        totals.delivered++;
      }
      if (st === 'READ') {
        bucket.read++;
        totals.read++;
      }
    }
    if (log.responded) {
      bucket.responded++;
      totals.responded++;
    }
  }
  return { totals, byEvent };
}

class WhatsAppUnifiedJourneyService {
  get prisma() {
    return getSharedPrismaClient();
  }

  async getUnifiedOverview(companyId) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      flows,
      templates,
      notifSettings,
      leadFollowUp,
      company,
      occasions,
      sessions,
      recentLogs,
      journeyCounts,
    ] = await Promise.all([
      safeQuery(() =>
        this.prisma.whatsAppFollowUpFlow.findMany({
          where: { companyId },
          include: {
            steps: { orderBy: { stepOrder: 'asc' } },
            categories: { select: { id: true, name: true, color: true } },
            _count: { select: { steps: true, journeys: true, categories: true } },
          },
          orderBy: { createdAt: 'desc' },
        }),
      ),
      safeQuery(() =>
        this.prisma.whatsAppNotificationTemplate.findMany({
          where: { companyId, isActive: true },
          select: {
            id: true,
            name: true,
            category: true,
            eventType: true,
            content: true,
            hasButtons: true,
            buttons: true,
            metaTemplateName: true,
            metaTemplateStatus: true,
            metaTemplateLanguage: true,
            sentCount: true,
            updatedAt: true,
          },
          orderBy: { updatedAt: 'desc' },
        }),
      ),
      safeQuery(() =>
        this.prisma.whatsAppNotificationSettings.findUnique({ where: { companyId } }),
      ),
      safeQuery(() =>
        this.prisma.leadFollowUpSettings.findUnique({ where: { companyId } }),
      ),
      safeQuery(() =>
        this.prisma.company.findUnique({
          where: { id: companyId },
          select: { loyaltySettings: true, settings: true },
        }),
      ),
      safeQuery(() =>
        this.prisma.occasion.findMany({
          where: { companyId },
          orderBy: { scheduledAt: 'asc' },
          select: {
            id: true,
            name: true,
            status: true,
            templateId: true,
            scheduledAt: true,
            nextRunAt: true,
            recurrence: true,
            totalSent: true,
            lastSentCount: true,
          },
        }),
      ),
      safeQuery(() =>
        this.prisma.whatsAppSession.findMany({
          where: { companyId, status: 'CONNECTED' },
          select: { id: true, name: true, provider: true, phoneNumber: true },
        }),
      ),
      safeQuery(() =>
        this.prisma.whatsAppNotificationLog.findMany({
          where: { companyId, createdAt: { gte: weekAgo } },
          select: { eventType: true, rawEventType: true, status: true, responded: true },
        }),
      ),
      safeQuery(() =>
        this.prisma.customerJourney.groupBy({
          by: ['status'],
          where: { companyId },
          _count: { id: true },
        }),
      ),
    ]);

    const templateById = new Map();
    const templateByEvent = new Map();
    for (const tpl of templates || []) {
      templateById.set(tpl.id, tpl);
      const prev = templateByEvent.get(tpl.eventType);
      if (!prev || resolveTemplateHealth(tpl) === 'APPROVED') {
        templateByEvent.set(tpl.eventType, tpl);
      }
    }

    const { totals: telemetry7d, byEvent } = summarizeLogs(recentLogs || []);
    const cadenceConfig = retentionCadenceService.normalizeConfig(
      safeJsonParse(company?.loyaltySettings, {}).cadence || {},
    );
    const companySettingsJson = safeJsonParse(company?.settings, {});
    const birthdayData = companySettingsJson.whatsappBirthdayAutomation || {
      isEnabled: false,
      dailySendTime: '12:00',
      metaTemplateName: 'birthday_greeting_v1',
    };

    const hasMetaSession = (sessions || []).some((s) => s.provider === 'META_CLOUD');
    const postDeliveryTpl = templateByEvent.get('POST_DELIVERY_FOLLOWUP') || null;

    const enrichedFlows = (flows || []).map((flow) => ({
      ...flow,
      channels: safeJsonParse(flow.channels, ['WHATSAPP']),
      steps: (flow.steps || []).map((step) => {
        const boundTpl =
          (step.templateId && templateById.get(step.templateId)) ||
          (step.eventType && templateByEvent.get(step.eventType)) ||
          postDeliveryTpl;
        return {
          ...step,
          replyKeywords: safeJsonParse(step.replyKeywords, null),
          buttons: safeJsonParse(step.buttons, null),
          boundTemplate: boundTpl
            ? {
                id: boundTpl.id,
                name: boundTpl.name,
                eventType: boundTpl.eventType,
                metaTemplateName: boundTpl.metaTemplateName,
                metaTemplateStatus: boundTpl.metaTemplateStatus,
                health: resolveTemplateHealth(boundTpl),
                hasButtons: Boolean(boundTpl.hasButtons),
                buttons: safeJsonParse(boundTpl.buttons, []),
              }
            : null,
        };
      }),
    }));

    const scheduledOccasions = (occasions || []).filter((o) => o.status === 'scheduled');
    const unboundScheduledOccasions = scheduledOccasions.filter((o) => !o.templateId);

    const orderEvents = ['ORDER_CREATED', 'ORDER_CONFIRMED', 'ORDER_PROCESSING', 'ORDER_SHIPPED', 'ORDER_DELIVERED', 'ORDER_CANCELLED'];
    const orderTemplates = orderEvents.map((ev) => {
      const tpl = templateByEvent.get(ev);
      const stats = byEvent.get(ev) || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 };
      return {
        eventType: ev,
        templateId: tpl?.id || null,
        name: tpl?.name || ev,
        metaTemplateName: tpl?.metaTemplateName || null,
        health: resolveTemplateHealth(tpl),
        hasButtons: Boolean(tpl?.hasButtons),
        stats,
      };
    });

    const loyaltyEvents = [
      'LOYALTY_POINTS_AWARDED',
      'LOYALTY_POINTS_EXPIRY_WARNING',
      'LOYALTY_POINTS_EXPIRED',
      'LOYALTY_TIER_UPGRADED',
      'CASHBACK_CREDITED',
      'AUTO_DISCOUNT_COUPON_GRANTED',
      'AUTO_DISCOUNT_COUPON_EXPIRING',
      'AUTO_DISCOUNT_CASHBACK_CONVERTED',
    ];
    const loyaltyTemplates = loyaltyEvents.map((ev) => {
      const tpl = templateByEvent.get(ev);
      const stats = byEvent.get(ev) || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 };
      return {
        eventType: ev,
        templateId: tpl?.id || null,
        name: tpl?.name || ev,
        metaTemplateName: tpl?.metaTemplateName || null,
        health: resolveTemplateHealth(tpl),
        stats,
      };
    });

    const engines = [
      {
        key: 'lead_followup',
        stage: 'pre_purchase',
        title: 'متابعة العملاء المحتملين (Leads)',
        description: 'رسائل الترحيب والتأهيل التلقائي لعملاء الشات الجدد داخل نافذة 24 ساعة.',
        isEnabled: Boolean(leadFollowUp?.isEnabled),
        windowPolicy: 'INSIDE_24H',
        templateHealth: leadFollowUp?.templateName ? 'APPROVED' : 'INSIDE_24H',
        metaTemplateName: leadFollowUp?.templateName || null,
        canToggle: true,
        manageHref: '/whatsapp/lead-followup',
        stats: byEvent.get('LEAD_FOLLOW_UP') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'abandoned_cart',
        stage: 'pre_purchase',
        title: 'استرداد السلات المتروكة',
        description: 'تذكير تلقائي بعد ساعة / 24 ساعة / 72 ساعة لإتمام الشراء.',
        isEnabled: Boolean(notifSettings?.abandonedCartEnabled),
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: resolveTemplateHealth(templateByEvent.get('CART_ABANDONED_1H')),
        metaTemplateName: templateByEvent.get('CART_ABANDONED_1H')?.metaTemplateName || null,
        canToggle: true,
        manageHref: '/orders/status-templates',
        stats: byEvent.get('CART_ABANDONED_1H') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'order_lifecycle',
        stage: 'order_lifecycle',
        title: 'إشعارات حالات الطلبات',
        description: 'تأكيد الطلب، التجهيز، الشحن، والتسليم عبر قوالب /orders/status-templates.',
        isEnabled: notifSettings?.orderNotificationsEnabled !== false,
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: orderTemplates.some((t) => t.health === 'APPROVED') ? 'APPROVED' : 'UNBOUND',
        metaTemplateName: null,
        canToggle: true,
        manageHref: '/orders/status-templates',
        items: orderTemplates,
        stats: orderTemplates.reduce(
          (acc, t) => ({
            sent: acc.sent + t.stats.sent,
            delivered: acc.delivered + t.stats.delivered,
            read: acc.read + t.stats.read,
            failed: acc.failed + t.stats.failed,
            responded: acc.responded + t.stats.responded,
          }),
          { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
        ),
      },
      {
        key: 'post_delivery_flows',
        stage: 'post_delivery',
        title: 'رحلة ما بعد الاستلام',
        description: 'متابعة تجربة المنتج، التقييم، كوبون العودة، والكاش باك بعد تسليم الطلب.',
        isEnabled: enrichedFlows.some((f) => f.isEnabled),
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: enrichedFlows.some((f) =>
          (f.steps || []).some((s) => s.boundTemplate?.health === 'APPROVED'),
        )
          ? 'APPROVED'
          : 'UNBOUND',
        canToggle: false,
        flowsCount: enrichedFlows.length,
        activeEnrollments:
          (journeyCounts || []).find((c) => c.status === 'ACTIVE')?._count?.id || 0,
        stats: { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'retention_cadence',
        stage: 'loyalty_retention',
        title: 'الرسائل الدورية للاحتفاظ (Cadence)',
        description: 'منتج جديد، رصيد النقاط، إحالة، ومستوى العضوية — بسقف أسبوعي موحد (3/أسبوع).',
        isEnabled: Boolean(cadenceConfig.enabled),
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: resolveTemplateHealth(templateByEvent.get('PROMOTIONAL')),
        metaTemplateName: templateByEvent.get('PROMOTIONAL')?.metaTemplateName || null,
        canToggle: true,
        types: cadenceConfig.types,
        stats: byEvent.get('PROMOTIONAL') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'loyalty_notifications',
        stage: 'loyalty_retention',
        title: 'إشعارات النقاط والكاش باك',
        description: 'إشعار كسب النقاط، تحذير الانتهاء، والكاش باك عبر البوابة الموحدة.',
        isEnabled: true,
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: resolveTemplateHealth(templateByEvent.get('LOYALTY_POINTS_EXPIRY_WARNING')),
        canToggle: false,
        items: loyaltyTemplates,
        stats: loyaltyTemplates.reduce(
          (acc, t) => ({
            sent: acc.sent + t.stats.sent,
            delivered: acc.delivered + t.stats.delivered,
            read: acc.read + t.stats.read,
            failed: acc.failed + t.stats.failed,
            responded: acc.responded + t.stats.responded,
          }),
          { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
        ),
      },
      {
        key: 'birthday_automation',
        stage: 'occasions_campaigns',
        title: 'تهنئة أعياد الميلاد التلقائية',
        description: `إرسال تلقائي يومي الساعة ${birthdayData.dailySendTime || '12:00'} بكود خصم خاص.`,
        isEnabled: Boolean(birthdayData.isEnabled),
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: resolveTemplateHealth(templateByEvent.get('BIRTHDAY_WISH')),
        metaTemplateName: birthdayData.metaTemplateName || null,
        canToggle: true,
        stats: byEvent.get('BIRTHDAY_WISH') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'occasions_campaigns',
        stage: 'occasions_campaigns',
        title: 'حملات المناسبات المجدولة',
        description: `${scheduledOccasions.length} مناسبة مجدولة${unboundScheduledOccasions.length > 0 ? ` (${unboundScheduledOccasions.length} بدون قالب مربوط)` : ''}.`,
        isEnabled: scheduledOccasions.length > 0,
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth:
          unboundScheduledOccasions.length > 0
            ? 'UNBOUND'
            : scheduledOccasions.length > 0
              ? 'APPROVED'
              : 'UNBOUND',
        canToggle: scheduledOccasions.length > 0,
        scheduledCount: scheduledOccasions.length,
        unboundCount: unboundScheduledOccasions.length,
        occasions: occasions || [],
        stats: byEvent.get('OCCASION_CAMPAIGN') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
      {
        key: 'product_auto_send',
        stage: 'occasions_campaigns',
        title: 'تنبيهات المنتجات الجديدة والخصومات',
        description: 'إشعار تلقائي للعملاء عند طرح منتج جديد أو عودة المخزون.',
        isEnabled: Boolean(notifSettings?.newProductAutoSend),
        windowPolicy: 'OUTSIDE_24H_HSM',
        templateHealth: resolveTemplateHealth(templateByEvent.get('NEW_PRODUCT')),
        metaTemplateName: templateByEvent.get('NEW_PRODUCT')?.metaTemplateName || null,
        canToggle: true,
        stats: byEvent.get('NEW_PRODUCT') || { sent: 0, delivered: 0, read: 0, failed: 0, responded: 0 },
      },
    ];

    const templateHealthSummary = {
      total: (templates || []).length,
      approved: (templates || []).filter((t) => resolveTemplateHealth(t) === 'APPROVED').length,
      rejected: (templates || []).filter((t) => resolveTemplateHealth(t) === 'REJECTED').length,
      unbound: (templates || []).filter((t) => resolveTemplateHealth(t) === 'UNBOUND').length,
    };

    const selectableTemplates = (templates || []).map((t) => ({
      id: t.id,
      name: t.name,
      category: t.category,
      eventType: t.eventType,
      content: t.content,
      metaTemplateName: t.metaTemplateName,
      metaTemplateStatus: t.metaTemplateStatus,
      health: resolveTemplateHealth(t),
      hasButtons: Boolean(t.hasButtons),
      buttons: safeJsonParse(t.buttons, []),
    }));

    return {
      hasMetaSession,
      connectedSessionsCount: (sessions || []).length,
      guardrails: {
        weeklyFrequencyCap: 3,
        deliveryWindowHours: 48,
        pauseOnUnreadInbox: true,
        respectBotUnsubscribe: true,
        blockUnboundOccasions: true,
      },
      journeyStatusSummary: (journeyCounts || []).reduce((acc, row) => {
        acc[row.status] = row._count?.id || 0;
        return acc;
      }, {}),
      telemetry7d,
      templateHealthSummary,
      engines,
      flows: enrichedFlows,
      occasions: occasions || [],
      selectableTemplates,
    };
  }

  async toggleEngine(companyId, engineKey, enabled) {
    const next = Boolean(enabled);
    switch (engineKey) {
      case 'abandoned_cart':
        await this.prisma.whatsAppNotificationSettings.upsert({
          where: { companyId },
          create: { companyId, abandonedCartEnabled: next },
          update: { abandonedCartEnabled: next },
        });
        return { engineKey, isEnabled: next };

      case 'order_lifecycle':
        await this.prisma.whatsAppNotificationSettings.upsert({
          where: { companyId },
          create: { companyId, orderNotificationsEnabled: next },
          update: { orderNotificationsEnabled: next },
        });
        return { engineKey, isEnabled: next };

      case 'product_auto_send':
        await this.prisma.whatsAppNotificationSettings.upsert({
          where: { companyId },
          create: { companyId, newProductAutoSend: next, productNotificationsEnabled: next },
          update: { newProductAutoSend: next, productNotificationsEnabled: next },
        });
        return { engineKey, isEnabled: next };

      case 'lead_followup':
        await this.prisma.leadFollowUpSettings.upsert({
          where: { companyId },
          create: { companyId, isEnabled: next, message: 'مرحباً بك! كيف يمكننا مساعدتك؟' },
          update: { isEnabled: next },
        });
        return { engineKey, isEnabled: next };

      case 'retention_cadence':
        await retentionCadenceService.updateConfig(companyId, { enabled: next });
        return { engineKey, isEnabled: next };

      case 'birthday_automation': {
        const comp = await this.prisma.company.findUnique({
          where: { id: companyId },
          select: { settings: true },
        });
        const parsedSettings = safeJsonParse(comp?.settings, {});
        const current = parsedSettings.whatsappBirthdayAutomation || {};
        const merged = { ...current, isEnabled: next, updatedAt: new Date().toISOString() };
        parsedSettings.whatsappBirthdayAutomation = merged;
        await this.prisma.company.update({
          where: { id: companyId },
          data: { settings: JSON.stringify(parsedSettings) },
        });
        return { engineKey, isEnabled: next };
      }

      case 'occasions_campaigns':
        if (!next) {
          await this.prisma.occasion.updateMany({
            where: { companyId, status: 'scheduled' },
            data: { status: 'draft', nextRunAt: null },
          });
        }
        return { engineKey, isEnabled: next };

      default:
        throw new Error(`Unsupported engine key: ${engineKey}`);
    }
  }

  async sendTestMessage(companyId, { recipientPhone, templateId, eventType, content }) {
    if (!recipientPhone) {
      return { success: false, message: 'رقم الهاتف مطلوب للتجربة' };
    }
    let boundTemplate = null;
    if (templateId) {
      boundTemplate = await this.prisma.whatsAppNotificationTemplate.findFirst({
        where: { id: templateId, companyId },
      });
    }
    const resolvedEvent = boundTemplate?.eventType || eventType || 'POST_DELIVERY_FOLLOWUP';
    const result = await WhatsAppNotificationService.sendNotification({
      companyId,
      deliveryStrategy: 'platform-fallback',
      recipientPhone,
      recipientName: 'اختبار النظام',
      recipientType: 'CUSTOMER',
      category: boundTemplate?.category || 'CUSTOMER',
      eventType: resolvedEvent,
      ...(boundTemplate ? { template: boundTemplate } : {}),
      ...(content ? { contentOverride: content } : {}),
      variables: {
        firstName: 'أحمد',
        lastName: 'محمد',
        customerName: 'أحمد محمد',
        orderNumber: 'ORD-TEST-01',
        totalPrice: '1250',
        discountPercent: '10',
        voucherAmount: '125.00',
        validityDays: '3',
        expiryDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
        pointsBalance: '250',
        cashbackBalance: '50.00',
        reason: 'اختبار رحلة العميل',
      },
      priority: 1,
    });
    return result;
  }
}

module.exports = new WhatsAppUnifiedJourneyService();
