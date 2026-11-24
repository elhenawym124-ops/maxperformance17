const { getSharedPrismaClient } = require('../services/sharedDatabase');

const getCompanyId = (req) => req.user?.effectiveCompanyId || req.user?.companyId || null;

const getAttendanceReport = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const service = require('../services/educationAttendanceReportService');
    const data = await service.buildAttendanceReport(getSharedPrismaClient(), companyId, {
      months: req.query.months,
    });
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error building attendance report:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب تقرير الحضور' });
  }
};

module.exports = { getAttendanceReport };
