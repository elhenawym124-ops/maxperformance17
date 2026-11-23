const { getSharedPrismaClient } = require('../services/sharedDatabase');
const absenceService = require('../services/educationAbsenceService');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const listAbsenceAlerts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const students = await absenceService.findStreaks(getSharedPrismaClient(), companyId, {
      threshold: req.query.threshold,
      windowDays: req.query.days,
    });

    res.json({ success: true, data: students });
  } catch (error) {
    console.error('Error listing absence alerts:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تنبيهات الغياب' });
  }
};

const runAbsenceAlerts = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const summary = await absenceService.runAbsenceSweep(getSharedPrismaClient(), {
      companyId,
      threshold: req.body?.threshold,
      windowDays: req.body?.days,
    });

    res.json({ success: true, data: summary });
  } catch (error) {
    console.error('Error running absence alerts:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إرسال تنبيهات الغياب' });
  }
};

module.exports = { listAbsenceAlerts, runAbsenceAlerts };
