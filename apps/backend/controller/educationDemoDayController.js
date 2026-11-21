const sharedDatabase = require('../services/sharedDatabase');
const getSharedPrismaClient = () => sharedDatabase.getSharedPrismaClient();
const {
  ensureTablesExist,
  generateDemoDayId,
  generateAttendeeId
} = require('../services/educationDemoDayService');
const { logEducationEvent } = require('../services/educationAuditService');
const { generateUniqueStudentCode } = require('./educationStudentsController');
const {
  normalizeSourceChannel,
  normalizeRegisteredByType,
  extractAttributionFromNotes,
  buildAttributionTag,
  getChannelArabicLabel,
  getRegisteredByTypeArabicLabel,
} = require('../services/educationAttributionHelper');

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

const resolveClassroomName = (classroomId, branchClassrooms, fallbackRoom = null) => {
  if (!classroomId) return fallbackRoom || null;
  if (branchClassrooms) {
    try {
      const rooms = typeof branchClassrooms === 'string' ? JSON.parse(branchClassrooms) : branchClassrooms;
      if (Array.isArray(rooms)) {
        const found = rooms.find(r => String(r.id) === String(classroomId));
        if (found && found.name) return found.name;
      }
    } catch (_) {}
  }
  return classroomId || fallbackRoom || null;
};

// 1. Get all demo days with counts
const getAllDemoDays = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const { status, search } = req.query;

    let query = `
      SELECT 
        d.*,
        s.name AS "subjectName",
        t.name AS "teacherName",
        b.name AS "branchName",
        b.address AS "branchAddress",
        b.city AS "branchCity",
        b.phone AS "branchPhone",
        b.classrooms AS "branchClassrooms",
        COALESCE(d."googleMapsUrl", b."googleMapsUrl") AS "branchGoogleMapsUrl",
        COALESCE(a.total_attendees, 0)::integer AS "totalAttendees",
        COALESCE(a.attended_count, 0)::integer AS "attendedCount",
        COALESCE(a.converted_count, 0)::integer AS "convertedCount"
      FROM "education_demo_days" d
      LEFT JOIN "education_subjects" s ON s.id = d."subjectId" AND s."companyId" = d."companyId"
      LEFT JOIN "education_teachers" t ON t.id = d."teacherId" AND t."companyId" = d."companyId"
      LEFT JOIN "branches" b ON b.id = d."branchId" AND b."companyId" = d."companyId"
      LEFT JOIN (
        SELECT 
          "demoDayId",
          COUNT(*)::integer AS total_attendees,
          COUNT(*) FILTER (WHERE "attendanceStatus" = 'ATTENDED')::integer AS attended_count,
          COUNT(*) FILTER (WHERE "conversionStatus" = 'CONVERTED')::integer AS converted_count
        FROM "education_demo_attendees"
        WHERE "companyId" = $1
        GROUP BY "demoDayId"
      ) a ON a."demoDayId" = d.id
      WHERE d."companyId" = $1
    `;

    const params = [companyId];

    if (status && status !== 'ALL') {
      params.push(status);
      query += ` AND d.status = $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      query += ` AND (d.title ILIKE $${params.length} OR d.description ILIKE $${params.length})`;
    }

    query += ` ORDER BY d."scheduledAt" DESC`;

    const demoDays = await prisma.$queryRawUnsafe(query, ...params);
    const sanitized = (demoDays || []).map(d => ({
      ...d,
      classroomName: resolveClassroomName(d.classroomId, d.branchClassrooms, d.room),
      totalAttendees: Number(d.totalAttendees || 0),
      attendedCount: Number(d.attendedCount || 0),
      convertedCount: Number(d.convertedCount || 0)
    }));

    res.json({ success: true, data: sanitized });
  } catch (error) {
    console.error('Error in getAllDemoDays:', error);
    res.status(500).json({ success: false, error: 'فشل جلب فعاليات الديمو داي' });
  }
};

// 2. Get single demo day with its attendees
const getDemoDayById = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const demoDays = await prisma.$queryRawUnsafe(`
      SELECT 
        d.*,
        s.name AS "subjectName",
        t.name AS "teacherName",
        b.name AS "branchName",
        b.address AS "branchAddress",
        b.city AS "branchCity",
        b.phone AS "branchPhone",
        b.classrooms AS "branchClassrooms",
        COALESCE(d."googleMapsUrl", b."googleMapsUrl") AS "branchGoogleMapsUrl"
      FROM "education_demo_days" d
      LEFT JOIN "education_subjects" s ON s.id = d."subjectId" AND s."companyId" = d."companyId"
      LEFT JOIN "education_teachers" t ON t.id = d."teacherId" AND t."companyId" = d."companyId"
      LEFT JOIN "branches" b ON b.id = d."branchId" AND b."companyId" = d."companyId"
      WHERE d.id = $1 AND d."companyId" = $2
    `, id, companyId);

    if (!demoDays.length) {
      return res.status(404).json({ success: false, error: 'الفعالية غير موجودة' });
    }

    const event = demoDays[0];
    const classroomName = resolveClassroomName(event.classroomId, event.branchClassrooms, event.room);

    const attendees = await prisma.$queryRawUnsafe(`
      SELECT 
        a.*,
        c."leadStage",
        c."leadPriority",
        COALESCE(b.name, d_b.name) AS "branchName",
        COALESCE(b.city, d_b.city) AS "branchCity",
        COALESCE(b.address, d_b.address) AS "branchAddress",
        stu.code AS "studentCode"
      FROM "education_demo_attendees" a
      LEFT JOIN "customers" c ON c.id = a."customerId"
      LEFT JOIN "education_demo_days" d ON d.id = a."demoDayId"
      LEFT JOIN "branches" b ON b.id = a."branchId"
      LEFT JOIN "branches" d_b ON d_b.id = d."branchId"
      LEFT JOIN "education_students" stu ON stu.id = a."convertedStudentId"
      WHERE a."demoDayId" = $1 AND a."companyId" = $2
      ORDER BY a."createdAt" DESC
    `, id, companyId);

    res.json({
      success: true,
      data: {
        ...event,
        classroomName,
        attendees
      }
    });
  } catch (error) {
    console.error('Error in getDemoDayById:', error);
    res.status(500).json({ success: false, error: 'فشل جلب تفاصيل الديمو داي' });
  }
};

// 3. Create Demo Day
const createDemoDay = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const {
      title,
      description,
      subjectId,
      teacherId,
      scheduledAt,
      durationMinutes,
      locationType,
      meetingLink,
      room,
      capacity,
      notes,
      branchId,
      classroomId,
      googleMapsUrl
    } = req.body;

    if (!title || !scheduledAt) {
      return res.status(400).json({ success: false, error: 'عنوان الفعالية وتاريخ الانعقاد مطلوبان' });
    }

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const id = generateDemoDayId();
    const duration = parseInt(durationMinutes, 10) || 60;
    const cap = parseInt(capacity, 10) || 20;
    const loc = locationType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE';
    const parsedDate = new Date(scheduledAt);

    let finalBranchId = branchId ? String(branchId).trim() : null;
    let finalClassroomId = classroomId ? String(classroomId).trim() : null;
    let finalGoogleMapsUrl = googleMapsUrl ? String(googleMapsUrl).trim() : null;

    // If branchId is provided and googleMapsUrl is empty, auto-lookup branch's googleMapsUrl
    if (finalBranchId && !finalGoogleMapsUrl) {
      try {
        const branchRows = await prisma.$queryRawUnsafe(`
          SELECT "googleMapsUrl" FROM "branches" WHERE id = $1 AND "companyId" = $2
        `, finalBranchId, companyId);
        if (branchRows.length > 0 && branchRows[0].googleMapsUrl) {
          finalGoogleMapsUrl = branchRows[0].googleMapsUrl;
        }
      } catch (err) {
        console.warn('Failed to lookup branch googleMapsUrl on create:', err.message);
      }
    }

    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_demo_days" (
        "id", "companyId", "title", "description", "subjectId", "teacherId",
        "scheduledAt", "durationMinutes", "locationType", "meetingLink", "room",
        "capacity", "status", "notes", "branchId", "classroomId", "googleMapsUrl",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'SCHEDULED', $13,
        $14, $15, $16, NOW(), NOW()
      )
    `, id, companyId, title.trim(), description || null, subjectId || null, teacherId || null,
       parsedDate, duration, loc, meetingLink || null, room || null, cap, notes || null,
       finalBranchId, finalClassroomId, finalGoogleMapsUrl);

    await logEducationEvent({
      companyId,
      req,
      action: 'CREATE_DEMO_DAY',
      entityType: 'DEMO_DAY',
      entityId: id,
      targetName: title
    });

    res.status(201).json({
      success: true,
      data: {
        id,
        title,
        scheduledAt: parsedDate,
        branchId: finalBranchId,
        classroomId: finalClassroomId,
        googleMapsUrl: finalGoogleMapsUrl
      }
    });
  } catch (error) {
    console.error('Error in createDemoDay:', error);
    res.status(500).json({ success: false, error: 'فشل إنشاء فعالية الديمو داي' });
  }
};

