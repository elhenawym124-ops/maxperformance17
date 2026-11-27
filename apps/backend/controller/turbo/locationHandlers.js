const TurboService = require('../../services/turboService');
const { getSharedPrismaClient, safeQuery } = require('../../services/sharedDatabase');

const getGovernments = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.headers['x-company-id'] || req.query.companyId;
    const prisma = getSharedPrismaClient();
    const company = await safeQuery(() => prisma.company.findUnique({ where: { id: companyId }, select: { turboApiKey: true, turboEnabled: true } }), 3);
    const turboService = new TurboService(company?.turboApiKey || null, companyId);
    const result = await turboService.getGovernments();
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [TURBO-CONTROLLER] Error getting governments:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get governments' });
  }
};

const getAreas = async (req, res) => {
  try {
    const { governmentId } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'Company ID is required' });
    if (!governmentId) return res.status(400).json({ success: false, error: 'Government ID is required' });
    const prisma = getSharedPrismaClient();
    const company = await safeQuery(() => prisma.company.findUnique({ where: { id: companyId }, select: { turboApiKey: true, turboEnabled: true } }), 3);
    if (!company?.turboEnabled || !company?.turboApiKey) return res.json({ success: true, data: { areas: [] } });
    const turboService = new TurboService(company.turboApiKey, companyId);
    const result = await turboService.getAreas(governmentId);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [TURBO-CONTROLLER] Error getting areas:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get areas' });
  }
};

const getBranches = async (req, res) => {
  try {
    const { city, governorate } = req.query;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'Company ID is required' });
    const prisma = getSharedPrismaClient();
    const company = await safeQuery(() => prisma.company.findUnique({ where: { id: companyId }, select: { turboApiKey: true, turboEnabled: true } }), 3);
    if (!company?.turboEnabled || !company?.turboApiKey) return res.status(400).json({ success: false, error: 'Turbo is not enabled or API key is not configured' });
    const turboService = new TurboService(company.turboApiKey, companyId);
    const result = await turboService.getBranches(city, governorate);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [TURBO-CONTROLLER] Error getting branches:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to get branches' });
  }
};

const searchAreaByText = async (req, res) => {
  try {
    const q = req.query.q || req.query.query;
    const limit = req.query.limit;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'Company ID is required' });
    if (!q || !String(q).trim()) return res.status(400).json({ success: false, error: 'Search query is required' });
    const prisma = getSharedPrismaClient();
    const company = await safeQuery(() => prisma.company.findUnique({ where: { id: companyId }, select: { turboApiKey: true, turboEnabled: true } }), 3);
    const turboService = new TurboService(company?.turboApiKey || null, companyId);
    const result = await turboService.searchAreaByText(q, { limit });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [TURBO-CONTROLLER] Error searching area:', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to search area' });
  }
};

const searchAreaByTextPublic = async (req, res) => {
  try {
    const q = req.query.q || req.query.query;
    const limit = req.query.limit;
    const companyId = req.query.companyId || req.headers?.['x-company-id'] || req.body?.companyId;
    if (!companyId) return res.status(400).json({ success: false, error: 'Company ID is required' });
    if (!q || !String(q).trim()) return res.status(400).json({ success: false, error: 'Search query is required' });
    const prisma = getSharedPrismaClient();
    const company = await safeQuery(() => prisma.company.findUnique({ where: { id: companyId }, select: { turboApiKey: true, turboEnabled: true } }), 3);
    const turboService = new TurboService(company?.turboApiKey || null, companyId);
    const result = await turboService.searchAreaByText(q, { limit });
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('❌ [TURBO-CONTROLLER] Error searching area (public):', error);
    res.status(500).json({ success: false, error: error.message || 'Failed to search area' });
  }
};

