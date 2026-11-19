const test = require('node:test');
const assert = require('node:assert/strict');
const {
  buildStudentsWhere,
  normalizePaymentState,
  resolveSort
} = require('../utils/educationStudentsQuery');

test('normalizePaymentState: correctly maps UI values to Prisma enums', () => {
  assert.equal(normalizePaymentState('paid'), 'COMPLETED');
  assert.equal(normalizePaymentState('completed'), 'COMPLETED');
  assert.equal(normalizePaymentState('PAID'), 'COMPLETED');
  assert.equal(normalizePaymentState('COMPLETED'), 'COMPLETED');

  assert.equal(normalizePaymentState('partial'), 'PARTIALLY_PAID');
  assert.equal(normalizePaymentState('partially_paid'), 'PARTIALLY_PAID');
  assert.equal(normalizePaymentState('PARTIAL'), 'PARTIALLY_PAID');

  assert.equal(normalizePaymentState('overdue'), 'PENDING');
  assert.equal(normalizePaymentState('pending'), 'PENDING');
  assert.equal(normalizePaymentState('OVERDUE'), 'PENDING');

  assert.equal(normalizePaymentState('failed'), 'FAILED');
  assert.equal(normalizePaymentState('refunded'), 'REFUNDED');

  // Edge cases and invalid values: must return null without crashing
  assert.equal(normalizePaymentState('all'), null);
  assert.equal(normalizePaymentState('ALL'), null);
  assert.equal(normalizePaymentState(''), null);
  assert.equal(normalizePaymentState(null), null);
  assert.equal(normalizePaymentState(undefined), null);
  assert.equal(normalizePaymentState(123), null);
  assert.equal(normalizePaymentState('invalid_status_xyz'), null);
});

test('resolveSort: maps aliases and handles whitelist and special remaining sort', () => {
  // Name alias -> firstName
  assert.deepEqual(resolveSort({ sortBy: 'name', sortDir: 'asc' }), {
    sortBy: 'firstName',
    sortDir: 'asc'
  });

  // Status alias -> isActive
  assert.deepEqual(resolveSort({ sortBy: 'status', sortOrder: 'desc' }), {
    sortBy: 'isActive',
    sortDir: 'desc'
  });

  // Remaining special marker
  assert.deepEqual(resolveSort({ sortBy: 'remaining', sortDir: 'desc' }), {
    sortBy: 'remaining',
    sortDir: 'desc'
  });

  // Whitelisted fields
  assert.deepEqual(resolveSort({ sortBy: 'grade', sortDir: 'asc' }), {
    sortBy: 'grade',
    sortDir: 'asc'
  });
  assert.deepEqual(resolveSort({ sortBy: 'code' }), {
    sortBy: 'code',
    sortDir: 'desc'
  });

  // Non-whitelisted field falls back to createdAt
  assert.deepEqual(resolveSort({ sortBy: 'dangerous_column; DROP TABLE', sortDir: 'asc' }), {
    sortBy: 'createdAt',
    sortDir: 'asc'
  });

  // Defaults
  assert.deepEqual(resolveSort({}), {
    sortBy: 'createdAt',
    sortDir: 'desc'
  });
});

test('buildStudentsWhere: search with and without # code strip', () => {
  const companyId = 'comp_1';

  // Search with #
  const res1 = buildStudentsWhere({ search: '#123' }, companyId);
  assert.equal(res1.where.companyId, companyId);
  assert.ok(Array.isArray(res1.where.OR));
  assert.deepEqual(res1.where.OR[0], { code: { contains: '123', mode: 'insensitive' } });
  assert.deepEqual(res1.where.OR[1], { firstName: { contains: '#123', mode: 'insensitive' } });

  // Normal text search via q
  const res2 = buildStudentsWhere({ q: 'أحمد' }, companyId);
  assert.equal(res2.where.OR[0].code.contains, 'أحمد');
  assert.equal(res2.where.OR[1].firstName.contains, 'أحمد');
});