// 4. Update Demo Day
const updateDemoDay = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const {
      title,
      description,
      subjectId,
      teacherId,
      scheduledAt,
      durationMinutes,
      locationType,
      meetingLink,
      room,
      capacity,
      status,
      notes,
      branchId,
      classroomId,
      googleMapsUrl
    } = req.body;

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const existingRows = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_demo_days" WHERE id = $1 AND "companyId" = $2
    `, id, companyId);

    if (!existingRows.length) {
      return res.status(404).json({ success: false, error: 'الفعالية غير موجودة' });
    }

    const current = existingRows[0];
    const duration = durationMinutes !== undefined ? parseInt(durationMinutes, 10) : current.durationMinutes;
    const cap = capacity !== undefined ? parseInt(capacity, 10) : current.capacity;
    const loc = locationType !== undefined ? (locationType === 'OFFLINE' ? 'OFFLINE' : 'ONLINE') : current.locationType;

    let finalBranchId = branchId !== undefined ? (branchId ? String(branchId).trim() : null) : current.branchId;
    let finalClassroomId = classroomId !== undefined ? (classroomId ? String(classroomId).trim() : null) : current.classroomId;
    let finalGoogleMapsUrl = googleMapsUrl !== undefined ? (googleMapsUrl ? String(googleMapsUrl).trim() : null) : current.googleMapsUrl;

    // If branchId is provided/updated and googleMapsUrl is empty, auto-lookup branch's googleMapsUrl
    if (finalBranchId && !finalGoogleMapsUrl) {
      try {
        const branchRows = await prisma.$queryRawUnsafe(`
          SELECT "googleMapsUrl" FROM "branches" WHERE id = $1 AND "companyId" = $2
        `, finalBranchId, companyId);
        if (branchRows.length > 0 && branchRows[0].googleMapsUrl) {
          finalGoogleMapsUrl = branchRows[0].googleMapsUrl;
        }
      } catch (err) {
        console.warn('Failed to lookup branch googleMapsUrl on update:', err.message);
      }
    }

    await prisma.$executeRawUnsafe(`
      UPDATE "education_demo_days"
      SET 
        "title" = COALESCE($1, "title"),
        "description" = $2,
        "subjectId" = $3,
        "teacherId" = $4,
        "scheduledAt" = COALESCE($5, "scheduledAt"),
        "durationMinutes" = $6,
        "locationType" = $7,
        "meetingLink" = $8,
        "room" = $9,
        "capacity" = $10,
        "status" = COALESCE($11, "status"),
        "notes" = $12,
        "branchId" = $13,
        "classroomId" = $14,
        "googleMapsUrl" = $15,
        "updatedAt" = NOW()
      WHERE "id" = $16 AND "companyId" = $17
    `, title || null, description !== undefined ? description : current.description,
       subjectId !== undefined ? subjectId : current.subjectId,
       teacherId !== undefined ? teacherId : current.teacherId,
       scheduledAt ? new Date(scheduledAt) : null, duration, loc,
       meetingLink !== undefined ? meetingLink : current.meetingLink,
       room !== undefined ? room : current.room, cap, status || null,
       notes !== undefined ? notes : current.notes,
       finalBranchId, finalClassroomId, finalGoogleMapsUrl, id, companyId);

    await logEducationEvent({
      companyId,
      req,
      action: 'UPDATE_DEMO_DAY',
      entityType: 'DEMO_DAY',
      entityId: id,
      targetName: title
    });

    res.json({ success: true, message: 'تم تحديث الفعالية بنجاح' });
  } catch (error) {
    console.error('Error in updateDemoDay:', error);
    res.status(500).json({ success: false, error: 'فشل تحديث الفعالية' });
  }
};

// 5. Delete Demo Day
const deleteDemoDay = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    await prisma.$executeRawUnsafe(`DELETE FROM "education_demo_attendees" WHERE "demoDayId" = $1 AND "companyId" = $2`, id, companyId);
    await prisma.$executeRawUnsafe(`DELETE FROM "education_demo_days" WHERE "id" = $1 AND "companyId" = $2`, id, companyId);

    await logEducationEvent({
      companyId,
      req,
      action: 'DELETE_DEMO_DAY',
      entityType: 'DEMO_DAY',
      entityId: id
    });

    res.json({ success: true, message: 'تم حذف الفعالية بنجاح' });
  } catch (error) {
    console.error('Error in deleteDemoDay:', error);
    res.status(500).json({ success: false, error: 'فشل حذف الفعالية' });
  }
};

// 6. Register Attendee (creates or links Customer as CRM Lead + Auto registers Student in Students List)
const registerAttendee = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: demoDayId } = req.params;
    const { studentName, guardianName, phone, phone2, email, age, grade, notes, branchId: inputBranchId, leadSource, campaignName, adId: inputAdId, postId: inputPostId } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({ success: false, error: 'اسم الطالب ورقم الهاتف مطلوبان' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '').trim();
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    // Resolve branch (input or demo day's branch)
    let resolvedBranchId = inputBranchId ? String(inputBranchId).trim() : null;
    let demoDay = null;
    try {
      const demoDays = await prisma.$queryRawUnsafe(`
        SELECT * FROM "education_demo_days" WHERE id = $1 AND "companyId" = $2
      `, demoDayId, companyId);
      if (demoDays.length > 0) {
        demoDay = demoDays[0];
        if (!resolvedBranchId && demoDay.branchId) {
          resolvedBranchId = demoDay.branchId;
        }
      }
    } catch (_) {}

    // Find or create Customer (CRM Lead)
    let customer = await prisma.customer.findFirst({
      where: {
        companyId,
        OR: [
          { phone: cleanPhone },
          { phone2: cleanPhone },
          { phoneNormalized: cleanPhone }
        ]
      }
    });

    // Registered By details (from token / authenticated user, not body)
    const registeredByUserId = req.user?.id ? String(req.user.id) : (req.user?.userId ? String(req.user.userId) : null);
    const registeredByName = (
      req.user?.name ||
      [req.user?.firstName, req.user?.lastName].filter(Boolean).join(' ') ||
      req.user?.email ||
      'موظف'
    ).trim();
    // Path 4: Import / API integrations tag as IMPORT/API, otherwise default to EMPLOYEE
    const registeredByType = normalizeRegisteredByType(
      req.body.registeredByType || (req.apiKey ? 'API' : 'EMPLOYEE'),
      'EMPLOYEE'
    );

    // Try resolving attribution data (Ad ID, Post ID, Campaign)
    let adId = inputAdId || req.body.adRef || req.body.adId || null;
    let postId = inputPostId || req.body.postRef || req.body.postId || null;
    let campaign = campaignName || req.body.campaign || req.body.utmCampaign || req.body.utm_campaign || null;
    let rawSource = req.body.sourceChannel || req.body.channel || leadSource || req.body.source || req.body.utmSource || req.body.utm_source || null;

    if (!adId && !postId && customer?.id) {
      try {
        const conv = await prisma.conversation.findFirst({
          where: { customerId: customer.id, companyId },
          orderBy: { updatedAt: 'desc' },
          select: { metadata: true, channel: true },
        });
        if (conv?.metadata) {
          const parsed = typeof conv.metadata === 'string' ? JSON.parse(conv.metadata) : conv.metadata;
          if (parsed.adId) adId = parsed.adId;
          if (parsed.postId) postId = parsed.postId;
          if (parsed.adRef) campaign = parsed.adRef;
          if (parsed.adsContextData?.ad_title && !campaign) campaign = parsed.adsContextData.ad_title;
          if (!rawSource && conv.channel) rawSource = conv.channel;
        }
      } catch (_) {}
    }

    if (!rawSource) rawSource = customer?.leadSource || 'OTHER';

    const { channel: sourceChannel, raw: sourceRaw } = normalizeSourceChannel(rawSource, 'OTHER');
    const resolvedCampaignName = campaign ? String(campaign).trim().slice(0, 255) : 'حملة عامة';
    const adRef = adId ? String(adId).trim().slice(0, 255) : null;
    const postRef = postId ? String(postId).trim().slice(0, 255) : null;
    const landingUrl = req.body.landingUrl ? String(req.body.landingUrl).trim().slice(0, 1000) : null;

    // Auto-generate credentials for student/parent
    const { generateUserCredentials } = require('../services/educationAgeLevelService');
    const creds = generateUserCredentials(studentName, cleanPhone);

    const hashPassword = async (pwd) => {
      try {
        const bcrypt = require('bcryptjs');
        return await bcrypt.hash(pwd, 10);
      } catch {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(pwd).digest('hex');
      }
    };
    const hashedPassword = creds.password ? await hashPassword(creds.password) : null;

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId,
          firstName: guardianName ? guardianName.trim() : studentName.trim(),
          lastName: guardianName ? studentName.trim() : '',
          phone: cleanPhone,
          phone2: phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
          email: email ? String(email).trim() : null,
          password: hashedPassword,
          status: 'LEAD',
          leadStage: 'NEW_LEAD',
          leadSource: ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'OTHER'].includes(sourceChannel) ? sourceChannel : 'OTHER',
          notes: `سجل لحضور الديمو داي: ${notes || ''}`
        }
      });
    } else {
      const custUpdate = {};
      if (hashedPassword && !customer.password) custUpdate.password = hashedPassword;
      // Guard: Only update leadSource if empty or OTHER
      if ((!customer.leadSource || customer.leadSource === 'OTHER') && ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'PHONE', 'WALK_IN', 'REFERRAL'].includes(sourceChannel)) {
        custUpdate.leadSource = ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE'].includes(sourceChannel) ? sourceChannel : 'OTHER';
      }
      if (Object.keys(custUpdate).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: custUpdate
        }).catch(() => customer);
      }
    }

    // Attach structured attribution tag to notes (preserve backward compatibility)
    const attrTag = buildAttributionTag({ source: sourceChannel, campaign: resolvedCampaignName, adId: adRef, postId: postRef });
    const finalNotes = notes ? `${notes} ${attrTag}` : attrTag;

    // Requirement 1: Auto-register student in EducationStudent list
    let student = await prisma.educationStudent.findFirst({
      where: {
        companyId,
        OR: [
          { phone: cleanPhone },
          { customerId: customer.id, firstName: studentName.trim() }
        ]
      }
    });

    if (!student) {
      const count = await prisma.educationStudent.count({ where: { companyId } });
      const safeCode = await generateUniqueStudentCode(companyId, prisma);
      student = await prisma.educationStudent.create({
        data: {
          companyId,
          customerId: customer.id,
          code: safeCode,
          firstName: studentName.trim(),
          lastName: guardianName ? guardianName.trim() : '',
          phone: cleanPhone,
          phone2: phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
          grade: grade || null,
          age: age ? parseInt(age, 10) : null,
          branchId: resolvedBranchId,
          username: creds.username,
          plainPassword: creds.password,
          notes: `مسجل تلقائياً عبر الديمو داي: ${notes || ''}`
        }
      });
    }

    const attendeeId = generateAttendeeId();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_demo_attendees" (
        "id", "companyId", "demoDayId", "customerId", "studentName", "guardianName",
        "phone", "phone2", "email", "age", "grade", "attendanceStatus",
        "conversionStatus", "convertedStudentId", "branchId", "notes",
        "registeredByType", "registeredByUserId", "registeredByName",
        "sourceChannel", "sourceRaw", "campaignName", "adRef", "postRef", "landingUrl",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'REGISTERED', 'PENDING', $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW()
      )
    `, attendeeId, companyId, demoDayId, customer.id, studentName.trim(), guardianName ? guardianName.trim() : null,
       cleanPhone, phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
       email ? String(email).trim() : null, age ? parseInt(age, 10) : null, grade || null,
       student.id, resolvedBranchId, finalNotes,
       registeredByType, registeredByUserId, registeredByName,
       sourceChannel, sourceRaw, resolvedCampaignName, adRef, postRef, landingUrl);

    // Auto-send WhatsApp Confirmation Notification
    try {
      if (demoDay) {
        const educationNotificationService = require('../services/educationNotificationService');
        educationNotificationService.notifyDemoDayRegistered({
          companyId,
          demoDay,
          attendee: {
            id: attendeeId,
            studentName: studentName.trim(),
            guardianName: guardianName ? guardianName.trim() : null,
            phone: cleanPhone,
            age: age ? parseInt(age, 10) : null,
          },
          leadSource: sourceChannel,
        }).catch((e) => console.warn('[DemoDayWhatsApp] Auto notification warn:', e.message));
      }
    } catch (_) {}

    await logEducationEvent({
      companyId,
      req,
      action: 'REGISTER_DEMO_ATTENDEE',
      entityType: 'DEMO_DAY',
      entityId: attendeeId,
      targetName: studentName
    });

    res.status(201).json({
      success: true,
      data: {
        id: attendeeId,
        studentName,
        studentId: student.id,
        studentCode: student.code,
        customerId: customer.id,
        branchId: resolvedBranchId,
        credentials: creds
      }
    });
  } catch (error) {
    console.error('Error in registerAttendee:', error);
    res.status(500).json({ success: false, error: 'فشل تسجيل الحاضر' });
  }
};