const resolveOrderArea = async (req, res) => {
  try {
    const { orderId } = req.params;
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'Company ID is required' });

    const prisma = getSharedPrismaClient();
    let order = await prisma.order.findFirst({
      where: {
        companyId,
        OR: [{ id: orderId }, { orderNumber: orderId }],
      },
    });
    if (!order) {
      const guest = await prisma.guestOrder.findFirst({
        where: {
          companyId,
          OR: [{ id: orderId }, { orderNumber: orderId }],
        },
      });
      if (guest) {
        order = { ...guest, tableType: 'GuestOrder' };
      }
    }
    if (!order) {
      return res.status(404).json({ success: false, error: 'الطلب غير موجود' });
    }

    const { resolveOrderAreaManually } = require('../../services/turbo/turboAiAreaResolver');
    const resolution = await resolveOrderAreaManually({ prisma, companyId, order });

    if (resolution?.skipped && resolution.reason === 'NO_TURBO_API_KEY') {
      return res.status(400).json({ success: false, error: 'مفتاح Turbo API غير مضاف لهذه الشركة' });
    }

    return res.json({
      success: true,
      resolved: Boolean(resolution?.resolved),
      data: {
        governorate: order.governorate || resolution?.governorate || null,
        area: order.city || resolution?.area || null,
        confidence: resolution?.confidence ?? 0,
        reason: resolution?.reason || null,
        needsDetails: !resolution?.resolved,
        message: resolution?.resolved
          ? `تم تحديد المنطقة (${resolution.governorate} - ${resolution.area}) بنجاح`
          : 'العنوان غير واضح أو يحتاج تفاصيل أكثر لتحديد منطقة تربو',
        metadata: order.metadata || null,
      },
    });
  } catch (error) {
    console.error('❌ [TURBO-RESOLVE-AREA] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'فشل تحديد المنطقة بالذكاء الاصطناعي' });
  }
};

const bulkResolveOrderAreas = async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'Company ID is required' });

    const orderIds = Array.isArray(req.body?.orderIds) ? req.body.orderIds.slice(0, 25) : [];
    if (orderIds.length === 0) {
      return res.status(400).json({ success: false, error: 'يرجى تحديد طلب واحد على الأقل' });
    }

    const prisma = getSharedPrismaClient();
    const { resolveOrderAreaManually } = require('../../services/turbo/turboAiAreaResolver');

    let resolved = 0;
    let needsDetails = 0;
    let skipped = 0;
    const results = [];

    for (const rawId of orderIds) {
      const targetId = String(rawId || '').trim();
      if (!targetId) continue;

      let order = await prisma.order.findFirst({
        where: { companyId, OR: [{ id: targetId }, { orderNumber: targetId }] },
      });
      if (!order) {
        const guest = await prisma.guestOrder.findFirst({
          where: { companyId, OR: [{ id: targetId }, { orderNumber: targetId }] },
        });
        if (guest) order = { ...guest, tableType: 'GuestOrder' };
      }
      if (!order) {
        skipped++;
        results.push({ orderId: targetId, status: 'not_found' });
        continue;
      }

      const resolution = await resolveOrderAreaManually({ prisma, companyId, order });
      if (resolution?.skipped) {
        skipped++;
        results.push({ orderId: order.orderNumber || targetId, status: 'skipped', reason: resolution.reason });
      } else if (resolution?.resolved) {
        resolved++;
        results.push({ orderId: order.orderNumber || targetId, status: 'resolved', governorate: resolution.governorate, area: resolution.area });
      } else {
        needsDetails++;
        results.push({ orderId: order.orderNumber || targetId, status: 'needs_details', reason: resolution?.reason });
      }
    }

    return res.json({
      success: true,
      data: { total: orderIds.length, resolved, needsDetails, skipped, results },
    });
  } catch (error) {
    console.error('❌ [TURBO-BULK-RESOLVE-AREA] Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'فشل تحديد المناطق بالذكاء الاصطناعي' });
  }
};

module.exports = { getGovernments, getAreas, getBranches, searchAreaByText, searchAreaByTextPublic, resolveOrderArea, bulkResolveOrderAreas };
