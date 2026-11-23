const { getSharedPrismaClient } = require('./sharedDatabase');

/**
 * Universal Notification Service for MaxP Platform
 * Provides unified creation of notifications across modules (e.g. Orders, Academy, WhatsApp, System)
 */

/**
 * Resolve target recipient user IDs for a company
 * Ensures notifications are never orphaned with userId: null
 */
async function resolveCompanyRecipientUserIds(companyId, preferredUserId = null) {
  if (preferredUserId) return [preferredUserId];
  if (!companyId) return [];

  const db = getSharedPrismaClient();
  try {
    // 1. Primary: active company admins/owners/managers
    const managers = await db.user.findMany({
      where: {
        companyId,
        isActive: true,
        role: { in: ['OWNER', 'COMPANY_ADMIN', 'ADMIN', 'MANAGER'] },
      },
      select: { id: true },
      take: 5,
    });

    if (managers && managers.length > 0) {
      return managers.map((u) => u.id);
    }

    // 2. Fallback: any active user in the company
    const anyUser = await db.user.findFirst({
      where: {
        companyId,
        isActive: true,
      },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (anyUser) {
      return [anyUser.id];
    }
  } catch (err) {
    console.warn('[notificationService] Error resolving company users:', err.message);
  }

  return [];
}

/**
 * Check if a duplicate notification exists within windowMinutes
 */
async function isDuplicateNotification({ companyId, title, type, dedupeKey = null, windowMinutes = 5 }) {
  if (!companyId) return false;
  const db = getSharedPrismaClient();
  const since = new Date(Date.now() - windowMinutes * 60 * 1000);

  try {
    const existing = await db.notification.findFirst({
      where: {
        companyId,
        type,
        createdAt: { gte: since },
        ...(title ? { title } : {}),
      },
      select: { id: true, data: true },
    });

    if (!existing) return false;

    if (dedupeKey) {
      const dataStr = typeof existing.data === 'string' ? existing.data : JSON.stringify(existing.data || {});
      return dataStr.includes(dedupeKey);
    }

    return true;
  } catch (err) {
    console.warn('[notificationService] Dedupe check failed:', err.message);
    return false;
  }
}

/**
 * Create order notification for store managers/owners
 */
async function createOrderNotification({ companyId, order, source = 'storefront' }) {
  if (!companyId || !order) return null;
  const db = getSharedPrismaClient();

  const orderNumber = order.orderNumber || order.id;
  const isDupe = await isDuplicateNotification({
    companyId,
    type: 'order_created',
    dedupeKey: String(orderNumber),
    windowMinutes: 120, // 2 hours dedupe per order
  });

  if (isDupe) {
    console.log(`ℹ️ [notificationService] Duplicate order notification suppressed for #${orderNumber}`);
    return null;
  }

  const recipientUserIds = await resolveCompanyRecipientUserIds(companyId);
  const title = `طلب جديد #${orderNumber}`;
  const customerName = order.guestName || order.customerName || 'عميل';
  const total = order.total || order.finalTotal || 0;
  const message = `${customerName} • ${total} ج.م`;

  const metaData = {
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName,
    customerPhone: order.guestPhone || order.customerPhone || null,
    total,
    source,
    createdAt: order.createdAt || new Date(),
  };

  const createdNotifications = [];

  // If we have recipient users, create one record per recipient user
  if (recipientUserIds.length > 0) {
    for (const uId of recipientUserIds) {
      try {
        const notif = await db.notification.create({
          data: {
            companyId,
            userId: uId,
            type: 'order_created',
            title,
            message,
            data: metaData,
            isRead: false,
          },
        });
        createdNotifications.push(notif);

        try {
          const socketService = require('./socketService');
          if (socketService?.emitToUser) {
            socketService.emitToUser(uId, 'notification:new', notif);
          }
        } catch (_) {}
      } catch (err) {
        console.warn(`[notificationService] Error creating order notif for user ${uId}:`, err.message);
      }
    }
  } else {
    // Fallback only if no users exist for company
    try {
      const notif = await db.notification.create({
        data: {
          companyId,
          userId: null,
          type: 'order_created',
          title,
          message,
          data: metaData,
          isRead: false,
        },
      });
      createdNotifications.push(notif);
    } catch (err) {
      console.warn('[notificationService] Fallback order notif creation failed:', err.message);
    }
  }

  // Also emit to company room
  try {
    const socketService = require('./socketService');
    if (socketService?.getIO) {
      socketService.getIO().to(`company_${companyId}`).emit('notification:new', {
        id: createdNotifications[0]?.id || `ord_${Date.now()}`,
        companyId,
        type: 'order_created',
        title,
        message,
        data: metaData,
        isRead: false,
        createdAt: new Date(),
      });
    }
  } catch (_) {}

  return createdNotifications;
}

/**
 * Universal createNotification:
 * Ensures userId is resolved if null/omitted to prevent orphan notifications
 */
async function createNotification({
  companyId,
  title,
  body,
  message,
  type = 'SYSTEM',
  userId = null,
  recipientCustomerId = null,
  metadata = null,
  dedupeKey = null,
  windowMinutes = null,
}) {
  if (!companyId) return null;
  const db = getSharedPrismaClient();
  const notificationMessage = body || message || title;

  // Deduplication check if windowMinutes specified
  if (windowMinutes && windowMinutes > 0) {
    const isDupe = await isDuplicateNotification({
      companyId,
      title,
      type,
      dedupeKey,
      windowMinutes,
    });
    if (isDupe) {
      console.log(`ℹ️ [notificationService] Duplicate notification suppressed: "${title}"`);
      return null;
    }
  }

  // Resolve target userId if null to ensure no orphan notification
  let resolvedUserId = userId;
  if (!resolvedUserId) {
    const targetUsers = await resolveCompanyRecipientUserIds(companyId);
    if (targetUsers.length > 0) {
      resolvedUserId = targetUsers[0];
    }
  }

  try {
    const notification = await db.notification.create({
      data: {
        companyId,
        title,
        message: notificationMessage,
        type,
        data: metadata ? metadata : (recipientCustomerId ? { recipientCustomerId } : null),
        userId: resolvedUserId || null,
      },
    });

    try {
      const socketService = require('./socketService');
      if (resolvedUserId && socketService?.emitToUser) {
        socketService.emitToUser(resolvedUserId, 'notification:new', notification);
      }
      if (socketService?.getIO) {
        socketService.getIO().to(`company_${companyId}`).emit('notification:new', notification);
      }
    } catch (_) {}

    return notification;
  } catch (err) {
    console.warn('[notificationService] Failed to create notification:', err.message);
    return null;
  }
}

module.exports = {
  createNotification,
  createOrderNotification,
  resolveCompanyRecipientUserIds,
  isDuplicateNotification,
};
