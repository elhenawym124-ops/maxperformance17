let bcrypt;
try {
  bcrypt = require('bcryptjs');
} catch {
  bcrypt = null;
}
const crypto = require('crypto');

const hashPassword = async (pwd) => {
  if (!pwd) return null;
  if (bcrypt && typeof bcrypt.hash === 'function') {
    return await bcrypt.hash(pwd, 10);
  }
  return crypto.createHash('sha256').update(pwd).digest('hex');
};

const { getSharedPrismaClient } = require('../services/sharedDatabase');
const { logEducationEvent } = require('../services/educationAuditService');
const { buildStudentsWhere } = require('../utils/educationStudentsQuery');

const normalizeGender = (g) => {
  if (!g) return null;
  const upper = String(g).trim().toUpperCase();
  if (upper === 'MALE' || upper === 'FEMALE') return upper;
  if (upper === 'ذكر' || upper === 'M') return 'MALE';
  if (upper === 'أنثى' || upper === 'انثى' || upper === 'F') return 'FEMALE';
  return null;
};

const generateUniqueStudentCode = async (companyId, prismaClient) => {
  const prisma = prismaClient || getSharedPrismaClient();
  try {
    const lastStudentWithCode = await prisma.educationStudent.findFirst({
      where: { companyId, code: { not: null } },
      orderBy: { createdAt: 'desc' },
      select: { code: true }
    });

    let nextNumber = 1001;
    if (lastStudentWithCode?.code) {
      const match = lastStudentWithCode.code.match(/(\d+)$/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    } else {
      const count = await prisma.educationStudent.count({ where: { companyId } });
      nextNumber = 1001 + count;
    }

    let candidate = `STU-${nextNumber}`;
    let exists = await prisma.educationStudent.findFirst({
      where: { companyId, code: candidate }
    });
    while (exists) {
      nextNumber++;
      candidate = `STU-${nextNumber}`;
      exists = await prisma.educationStudent.findFirst({
        where: { companyId, code: candidate }
      });
    }
    return candidate;
  } catch (err) {
    console.error('[StudentCode] Error generating student code:', err);
    return `STU-${Date.now().toString().slice(-4)}`;
  }
};

/**
 * Attaches active groupName to an array of student objects in a single batch query (no N+1).
 * @param {Array<object>} items
 * @param {string} companyId
 * @param {object} prisma
 * @returns {Promise<Array<object>>}
 */
const attachStudentGroupNames = async (items, companyId, prisma) => {
  if (!Array.isArray(items) || items.length === 0 || !companyId || !prisma) {
    return items;
  }

  const studentIds = items.map((s) => s && s.id).filter(Boolean);
  if (studentIds.length === 0) return items;

  try {
    const memberships = await prisma.educationGroupMember.findMany({
      where: {
        studentId: { in: studentIds },
        companyId,
        status: 'ACTIVE'
      },
      select: { studentId: true, groupId: true }
    });

    const groupIds = [...new Set(memberships.map((m) => m.groupId).filter(Boolean))];
    const groupNameMap = new Map();

    if (groupIds.length > 0) {
      const groups = await prisma.educationGroup.findMany({
        where: {
          id: { in: groupIds },
          companyId
        },
        select: { id: true, name: true }
      });
      for (const g of groups) {
        if (g && g.id) groupNameMap.set(g.id, g.name);
      }
    }

    const studentGroupMap = new Map();
    for (const m of memberships) {
      const gName = groupNameMap.get(m.groupId);
      if (gName) {
        if (studentGroupMap.has(m.studentId)) {
          studentGroupMap.set(m.studentId, `${studentGroupMap.get(m.studentId)}، ${gName}`);
        } else {
          studentGroupMap.set(m.studentId, gName);
        }
      }
    }

    return items.map((item) => ({
      ...item,
      groupName: (item && item.id && studentGroupMap.get(item.id)) || null
    }));
  } catch (err) {
    console.error('[attachStudentGroupNames] Error resolving student groups:', err);
    return items.map((item) => ({
      ...item,
      groupName: null
    }));
  }
};

const getAll = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();

    // Group filter two-step: if groupId provided, resolve active member studentIds first
    let groupStudentIds = null;
    if (req.query.groupId && req.query.groupId !== 'all') {
      const members = await prisma.educationGroupMember.findMany({
        where: {
          companyId,
          groupId: String(req.query.groupId).trim(),
          status: 'ACTIVE'
        },
        select: { studentId: true }
      });
      groupStudentIds = members.map(m => m.studentId);
    }

    const queryWithGroup = { ...req.query };
    if (groupStudentIds !== null) {
      queryWithGroup.__groupStudentIds = groupStudentIds;
    }

    const { where, page, pageSize, sortBy, sortDir } = buildStudentsWhere(queryWithGroup, companyId);

    const includeRelations = {
      customer: { select: { id: true, firstName: true, lastName: true, phone: true, phone2: true, email: true } },
      enrollments: {
        where: { isActive: true },
        include: {
          package: { select: { id: true, name: true, price: true, hoursCount: true } },
          teacher: { select: { id: true, name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    };

    // Check if remaining sort is requested (special two-step path)
    if (sortBy === 'remaining') {
      const filteredStudents = await prisma.educationStudent.findMany({
        where,
        select: { id: true }
      });
      const total = filteredStudents.length;

      if (total === 0) {
        return res.json({
          success: true,
          data: [],
          items: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        });
      }

      const allIds = filteredStudents.map(s => s.id);

      // Parameterized raw query over active enrollments
      const remainingRows = await prisma.$queryRawUnsafe(
        `SELECT e."studentId",
                COALESCE(SUM(COALESCE(e."finalAmount", p."price", 0) - COALESCE(e."amountPaid", 0)), 0) AS "remaining"
         FROM "education_enrollments" e
         LEFT JOIN "education_packages" p ON p."id" = e."packageId"
         WHERE e."companyId" = $1
           AND e."isActive" = true
           AND e."studentId" = ANY($2::text[])
         GROUP BY e."studentId"`,
        companyId,
        allIds
      );

      const remainingMap = new Map();
      for (const id of allIds) {
        remainingMap.set(id, 0);
      }
      for (const row of (remainingRows || [])) {
        remainingMap.set(row.studentId, Number(row.remaining) || 0);
      }

      const factor = sortDir === 'asc' ? 1 : -1;
      allIds.sort((a, b) => {
        const diff = (remainingMap.get(a) - remainingMap.get(b)) * factor;
        if (diff !== 0) return diff;
        return a.localeCompare(b);
      });

      // If unpaginated (all=true)
      if (req.query.all === 'true') {
        const fullRows = await prisma.educationStudent.findMany({
          where: { id: { in: allIds }, companyId },
          include: includeRelations
        });
        const rowMap = new Map(fullRows.map(r => [r.id, r]));
        let ordered = allIds.map(id => rowMap.get(id)).filter(Boolean);
        ordered = await attachStudentGroupNames(ordered, companyId, prisma);
        return res.json({ success: true, data: ordered, items: ordered, total: ordered.length });
      }

      const start = (page - 1) * pageSize;
      const pageIds = allIds.slice(start, start + pageSize);

      let items = [];
      if (pageIds.length > 0) {
        const fetched = await prisma.educationStudent.findMany({
          where: { id: { in: pageIds }, companyId },
          include: includeRelations
        });
        const rowMap = new Map(fetched.map(r => [r.id, r]));
        items = pageIds.map(id => rowMap.get(id)).filter(Boolean);
        items = await attachStudentGroupNames(items, companyId, prisma);
      }

      return res.json({
        success: true,
        data: items,
        items,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      });
    }

    // Standard sorting
    const orderBy = { [sortBy]: sortDir };

    if (req.query.all === 'true') {
      let data = await prisma.educationStudent.findMany({
        where,
        include: includeRelations,
        orderBy
      });
      data = await attachStudentGroupNames(data, companyId, prisma);
      return res.json({ success: true, data, items: data, total: data.length });
    }

    const [total, rawItems] = await Promise.all([
      prisma.educationStudent.count({ where }),
      prisma.educationStudent.findMany({
        where,
        include: includeRelations,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize
      })
    ]);

    const items = await attachStudentGroupNames(rawItems, companyId, prisma);

    res.json({
      success: true,
      data: items,
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الطلاب' });
  }
};

const getById = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const data = await getSharedPrismaClient().educationStudent.findFirst({
      where: { id, companyId },
      include: {
        customer: { select: { id: true, firstName: true, lastName: true, phone: true, phone2: true, email: true, password: true } },
        enrollments: {
          include: {
            package: { include: { subject: { select: { id: true, name: true } } } },
            teacher: { select: { id: true, name: true } }
          }
        }
      }
    });
    if (!data) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });
    if (data.customer) {
      data.customer.hasPassword = !!data.customer.password;
      delete data.customer.password;
    }
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في جلب الطالب' });
  }
};

const create = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    let { customerId, firstName, lastName, phone, phone2, address, gender, grade, subjects, notes, guardianName, guardianPhone, guardianPhone2, guardianEmail, guardianPassword, isSelfGuardian, currentLevel, code } = req.body;
    if (!firstName || !firstName.trim()) return res.status(400).json({ success: false, error: 'اسم الطالب مطلوب' });

    let safeCode = (code && typeof code === 'string' && code.trim()) ? code.trim().toUpperCase() : null;
    if (safeCode) {
      const duplicate = await getSharedPrismaClient().educationStudent.findFirst({
        where: { companyId, code: { equals: safeCode, mode: 'insensitive' } }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, error: `كود الطالب (${safeCode}) مستخدم بالفعل لطالب آخر` });
      }
    } else {
      safeCode = await generateUniqueStudentCode(companyId, getSharedPrismaClient());
    }

    const safeLastName = (lastName && typeof lastName === 'string' && lastName.trim()) ? lastName.trim() : '';
    const safeGender = normalizeGender(gender);
    const safePhone = (phone && typeof phone === 'string' && phone.trim()) ? phone.trim() : null;
    const safePhone2 = (phone2 && typeof phone2 === 'string' && phone2.trim()) ? phone2.trim() : null;
    const safeAddress = (address && typeof address === 'string' && address.trim()) ? address.trim() : null;
    const safeGuardianPhone2 = (guardianPhone2 && typeof guardianPhone2 === 'string' && guardianPhone2.trim())
      ? guardianPhone2.trim()
      : (isSelfGuardian ? safePhone2 : null);
    let safeSubjects = [];
    if (Array.isArray(subjects)) {
      safeSubjects = subjects.filter(Boolean);
    } else if (typeof subjects === 'string' && subjects.trim()) {
      try {
        const parsed = JSON.parse(subjects);
        safeSubjects = Array.isArray(parsed) ? parsed : [subjects.trim()];
      } catch {
        safeSubjects = [subjects.trim()];
      }
    }
    const safeGrade = (grade && typeof grade === 'string' && grade.trim()) ? grade.trim() : null;
    const safeNotes = (notes && typeof notes === 'string' && notes.trim()) ? notes.trim() : null;
    const safeGuardianEmail = (guardianEmail && typeof guardianEmail === 'string' && guardianEmail.trim())
      ? guardianEmail.trim().toLowerCase()
      : null;
    if (safeGuardianEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeGuardianEmail)) {
      return res.status(400).json({ success: false, error: 'صيغة البريد الإلكتروني لولي الأمر غير صحيحة' });
    }

    if (guardianPassword && typeof guardianPassword === 'string' && guardianPassword.trim()) {
      if (guardianPassword.trim().length < 6) {
        return res.status(400).json({ success: false, error: 'كلمة مرور ولي الأمر يجب ألا تقل عن 6 أحرف' });
      }
    }

    const safeHashedPassword = (guardianPassword && typeof guardianPassword === 'string' && guardianPassword.trim())
      ? await hashPassword(guardianPassword.trim())
      : null;

    if (!customerId) {
      const typedGuardianName = (guardianName && typeof guardianName === 'string') ? guardianName.trim() : '';
      const gPhone = (guardianPhone && typeof guardianPhone === 'string' && guardianPhone.trim())
        ? guardianPhone.trim()
        : (safePhone || null);

      // ممنوع نعمل عميل باسم «ولي أمر —» من غير رقم: كان بيسيب ولي أمر وهمي
      // في الـ CRM وبيرمي الاسم والرقم اللي المستخدم كتبهم.
      if (!typedGuardianName && !isSelfGuardian) {
        return res.status(400).json({
          success: false,
          error: 'لازم تختار ولي أمر موجود، أو تكتب اسم ولي الأمر ورقم هاتفه'
        });
      }
      if (!gPhone) {
        return res.status(400).json({
          success: false,
          error: 'رقم هاتف ولي الأمر مطلوب — من غيره مش هنقدر نتواصل معاه'
        });
      }

      let gFirstName;
      let gLastName;
      if (typedGuardianName) {
        const parts = typedGuardianName.split(/\s+/);
        gFirstName = parts[0];
        gLastName = parts.slice(1).join(' ');
      } else {
        gFirstName = firstName.trim();
        gLastName = safeLastName;
      }

      let customer = null;
      if (gPhone) {
        customer = await getSharedPrismaClient().customer.findFirst({
          where: { companyId, phone: gPhone }
        });
      }

      if (!customer) {
        customer = await getSharedPrismaClient().customer.create({
          data: {
            companyId,
            firstName: gFirstName,
            lastName: gLastName,
            phone: gPhone,
            phone2: safeGuardianPhone2,
            status: 'ACTIVE',
            email: safeGuardianEmail,
            password: safeHashedPassword
          }
        });
      }
      else if (safeGuardianEmail || safeHashedPassword || safeGuardianPhone2) {
        const custUpdate = {};
        if (safeGuardianEmail) custUpdate.email = safeGuardianEmail;
        if (safeHashedPassword) custUpdate.password = safeHashedPassword;
        if (safeGuardianPhone2) custUpdate.phone2 = safeGuardianPhone2;
        customer = await getSharedPrismaClient().customer.update({
          where: { id: customer.id },
          data: custUpdate
        });
      }
      customerId = customer.id;
    } else {
      let customer = await getSharedPrismaClient().customer.findFirst({ where: { id: customerId, companyId } });
      if (!customer) return res.status(400).json({ success: false, error: 'ولي الأمر غير موجود' });
      if (safeGuardianEmail || safeHashedPassword || safeGuardianPhone2) {
        const custUpdate = {};
        if (safeGuardianEmail) custUpdate.email = safeGuardianEmail;
        if (safeHashedPassword) custUpdate.password = safeHashedPassword;
        if (safeGuardianPhone2) custUpdate.phone2 = safeGuardianPhone2;
        await getSharedPrismaClient().customer.update({
          where: { id: customer.id },
          data: custUpdate
        });
      }
    }

    const data = await getSharedPrismaClient().educationStudent.create({
      data: {
        companyId,
        customerId,
        code: safeCode,
        firstName: firstName.trim(),
        lastName: safeLastName,
        phone: safePhone,
        phone2: safePhone2,
        address: safeAddress,
        gender: safeGender,
        grade: safeGrade,
        subjects: safeSubjects,
        currentLevel: currentLevel ? Number(currentLevel) : null,
        notes: safeNotes
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true, phone2: true, email: true } } }
    });
    const studentFullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'CREATE_STUDENT',
      entityType: 'STUDENT',
      entityId: data.id,
      entityName: studentFullName,
      description: `تم تسجيل طالب جديد: ${studentFullName} (كود: ${data.code || 'بدون كود'} - ${data.grade || 'بدون مرحلة'} - هاتف: ${data.phone || 'غير مسجل'})`,
      details: {
        code: data.code,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        grade: data.grade,
        customerId: data.customerId,
      },
      req,
    }).catch(e => console.error('[StudentAudit]', e.message));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إنشاء الطالب' });
  }
};

