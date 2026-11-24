const { getSharedPrismaClient } = require('../services/sharedDatabase');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const listGroupAlerts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationGroupAlertsService');
    const alerts = await service.listAlerts(getSharedPrismaClient(), companyId, {
      status: req.query.status,
      limit: req.query.limit,
    });
    res.json({ success: true, data: alerts });
  } catch (error) {
    console.error('Error listing group alerts:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تنبيهات المجموعات' });
  }
};

const syncGroupAlerts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationGroupAlertsService');
    const summary = await service.syncAlerts(getSharedPrismaClient(), companyId, {
      months: req.body?.months,
    });
    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error syncing group alerts:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث تنبيهات المجموعات' });
  }
};

const resolveGroupAlert = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationGroupAlertsService');
    const updated = await service.resolveAlert(getSharedPrismaClient(), companyId, req.params.id, {
      status: req.body?.status || 'RESOLVED',
      resolvedBy: req.user?.name || req.user?.email || null,
    });
    if (!updated) return res.status(404).json({ success: false, error: 'التنبيه غير موجود' });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error resolving group alert:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث التنبيه' });
  }
};

module.exports = { listGroupAlerts, syncGroupAlerts, resolveGroupAlert };