// 7. Update Attendee Status (Attendance, Conversion, Branch, Notes)
const updateAttendeeStatus = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { attendeeId } = req.params;
    const { attendanceStatus, conversionStatus, notes, branchId } = req.body;

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    await prisma.$executeRawUnsafe(`
      UPDATE "education_demo_attendees"
      SET 
        "attendanceStatus" = COALESCE($1, "attendanceStatus"),
        "conversionStatus" = COALESCE($2, "conversionStatus"),
        "notes" = COALESCE($3, "notes"),
        "branchId" = COALESCE($4, "branchId"),
        "updatedAt" = NOW()
      WHERE "id" = $5 AND "companyId" = $6
    `, attendanceStatus || null, conversionStatus || null, notes || null, branchId || null, attendeeId, companyId);

    await logEducationEvent({
      companyId,
      req,
      action: 'UPDATE_DEMO_ATTENDEE',
      entityType: 'DEMO_DAY',
      entityId: attendeeId,
      details: { attendanceStatus, conversionStatus, branchId }
    });

    res.json({ success: true, message: 'تم تحديث حالة الحاضر بنجاح' });
  } catch (error) {
    console.error('Error in updateAttendeeStatus:', error);
    res.status(500).json({ success: false, error: 'فشل تحديث حالة الحاضر' });
  }
};