test('buildStudentsWhere: isActive=false and status=inactive return identical where.isActive', () => {
  const c = 'comp_1';
  const res1 = buildStudentsWhere({ isActive: false }, c);
  const res2 = buildStudentsWhere({ status: 'inactive' }, c);
  const res3 = buildStudentsWhere({ isActive: 'false' }, c);

  assert.equal(res1.where.isActive, false);
  assert.equal(res2.where.isActive, false);
  assert.equal(res3.where.isActive, false);

  const resActive1 = buildStudentsWhere({ isActive: true }, c);
  const resActive2 = buildStudentsWhere({ status: 'active' }, c);
  const resActive3 = buildStudentsWhere({ isActive: 'true' }, c);

  assert.equal(resActive1.where.isActive, true);
  assert.equal(resActive2.where.isActive, true);
  assert.equal(resActive3.where.isActive, true);

  // 'all' ignores status filter
  const resAll = buildStudentsWhere({ status: 'all', isActive: 'all' }, c);
  assert.equal(resAll.where.isActive, undefined);
});

test('buildStudentsWhere: grade filter', () => {
  const c = 'comp_1';
  const res = buildStudentsWhere({ grade: 'الصف الأول' }, c);
  assert.deepEqual(res.where.grade, { equals: 'الصف الأول', mode: 'insensitive' });

  const resAll = buildStudentsWhere({ grade: 'all' }, c);
  assert.equal(resAll.where.grade, undefined);
});

test('buildStudentsWhere: level and currentLevel alias only accept integers 1..15', () => {
  const c = 'comp_1';

  // Valid level 3
  const res3 = buildStudentsWhere({ level: 3 }, c);
  assert.equal(res3.where.currentLevel, 3);

  // Valid alias currentLevel string "15"
  const res15 = buildStudentsWhere({ currentLevel: '15' }, c);
  assert.equal(res15.where.currentLevel, 15);

  // Invalid levels (out of bounds or non-integer) must be ignored
  assert.equal(buildStudentsWhere({ level: 0 }, c).where.currentLevel, undefined);
  assert.equal(buildStudentsWhere({ level: 16 }, c).where.currentLevel, undefined);
  assert.equal(buildStudentsWhere({ currentLevel: 'abc' }, c).where.currentLevel, undefined);
  assert.equal(buildStudentsWhere({ level: 2.5 }, c).where.currentLevel, undefined);
  assert.equal(buildStudentsWhere({ level: 'all' }, c).where.currentLevel, undefined);
});

test('buildStudentsWhere: enrollment filters merged into ONE enrollments.some', () => {
  const c = 'comp_1';

  // Single subject filter
  const resSubject = buildStudentsWhere({ subject: 'sub_123' }, c);
  assert.deepEqual(resSubject.where.enrollments, {
    some: {
      isActive: true,
      package: { subjectId: 'sub_123' }
    }
  });

  // subjectId alias
  const resSubjectAlias = buildStudentsWhere({ subjectId: 'sub_456' }, c);
  assert.deepEqual(resSubjectAlias.where.enrollments, {
    some: {
      isActive: true,
      package: { subjectId: 'sub_456' }
    }
  });

  // Merging subject + teacherId + paymentState into ONE some object
  const resMerged = buildStudentsWhere({
    subject: 'sub_1',
    teacherId: 'teach_9',
    paymentState: 'paid'
  }, c);

  assert.deepEqual(resMerged.where.enrollments, {
    some: {
      isActive: true,
      package: { subjectId: 'sub_1' },
      teacherId: 'teach_9',
      paymentStatus: 'COMPLETED'
    }
  });
  // Verify only one enrollments key and only one 'some' key inside it
  assert.equal(Object.keys(resMerged.where.enrollments).length, 1);
  assert.ok(resMerged.where.enrollments.some);
});

