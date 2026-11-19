/**
 * Pure query helper for Education Students list endpoint.
 * Zero external dependencies (no @prisma/client require) for unit testability with node --test.
 */

/**
 * Normalizes paymentState string from UI/query to Prisma PaymentStatus enum value.
 * Mapping:
 *   paid / completed -> COMPLETED
 *   partial / partially_paid -> PARTIALLY_PAID
 *   overdue / pending -> PENDING
 *   failed -> FAILED
 *   refunded -> REFUNDED
 * Any unrecognized / invalid value or 'all' returns null (safely ignored, never throws).
 *
 * @param {unknown} value
 * @returns {'COMPLETED' | 'PARTIALLY_PAID' | 'PENDING' | 'FAILED' | 'REFUNDED' | null}
 */
function normalizePaymentState(value) {
  if (!value || typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (!v || v === 'all') return null;

  if (v === 'paid' || v === 'completed') return 'COMPLETED';
  if (v === 'partial' || v === 'partially_paid') return 'PARTIALLY_PAID';
  if (v === 'overdue' || v === 'pending') return 'PENDING';
  if (v === 'failed') return 'FAILED';
  if (v === 'refunded') return 'REFUNDED';

  return null;
}

const ALLOWED_SORT_FIELDS = [
  'firstName',
  'lastName',
  'createdAt',
  'updatedAt',
  'code',
  'grade',
  'isActive'
];

/**
 * Resolves sorting parameters from query.
 * Whitelists allowed sort columns, maps aliases:
 *   name -> firstName
 *   status -> isActive
 *   remaining -> special marker 'remaining'
 * Default: createdAt desc
 *
 * @param {Record<string, any>} [query={}]
 * @returns {{ sortBy: string, sortDir: 'asc' | 'desc' }}
 */
function resolveSort(query = {}) {
  const rawDir = query.sortDir || query.sortOrder || 'desc';
  const sortDir = String(rawDir).trim().toLowerCase() === 'asc' ? 'asc' : 'desc';

  const rawSort = query.sortBy ? String(query.sortBy).trim() : 'createdAt';

  if (rawSort === 'name') {
    return { sortBy: 'firstName', sortDir };
  }
  if (rawSort === 'status') {
    return { sortBy: 'isActive', sortDir };
  }
  if (rawSort === 'remaining') {
    return { sortBy: 'remaining', sortDir };
  }

  const sortBy = ALLOWED_SORT_FIELDS.includes(rawSort) ? rawSort : 'createdAt';
  return { sortBy, sortDir };
}

/**
 * Builds Prisma where object and pagination/sort settings for education students.
 * Supports canonical params and backward-compatible aliases:
 *   status -> isActive
 *   currentLevel -> level
 *   subjectId -> subject
 *   startDate/endDate -> dateFrom/dateTo
 *   paymentStatus -> paymentState
 *   sortOrder -> sortDir
 *
 * @param {Record<string, any>} [query={}]
 * @param {string} [companyId]
 * @returns {{ where: Record<string, any>, page: number, pageSize: number, sortBy: string, sortDir: 'asc' | 'desc' }}
 */
function buildStudentsWhere(query = {}, companyId) {
  const where = {};
  if (companyId) {
    where.companyId = companyId;
  }

  if (query.customerId && typeof query.customerId === 'string') {
    where.customerId = query.customerId;
  }

  // 1. Search filter: code, firstName, lastName, phone, phone2, customer names/phone
  const rawSearch = query.search !== undefined ? query.search : query.q;
  if (rawSearch && typeof rawSearch === 'string' && rawSearch.trim()) {
    const q = rawSearch.trim();
    const codeQ = q.startsWith('#') ? q.slice(1).trim() : q;
    where.OR = [
      { code: { contains: codeQ, mode: 'insensitive' } },
      { firstName: { contains: q, mode: 'insensitive' } },
      { lastName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      { phone2: { contains: q } },
      { customer: { firstName: { contains: q, mode: 'insensitive' } } },
      { customer: { lastName: { contains: q, mode: 'insensitive' } } },
      { customer: { phone: { contains: q } } }
    ];
  }

  // 2. Active status filter (supports isActive, status, 'active'/'inactive', booleans)
  const rawStatus = query.isActive !== undefined ? query.isActive : query.status;
  if (rawStatus !== undefined && rawStatus !== null && rawStatus !== '' && rawStatus !== 'all') {
    if (rawStatus === true || rawStatus === 'true' || rawStatus === 'active') {
      where.isActive = true;
    } else if (rawStatus === false || rawStatus === 'false' || rawStatus === 'inactive') {
      where.isActive = false;
    }
  }

  // 3. Grade filter
  if (query.grade && typeof query.grade === 'string' && query.grade.trim() && query.grade.trim() !== 'all') {
    where.grade = { equals: query.grade.trim(), mode: 'insensitive' };
  }

  // 4. Level filter (alias currentLevel) - strictly 1..15 integer
  const rawLevel = query.level !== undefined && query.level !== '' ? query.level : query.currentLevel;
  if (rawLevel !== undefined && rawLevel !== null && rawLevel !== '' && rawLevel !== 'all') {
    const lvlNum = Number(rawLevel);
    if (Number.isInteger(lvlNum) && lvlNum >= 1 && lvlNum <= 15) {
      where.currentLevel = lvlNum;
    }
  }

  // 5. Group filter (caller pre-resolves group members into query.__groupStudentIds)
  // An empty array MUST yield where.id in [] to return ZERO rows, not all rows
  if (Array.isArray(query.__groupStudentIds)) {
    where.id = { in: query.__groupStudentIds };
  }

  // 6. Enrollment-related filters: subject, packageId, teacherId, paymentState
  // Must merge into ONE single enrollments.some object
  const enrollmentSome = { isActive: true };
  let hasEnrollmentFilter = false;

  const subject = (query.subject && query.subject !== 'all')
    ? query.subject
    : ((query.subjectId && query.subjectId !== 'all') ? query.subjectId : null);
  if (subject && typeof subject === 'string' && subject.trim()) {
    enrollmentSome.package = { subjectId: subject.trim() };
    hasEnrollmentFilter = true;
  }

  const packageId = query.packageId && query.packageId !== 'all' ? query.packageId : null;
  if (packageId && typeof packageId === 'string' && packageId.trim()) {
    enrollmentSome.packageId = packageId.trim();
    hasEnrollmentFilter = true;
  }

  const teacherId = query.teacherId && query.teacherId !== 'all' ? query.teacherId : null;
  if (teacherId && typeof teacherId === 'string' && teacherId.trim()) {
    enrollmentSome.teacherId = teacherId.trim();
    hasEnrollmentFilter = true;
  }

  const rawPayment = query.paymentState !== undefined ? query.paymentState : query.paymentStatus;
  const paymentStatus = normalizePaymentState(rawPayment);
  if (paymentStatus) {
    enrollmentSome.paymentStatus = paymentStatus;
    hasEnrollmentFilter = true;
  }

  if (hasEnrollmentFilter) {
    where.enrollments = { some: enrollmentSome };
  }

  // 7. Date range filter (dateFrom/dateTo, aliases startDate/endDate)
  const rawDateFrom = query.dateFrom || query.startDate;
  const rawDateTo = query.dateTo || query.endDate;
  const createdAt = {};
  if (rawDateFrom) {
    const dFrom = new Date(rawDateFrom);
    if (!isNaN(dFrom.getTime())) {
      createdAt.gte = dFrom;
    }
  }
  if (rawDateTo) {
    const dTo = new Date(rawDateTo);
    if (!isNaN(dTo.getTime())) {
      createdAt.lte = dTo;
    }
  }
  if (Object.keys(createdAt).length > 0) {
    where.createdAt = createdAt;
  }

  // 8. Pagination clamping
  const hasPage = query.page !== undefined && query.page !== null && query.page !== '';
  const rawPage = parseInt(hasPage ? query.page : NaN, 10);
  const page = (!isNaN(rawPage) && rawPage >= 1) ? rawPage : 1;

  const hasPageSize = query.pageSize !== undefined && query.pageSize !== null && query.pageSize !== '';
  const hasLimit = query.limit !== undefined && query.limit !== null && query.limit !== '';
  const rawPageSize = parseInt(hasPageSize ? query.pageSize : (hasLimit ? query.limit : NaN), 10);
  let pageSize = 20; // default for compatibility
  if (!isNaN(rawPageSize)) {
    pageSize = Math.max(1, Math.min(rawPageSize, 100));
  }

  // 9. Sorting
  const { sortBy, sortDir } = resolveSort(query);

  return { where, page, pageSize, sortBy, sortDir };
}

module.exports = {
  buildStudentsWhere,
  normalizePaymentState,
  resolveSort
};