// 8. Convert Lead to Enrolled Student (With Group, Level, Branch, Payment Plan, Discounts, and Credentials)
const convertAttendeeToStudent = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { attendeeId } = req.params;
    const {
      packageId,
      teacherId,
      amountPaid,
      groupId,
      level,
      branchId,
      paymentMethod,
      installmentCount,
      installments,
      discountType,
      discountAmount,
      finalAmount,
      autoGenerateCredentials
    } = req.body;

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const rows = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_demo_attendees" WHERE "id" = $1 AND "companyId" = $2
    `, attendeeId, companyId);

    if (!rows.length) {
      return res.status(404).json({ success: false, error: 'الحاضر غير موجود' });
    }

    const attendee = rows[0];

    // Ensure customer exists
    let customerId = attendee.customerId;
    if (!customerId) {
      const cust = await prisma.customer.create({
        data: {
          companyId,
          firstName: attendee.guardianName || attendee.studentName,
          lastName: attendee.guardianName ? attendee.studentName : '',
          phone: attendee.phone,
          status: 'ACTIVE',
          leadStage: 'WON',
          notes: 'تم التحويل من ديمو داي'
        }
      });
      customerId = cust.id;
    } else {
      await prisma.customer.update({
        where: { id: customerId },
        data: { status: 'ACTIVE', leadStage: 'CONVERTED' }
      }).catch(() => {});
    }

    // Find or create EducationStudent
    let student = null;
    if (attendee.convertedStudentId) {
      student = await prisma.educationStudent.findFirst({
        where: { id: attendee.convertedStudentId, companyId }
      });
    }

    if (!student) {
      const count = await prisma.educationStudent.count({ where: { companyId } });
      const safeCode = await generateUniqueStudentCode(companyId, prisma);
      student = await prisma.educationStudent.create({
        data: {
          companyId,
          customerId,
          code: safeCode,
          firstName: attendee.studentName,
          lastName: attendee.guardianName || '',
          phone: attendee.phone,
          phone2: attendee.phone2,
          grade: level || attendee.grade || null,
          age: attendee.age || null,
          branchId: branchId || attendee.branchId || null,
          notes: `طالب محول من ديمو داي`
        }
      });
    } else {
      // Update student grade/level and branch
      const updateData = {};
      if (level) updateData.grade = level;
      if (branchId) updateData.branchId = branchId;
      if (Object.keys(updateData).length > 0) {
        student = await prisma.educationStudent.update({
          where: { id: student.id },
          data: updateData
        }).catch(() => student);
      }
    }

    // Enroll into Group if groupId is provided
    let groupMember = null;
    if (groupId) {
      const existingMember = await prisma.$queryRawUnsafe(`
        SELECT * FROM "education_group_members" WHERE "groupId" = $1 AND "studentId" = $2 AND "companyId" = $3
      `, groupId, student.id, companyId);

      if (!existingMember.length) {
        const crypto = require('crypto');
        const memberId = `egm_${crypto.randomBytes(8).toString('hex')}`;
        await prisma.$executeRawUnsafe(`
          INSERT INTO "education_group_members" (
            "id", "companyId", "groupId", "studentId", "status", "joinedAt",
            "paymentStatus", "amountPaid", "notes", "createdAt", "updatedAt"
          ) VALUES (
            $1, $2, $3, $4, 'ACTIVE', NOW(), $5, $6, $7, NOW(), NOW()
          )
        `, memberId, companyId, groupId, student.id,
           (parseFloat(amountPaid) || 0) > 0 ? 'PAID' : 'PENDING',
           parseFloat(amountPaid) || 0,
           'محول من الديمو داي'
        );
        groupMember = { id: memberId, groupId, studentId: student.id };
      }
    }

    // Optional package enrollment with Installments & Discounts
    let enrollment = null;
    if (packageId) {
      const pkg = await prisma.educationPackage.findFirst({
        where: { id: packageId, companyId }
      });
      if (pkg) {
        const safeInstallments = installments
          ? (typeof installments === 'string' ? installments : JSON.stringify(installments))
          : '[]';

        const safeFinalAmount = finalAmount !== undefined
          ? parseFloat(finalAmount)
          : (parseFloat(amountPaid) || pkg.price);

        enrollment = await prisma.educationEnrollment.create({
          data: {
            companyId,
            studentId: student.id,
            packageId: pkg.id,
            teacherId: teacherId || null,
            totalHours: pkg.hoursCount,
            remainingHours: pkg.hoursCount,
            amountPaid: parseFloat(amountPaid) || 0,
            paymentStatus: (parseFloat(amountPaid) || 0) >= safeFinalAmount ? 'COMPLETED' : ((parseFloat(amountPaid) || 0) > 0 ? 'PARTIALLY_PAID' : 'PENDING'),
            paymentMethod: paymentMethod || 'CASH',
            installmentCount: installmentCount ? parseInt(installmentCount, 10) : 1,
            installments: typeof safeInstallments === 'string' ? JSON.parse(safeInstallments) : safeInstallments,
            discountType: discountType || 'NONE',
            discountAmount: discountAmount ? parseFloat(discountAmount) : 0,
            finalAmount: safeFinalAmount,
            branchId: branchId || null
          }
        });
      }
    }

    // Credentials generation
    let credentials = null;
    if (autoGenerateCredentials !== false) {
      const { generateUserCredentials } = require('../services/educationAgeLevelService');
      credentials = generateUserCredentials(attendee.studentName, attendee.phone, student.code);
      try {
        const hashPassword = async (pwd) => {
          try {
            const bcrypt = require('bcryptjs');
            return await bcrypt.hash(pwd, 10);
          } catch {
            const crypto = require('crypto');
            return crypto.createHash('sha256').update(pwd).digest('hex');
          }
        };
        const hashed = await hashPassword(credentials.password);
        await prisma.customer.update({
          where: { id: customerId },
          data: { password: hashed }
        }).catch(() => {});
        await prisma.$executeRawUnsafe(`
          UPDATE "education_students" SET "username" = $1, "plainPassword" = $2 WHERE "id" = $3
        `, credentials.username, credentials.password, student.id).catch(() => {});
      } catch (_) {}
    }

    // Update attendee record
    await prisma.$executeRawUnsafe(`
      UPDATE "education_demo_attendees"
      SET 
        "attendanceStatus" = 'ATTENDED',
        "conversionStatus" = 'CONVERTED',
        "convertedStudentId" = $1,
        "customerId" = $2,
        "branchId" = COALESCE($3, "branchId"),
        "updatedAt" = NOW()
      WHERE "id" = $4
    `, student.id, customerId, branchId || null, attendeeId);

    await logEducationEvent({
      companyId,
      req,
      action: 'CONVERT_DEMO_LEAD',
      entityType: 'DEMO_DAY',
      entityId: attendeeId,
      targetName: attendee.studentName,
      details: { studentId: student.id, enrollmentId: enrollment?.id, groupId, branchId, level }
    });

    res.json({
      success: true,
      message: 'تم تحويل العميل المحتمل إلى طالب بنجاح',
      data: {
        student,
        groupMember,
        enrollment,
        credentials
      }
    });
  } catch (error) {
    console.error('Error in convertAttendeeToStudent:', error);
    res.status(500).json({ success: false, error: 'فشل تحويل الحاضر إلى طالب' });
  }
};

// 9. Delete Attendee
const deleteAttendee = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { attendeeId } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    await prisma.$executeRawUnsafe(`
      DELETE FROM "education_demo_attendees" WHERE "id" = $1 AND "companyId" = $2
    `, attendeeId, companyId);

    res.json({ success: true, message: 'تم حذف الحاضر بنجاح' });
  } catch (error) {
    console.error('Error in deleteAttendee:', error);
    res.status(500).json({ success: false, error: 'فشل حذف الحاضر' });
  }
};

// 10. Public view of a Demo Day
const getPublicDemoDay = async (req, res) => {
  try {
    const { id } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const demoDays = await prisma.$queryRawUnsafe(`
      SELECT 
        d.id,
        d."companyId",
        d.title,
        d.description,
        d."scheduledAt",
        d."durationMinutes",
        d."locationType",
        d.room,
        d."branchId",
        d."classroomId",
        d.capacity,
        d.status,
        c.name AS "companyName",
        s.name AS "subjectName",
        b.name AS "branchName",
        b.address AS "branchAddress",
        b.city AS "branchCity",
        b.phone AS "branchPhone",
        b.classrooms AS "branchClassrooms",
        COALESCE(d."googleMapsUrl", b."googleMapsUrl") AS "branchGoogleMapsUrl"
      FROM "education_demo_days" d
      LEFT JOIN "companies" c ON c.id = d."companyId"
      LEFT JOIN "education_subjects" s ON s.id = d."subjectId" AND s."companyId" = d."companyId"
      LEFT JOIN "branches" b ON b.id = d."branchId"
      WHERE d.id = $1 AND d.status != 'CANCELLED'
    `, id);

    if (!demoDays.length) {
      return res.status(404).json({ success: false, error: 'الفعالية غير متاحة' });
    }

    const event = demoDays[0];
    const classroomName = resolveClassroomName(event.classroomId, event.branchClassrooms, event.room);

    const counts = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM "education_demo_attendees" WHERE "demoDayId" = $1
    `, id);

    const registered = parseInt(counts[0]?.total || 0, 10);
    const spotsLeft = Math.max(0, event.capacity - registered);

    res.json({
      success: true,
      data: {
        ...event,
        classroomName,
        registeredCount: registered,
        spotsLeft,
        isFull: spotsLeft <= 0
      }
    });
  } catch (error) {
    console.error('Error in getPublicDemoDay:', error);
    res.status(500).json({ success: false, error: 'فشل جلب تفاصيل الفعالية' });
  }
};