test('buildStudentsWhere: groupId empty array yields where.id in [] returning zero rows', () => {
  const c = 'comp_1';

  // Group resolved to no active students -> must produce where.id: { in: [] }
  const resEmpty = buildStudentsWhere({ __groupStudentIds: [] }, c);
  assert.deepEqual(resEmpty.where.id, { in: [] });

  // Group resolved to specific students
  const resMembers = buildStudentsWhere({ __groupStudentIds: ['stu_1', 'stu_2'] }, c);
  assert.deepEqual(resMembers.where.id, { in: ['stu_1', 'stu_2'] });
});

test('buildStudentsWhere: date range with aliases startDate/endDate and dateFrom/dateTo', () => {
  const c = 'comp_1';

  const res1 = buildStudentsWhere({
    dateFrom: '2026-01-01T00:00:00.000Z',
    dateTo: '2026-12-31T23:59:59.000Z'
  }, c);
  assert.ok(res1.where.createdAt.gte instanceof Date);
  assert.ok(res1.where.createdAt.lte instanceof Date);

  const res2 = buildStudentsWhere({
    startDate: '2026-05-01',
    endDate: '2026-06-01'
  }, c);
  assert.ok(res2.where.createdAt.gte instanceof Date);
  assert.ok(res2.where.createdAt.lte instanceof Date);

  // Invalid date string ignored
  const resInvalid = buildStudentsWhere({ dateFrom: 'not-a-date' }, c);
  assert.equal(resInvalid.where.createdAt, undefined);
});

test('buildStudentsWhere: pagination clamping', () => {
  const c = 'comp_1';

  // Default pageSize is 20 for backward compatibility
  const resDef = buildStudentsWhere({}, c);
  assert.equal(resDef.page, 1);
  assert.equal(resDef.pageSize, 20);

  // Clamp min 1
  const resMin = buildStudentsWhere({ page: -5, pageSize: 0 }, c);
  assert.equal(resMin.page, 1);
  assert.equal(resMin.pageSize, 1);

  // Clamp max 100
  const resMax = buildStudentsWhere({ page: 4, pageSize: 500 }, c);
  assert.equal(resMax.page, 4);
  assert.equal(resMax.pageSize, 100);

  // Normal valid page and pageSize
  const resNorm = buildStudentsWhere({ page: '2', pageSize: '25' }, c);
  assert.equal(resNorm.page, 2);
  assert.equal(resNorm.pageSize, 25);

  // Adversarial: page=0 defaults to 1
  const resPage0 = buildStudentsWhere({ page: 0 }, c);
  assert.equal(resPage0.page, 1);

  // Adversarial: Arabic numerals ٥٠٠ clamp to 100
  const resArabicPageSize = buildStudentsWhere({ page: '٣', pageSize: '٥٠٠' }, c);
  assert.equal(resArabicPageSize.page, 3);
  assert.equal(resArabicPageSize.pageSize, 100);
});

