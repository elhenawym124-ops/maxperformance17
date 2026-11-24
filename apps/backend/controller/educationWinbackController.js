const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const listWinback = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationWinbackService');
    const actions = await service.listActions(getSharedPrismaClient(), companyId, {
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ success: true, data: actions });
  } catch (error) {
    console.error('Error listing winback actions:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب قائمة الاسترجاع' });
  }
};

const syncWinback = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationWinbackService');
    const prisma = getSharedPrismaClient();
    const candidates = await service.findCandidates(prisma, companyId, {
      months: req.body?.months,
      inactiveDays: req.body?.inactiveDays,
    });
    const result = await service.syncActions(prisma, companyId, candidates, {
      createdBy: req.user?.name || req.user?.email || null,
    });

    logEducationEvent({
      companyId,
      action: 'WINBACK_SYNC',
      entityType: 'PAYMENT',
      entityId: companyId,
      entityName: 'قائمة الاسترجاع',
      description: `تم تحديث قائمة الاسترجاع: ${result.created} حالة جديدة من ${result.detected} طالب معرّض`,
      details: result,
      severity: 'LOW',
      req,
    }).catch(() => {});

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error syncing winback actions:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث قائمة الاسترجاع' });
  }
};

const getWinbackPerformance = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationWinbackPerformanceService');
    const data = await service.buildWinbackPerformance(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building winback performance:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب أداء المتابعة' });
  }
};

const completeWinback = async (req, res) => {  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationWinbackService');
    const updated = await service.completeAction(getSharedPrismaClient(), companyId, req.params.id, {
      status: req.body?.status || 'DONE',
      handledBy: req.user?.name || req.user?.email || null,
      notes: req.body?.notes || null,
    });
    if (!updated) return res.status(404).json({ success: false, error: 'الحالة غير موجودة' });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error completing winback action:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث حالة الاسترجاع' });
  }
};

module.exports = { listWinback, syncWinback, completeWinback, getWinbackPerformance };