// 11. Public registration from external form
const registerPublicAttendee = async (req, res) => {
  try {
    const { id: demoDayId } = req.params;
    const { studentName, guardianName, phone, phone2, email, age, grade, notes } = req.body;

    if (!studentName || !phone) {
      return res.status(400).json({ success: false, error: 'اسم الطالب ورقم الهاتف مطلوبان' });
    }

    const cleanPhone = String(phone).replace(/[^\d+]/g, '').trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      return res.status(400).json({ success: false, error: 'رقم الهاتف غير صالح' });
    }

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const events = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_demo_days" WHERE "id" = $1 AND "status" != 'CANCELLED'
    `, demoDayId);

    if (!events.length) {
      return res.status(404).json({ success: false, error: 'الفعالية غير متاحة' });
    }

    const event = events[0];
    const companyId = event.companyId;

    // Check capacity
    const counts = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM "education_demo_attendees" WHERE "demoDayId" = $1
    `, demoDayId);
    const registeredCount = parseInt(counts[0]?.total || 0, 10);
    if (registeredCount >= event.capacity) {
      return res.status(400).json({ success: false, error: 'عذراً، اكتملت السعة القصوى لهذه الجلسة' });
    }

    // Guard against duplicate registration (same phone in same demo session)
    const existingAttendees = await prisma.$queryRawUnsafe(`
      SELECT "id" FROM "education_demo_attendees"
      WHERE "demoDayId" = $1 AND ("phone" = $2 OR "phone2" = $2)
      LIMIT 1
    `, demoDayId, cleanPhone);

    if (existingAttendees && existingAttendees.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'رقم الهاتف مسجل بالفعل في هذه الجلسة التجريبية',
        data: { existingAttendeeId: existingAttendees[0].id }
      });
    }

    // Attribution for public attendee (query + body + Referer)
    const query = req.query || {};
    const body = req.body || {};
    const referer = typeof req.get === 'function' ? (req.get('Referer') || req.get('referrer') || '') : '';

    const rawSource =
      body.utm_source ||
      query.utm_source ||
      body.leadSource ||
      query.leadSource ||
      body.source ||
      query.source ||
      body.utmSource ||
      query.utmSource ||
      'WEBSITE';

    const rawCampaign =
      body.utm_campaign ||
      query.utm_campaign ||
      body.campaignName ||
      query.campaignName ||
      body.campaign ||
      query.campaign ||
      body.utmCampaign ||
      query.utmCampaign ||
      'الموقع العام';

    const rawAdId =
      body.adId ||
      query.adId ||
      body.ad_id ||
      query.ad_id ||
      body.adRef ||
      query.adRef ||
      null;

    const rawPostId =
      body.postId ||
      query.postId ||
      body.post_id ||
      query.post_id ||
      body.postRef ||
      query.postRef ||
      null;

    const landingUrl =
      (body.landingUrl || query.landingUrl || referer || '')
        .toString()
        .trim()
        .slice(0, 1000) || null;

    const { channel: sourceChannel, raw: sourceRaw } = normalizeSourceChannel(rawSource, 'WEBSITE');
    const resolvedCampaignName = String(rawCampaign || 'الموقع العام').trim().slice(0, 255);
    const adRef = rawAdId ? String(rawAdId).trim().slice(0, 255) : null;
    const postRef = rawPostId ? String(rawPostId).trim().slice(0, 255) : null;

    const registeredByType = 'SELF';
    const registeredByUserId = null;
    const registeredByName = null;

    const attrTag = buildAttributionTag({ source: sourceChannel, campaign: resolvedCampaignName, adId: adRef, postId: postRef });
    const finalNotes = notes ? `${notes} ${attrTag}` : attrTag;

    // Auto-generate credentials for student/parent
    const { generateUserCredentials } = require('../services/educationAgeLevelService');
    const creds = generateUserCredentials(studentName.trim(), cleanPhone);

    const hashPassword = async (pwd) => {
      try {
        const bcrypt = require('bcryptjs');
        return await bcrypt.hash(pwd, 10);
      } catch {
        const crypto = require('crypto');
        return crypto.createHash('sha256').update(pwd).digest('hex');
      }
    };
    const hashedPassword = creds.password ? await hashPassword(creds.password) : null;

    // CRM Lead
    let customer = await prisma.customer.findFirst({
      where: {
        companyId,
        OR: [{ phone: cleanPhone }, { phone2: cleanPhone }]
      }
    });

    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          companyId,
          firstName: guardianName ? guardianName.trim() : studentName.trim(),
          lastName: guardianName ? studentName.trim() : '',
          phone: cleanPhone,
          phone2: phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
          email: email ? String(email).trim() : null,
          password: hashedPassword,
          status: 'LEAD',
          leadStage: 'NEW_LEAD',
          leadSource: ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE', 'OTHER'].includes(sourceChannel) ? sourceChannel : 'WEBSITE',
          notes: `تسجيل ذاتي عبر رابط الديمو داي: ${event.title}`
        }
      });
    } else {
      const custUpdate = {};
      if (hashedPassword && !customer.password) custUpdate.password = hashedPassword;
      if (email && !customer.email) custUpdate.email = String(email).trim();
      if (phone2 && !customer.phone2) custUpdate.phone2 = String(phone2).replace(/[^\d+]/g, '').trim();
      // Guard: Only update leadSource if empty or OTHER
      if ((!customer.leadSource || customer.leadSource === 'OTHER') && ['WHATSAPP', 'FACEBOOK', 'INSTAGRAM', 'WEBSITE'].includes(sourceChannel)) {
        custUpdate.leadSource = sourceChannel;
      }
      if (Object.keys(custUpdate).length > 0) {
        customer = await prisma.customer.update({
          where: { id: customer.id },
          data: custUpdate
        }).catch(() => customer);
      }
    }

    // Student Profile (education_students)
    let student = await prisma.educationStudent.findFirst({
      where: {
        companyId,
        OR: [
          { phone: cleanPhone },
          { customerId: customer.id, firstName: studentName.trim() }
        ]
      }
    });

    const resolvedBranchId = event.branchId || null;

    if (!student) {
      const count = await prisma.educationStudent.count({ where: { companyId } }).catch(() => 0);
      const safeCode = await generateUniqueStudentCode(companyId, prisma);
      student = await prisma.educationStudent.create({
        data: {
          companyId,
          customerId: customer.id,
          code: safeCode,
          firstName: studentName.trim(),
          lastName: guardianName ? guardianName.trim() : '',
          phone: cleanPhone,
          phone2: phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
          grade: grade ? String(grade).trim() : null,
          age: age ? parseInt(age, 10) : null,
          branchId: resolvedBranchId,
          username: creds.username,
          plainPassword: creds.password,
          notes: `مسجل ذاتياً عبر الديمو داي: ${event.title}`
        }
      });
    } else {
      const studentUpdate = {};
      if (age && !student.age) studentUpdate.age = parseInt(age, 10);
      if (grade && !student.grade) studentUpdate.grade = String(grade).trim();
      if (resolvedBranchId && !student.branchId) studentUpdate.branchId = resolvedBranchId;
      if (creds.username && !student.username) studentUpdate.username = creds.username;
      if (creds.password && !student.plainPassword) studentUpdate.plainPassword = creds.password;
      if (phone2 && !student.phone2) studentUpdate.phone2 = String(phone2).replace(/[^\d+]/g, '').trim();

      if (Object.keys(studentUpdate).length > 0) {
        student = await prisma.educationStudent.update({
          where: { id: student.id },
          data: studentUpdate
        }).catch(() => student);
      }
    }

    const attendeeId = generateAttendeeId();
    await prisma.$executeRawUnsafe(`
      INSERT INTO "education_demo_attendees" (
        "id", "companyId", "demoDayId", "customerId", "studentName", "guardianName",
        "phone", "phone2", "email", "age", "grade", "attendanceStatus",
        "conversionStatus", "convertedStudentId", "branchId", "notes",
        "registeredByType", "registeredByUserId", "registeredByName",
        "sourceChannel", "sourceRaw", "campaignName", "adRef", "postRef", "landingUrl",
        "createdAt", "updatedAt"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'REGISTERED', 'PENDING', $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22, $23, NOW(), NOW()
      )
    `, attendeeId, companyId, demoDayId, customer.id, studentName.trim(), guardianName ? guardianName.trim() : null,
       cleanPhone, phone2 ? String(phone2).replace(/[^\d+]/g, '').trim() : null,
       email ? String(email).trim() : null, age ? parseInt(age, 10) : null, grade ? String(grade).trim() : null,
       student.id, resolvedBranchId, finalNotes,
       registeredByType, registeredByUserId, registeredByName,
       sourceChannel, sourceRaw, resolvedCampaignName, adRef, postRef, landingUrl);

    // Auto WhatsApp confirmation for public registrant
    try {
      const educationNotificationService = require('../services/educationNotificationService');
      educationNotificationService.notifyDemoDayRegistered({
        companyId,
        demoDay: event,
        attendee: {
          id: attendeeId,
          studentName: studentName.trim(),
          guardianName: guardianName ? guardianName.trim() : null,
          phone: cleanPhone,
          age: age ? parseInt(age, 10) : null,
        },
        leadSource: sourceChannel,
      }).catch((e) => console.warn('[DemoDayWhatsApp] Public registration notification error:', e.message));
    } catch (_) {}

    await logEducationEvent({
      companyId,
      req,
      action: 'REGISTER_DEMO_ATTENDEE',
      entityType: 'DEMO_DAY',
      entityId: attendeeId,
      targetName: studentName.trim(),
      details: {
        source: 'PUBLIC_FORM',
        studentId: student.id,
        studentCode: student.code,
        phone: cleanPhone
      }
    }).catch(() => {});

    // Recalculate spots left
    const countsAfter = await prisma.$queryRawUnsafe(`
      SELECT COUNT(*) AS total FROM "education_demo_attendees" WHERE "demoDayId" = $1
    `, demoDayId);
    const newTotal = parseInt(countsAfter[0]?.total || 0, 10);
    const spotsLeft = Math.max(0, event.capacity - newTotal);

    res.status(201).json({
      success: true,
      message: 'تم تأكيد تسجيلك في اليوم التجريبي بنجاح',
      data: {
        id: attendeeId,
        title: event.title,
        scheduledAt: event.scheduledAt,
        studentId: student.id,
        studentCode: student.code,
        customerId: customer.id,
        registeredCount: newTotal,
        spotsLeft,
        capacity: event.capacity
      }
    });
  } catch (error) {
    console.error('Error in registerPublicAttendee:', error);
    res.status(500).json({ success: false, error: 'فشل إتمام التسجيل' });
  }
};

