const sharedDatabase = require('../services/sharedDatabase');
const getSharedPrismaClient = () => sharedDatabase.getSharedPrismaClient();
const {
  ensureTablesExist,
  generateGroupId,
  generateMemberId,
  generateSessionId,
  generateAttId
} = require('../services/educationGroupsService');

const DISALLOWED_ROLES = new Set(['SHIPPING_CLIENT', 'STUDENT', 'CUSTOMER', 'COURIER']);

const getCompanyId = (req) => {
  const userRole = String(req.user?.role || '').toUpperCase();
  if (DISALLOWED_ROLES.has(userRole)) return null;
  const headerCid = req.headers?.['x-company-id'] || req.headers?.['X-Company-Id'] || req.query?.companyId;
  if (headerCid) {
    if (userRole === 'SUPER_ADMIN') return String(headerCid).trim();
    if (req.user?.companyId === headerCid) return String(headerCid).trim();
    const hasCompany = Array.isArray(req.user?.userCompanies) && req.user.userCompanies.some(uc => uc.companyId === headerCid || uc.company?.id === headerCid);
    if (hasCompany) return String(headerCid).trim();
  }
  return req.user?.companyId || req.user?.effectiveCompanyId || req.user?.userCompanies?.[0]?.companyId || null;
};

const getAll = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const { subjectId, teacherId, status, search } = req.query;

    let query = `
      SELECT 
        g.*,
        s.name AS "subjectName",
        t.name AS "teacherName",
        t.phone AS "teacherPhone",
        COALESCE(m.total_members, 0) AS "totalMembers",
        COALESCE(m.active_members, 0) AS "activeMembers",
        COALESCE(m.waiting_members, 0) AS "waitingMembers"
      FROM "education_groups" g
      LEFT JOIN "education_subjects" s ON s.id = g."subjectId" AND s."companyId" = g."companyId"
      LEFT JOIN "education_teachers" t ON t.id = g."teacherId" AND t."companyId" = g."companyId"
      LEFT JOIN (
        SELECT 
          "groupId",
          COUNT(*) AS total_members,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_members,
          COUNT(*) FILTER (WHERE status = 'WAITING_LIST') AS waiting_members
        FROM "education_group_members"
        WHERE "companyId" = $1
        GROUP BY "groupId"
      ) m ON m."groupId" = g.id
      WHERE g."companyId" = $1
    `;

    const params = [companyId];
    let paramIndex = 2;

    if (subjectId) {
      query += ` AND g."subjectId" = $${paramIndex++}`;
      params.push(subjectId);
    }
    if (teacherId) {
      query += ` AND g."teacherId" = $${paramIndex++}`;
      params.push(teacherId);
    }
    if (status) {
      query += ` AND g."status" = $${paramIndex++}`;
      params.push(status);
    }
    if (search && typeof search === 'string' && search.trim()) {
      query += ` AND (g."name" ILIKE $${paramIndex} OR g."code" ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    query += ` ORDER BY g."createdAt" DESC`;

    const rawGroups = await prisma.$queryRawUnsafe(query, ...params);

    const groups = rawGroups.map(g => {
      let parsedDays = typeof g.scheduleDays === 'string' ? JSON.parse(g.scheduleDays) : (g.scheduleDays || []);
      let parsedSlots = [];
      try {
        parsedSlots = typeof g.scheduleSlots === 'string' ? JSON.parse(g.scheduleSlots) : (g.scheduleSlots || []);
      } catch (_) { parsedSlots = []; }
      if (!parsedSlots.length && Array.isArray(parsedDays) && parsedDays.length) {
        parsedSlots = parsedDays.map(d => ({ day: d, startTime: g.startTime || '17:00', endTime: g.endTime || '18:30' }));
      }
      return {
        ...g,
        totalMembers: Number(g.totalMembers || 0),
        activeMembers: Number(g.activeMembers || 0),
        waitingMembers: Number(g.waitingMembers || 0),
        scheduleDays: parsedDays,
        scheduleSlots: parsedSlots,
        isFull: Number(g.activeMembers || 0) >= (g.capacity || 15)
      };
    });

    return res.json({ success: true, data: groups });
  } catch (err) {
    console.error('[EducationGroups] getAll error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const rawGroup = await prisma.$queryRawUnsafe(`
      SELECT 
        g.*,
        s.name AS "subjectName",
        t.name AS "teacherName",
        t.phone AS "teacherPhone"
      FROM "education_groups" g
      LEFT JOIN "education_subjects" s ON s.id = g."subjectId" AND s."companyId" = g."companyId"
      LEFT JOIN "education_teachers" t ON t.id = g."teacherId" AND t."companyId" = g."companyId"
      WHERE g.id = $1 AND g."companyId" = $2
    `, id, companyId);

    if (!rawGroup || rawGroup.length === 0) {
      return res.status(404).json({ success: false, error: 'المجموعة غير موجودة' });
    }

    const group = {
      ...rawGroup[0],
      scheduleDays: typeof rawGroup[0].scheduleDays === 'string' ? JSON.parse(rawGroup[0].scheduleDays) : (rawGroup[0].scheduleDays || [])
    };

    // Fetch members with student details
    const members = await prisma.$queryRawUnsafe(`
      SELECT 
        m.*,
        st."firstName" AS "studentFirstName",
        st."lastName" AS "studentLastName",
        st.code AS "studentCode",
        st.phone AS "studentPhone",
        c."firstName" AS "guardianFirstName",
        c."lastName" AS "guardianLastName",
        c.phone AS "guardianPhone"
      FROM "education_group_members" m
      INNER JOIN "education_students" st ON st.id = m."studentId" AND st."companyId" = m."companyId"
      LEFT JOIN "customers" c ON c.id = st."customerId" AND c."companyId" = m."companyId"
      WHERE m."groupId" = $1 AND m."companyId" = $2
      ORDER BY m."status" ASC, m."joinedAt" ASC
    `, id, companyId);

    // Fetch sessions (both scheduled and completed, ordered chronologically)
    const sessions = await prisma.$queryRawUnsafe(`
      SELECT 
        s.*,
        COUNT(a.id) FILTER (WHERE a.status = 'PRESENT') AS "presentCount",
        COUNT(a.id) FILTER (WHERE a.status = 'ABSENT') AS "absentCount",
        COUNT(a.id) AS "totalCount"
      FROM "education_group_sessions" s
      LEFT JOIN "education_group_attendance" a ON a."sessionId" = s.id AND a."companyId" = s."companyId"
      WHERE s."groupId" = $1 AND s."companyId" = $2
      GROUP BY s.id
      ORDER BY s."sessionDate" ASC
      LIMIT 200
    `, id, companyId);

    return res.json({
      success: true,
      data: {
        ...group,
        members: members.map(m => ({
          ...m,
          studentName: `${m.studentFirstName || ''} ${m.studentLastName || ''}`.trim(),
          guardianName: `${m.guardianFirstName || ''} ${m.guardianLastName || ''}`.trim()
        })),
        sessions: sessions.map(s => ({
          ...s,
          presentCount: Number(s.presentCount || 0),
          absentCount: Number(s.absentCount || 0),
          totalCount: Number(s.totalCount || 0)
        }))
      }
    });
  } catch (err) {
    console.error('[EducationGroups] getById error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const create = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      name,
      code,
      subjectId,
      teacherId,
      level,
      capacity,
      feeType,
      feeAmount,
      teacherRateType,
      teacherRateValue,
      scheduleDays,
      scheduleSlots,
      startTime,
      endTime,
      room,
      status,
      startDate,
      endDate,
      notes,
      branchId,
      classroomId,
      ageFrom,
      ageTo
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, error: 'اسم المجموعة مطلوب' });
    }

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    // In Courses/Packages mode, subjectId might be omitted. Auto-resolve to default company subject.
    let resolvedSubjectId = subjectId;
    if (!resolvedSubjectId) {
      let defaultSubject = await prisma.educationSubject.findFirst({
        where: { companyId, name: 'عام' }
      });
      if (!defaultSubject) {
        defaultSubject = await prisma.educationSubject.create({
          data: {
            companyId,
            name: 'عام',
            description: 'تصنيف عام للكورسات والمجموعات',
            color: '#6366f1',
            isActive: true
          }
        });
      }
      resolvedSubjectId = defaultSubject.id;
    } else {
      const validSubject = await prisma.educationSubject.findFirst({
        where: { id: subjectId, companyId }
      });
      if (!validSubject) {
        return res.status(400).json({ success: false, error: 'المادة المحددة غير صالحة أو غير تابعة لهذه الشركة' });
      }
    }

    if (teacherId) {
      const validTeacher = await prisma.educationTeacher.findFirst({
        where: { id: teacherId, companyId },
        select: { id: true }
      });
      if (!validTeacher) {
        return res.status(400).json({ success: false, error: 'المدرب المحدد غير صالح أو غير تابع لهذه الشركة' });
      }
    }

    const id = generateGroupId();
    let safeSlots = [];
    if (Array.isArray(scheduleSlots)) {
      safeSlots = scheduleSlots;
    } else if (typeof scheduleSlots === 'string' && scheduleSlots.trim()) {
      try { safeSlots = JSON.parse(scheduleSlots); } catch (_) { safeSlots = []; }
    }
    if (!safeSlots.length && Array.isArray(scheduleDays) && scheduleDays.length) {
      safeSlots = scheduleDays.map(day => ({
        day,
        startTime: startTime || '17:00',
        endTime: endTime || '18:30'
      }));
    }
    const derivedDays = safeSlots.length ? [...new Set(safeSlots.map(s => s.day).filter(Boolean))] : (Array.isArray(scheduleDays) ? scheduleDays : []);
    const daysJson = JSON.stringify(derivedDays);
    const slotsJson = JSON.stringify(safeSlots);
    const primaryStartTime = safeSlots[0]?.startTime || startTime || '17:00';
    const primaryEndTime = safeSlots[0]?.endTime || endTime || '18:30';

    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_groups" (
        "id", "companyId", "name", "code", "subjectId", "teacherId", "level",
        "capacity", "feeType", "feeAmount", "teacherRateType", "teacherRateValue",
        "scheduleDays", "scheduleSlots", "startTime", "endTime", "room", "status",
        "startDate", "endDate", "notes", "branchId", "classroomId", "ageFrom", "ageTo", "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11, $12,
        $13::jsonb, $14::jsonb, $15, $16, $17, $18,
        $19, $20, $21, $22, $23, $24, $25, NOW(), NOW()
      )
    `,
      id,
      companyId,
      name.trim(),
      code ? code.trim() : null,
      resolvedSubjectId,
      teacherId || null,
      level || null,
      capacity ? parseInt(capacity, 10) : 15,
      feeType || 'MONTHLY',
      feeAmount ? parseFloat(feeAmount) : 0,
      teacherRateType || 'PERCENTAGE',
      teacherRateValue ? parseFloat(teacherRateValue) : 50,
      daysJson,
      slotsJson,
      primaryStartTime,
      primaryEndTime,
      room || null,
      status || 'OPEN',
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      notes || null,
      branchId ? String(branchId).trim() : null,
      classroomId ? String(classroomId).trim() : null,
      ageFrom ? parseInt(ageFrom, 10) : null,
      ageTo ? parseInt(ageTo, 10) : null
    );

    let generationResult = null;
    if (req.body.autoGenerateSessions && startDate && endDate) {
      try {
        generationResult = await generateGroupSessionsInternal({
          prisma,
          companyId,
          groupId: id,
          startDate,
          endDate,
          teacherId,
          scheduleSlots: safeSlots,
          scheduleDays: derivedDays,
          startTime: primaryStartTime,
          endTime: primaryEndTime,
          clearFutureScheduled: true
        });
      } catch (genErr) {
        console.warn('[EducationGroups] Auto session generation warning on create:', genErr.message);
      }
    }

    return res.json({
      success: true,
      data: {
        id,
        branchId: branchId || null,
        classroomId: classroomId || null,
        generatedSessionsCount: generationResult?.count || 0,
        message: 'تم إنشاء المجموعة بنجاح'
      }
    });
  } catch (err) {
    console.error('[EducationGroups] create error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const update = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const {
      name,
      code,
      subjectId,
      teacherId,
      level,
      capacity,
      feeType,
      feeAmount,
      teacherRateType,
      teacherRateValue,
      scheduleDays,
      scheduleSlots,
      startTime,
      endTime,
      room,
      status,
      startDate,
      endDate,
      notes,
      branchId,
      classroomId,
      ageFrom,
      ageTo
    } = req.body;

    let safeSlots = [];
    if (Array.isArray(scheduleSlots)) {
      safeSlots = scheduleSlots;
    } else if (typeof scheduleSlots === 'string' && scheduleSlots.trim()) {
      try { safeSlots = JSON.parse(scheduleSlots); } catch (_) { safeSlots = []; }
    }
    if (!safeSlots.length && Array.isArray(scheduleDays) && scheduleDays.length) {
      safeSlots = scheduleDays.map(day => ({
        day,
        startTime: startTime || '17:00',
        endTime: endTime || '18:30'
      }));
    }
    const derivedDays = safeSlots.length ? [...new Set(safeSlots.map(s => s.day).filter(Boolean))] : (Array.isArray(scheduleDays) ? scheduleDays : []);
    const daysJson = JSON.stringify(derivedDays);
    const slotsJson = JSON.stringify(safeSlots);
    const primaryStartTime = safeSlots[0]?.startTime || startTime || null;
    const primaryEndTime = safeSlots[0]?.endTime || endTime || null;

    if (subjectId) {
      const validSubject = await prisma.educationSubject.findFirst({
        where: { id: subjectId, companyId }
      });
      if (!validSubject) {
        return res.status(400).json({ success: false, error: 'المادة المحددة غير صالحة أو غير تابعة لهذه الشركة' });
      }
    }

    if (teacherId) {
      const validTeacher = await prisma.educationTeacher.findFirst({
        where: { id: teacherId, companyId },
        select: { id: true }
      });
      if (!validTeacher) {
        return res.status(400).json({ success: false, error: 'المدرب المحدد غير صالح أو غير تابع لهذه الشركة' });
      }
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "education_groups" SET
        "name" = COALESCE($1, "name"),
        "code" = $2,
        "subjectId" = COALESCE($3, "subjectId"),
        "teacherId" = $4,
        "level" = $5,
        "capacity" = COALESCE($6, "capacity"),
        "feeType" = COALESCE($7, "feeType"),
        "feeAmount" = COALESCE($8, "feeAmount"),
        "teacherRateType" = COALESCE($9, "teacherRateType"),
        "teacherRateValue" = COALESCE($10, "teacherRateValue"),
        "scheduleDays" = $11::jsonb,
        "scheduleSlots" = $12::jsonb,
        "startTime" = COALESCE($13, "startTime"),
        "endTime" = COALESCE($14, "endTime"),
        "room" = $15,
        "status" = COALESCE($16, "status"),
        "startDate" = $17,
        "endDate" = $18,
        "notes" = $19,
        "branchId" = COALESCE($20, "branchId"),
        "classroomId" = COALESCE($21, "classroomId"),
        "ageFrom" = COALESCE($22, "ageFrom"),
        "ageTo" = COALESCE($23, "ageTo"),
        "updatedAt" = NOW()
      WHERE "id" = $24 AND "companyId" = $25
    `,
      name ? name.trim() : null,
      code ? code.trim() : null,
      subjectId || null,
      teacherId || null,
      level || null,
      capacity !== undefined ? parseInt(capacity, 10) : null,
      feeType || null,
      feeAmount !== undefined ? parseFloat(feeAmount) : null,
      teacherRateType || null,
      teacherRateValue !== undefined ? parseFloat(teacherRateValue) : null,
      daysJson,
      slotsJson,
      primaryStartTime,
      primaryEndTime,
      room || null,
      status || null,
      startDate ? new Date(startDate) : null,
      endDate ? new Date(endDate) : null,
      notes || null,
      branchId ? String(branchId).trim() : null,
      classroomId ? String(classroomId).trim() : null,
      ageFrom ? parseInt(ageFrom, 10) : null,
      ageTo ? parseInt(ageTo, 10) : null,
      id,
      companyId
    );

    let generationResult = null;
    if (req.body.autoGenerateSessions && (startDate || endDate)) {
      try {
        generationResult = await generateGroupSessionsInternal({
          prisma,
          companyId,
          groupId: id,
          startDate,
          endDate,
          teacherId,
          scheduleSlots: safeSlots,
          scheduleDays: derivedDays,
          startTime: primaryStartTime,
          endTime: primaryEndTime,
          clearFutureScheduled: true
        });
      } catch (genErr) {
        console.warn('[EducationGroups] Auto session generation warning on update:', genErr.message);
      }
    }

    return res.json({
      success: true,
      generatedSessionsCount: generationResult?.count,
      message: 'تم تحديث المجموعة بنجاح'
    });
  } catch (err) {
    console.error('[EducationGroups] update error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const remove = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_group_attendance" WHERE "groupId" = $1 AND "companyId" = $2
    `, id, companyId);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_group_sessions" WHERE "groupId" = $1 AND "companyId" = $2
    `, id, companyId);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_group_members" WHERE "groupId" = $1 AND "companyId" = $2
    `, id, companyId);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_groups" WHERE "id" = $1 AND "companyId" = $2
    `, id, companyId);

    return res.json({ success: true, message: 'تم حذف المجموعة بنجاح' });
  } catch (err) {
    console.error('[EducationGroups] remove error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Member management
const addMember = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: groupId } = req.params;
    const { studentId, paymentStatus, amountPaid, notes, forceActive } = req.body;

    if (!studentId) {
      return res.status(400).json({ success: false, error: 'معرف الطالب مطلوب' });
    }

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    // Verify student belongs to this tenant
    const validStudent = await prisma.educationStudent.findFirst({
      where: { id: studentId, companyId },
      select: { id: true }
    });
    if (!validStudent) {
      return res.status(404).json({ success: false, error: 'الطالب غير موجود أو غير تابع لهذه الشركة' });
    }

    // Check if group exists and check capacity
    const groupRows = await prisma.$queryRawUnsafe(`
      SELECT g.id, g."name", g."feeType", g."feeAmount", g.capacity,
             COALESCE(COUNT(m.id) FILTER (WHERE m.status = 'ACTIVE'), 0) AS active_count
      FROM "education_groups" g
      LEFT JOIN "education_group_members" m ON m."groupId" = g.id AND m."companyId" = g."companyId"
      WHERE g.id = $1 AND g."companyId" = $2
      GROUP BY g.id, g."name", g."feeType", g."feeAmount", g.capacity
    `, groupId, companyId);

    if (!groupRows || groupRows.length === 0) {
      return res.status(404).json({ success: false, error: 'المجموعة غير موجودة' });
    }

    const group = groupRows[0];
    const isFull = Number(group.active_count) >= Number(group.capacity);
    const memberStatus = (isFull && !forceActive) ? 'WAITING_LIST' : 'ACTIVE';

    // Check duplicate enrollment (only if currently active or waiting)
    const existing = await prisma.$queryRawUnsafe(`
      SELECT id, status FROM "education_group_members"
      WHERE "groupId" = $1 AND "studentId" = $2 AND "companyId" = $3 AND "status" IN ('ACTIVE', 'WAITING_LIST')
    `, groupId, studentId, companyId);

    if (existing && existing.length > 0) {
      return res.status(400).json({ success: false, error: 'الطالب مسجل بالفعل في هذه المجموعة' });
    }

    const memberId = generateMemberId();
    const initialPaid = amountPaid ? parseFloat(amountPaid) : 0;
    const initialPaymentStatus = paymentStatus || 'PAID';
    const isMonthlyGroup = String(group.feeType || '').toUpperCase() === 'MONTHLY';
    const initialRenewalDate = isMonthlyGroup && initialPaymentStatus === 'PAID'
      ? (() => { const d = new Date(); d.setMonth(d.getMonth() + 1); return d; })()
      : null;

    const runInTx = typeof prisma.$transaction === 'function'
      ? (fn) => prisma.$transaction(fn)
      : (fn) => fn(prisma);

    // Member row, capacity flag, ledger entry and treasury deposit commit together.
    await runInTx(async (tx) => {
      await tx.$executeRawUnsafe(`
        INSERT INTO "education_group_members" (
          "id", "companyId", "groupId", "studentId", "status", "paymentStatus", "amountPaid", "nextRenewalDate", "notes", "joinedAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW()
        )
      `,
        memberId,
        companyId,
        groupId,
        studentId,
        memberStatus,
        initialPaymentStatus,
        initialPaid,
        initialRenewalDate,
        notes || null
      );

      if (isFull) {
        await tx.$executeRawUnsafe(`
          UPDATE "education_groups" SET "status" = 'FULL' WHERE "id" = $1 AND "companyId" = $2 AND "status" = 'OPEN'
        `, groupId, companyId);
      }

      const paidNum = initialPaid;
      if (paidNum > 0 && (initialPaymentStatus === 'PAID' || initialPaymentStatus === 'PARTIAL')) {
        const studentInfo = await tx.educationStudent.findUnique({
          where: { id: studentId },
          select: { firstName: true, lastName: true }
        });
        const groupInfo = group.name || 'مجموعة دراسية';
        const studentName = studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}`.trim() : 'طالب';

        const educationFinancialService = require('../services/educationFinancialIntegrationService');
        await educationFinancialService.recordEducationRevenueInTx(tx, {
          companyId,
          sourceType: 'EDUCATION_GROUP_FEE',
          sourceId: memberId,
          studentName,
          title: `تحصيل رسوم مجموعة (${groupInfo})`,
          amount: paidNum,
          createdById: req.user?.id
        });

        // 🧾 Unified payment ledger entry
        const now = new Date();
        const prefix = `EDU-PAY-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-`;
        const lastPayment = await tx.educationPayment.findFirst({
          where: { companyId, paymentNumber: { startsWith: prefix } },
          orderBy: { paymentNumber: 'desc' },
          select: { paymentNumber: true }
        });
        let seq = 1;
        if (lastPayment?.paymentNumber) {
          const parsed = parseInt(String(lastPayment.paymentNumber).split('-').pop(), 10);
          if (!Number.isNaN(parsed)) seq = parsed + 1;
        }
        const paymentNumber = `${prefix}${String(seq).padStart(4, '0')}`;
        await tx.educationPayment.create({
          data: {
            companyId,
            paymentNumber,
            receiptNumber: paymentNumber.replace('EDU-PAY-', 'RCP-'),
            studentId,
            groupId,
            groupMemberId: memberId,
            studentName: studentInfo ? `${studentInfo.firstName} ${studentInfo.lastName}`.trim() : null,
            amount: paidNum,
            method: 'CASH',
            status: 'COMPLETED',
            source: 'GROUP',
            notes: `تسجيل عضو جديد في مجموعة ${groupInfo}`,
            paidAt: now,
            cashierId: req.user?.id || null,
            cashierName: req.user?.name || [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') || null
          }
        });
      }
    });

    return res.json({
      success: true,
      data: {
        memberId,
        status: memberStatus,
        message: memberStatus === 'WAITING_LIST'
          ? 'تم إضافة الطالب في قائمة الانتظار لاكتمال العدد'
          : 'تم تسجيل الطالب في المجموعة بنجاح'
      }
    });
  } catch (err) {
    console.error('[EducationGroups] addMember error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const removeMember = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: groupId, studentId } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_group_members"
      WHERE "groupId" = $1 AND "studentId" = $2 AND "companyId" = $3
    `, groupId, studentId, companyId);

    // Auto-promote oldest waiting student if available
    const waitingStudent = await prisma.$queryRawUnsafe(`
      SELECT id FROM "education_group_members"
      WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'WAITING_LIST'
      ORDER BY "joinedAt" ASC
      LIMIT 1
    `, groupId, companyId);

    if (waitingStudent && waitingStudent.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE "education_group_members" SET
          "status" = 'ACTIVE',
          "updatedAt" = NOW()
        WHERE "id" = $1 AND "companyId" = $2
      `, waitingStudent[0].id, companyId);
    } else {
      await prisma.$executeRawUnsafe(`
        UPDATE "education_groups" SET "status" = 'OPEN' WHERE "id" = $1 AND "companyId" = $2 AND "status" = 'FULL'
      `, groupId, companyId);
    }

    return res.json({ success: true, message: 'تم إزالة الطالب من المجموعة' });
  } catch (err) {
    console.error('[EducationGroups] removeMember error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const transferMember = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: fromGroupId } = req.params;
    const { studentId, targetGroupId } = req.body;

    if (!studentId || !targetGroupId) {
      return res.status(400).json({ success: false, error: 'معرف الطالب والمجموعة المستهدفة مطلوبان' });
    }

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    // Fetch previous payment details (and verify membership in source group for this tenant)
    const oldMember = await prisma.$queryRawUnsafe(`
      SELECT "paymentStatus", "amountPaid" FROM "education_group_members"
      WHERE "groupId" = $1 AND "studentId" = $2 AND "companyId" = $3 AND "status" IN ('ACTIVE', 'WAITING_LIST')
      ORDER BY "joinedAt" DESC LIMIT 1
    `, fromGroupId, studentId, companyId);
    if (!oldMember || oldMember.length === 0) {
      return res.status(404).json({ success: false, error: 'الطالب غير مسجل في المجموعة الأصلية' });
    }
    const prevPaymentStatus = oldMember[0].paymentStatus || 'PAID';
    const prevAmountPaid = oldMember[0].amountPaid || 0;

    // Update old membership to TRANSFERRED
    await prisma.$executeRawUnsafe(`
      UPDATE "education_group_members" SET
        "status" = 'TRANSFERRED',
        "updatedAt" = NOW()
      WHERE "groupId" = $1 AND "studentId" = $2 AND "companyId" = $3
    `, fromGroupId, studentId, companyId);

    // Auto-promote oldest waiting student from original group if available
    const waitingStudent = await prisma.$queryRawUnsafe(`
      SELECT id FROM "education_group_members"
      WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'WAITING_LIST'
      ORDER BY "joinedAt" ASC
      LIMIT 1
    `, fromGroupId, companyId);

    if (waitingStudent && waitingStudent.length > 0) {
      await prisma.$executeRawUnsafe(`
        UPDATE "education_group_members" SET
          "status" = 'ACTIVE',
          "updatedAt" = NOW()
        WHERE "id" = $1 AND "companyId" = $2
      `, waitingStudent[0].id, companyId);
    }

    // Check target group exists in same tenant and check capacity
    const targetGroupRows = await prisma.$queryRawUnsafe(`
      SELECT g.id, g.capacity, COALESCE(COUNT(m.id) FILTER (WHERE m.status = 'ACTIVE'), 0) AS active_count
      FROM "education_groups" g
      LEFT JOIN "education_group_members" m ON m."groupId" = g.id AND m."companyId" = g."companyId"
      WHERE g.id = $1 AND g."companyId" = $2
      GROUP BY g.id, g.capacity
    `, targetGroupId, companyId);

    if (!targetGroupRows || targetGroupRows.length === 0) {
      return res.status(404).json({ success: false, error: 'المجموعة المستهدفة غير موجودة' });
    }

    const isTargetFull = Number(targetGroupRows[0].active_count) >= Number(targetGroupRows[0].capacity);
    const targetStatus = isTargetFull ? 'WAITING_LIST' : 'ACTIVE';

    // Add into target group with carried over payment
    const newMemberId = generateMemberId();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_group_members" (
        "id", "companyId", "groupId", "studentId", "status", "paymentStatus", "amountPaid", "notes", "joinedAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW()
      )
    `,
      newMemberId,
      companyId,
      targetGroupId,
      studentId,
      targetStatus,
      prevPaymentStatus,
      prevAmountPaid,
      `تم النقل من المجموعة: ${fromGroupId}`
    );

    return res.json({
      success: true,
      message: targetStatus === 'WAITING_LIST'
        ? 'تم نقل الطالب إلى قائمة الانتظار بالمجموعة الجديدة لاكتمال عددها'
        : 'تم نقل الطالب إلى المجموعة الجديدة بنجاح'
    });
  } catch (err) {
    console.error('[EducationGroups] transferMember error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// Sessions & Attendance
const recordSession = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: groupId } = req.params;
    const {
      sessionDate,
      teacherId,
      topic,
      homework,
      notes,
      attendanceList, // [{ studentId, status: 'PRESENT' | 'ABSENT' | 'EXCUSED', notes }]
      notifyAbsentWhatsApp
    } = req.body;

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    // Verify group belongs to this tenant before recording session
    const groupCheck = await prisma.$queryRawUnsafe(`
      SELECT id FROM "education_groups" WHERE id = $1 AND "companyId" = $2 LIMIT 1
    `, groupId, companyId);
    if (!groupCheck || groupCheck.length === 0) {
      return res.status(404).json({ success: false, error: 'المجموعة غير موجودة' });
    }

    let sessionId = req.body.sessionId;
    const date = sessionDate ? new Date(sessionDate) : new Date();

    if (sessionId) {
      const existingSession = await prisma.$queryRawUnsafe(`
        SELECT id FROM "education_group_sessions" WHERE id = $1 AND "groupId" = $2 AND "companyId" = $3
      `, sessionId, groupId, companyId);
      if (existingSession && existingSession.length > 0) {
        await prisma.$executeRawUnsafe(`
          UPDATE "education_group_sessions"
          SET "status" = 'COMPLETED',
              "teacherId" = COALESCE($1, "teacherId"),
              "topic" = COALESCE($2, "topic"),
              "homework" = COALESCE($3, "homework"),
              "notes" = COALESCE($4, "notes"),
              "sessionDate" = $5
          WHERE id = $6 AND "companyId" = $7
        `, teacherId || null, topic || null, homework || null, notes || null, date, sessionId, companyId);
      } else {
        sessionId = null;
      }
    }

    if (!sessionId) {
      sessionId = generateSessionId();
      await prisma.$executeRawUnsafe(`
        INSERT INTO "education_group_sessions" (
          "id", "companyId", "groupId", "teacherId", "sessionDate", "topic", "homework", "status", "notes", "createdAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, 'COMPLETED', $8, NOW()
        )
      `,
        sessionId,
        companyId,
        groupId,
        teacherId || null,
        date,
        topic || null,
        homework || null,
        notes || null
      );
    } else {
      // Clear previous attendance for this session if re-recording/updating
      await prisma.$executeRawUnsafe(`
        DELETE FROM "education_group_attendance" WHERE "sessionId" = $1 AND "companyId" = $2
      `, sessionId, companyId);
    }

    // Insert attendance records (tenant-verified students only)
    if (Array.isArray(attendanceList) && attendanceList.length > 0) {
      const requestedStudentIds = Array.from(
        new Set(attendanceList.map(it => it && it.studentId).filter(Boolean))
      );
      const tenantStudents = requestedStudentIds.length > 0
        ? await prisma.educationStudent.findMany({
            where: { id: { in: requestedStudentIds }, companyId },
            include: { customer: true }
          })
        : [];
      const studentMap = new Map(tenantStudents.map(st => [st.id, st]));

      for (const item of attendanceList) {
        if (!item || !item.studentId || !studentMap.has(item.studentId)) {
          continue;
        }
        const attId = generateAttId();
        let notifiedAt = null;

        // Notify absent parent if requested
        if (notifyAbsentWhatsApp && item.status === 'ABSENT') {
          try {
            const st = studentMap.get(item.studentId);
            const phone = st?.customer?.phone || st?.phone;
            if (phone) {
              const studentName = `${st.firstName || ''} ${st.lastName || ''}`.trim();
              const parentName = st.customer?.firstName || 'ولي الأمر';
              const educationNotificationService = require('../services/educationNotificationService');
              const notifResult = await educationNotificationService.notifyAbsenceAlert({
                companyId,
                studentName,
                parentName,
                phone,
              }).catch(waErr => {
                console.error('[EducationGroups] Send absence alert error:', waErr.message);
                return null;
              });
              if (notifResult && notifResult.success !== false) notifiedAt = new Date();
            }
          } catch (notifErr) {
            console.error('[EducationGroups] Absence notification failed:', notifErr.message);
          }
        }

        await prisma.$executeRawUnsafe(`
          INSERT INTO "education_group_attendance" (
            "id", "companyId", "sessionId", "groupId", "studentId", "status", "notes", "notifiedParentAt", "createdAt"
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, NOW()
          )
        `,
          attId,
          companyId,
          sessionId,
          groupId,
          item.studentId,
          item.status || 'PRESENT',
          item.notes || null,
          notifiedAt
        );
      }
    }

    return res.json({
      success: true,
      data: {
        sessionId,
        message: 'تم تسجيل المحاضرة وتوثيق الحضور والغياب بنجاح'
      }
    });
  } catch (err) {
    console.error('[EducationGroups] recordSession error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const getFinancials = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: groupId } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const groupRows = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_groups" WHERE "id" = $1 AND "companyId" = $2
    `, groupId, companyId);

    if (!groupRows || groupRows.length === 0) {
      return res.status(404).json({ success: false, error: 'المجموعة غير موجودة' });
    }
    const group = groupRows[0];

    // Total collections
    const revenueRows = await prisma.$queryRawUnsafe(`
      SELECT 
        COUNT(id) AS total_students,
        COUNT(id) FILTER (WHERE "paymentStatus" = 'PAID') AS paid_count,
        COALESCE(SUM("amountPaid"), 0) AS total_collected
      FROM "education_group_members"
      WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'ACTIVE'
    `, groupId, companyId);

    const totalStudents = Number(revenueRows[0]?.total_students || 0);
    const paidCount = Number(revenueRows[0]?.paid_count || 0);
    const totalCollected = parseFloat(revenueRows[0]?.total_collected || 0);

    // Total completed sessions
    const sessionRows = await prisma.$queryRawUnsafe(`
      SELECT COUNT(id) AS session_count
      FROM "education_group_sessions"
      WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'COMPLETED'
    `, groupId, companyId);
    const sessionCount = Number(sessionRows[0]?.session_count || 0);

    // Calculate teacher share
    let teacherShare = 0;
    if (group.teacherRateType === 'PERCENTAGE') {
      teacherShare = (totalCollected * (group.teacherRateValue || 50)) / 100;
    } else if (group.teacherRateType === 'FIXED_PER_SESSION') {
      teacherShare = (group.teacherRateValue || 0) * sessionCount;
    } else if (group.teacherRateType === 'PER_STUDENT') {
      teacherShare = (group.teacherRateValue || 0) * totalStudents;
    }

    teacherShare = Math.round(teacherShare * 100) / 100;
    const centerProfit = Math.round((totalCollected - teacherShare) * 100) / 100;

    return res.json({
      success: true,
      data: {
        groupId,
        groupName: group.name,
        feeType: group.feeType,
        feeAmount: group.feeAmount,
        totalStudents,
        paidCount,
        totalCollected,
        sessionCount,
        teacherRateType: group.teacherRateType,
        teacherRateValue: group.teacherRateValue,
        teacherShare,
        centerProfit
      }
    });
  } catch (err) {
    console.error('[EducationGroups] getFinancials error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

const DAY_NAME_TO_INDEX = {
  'SUNDAY': 0, 'SUN': 0, '0': 0, 'الأحد': 0, 'الاحد': 0,
  'MONDAY': 1, 'MON': 1, '1': 1, 'الاثنين': 1, 'الإثنين': 1,
  'TUESDAY': 2, 'TUE': 2, '2': 2, 'الثلاثاء': 2,
  'WEDNESDAY': 3, 'WED': 3, '3': 3, 'الأربعاء': 3, 'الاربعاء': 3,
  'THURSDAY': 4, 'THU': 4, '4': 4, 'الخميس': 4,
  'FRIDAY': 5, 'FRI': 5, '5': 5, 'الجمعة': 5,
  'SATURDAY': 6, 'SAT': 6, '6': 6, 'السبت': 6
};

const generateGroupSessionsInternal = async ({
  prisma,
  companyId,
  groupId,
  startDate,
  endDate,
  teacherId,
  scheduleSlots,
  scheduleDays,
  startTime,
  endTime,
  clearFutureScheduled = true
}) => {
  const groupRows = await prisma.$queryRawUnsafe(`
    SELECT * FROM "education_groups" WHERE id = $1 AND "companyId" = $2
  `, groupId, companyId);
  if (!groupRows || groupRows.length === 0) {
    throw new Error('المجموعة غير موجودة');
  }
  const group = groupRows[0];

  const effectiveTeacherId = teacherId || group.teacherId;
  const effectiveStart = startDate ? new Date(startDate) : (group.startDate ? new Date(group.startDate) : new Date());
  const effectiveEnd = endDate ? new Date(endDate) : (group.endDate ? new Date(group.endDate) : new Date(Date.now() + 30 * 864e5));

  if (!effectiveStart || isNaN(effectiveStart.getTime())) {
    throw new Error('تاريخ بداية المجموعة مطلوب لتوليد الحصص');
  }
  if (!effectiveEnd || isNaN(effectiveEnd.getTime())) {
    throw new Error('تاريخ نهاية المجموعة مطلوب لتوليد الحصص');
  }
  if (effectiveEnd < effectiveStart) {
    throw new Error('تاريخ النهاية يجب أن يكون بعد تاريخ البداية');
  }

  const diffDays = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 366) {
    throw new Error('الفترة الزمنية القصوى لتوليد الحصص هي سنة واحدة');
  }

  // Update group record with startDate and endDate
  await prisma.$executeRawUnsafe(`
    UPDATE "education_groups"
    SET "startDate" = $1, "endDate" = $2, "updatedAt" = NOW()
    WHERE id = $3 AND "companyId" = $4
  `, effectiveStart, effectiveEnd, groupId, companyId);

  // Parse slots
  let slots = [];
  if (Array.isArray(scheduleSlots) && scheduleSlots.length > 0) {
    slots = scheduleSlots;
  } else if (typeof scheduleSlots === 'string' && scheduleSlots.trim()) {
    try { slots = JSON.parse(scheduleSlots); } catch (_) {}
  }
  if (slots.length === 0 && group.scheduleSlots) {
    try {
      slots = typeof group.scheduleSlots === 'string' ? JSON.parse(group.scheduleSlots) : group.scheduleSlots;
    } catch (_) {}
  }
  if (!Array.isArray(slots) || slots.length === 0) {
    let days = scheduleDays || group.scheduleDays;
    if (typeof days === 'string') {
      try { days = JSON.parse(days); } catch (_) { days = []; }
    }
    if (Array.isArray(days) && days.length > 0) {
      const defaultStart = startTime || group.startTime || '17:00';
      const defaultEnd = endTime || group.endTime || '18:30';
      slots = days.map(d => ({
        dayOfWeek: d,
        startTime: defaultStart,
        endTime: defaultEnd,
        room: group.room || ''
      }));
    }
  }

  if (!slots || slots.length === 0) {
    throw new Error('يجب تحديد جدول مواعيد وأيام للمجموعة لتوليد الحصص');
  }

  const normalizedSlots = [];
  for (const slot of slots) {
    const rawDay = String(slot.dayOfWeek || slot.day || '').trim().toUpperCase();
    const dayIdx = DAY_NAME_TO_INDEX[rawDay];
    if (dayIdx !== undefined) {
      normalizedSlots.push({
        dayIdx,
        startTime: slot.startTime || group.startTime || '17:00',
        endTime: slot.endTime || group.endTime || '18:30',
        room: slot.room || group.room || ''
      });
    }
  }

  if (normalizedSlots.length === 0) {
    throw new Error('أيام الجدول المحددة غير صالحة');
  }

  const now = new Date();
  if (clearFutureScheduled) {
    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_group_sessions"
      WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'SCHEDULED' AND "sessionDate" >= $3
    `, groupId, companyId, now);
  }

  const existingRows = await prisma.$queryRawUnsafe(`
    SELECT "sessionDate" FROM "education_group_sessions"
    WHERE "groupId" = $1 AND "companyId" = $2
  `, groupId, companyId);
  const existingDatesSet = new Set(
    existingRows.map(r => new Date(r.sessionDate).toISOString().slice(0, 10))
  );

  const countCompletedRows = await prisma.$queryRawUnsafe(`
    SELECT COUNT(id) AS cnt FROM "education_group_sessions"
    WHERE "groupId" = $1 AND "companyId" = $2 AND "status" = 'COMPLETED'
  `, groupId, companyId);
  let lectureNumber = 1 + Number(countCompletedRows[0]?.cnt || 0);

  const sessionsToCreate = [];
  const conflicts = [];
  const current = new Date(effectiveStart);
  current.setHours(0, 0, 0, 0);
  const endLimit = new Date(effectiveEnd);
  endLimit.setHours(23, 59, 59, 999);

  let loopSafety = 0;
  while (current <= endLimit && loopSafety < 366) {
    loopSafety++;
    const currentDayIdx = current.getDay();
    const matchingSlots = normalizedSlots.filter(s => s.dayIdx === currentDayIdx);

    for (const slot of matchingSlots) {
      const dateStr = current.toISOString().slice(0, 10);
      if (existingDatesSet.has(dateStr) && !clearFutureScheduled) {
        continue;
      }

      const [startHour, startMin] = (slot.startTime || '17:00').split(':').map(n => parseInt(n, 10) || 0);
      const [endHour, endMin] = (slot.endTime || '18:30').split(':').map(n => parseInt(n, 10) || 0);

      const sessionDateTime = new Date(current);
      sessionDateTime.setHours(startHour, startMin, 0, 0);

      const sessionEndDateTime = new Date(current);
      sessionEndDateTime.setHours(endHour, endMin, 0, 0);

      if (effectiveTeacherId) {
        try {
          const conflictPrivate = await prisma.educationSession.findFirst({
            where: {
              companyId,
              teacherId: effectiveTeacherId,
              status: { not: 'CANCELLED' },
              scheduledAt: {
                gte: new Date(sessionDateTime.getTime() - 30 * 60000),
                lte: new Date(sessionEndDateTime.getTime() + 30 * 60000)
              }
            },
            include: { student: { select: { firstName: true, lastName: true } } }
          });

          if (conflictPrivate) {
            const pStart = new Date(conflictPrivate.scheduledAt);
            const pEnd = new Date(pStart.getTime() + (conflictPrivate.plannedDuration || 60) * 60000);
            if (sessionDateTime < pEnd && sessionEndDateTime > pStart) {
              conflicts.push({
                date: sessionDateTime,
                conflictWith: `حصة خاصة مع الطالب ${conflictPrivate.student?.firstName || ''} ${conflictPrivate.student?.lastName || ''}`.trim()
              });
            }
          }
        } catch (_) {}
      }

      // Check room conflict across other groups
      const targetRoom = (slot.room || group.room || '').trim();
      if (targetRoom) {
        try {
          const roomConflict = await prisma.$queryRawUnsafe(`
            SELECT gs.id, gs."sessionDate", g.name AS "groupName"
            FROM "education_group_sessions" gs
            JOIN "education_groups" g ON g.id = gs."groupId" AND g."companyId" = gs."companyId"
            WHERE gs."companyId" = $1
              AND gs."groupId" != $2
              AND gs."sessionDate" = $3
              AND gs."status" != 'CANCELLED'
              AND (
                LOWER(TRIM(COALESCE(g.room, ''))) = LOWER(TRIM($4))
                OR LOWER(TRIM(COALESCE(gs.notes, ''))) LIKE LOWER(CONCAT('%', $4, '%'))
              )
            LIMIT 1
          `, companyId, groupId, sessionDateTime, targetRoom);

          if (roomConflict && roomConflict.length > 0) {
            conflicts.push({
              date: sessionDateTime,
              conflictWith: `تعارض القاعة «${targetRoom}» مع المحاضرة المجدولة لمجموعة «${roomConflict[0].groupName}»`
            });
          }
        } catch (_) {}
      }

      const sessionId = generateSessionId();
      sessionsToCreate.push({
        id: sessionId,
        companyId,
        groupId,
        teacherId: effectiveTeacherId || null,
        sessionDate: sessionDateTime,
        topic: `المحاضرة ${lectureNumber}`,
        homework: null,
        status: sessionDateTime < now ? 'COMPLETED' : 'SCHEDULED',
        notes: slot.room ? `القاعة: ${slot.room}` : null
      });

      lectureNumber++;
    }

    current.setDate(current.getDate() + 1);
  }

  for (const s of sessionsToCreate) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_group_sessions" (
        "id", "companyId", "groupId", "teacherId", "sessionDate", "topic", "homework", "status", "notes", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, NOW()
      )
    `,
      s.id,
      s.companyId,
      s.groupId,
      s.teacherId,
      s.sessionDate,
      s.topic,
      s.homework,
      s.status,
      s.notes
    );
  }

  return {
    success: true,
    count: sessionsToCreate.length,
    conflicts,
    message: `تم توليد ${sessionsToCreate.length} حصة بنجاح للمجموعة`
  };
};

const generateSessions = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: groupId } = req.params;
    const {
      startDate,
      endDate,
      teacherId,
      scheduleSlots,
      scheduleDays,
      startTime,
      endTime,
      clearFutureScheduled
    } = req.body;

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const result = await generateGroupSessionsInternal({
      prisma,
      companyId,
      groupId,
      startDate,
      endDate,
      teacherId,
      scheduleSlots,
      scheduleDays,
      startTime,
      endTime,
      clearFutureScheduled: clearFutureScheduled !== false
    });

    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[EducationGroups] generateSessions error:', err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  addMember,
  removeMember,
  transferMember,
  recordSession,
  getFinancials,
  generateSessions,
  generateGroupSessionsInternal
};
