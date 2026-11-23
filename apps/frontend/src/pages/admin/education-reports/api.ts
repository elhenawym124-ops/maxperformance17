import { buildApiUrl } from "../../../utils/urlHelper";
import {
  getCompanyId as getEducationCompanyId,
  getAuthHeaders as getEducationAuthHeaders,
} from "../education-management/api";
import { EducationAttributionData, EducationFunnelData, FinanceReportData, ReportPeriod } from "./types";

export const getCompanyId = () => getEducationCompanyId();
export const getAuthHeaders = () => getEducationAuthHeaders();

export async function fetchAttributionAnalytics(period: ReportPeriod): Promise<EducationAttributionData | null> {
  try {
    const base = buildApiUrl(`education/demo-day/analytics/attribution?period=${period}`);
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      url = new URL(base, window.location.origin);
    }
    const cid = getCompanyId();
    if (cid) url.searchParams.set("companyId", cid);
    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    const d = await res.json();
    return d.success ? d.data : null;
  } catch (err) {
    console.warn("Attribution fetch error:", err);
    return null;
  }
}

export async function fetchFunnelMetrics(period: ReportPeriod): Promise<EducationFunnelData | null> {
  try {
    const base = buildApiUrl(`education/notifications/funnel?period=${period}`);
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      url = new URL(base, window.location.origin);
    }
    const cid = getCompanyId();
    if (cid) url.searchParams.set("companyId", cid);
    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || d.message || "فشل جلب بيانات الفانل");
    // الباك-إند يرجع { funnel, conversion, repeat } — الشاشة تتوقع حقولًا مسطّحة
    // فكانت مرحلتا «المشتركين» و«الحصص المنفذة» تظهران صفرًا دائمًا.
    const raw = d.data || {};
    const f = raw.funnel || raw;
    const conv = raw.conversion || {};
    const rep = raw.repeat || {};
    const enrolled = Number(rep.totalEnrolledStudents ?? 0);
    const multi = Number(rep.studentsWithMultipleEnrollments ?? 0);
    const num = (v: unknown) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };
    return {
      totalCustomers: num(f.totalCustomers),
      registeredStudents: num(f.totalStudents),
      packagesEnrollments: num(f.totalEnrollments),
      scheduledSessions: num(f.scheduledSessions),
      confirmedSessions: num(f.confirmedSessions),
      completedSessions: num(f.confirmedSessions),
      totalDemoAttendees: num(f.totalDemoAttendees),
      attendedDemoAttendees: num(f.attendedDemoAttendees),
      convertedDemoAttendees: num(f.convertedDemoAttendees),
      demoAttendanceRate: num(conv.demoAttendanceRate),
      demoConversionRate: num(conv.demoConversionRate),
      rates: {
        customersToStudents: num(conv.customersToStudents),
        studentsToEnrollments: num(conv.studentsToEnrollments),
        completionRate: num(conv.completionRate),
        repeatRate: enrolled > 0 ? Number(((multi / enrolled) * 100).toFixed(1)) : 0,
      },
      repeatStats: {
        singleEnrollmentStudents: Math.max(0, enrolled - multi),
        multipleEnrollmentsStudents: multi,
      },
    };
  } catch (err) {
    console.error("Funnel fetch error:", err);
    return null;
  }
}

export async function fetchFinanceReport(months = 6): Promise<FinanceReportData | null> {
  try {
    const base = buildApiUrl(`education/finance/reports?months=${months}`);
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      url = new URL(base, window.location.origin);
    }
    const cid = getCompanyId();
    if (cid) url.searchParams.set("companyId", cid);
    const res = await fetch(url.toString(), { headers: getAuthHeaders() });
    const d = await res.json();
    if (!d.success) throw new Error(d.error || d.message || "فشل جلب التقرير المالي");
    return d.data || null;
  } catch (err) {
    console.error("Finance report fetch error:", err);
    return null;
  }
}