// 12. Campaign & Ad Attribution Analytics
const getAttributionAnalytics = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    const { period = 'all' } = req.query;
    let dateFilter = '';
    if (period === 'today') {
      dateFilter = `AND a."createdAt" >= CURRENT_DATE`;
    } else if (period === '7d') {
      dateFilter = `AND a."createdAt" >= NOW() - INTERVAL '7 days'`;
    } else if (period === '30d') {
      dateFilter = `AND a."createdAt" >= NOW() - INTERVAL '30 days'`;
    }

    const rawRows = await prisma.$queryRawUnsafe(`
      SELECT 
        a.id,
        a."studentName",
        a."attendanceStatus",
        a."conversionStatus",
        a."convertedStudentId",
        a."notes",
        a."createdAt",
        a."registeredByType",
        a."registeredByName",
        a."sourceChannel",
        a."sourceRaw",
        a."campaignName",
        a."adRef",
        a."postRef",
        a."landingUrl",
        c.id AS "customerId",
        c."leadSource",
        COALESCE(
          (SELECT SUM("amountPaid") FROM "education_enrollments" WHERE "studentId" = a."convertedStudentId" AND "companyId" = $1),
          0
        )::numeric AS "revenueGenerated"
      FROM "education_demo_attendees" a
      LEFT JOIN "customers" c ON c.id = a."customerId"
      WHERE a."companyId" = $1 ${dateFilter}
      ORDER BY a."createdAt" DESC
    `, companyId);

    const channelMap = new Map();
    let totalLeads = 0;
    let totalAttended = 0;
    let totalConverted = 0;
    let totalRevenue = 0;

    for (const row of rawRows) {
      totalLeads++;
      if (row.attendanceStatus === 'ATTENDED') totalAttended++;
      if (row.conversionStatus === 'CONVERTED') totalConverted++;
      const rev = Number(row.revenueGenerated || 0);
      totalRevenue += rev;

      // Requirement 7: Read new columns primarily, fallback to [ATTR: ...] in notes for legacy rows
      let campaignName = row.campaignName || null;
      let channel = row.sourceChannel || null;
      let adId = row.adRef || null;
      let postId = row.postRef || null;

      if ((!channel || !campaignName) && row.notes && row.notes.includes('[ATTR:')) {
        const parsed = extractAttributionFromNotes(row.notes);
        if (parsed) {
          if (!campaignName && parsed.campaign) campaignName = parsed.campaign;
          if (!channel && parsed.source) channel = parsed.source;
          if (!adId && parsed.adId) adId = parsed.adId;
          if (!postId && parsed.postId) postId = parsed.postId;
        }
      }

      if (!channel) channel = row.leadSource || 'OTHER';
      if (!campaignName) campaignName = 'حملة عامة / غير محددة';

      const channelLabel = getChannelArabicLabel(channel);

      const key = `${channel}:::${campaignName}`;
      if (!channelMap.has(key)) {
        channelMap.set(key, {
          channel,
          channelLabel,
          campaignName,
          adId,
          postId,
          leadsCount: 0,
          attendedCount: 0,
          convertedCount: 0,
          revenueGenerated: 0,
        });
      }

      const item = channelMap.get(key);
      item.leadsCount++;
      if (row.attendanceStatus === 'ATTENDED') item.attendedCount++;
      if (row.conversionStatus === 'CONVERTED') item.convertedCount++;
      item.revenueGenerated += rev;
    }

    const campaigns = Array.from(channelMap.values()).map((c) => ({
      ...c,
      attendanceRate: c.leadsCount > 0 ? ((c.attendedCount / c.leadsCount) * 100).toFixed(1) : '0.0',
      conversionRate: c.attendedCount > 0 ? ((c.convertedCount / c.attendedCount) * 100).toFixed(1) : (c.leadsCount > 0 ? ((c.convertedCount / c.leadsCount) * 100).toFixed(1) : '0.0'),
    }));

    res.json({
      success: true,
      data: {
        summary: {
          totalLeads,
          totalAttended,
          totalConverted,
          totalRevenue,
          overallAttendanceRate: totalLeads > 0 ? ((totalAttended / totalLeads) * 100).toFixed(1) : '0.0',
          overallConversionRate: totalAttended > 0 ? ((totalConverted / totalAttended) * 100).toFixed(1) : '0.0',
        },
        campaigns
      }
    });
  } catch (error) {
    console.error('Error in getAttributionAnalytics:', error);
    res.status(500).json({ success: false, error: 'فشل جلب تحليلات مصادر الحملات' });
  }
};