const update = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const { customerId, firstName, lastName, phone, phone2, address, gender, grade, subjects, notes, isActive, guardianEmail, guardianPassword, guardianPhone2, currentLevel, code } = req.body;

    const existing = await getSharedPrismaClient().educationStudent.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    let safeCode = undefined;
    if (code !== undefined) {
      safeCode = (code && typeof code === 'string' && code.trim()) ? code.trim().toUpperCase() : null;
      if (safeCode && safeCode !== (existing.code ? existing.code.toUpperCase() : null)) {
        const duplicate = await getSharedPrismaClient().educationStudent.findFirst({
          where: { companyId, code: { equals: safeCode, mode: 'insensitive' }, id: { not: id } }
        });
        if (duplicate) {
          return res.status(400).json({ success: false, error: `كود الطالب (${safeCode}) مستخدم بالفعل لطالب آخر` });
        }
      }
    }

    const safeCustomerId = (customerId && typeof customerId === 'string' && customerId.trim())
      ? customerId.trim()
      : undefined;

    if (safeCustomerId && safeCustomerId !== existing.customerId) {
      const cust = await getSharedPrismaClient().customer.findFirst({ where: { id: safeCustomerId, companyId } });
      if (!cust) return res.status(400).json({ success: false, error: 'ولي الأمر غير موجود' });
    }

    const targetCustomerId = safeCustomerId || existing.customerId;
    if (targetCustomerId && (guardianEmail !== undefined || guardianPassword || guardianPhone2 !== undefined)) {
      const custUpdate = {};
      if (guardianPhone2 !== undefined) {
        custUpdate.phone2 = (guardianPhone2 && typeof guardianPhone2 === 'string' && guardianPhone2.trim()) ? guardianPhone2.trim() : null;
      }
      if (guardianEmail !== undefined && typeof guardianEmail === 'string' && guardianEmail.trim()) {
        const trimmedEmail = guardianEmail.trim().toLowerCase();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
          return res.status(400).json({ success: false, error: 'صيغة البريد الإلكتروني لولي الأمر غير صحيحة' });
        }
        custUpdate.email = trimmedEmail;
      }
      if (guardianPassword && typeof guardianPassword === 'string' && guardianPassword.trim()) {
        if (guardianPassword.trim().length < 6) {
          return res.status(400).json({ success: false, error: 'كلمة مرور ولي الأمر يجب ألا تقل عن 6 أحرف' });
        }
        custUpdate.password = await hashPassword(guardianPassword.trim());
      }
      if (Object.keys(custUpdate).length > 0) {
        await getSharedPrismaClient().customer.update({
          where: { id: targetCustomerId },
          data: custUpdate
        });
      }
    }

    const safeLastName = lastName !== undefined ? ((lastName && typeof lastName === 'string' && lastName.trim()) ? lastName.trim() : '') : undefined;
    const safeGender = gender !== undefined ? normalizeGender(gender) : undefined;
    const safePhone = phone !== undefined ? ((phone && typeof phone === 'string' && phone.trim()) ? phone.trim() : null) : undefined;
    const safePhone2 = phone2 !== undefined ? ((phone2 && typeof phone2 === 'string' && phone2.trim()) ? phone2.trim() : null) : undefined;
    const safeAddress = address !== undefined ? ((address && typeof address === 'string' && address.trim()) ? address.trim() : null) : undefined;
    let safeSubjects = undefined;
    if (subjects !== undefined) {
      if (Array.isArray(subjects)) {
        safeSubjects = subjects.filter(Boolean);
      } else if (typeof subjects === 'string' && subjects.trim()) {
        try {
          const parsed = JSON.parse(subjects);
          safeSubjects = Array.isArray(parsed) ? parsed : [subjects.trim()];
        } catch {
          safeSubjects = [subjects.trim()];
        }
      } else {
        safeSubjects = [];
      }
    }
    const safeGrade = grade !== undefined ? ((grade && typeof grade === 'string' && grade.trim()) ? grade.trim() : null) : undefined;
    const safeNotes = notes !== undefined ? ((notes && typeof notes === 'string' && notes.trim()) ? notes.trim() : null) : undefined;

    const data = await getSharedPrismaClient().educationStudent.update({
      where: { id },
      data: {
        customerId: safeCustomerId,
        ...(code !== undefined ? { code: safeCode } : {}),
        firstName: firstName ? firstName.trim() : undefined,
        lastName: safeLastName,
        phone: safePhone,
        phone2: safePhone2,
        address: safeAddress,
        gender: safeGender,
        grade: safeGrade,
        subjects: safeSubjects,
        notes: safeNotes,
        isActive,
        ...(currentLevel !== undefined
          ? { currentLevel: currentLevel === null || currentLevel === '' ? null : Number(currentLevel) }
          : {})
      },
      include: { customer: { select: { id: true, firstName: true, lastName: true, phone: true, phone2: true, email: true } } }
    });

    const studentFullName = `${data.firstName || ''} ${data.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'UPDATE_STUDENT',
      entityType: 'STUDENT',
      entityId: data.id,
      entityName: studentFullName,
      description: `تم تحديث بيانات الطالب: ${studentFullName} (كود: ${data.code || 'بدون كود'})`,
      details: {
        before: { code: existing.code, firstName: existing.firstName, lastName: existing.lastName, phone: existing.phone, grade: existing.grade, isActive: existing.isActive },
        after: { code: data.code, firstName: data.firstName, lastName: data.lastName, phone: data.phone, grade: data.grade, isActive: data.isActive }
      },
      req,
    }).catch(e => console.error('[StudentAudit]', e.message));

    res.json({ success: true, data });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث الطالب' });
  }
};

const remove = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const existing = await getSharedPrismaClient().educationStudent.findFirst({ where: { id, companyId } });
    if (!existing) return res.status(404).json({ success: false, error: 'الطالب غير موجود' });

    await getSharedPrismaClient().educationStudent.delete({ where: { id } });

    const studentFullName = `${existing.firstName || ''} ${existing.lastName || ''}`.trim();
    logEducationEvent({
      companyId,
      action: 'DELETE_STUDENT',
      entityType: 'STUDENT',
      entityId: id,
      entityName: studentFullName,
      description: `تم حذف الطالب: ${studentFullName}`,
      details: { deletedStudent: existing },
      severity: 'HIGH',
      req,
    }).catch(e => console.error('[StudentAudit]', e.message));

    res.json({ success: true, message: 'تم حذف الطالب' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في حذف الطالب' });
  }
};

const searchGuardians = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const rawQ = req.query.q || req.query.query || '';
    const q = typeof rawQ === 'string' ? rawQ.trim() : '';
    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const customers = await getSharedPrismaClient().customer.findMany({
      where: {
        companyId,
        OR: [
          { phone: { contains: q } },
          { phone2: { contains: q } },
          { firstName: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
          { email: { contains: q, mode: 'insensitive' } }
        ]
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        phone2: true,
        email: true
      },
      take: 15,
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    console.error('Error searching guardians:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ أثناء البحث' });
  }
};

const bulkStatus = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { ids, isActive } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
      return res.status(400).json({ success: false, error: 'قائمة المعرفات غير صالحة (الحد الأقصى 200)' });
    }
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ success: false, error: 'حالة التفعيل غير صالحة' });
    }

    const prisma = getSharedPrismaClient();
    const result = await prisma.educationStudent.updateMany({
      where: { id: { in: ids }, companyId },
      data: { isActive }
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error in bulkStatus:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في تحديث الحالة الجماعي' });
  }
};

const bulkAddToGroup = async (req, res) => {
  try {
    const companyId = req.user?.companyId || req.user?.effectiveCompanyId;
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { ids, groupId } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 200) {
      return res.status(400).json({ success: false, error: 'قائمة المعرفات غير صالحة (الحد الأقصى 200)' });
    }
    if (!groupId || typeof groupId !== 'string') {
      return res.status(400).json({ success: false, error: 'معرف المجموعة مطلوب' });
    }

    const prisma = getSharedPrismaClient();
    // Group must belong to the same company
    const group = await prisma.educationGroup.findFirst({
      where: { id: groupId.trim(), companyId }
    });
    if (!group) {
      return res.status(404).json({ success: false, error: 'المجموعة غير موجودة في هذه الشركة' });
    }

    // Verify which students belong to the company
    const validStudents = await prisma.educationStudent.findMany({
      where: { id: { in: ids }, companyId },
      select: { id: true }
    });
    const validStudentIds = validStudents.map(s => s.id);
    if (validStudentIds.length === 0) {
      return res.json({ success: true, count: 0 });
    }

    const data = validStudentIds.map(studentId => ({
      id: `egm_${crypto.randomBytes(8).toString('hex')}`,
      companyId,
      groupId: group.id,
      studentId,
      status: 'ACTIVE',
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    const result = await prisma.educationGroupMember.createMany({
      data,
      skipDuplicates: true
    });

    res.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Error in bulkAddToGroup:', error);
    res.status(500).json({ success: false, error: 'حدث خطأ في إضافة الطلاب للمجموعة' });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  searchGuardians,
  bulkStatus,
  bulkAddToGroup,
  attachStudentGroupNames
};