test('buildStudentsWhere: adversarial edge cases (lone #, %, empty grade, inverted dates, weird paymentState)', () => {
  const c = 'comp_1';

  // 1. Lone '#' does not become empty string
  const resHash = buildStudentsWhere({ search: '#' }, c);
  assert.equal(resHash.where.OR[0].code.contains, '#');

  // Multiple hashes without code
  const resMultiHash = buildStudentsWhere({ search: '###' }, c);
  assert.equal(resMultiHash.where.OR[0].code.contains, '###');

  // Hash with code
  const resCode = buildStudentsWhere({ search: '#105' }, c);
  assert.equal(resCode.where.OR[0].code.contains, '105');

  // 2. Search with % and _ does not cause injection or crash
  const resPercent = buildStudentsWhere({ search: '100%_bonus' }, c);
  assert.equal(resPercent.where.OR[0].code.contains, '100%_bonus');

  // 3. Empty grade strings and whitespace-only grade
  assert.equal(buildStudentsWhere({ grade: '' }, c).where.grade, undefined);
  assert.equal(buildStudentsWhere({ grade: '   ' }, c).where.grade, undefined);

  // 4. Inverted dates: dateFrom > dateTo runs cleanly without runtime exception
  const resInverted = buildStudentsWhere({
    dateFrom: '2026-12-31',
    dateTo: '2026-01-01'
  }, c);
  assert.ok(resInverted.where.createdAt.gte instanceof Date);
  assert.ok(resInverted.where.createdAt.lte instanceof Date);
  assert.ok(resInverted.where.createdAt.gte > resInverted.where.createdAt.lte);

  // Date without time sets end of day for dateTo
  assert.ok(resInverted.where.createdAt.lte.toISOString().includes('23:59:59.999Z'));

  // 5. Weird paymentState: null, undefined, strange string -> ignored without crashing
  const resWeirdPay = buildStudentsWhere({ paymentState: 'weird_unknown_state_123' }, c);
  assert.equal(resWeirdPay.where.enrollments, undefined);

  // 6. Level with Arabic numerals: ٣ -> 3
  const resArabicLevel = buildStudentsWhere({ level: '٣' }, c);
  assert.equal(resArabicLevel.where.currentLevel, 3);

  // Level 0 -> ignored
  const resLevel0 = buildStudentsWhere({ level: 0 }, c);
  assert.equal(resLevel0.where.currentLevel, undefined);
});

test('schema verification: includeRelations fields exist in prisma schema (regression guard for totalHours/hoursCount)', () => {
  const fs = require('node:fs');
  const path = require('node:path');

  const schemaPath = path.resolve(__dirname, '../prisma/schema/education.prisma');
  assert.ok(fs.existsSync(schemaPath), 'education.prisma must exist');

  const schemaContent = fs.readFileSync(schemaPath, 'utf8');

  // Helper to extract field names from a model block in schema
  const extractModelFields = (modelName) => {
    const regex = new RegExp(`model\\s+${modelName}\\s+\\{([^}]+)\\}`, 'm');
    const match = schemaContent.match(regex);
    assert.ok(match, `Model ${modelName} must be present in education.prisma`);
    const lines = match[1].split('\n');
    const fields = new Set();
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('//') || line.startsWith('@@')) continue;
      const fieldName = line.split(/\s+/)[0];
      if (fieldName) fields.add(fieldName);
    }
    return fields;
  };

  const packageFields = extractModelFields('EducationPackage');
  const enrollmentFields = extractModelFields('EducationEnrollment');
  const teacherFields = extractModelFields('EducationTeacher');
  const groupMemberFields = extractModelFields('EducationGroupMember');

  // 1. Critical guard: EducationPackage MUST have hoursCount and MUST NOT have totalHours
  assert.ok(packageFields.has('hoursCount'), 'EducationPackage must have hoursCount');
  assert.ok(!packageFields.has('totalHours'), 'EducationPackage does NOT have totalHours (hoursCount is the correct column)');

  // Verify all fields selected on package in includeRelations
  const packageSelected = ['id', 'name', 'price', 'hoursCount'];
  for (const f of packageSelected) {
    assert.ok(packageFields.has(f), `EducationPackage must have field '${f}'`);
  }

  // 2. Verify fields selected on teacher in includeRelations
  const teacherSelected = ['id', 'name'];
  for (const f of teacherSelected) {
    assert.ok(teacherFields.has(f), `EducationTeacher must have field '${f}'`);
  }

  // 3. Verify enrollment fields used in query and relations
  const enrollmentExpected = ['id', 'companyId', 'studentId', 'packageId', 'teacherId', 'totalHours', 'amountPaid', 'finalAmount', 'paymentStatus', 'isActive'];
  for (const f of enrollmentExpected) {
    assert.ok(enrollmentFields.has(f), `EducationEnrollment must have field '${f}'`);
  }

  // 4. Verify EducationGroupMember fields
  const groupMemberExpected = ['id', 'companyId', 'groupId', 'studentId', 'status'];
  for (const f of groupMemberExpected) {
    assert.ok(groupMemberFields.has(f), `EducationGroupMember must have field '${f}'`);
  }
});