// 13. Broadcast Reminder to all registered attendees of a Demo Day
const broadcastReminder = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: demoDayId } = req.params;
    const { type = '24h' } = req.body;
    const prisma = getSharedPrismaClient();

    const events = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_demo_days" WHERE "id" = $1 AND "companyId" = $2
    `, demoDayId, companyId);
    if (!events.length) {
      return res.status(404).json({ success: false, error: 'الفعالية غير موجودة' });
    }
    const demoDay = events[0];

    const attendees = await prisma.$queryRawUnsafe(`
      SELECT * FROM "education_demo_attendees"
      WHERE "demoDayId" = $1 AND "companyId" = $2 AND "attendanceStatus" IN ('REGISTERED', 'CONFIRMED')
    `, demoDayId, companyId);

    let sentCount = 0;
    const educationNotificationService = require('../services/educationNotificationService');
    for (const attendee of attendees) {
      try {
        await educationNotificationService.notifyDemoDayReminder({
          companyId,
          demoDay,
          attendee,
          type
        });
        sentCount++;
      } catch (err) {
        console.warn(`[Broadcast] Failed for attendee ${attendee.id}:`, err.message);
      }
    }

    res.json({
      success: true,
      message: `تم إرسال تذكير الديمو داي بنجاح إلى ${sentCount} من المسجلين`,
      total: attendees.length,
      sent: sentCount
    });
  } catch (error) {
    console.error('Error in broadcastReminder:', error);
    res.status(500).json({ success: false, error: 'فشل إرسال التذكيرات' });
  }
};

// 12. Get age-to-levels configuration
const getAgeLevels = async (req, res) => {
  try {
    const { age } = req.query;
    const { getLevelsForAge } = require('../services/educationAgeLevelService');
    const result = getLevelsForAge(age);
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getAgeLevels:', err);
    res.status(500).json({ success: false, error: 'فشل جلب قائمة المستويات' });
  }
};

// 13. Generate auto credentials
const generateCredentialsEndpoint = async (req, res) => {
  try {
    const { studentName, phone, code } = req.body || {};
    const { generateUserCredentials } = require('../services/educationAgeLevelService');
    const creds = generateUserCredentials(studentName, phone, code);
    res.json({ success: true, data: creds });
  } catch (err) {
    console.error('Error in generateCredentialsEndpoint:', err);
    res.status(500).json({ success: false, error: 'فشل توليد بيانات الدخول' });
  }
};

// 14. Export Demo Day attendees (CSV with UTF-8 BOM for Arabic Excel support)
const exportDemoDayAttendees = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) return res.status(403).json({ success: false, error: 'غير مصرح' });

    const { id: demoDayId } = req.params;
    const prisma = getSharedPrismaClient();
    await ensureTablesExist(prisma);

    let whereClause = `WHERE a."companyId" = $1`;
    const params = [companyId];

    if (demoDayId && demoDayId !== 'all') {
      params.push(demoDayId);
      whereClause += ` AND a."demoDayId" = $${params.length}`;
    }

    const rows = await prisma.$queryRawUnsafe(`
      SELECT 
        a.*,
        d.title AS "demoDayTitle",
        d."scheduledAt" AS "demoDayScheduledAt",
        COALESCE(b.name, d_b.name) AS "branchName",
        stu.code AS "studentCode"
      FROM "education_demo_attendees" a
      LEFT JOIN "education_demo_days" d ON d.id = a."demoDayId"
      LEFT JOIN "branches" b ON b.id = a."branchId"
      LEFT JOIN "branches" d_b ON d_b.id = d."branchId"
      LEFT JOIN "education_students" stu ON stu.id = a."convertedStudentId"
      ${whereClause}
      ORDER BY a."createdAt" DESC
    `, ...params);

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const headers = [
      'كود الحجز',
      'كود الطالب',
      'اسم الطالب',
      'ولي الأمر',
      'الهاتف',
      'هاتف بديل',
      'البريد الإلكتروني',
      'السن',
      'المرحلة الدراسية',
      'الفعالية',
      'موعد الفعالية',
      'الفرع',
      'حالة الحضور',
      'حالة العميل المحتمل',
      'سجّله',
      'اسم الموظف المسجل',
      'معرف الموظف',
      'قناة الحجز',
      'اسم الحملة',
      'معرف الإعلان',
      'معرف المنشور',
      'رابط الوصول',
      'المصدر الخام',
      'تاريخ التسجيل',
      'الملاحظات'
    ];

    const csvLines = [headers.join(',')];

    for (const r of rows) {
      let channel = r.sourceChannel || null;
      let campaign = r.campaignName || null;
      let adId = r.adRef || null;
      let postId = r.postRef || null;
      let regType = r.registeredByType || null;
      let regName = r.registeredByName || null;

      if ((!channel || !campaign) && r.notes && r.notes.includes('[ATTR:')) {
        const parsed = extractAttributionFromNotes(r.notes);
        if (parsed) {
          if (!channel) channel = parsed.source;
          if (!campaign) campaign = parsed.campaign;
          if (!adId) adId = parsed.adId;
          if (!postId) postId = parsed.postId;
        }
      }
      if (!channel) channel = 'OTHER';
      if (!campaign) campaign = 'حملة عامة';
      if (!regType) regType = 'SELF';

      const regTypeLabel = getRegisteredByTypeArabicLabel(regType, regName);
      const channelLabel = getChannelArabicLabel(channel);

      const attendanceLabel = 
        r.attendanceStatus === 'ATTENDED' ? 'حضر الديمو' :
        r.attendanceStatus === 'ABSENT' ? 'غائب' :
        r.attendanceStatus === 'CANCELLED' ? 'ملغي' : 'مسجل';

      const leadLabel =
        r.conversionStatus === 'CONVERTED' ? 'مشترك (طالب رسمي)' :
        r.conversionStatus === 'FOLLOW_UP' ? 'مهتم - إعادة تواصل' :
        r.conversionStatus === 'NOT_INTERESTED' ? 'غير مهتم' : 'عميل محتمل (متابعة)';

      const scheduledStr = r.demoDayScheduledAt ? new Date(r.demoDayScheduledAt).toLocaleString('ar-EG') : '';
      const createdStr = r.createdAt ? new Date(r.createdAt).toLocaleString('ar-EG') : '';

      const line = [
        escapeCsv(r.id),
        escapeCsv(r.studentCode || ''),
        escapeCsv(r.studentName),
        escapeCsv(r.guardianName || ''),
        escapeCsv(r.phone),
        escapeCsv(r.phone2 || ''),
        escapeCsv(r.email || ''),
        escapeCsv(r.age || ''),
        escapeCsv(r.grade || ''),
        escapeCsv(r.demoDayTitle || ''),
        escapeCsv(scheduledStr),
        escapeCsv(r.branchName || ''),
        escapeCsv(attendanceLabel),
        escapeCsv(leadLabel),
        escapeCsv(regTypeLabel),
        escapeCsv(regName || ''),
        escapeCsv(r.registeredByUserId || ''),
        escapeCsv(channelLabel),
        escapeCsv(campaign),
        escapeCsv(adId || ''),
        escapeCsv(postId || ''),
        escapeCsv(r.landingUrl || ''),
        escapeCsv(r.sourceRaw || ''),
        escapeCsv(createdStr),
        escapeCsv(r.notes || '')
      ].join(',');

      csvLines.push(line);
    }

    const csvContent = '\uFEFF' + csvLines.join('\r\n');
    const filename = `demo_day_attendees_${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error in exportDemoDayAttendees:', error);
    res.status(500).json({ success: false, error: 'فشل تصدير بيانات الحضور' });
  }
};

module.exports = {
  getAllDemoDays,
  getDemoDayById,
  createDemoDay,
  updateDemoDay,
  deleteDemoDay,
  registerAttendee,
  updateAttendeeStatus,
  convertAttendeeToStudent,
  deleteAttendee,
  getPublicDemoDay,
  registerPublicAttendee,
  getAttributionAnalytics,
  broadcastReminder,
  getAgeLevels,
  generateCredentialsEndpoint,
  exportDemoDayAttendees
};
