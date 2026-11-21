const test = require('node:test');
const assert = require('node:assert');
const sharedDb = require('../../services/sharedDatabase');
const originalGetSharedPrisma = sharedDb.getSharedPrismaClient;
let activePrismaGetter = originalGetSharedPrisma;
sharedDb.getSharedPrismaClient = () => activePrismaGetter();

const controller = require('../../controller/educationDemoDayController');

test('educationDemoDayController unit test suite', async (t) => {
  let demoDaysDb = [];
  let attendeesDb = [];
  let customersDb = [];
  let studentsDb = [];
  let enrollmentsDb = [];

  const mockPrisma = {
    $executeRawUnsafe: async (sql, ...params) => {
      if (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX') || sql.includes('ALTER TABLE')) {
        return 1;
      }
      if (sql.includes('INSERT INTO "education_demo_days"')) {
        const [id, companyId, title, description, subjectId, teacherId, scheduledAt, durationMinutes, locationType, meetingLink, room, capacity, notes] = params;
        demoDaysDb.push({
          id, companyId, title, description, subjectId, teacherId, scheduledAt,
          durationMinutes, locationType, meetingLink, room, capacity, status: 'SCHEDULED', notes,
          createdAt: new Date(), updatedAt: new Date()
        });
        return 1;
      }
      if (sql.includes('INSERT INTO "education_demo_attendees"')) {
        // Handles admin, public, and attribution columns
        const id = params[0];
        const companyId = params[1];
        const demoDayId = params[2];
        const customerId = params[3];
        const studentName = params[4];
        const guardianName = params[5];
        const phone = params[6];
        const phone2 = params[7];
        const email = params[8];
        const age = params[9];
        const grade = params[10];
        const convertedStudentId = params[11] && typeof params[11] === 'string' && params[11].startsWith('stu_') ? params[11] : null;
        const branchId = params[12] || null;
        const notes = params[13] || params[11] || null;
        const registeredByType = params[14] || null;
        const registeredByUserId = params[15] || null;
        const registeredByName = params[16] || null;
        const sourceChannel = params[17] || null;
        const sourceRaw = params[18] || null;
        const campaignName = params[19] || null;
        const adRef = params[20] || null;
        const postRef = params[21] || null;
        const landingUrl = params[22] || null;

        attendeesDb.push({
          id, companyId, demoDayId, customerId, studentName, guardianName, phone, phone2, email, age, grade,
          attendanceStatus: 'REGISTERED', conversionStatus: 'PENDING',
          convertedStudentId, branchId, notes,
          registeredByType, registeredByUserId, registeredByName,
          sourceChannel, sourceRaw, campaignName, adRef, postRef, landingUrl,
          createdAt: new Date(), updatedAt: new Date()
        });
        return 1;
      }
      if (sql.includes('UPDATE "education_demo_attendees"')) {
        if (sql.includes('"registeredByType" = COALESCE')) {
          const [registeredByType, sourceChannel, sourceRaw, campaignName, adRef, postRef, attendeeId] = params;
          const a = attendeesDb.find(x => x.id === attendeeId);
          if (a) {
            if (!a.registeredByType) a.registeredByType = registeredByType;
            if (!a.sourceChannel) a.sourceChannel = sourceChannel;
            if (!a.sourceRaw) a.sourceRaw = sourceRaw;
            if (!a.campaignName) a.campaignName = campaignName;
            if (!a.adRef) a.adRef = adRef;
            if (!a.postRef) a.postRef = postRef;
          }
          return 1;
        }
        if (sql.includes('"attendanceStatus" = \'ATTENDED\'')) {
          const attendeeId = params[3] || params[2];
          const a = attendeesDb.find(x => x.id === attendeeId);
          if (a) {
            a.attendanceStatus = 'ATTENDED';
            a.conversionStatus = 'CONVERTED';
            a.convertedStudentId = params[0];
            a.customerId = params[1];
          }
          return 1;
        }
        const [attendanceStatus, conversionStatus, notes, branchId, attendeeId, companyId] = params;
        const a = attendeesDb.find(x => x.id === (attendeeId || branchId) && (!companyId || x.companyId === companyId));
        if (a) {
          if (attendanceStatus) a.attendanceStatus = attendanceStatus;
          if (conversionStatus) a.conversionStatus = conversionStatus;
          if (notes) a.notes = notes;
        }
        return 1;
      }
      if (sql.includes('DELETE FROM "education_demo_attendees"')) {
        const [id, companyId] = params;
        attendeesDb = attendeesDb.filter(x => !(x.id === id && x.companyId === companyId));
        return 1;
      }
      return 1;
    },
    $queryRawUnsafe: async (sql, ...params) => {
      if (sql.includes('FROM "education_demo_attendees" a') && sql.includes('revenueGenerated')) {
        const companyId = params[0];
        return attendeesDb
          .filter(a => a.companyId === companyId)
          .map(a => {
            const cust = customersDb.find(c => c.id === a.customerId);
            return {
              ...a,
              customerId: a.customerId,
              leadSource: cust?.leadSource || 'OTHER',
              revenueGenerated: a.conversionStatus === 'CONVERTED' ? 1500 : 0
            };
          });
      }
      if (sql.includes('FROM "education_demo_attendees" a') && sql.includes('demoDayTitle')) {
        const companyId = params[0];
        const demoDayId = params[1];
        return attendeesDb
          .filter(a => a.companyId === companyId && (!demoDayId || demoDayId === 'all' || a.demoDayId === demoDayId))
          .map(a => {
            const d = demoDaysDb.find(x => x.id === a.demoDayId);
            return {
              ...a,
              demoDayTitle: d?.title || 'فعالية تجريبية',
              demoDayScheduledAt: d?.scheduledAt || new Date().toISOString(),
              branchName: 'الفرع الرئيسي',
              studentCode: 'STU-1001'
            };
          });
      }
      if (sql.includes('FROM "education_demo_attendees"') && sql.includes('"sourceChannel" IS NULL')) {
        return attendeesDb
          .filter(a => a.sourceChannel === null || a.registeredByType === null)
          .map(a => ({
            id: a.id,
            companyId: a.companyId,
            demoDayId: a.demoDayId,
            studentName: a.studentName,
            notes: a.notes,
            registeredByType: a.registeredByType,
            sourceChannel: a.sourceChannel,
            campaignName: a.campaignName,
            adRef: a.adRef,
            postRef: a.postRef
          }));
      }
      if (sql.includes('FROM "education_demo_days" d')) {
        const companyId = params[0];
        return demoDaysDb
          .filter(d => d.companyId === companyId)
          .map(d => ({
            ...d,
            subjectName: null,
            teacherName: null,
            totalAttendees: attendeesDb.filter(a => a.demoDayId === d.id && a.companyId === companyId).length,
            attendedCount: attendeesDb.filter(a => a.demoDayId === d.id && a.companyId === companyId && a.attendanceStatus === 'ATTENDED').length,
            convertedCount: attendeesDb.filter(a => a.demoDayId === d.id && a.companyId === companyId && a.conversionStatus === 'CONVERTED').length
          }));
      }
      if (sql.includes('FROM "education_demo_days"') && sql.includes('WHERE "id" = $1')) {
        const id = params[0];
        return demoDaysDb.filter(d => d.id === id && d.status !== 'CANCELLED');
      }
      if (sql.includes('COUNT(*) AS total FROM "education_demo_attendees"') && sql.includes('WHERE "demoDayId" = $1')) {
        const demoDayId = params[0];
        const count = attendeesDb.filter(a => a.demoDayId === demoDayId).length;
        return [{ total: count }];
      }
      if (sql.includes('SELECT "id" FROM "education_demo_attendees"') && sql.includes('WHERE "demoDayId" = $1')) {
        const [demoDayId, phone] = params;
        const found = attendeesDb.find(a => a.demoDayId === demoDayId && (a.phone === phone || a.phone2 === phone));
        return found ? [{ id: found.id }] : [];
      }
      if (sql.includes('SELECT * FROM "education_demo_attendees" WHERE "id" = $1')) {
        const [id, companyId] = params;
        return attendeesDb.filter(a => a.id === id && (!companyId || a.companyId === companyId));
      }
      return [];
    },
    customer: {
      findFirst: async ({ where }) => {
        return customersDb.find(c => {
          if (where.companyId && c.companyId !== where.companyId) return false;
          if (where.id && c.id !== where.id) return false;
          if (where.phone && c.phone !== where.phone) return false;
          if (where.OR) {
            return where.OR.some(cond => {
              if (cond.phone && c.phone === cond.phone) return true;
              if (cond.phone2 && c.phone2 === cond.phone2) return true;
              return false;
            });
          }
          return true;
        }) || null;
      },
      create: async ({ data }) => {
        const newCust = { id: `cust_${customersDb.length + 1}`, ...data };
        customersDb.push(newCust);
        return newCust;
      },
      update: async ({ where, data }) => {
        const c = customersDb.find(x => x.id === where.id);
        if (c) Object.assign(c, data);
        return c;
      }
    },
    educationStudent: {
      findFirst: async ({ where }) => {
        return studentsDb.find(s => {
          if (where.companyId && s.companyId !== where.companyId) return false;
          if (where.id && s.id !== where.id) return false;
          if (where.phone && s.phone !== where.phone) return false;
          if (where.OR) {
            return where.OR.some(cond => {
              if (cond.phone && s.phone === cond.phone) return true;
              if (cond.customerId && cond.firstName && s.customerId === cond.customerId && s.firstName === cond.firstName) return true;
              return false;
            });
          }
          return true;
        }) || null;
      },
      count: async ({ where }) => {
        return studentsDb.filter(s => !where?.companyId || s.companyId === where.companyId).length;
      },
      create: async ({ data }) => {
        const s = { id: `stu_${studentsDb.length + 1}`, ...data };
        studentsDb.push(s);
        return s;
      },
      update: async ({ where, data }) => {
        const s = studentsDb.find(x => x.id === where.id);
        if (s) Object.assign(s, data);
        return s;
      }
    },
    educationPackage: {
      findFirst: async ({ where }) => ({ id: where.id, hoursCount: 12, price: 1500 })
    },
    educationEnrollment: {
      create: async ({ data }) => {
        const e = { id: `enr_${enrollmentsDb.length + 1}`, ...data };
        enrollmentsDb.push(e);
        return e;
      }
    },
    activityLog: {
      create: async () => ({ id: '1' })
    }
  };

  activePrismaGetter = () => mockPrisma;

  const createMockRes = () => {
    let responseData = null;
    let statusCode = 200;
    const headers = {};
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseData = data; return res; },
      setHeader: (k, v) => { headers[k.toLowerCase()] = v; return res; },
      send: (data) => { responseData = data; return res; },
      getHeader: (k) => headers[k.toLowerCase()],
      getData: () => responseData,
      getStatusCode: () => statusCode
    };
    return res;
  };

  await t.test('createDemoDay and getAllDemoDays with attendee telemetry', async () => {
    const reqCreate = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      body: {
        title: 'يوم تعريفي لبرمجة الذكاء الاصطناعي للأطفال',
        description: 'جلسة ديمو تجريبية للطلاب الجدد',
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 60,
        capacity: 25,
        locationType: 'ONLINE'
      }
    };
    const resCreate = createMockRes();
    await controller.createDemoDay(reqCreate, resCreate);
    const createData = resCreate.getData();
    assert.strictEqual(createData.success, true);
    assert.ok(createData.data.id);

    // List demo days
    const reqList = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      query: {}
    };
    const resList = createMockRes();
    await controller.getAllDemoDays(reqList, resList);
    const listData = resList.getData();
    assert.strictEqual(listData.success, true);
    assert.strictEqual(listData.data.length, 1);
    assert.strictEqual(listData.data[0].title, 'يوم تعريفي لبرمجة الذكاء الاصطناعي للأطفال');
    assert.strictEqual(listData.data[0].capacity, 25);
  });

  await t.test('registerAttendee creates Customer as CRM LEAD, creates Student profile, and links attendee', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'عمر المختار',
        guardianName: 'مختار الهنداوي',
        phone: '01012345678',
        email: 'mokhtar@example.com',
        age: 12,
        grade: 'الصف الأول الإعدادي',
        notes: 'مهتم بالروبوتيكس'
      }
    };
    const res = createMockRes();
    await controller.registerAttendee(req, res);
    const data = res.getData();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.customerId);
    assert.ok(data.data.studentId);

    // Verify Customer record created in CRM as LEAD
    const cust = customersDb.find(c => c.id === data.data.customerId);
    assert.ok(cust);
    assert.strictEqual(cust.status, 'LEAD');
    assert.strictEqual(cust.phone, '01012345678');

    // Verify Student record created in education_students
    const stu = studentsDb.find(s => s.id === data.data.studentId);
    assert.ok(stu);
    assert.strictEqual(stu.firstName, 'عمر المختار');
    assert.strictEqual(stu.age, 12);
  });

  await t.test('convertAttendeeToStudent converts lead to enrolled student in one click', async () => {
    const attendee = attendeesDb[0];
    const req = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      params: { attendeeId: attendee.id },
      body: {
        packageId: 'pkg-123',
        amountPaid: 1500
      }
    };
    const res = createMockRes();
    await controller.convertAttendeeToStudent(req, res);
    const data = res.getData();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.student);
    assert.strictEqual(data.data.student.firstName, 'عمر المختار');
    assert.strictEqual(attendee.attendanceStatus, 'ATTENDED');
    assert.strictEqual(attendee.conversionStatus, 'CONVERTED');

    // Customer status promoted to ACTIVE
    const cust = customersDb.find(c => c.id === attendee.customerId);
    assert.strictEqual(cust.status, 'ACTIVE');
    assert.strictEqual(cust.leadStage, 'CONVERTED');
  });

  // --- Public Registration Tests (Core Diagnostic & Regression) ---

  await t.test('registerPublicAttendee creates customer lead, student profile, saves attendee, and returns updated spots', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      body: {
        studentName: 'سارة مصطفى',
        guardianName: 'مصطفى كامل',
        phone: '01055554444',
        email: 'sara.mostafa@example.com',
        age: 14,
        grade: 'الصف الثالث الإعدادي',
        notes: 'تسجيل عام من الرابط المباشر'
      }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    const data = res.getData();

    assert.strictEqual(res.getStatusCode(), 201);
    assert.strictEqual(data.success, true);
    assert.ok(data.data.id);
    assert.ok(data.data.studentId);
    assert.ok(data.data.studentCode);
    assert.strictEqual(data.data.registeredCount, 2); // 1 admin + 1 public
    assert.strictEqual(data.data.spotsLeft, 23); // 25 - 2 = 23

    // Verify attendee record
    const att = attendeesDb.find(a => a.id === data.data.id);
    assert.ok(att);
    assert.strictEqual(att.studentName, 'سارة مصطفى');
    assert.strictEqual(att.phone, '01055554444');
    assert.strictEqual(att.convertedStudentId, data.data.studentId);

    // Verify Student record in education_students
    const stu = studentsDb.find(s => s.id === data.data.studentId);
    assert.ok(stu);
    assert.strictEqual(stu.firstName, 'سارة مصطفى');
    assert.strictEqual(stu.age, 14);
    assert.strictEqual(stu.grade, 'الصف الثالث الإعدادي');

    // Verify Customer record in CRM
    const cust = customersDb.find(c => c.id === data.data.customerId);
    assert.ok(cust);
    assert.strictEqual(cust.status, 'LEAD');
    assert.strictEqual(cust.leadSource, 'WEBSITE');
  });

  // Negative Case 1: Missing Student Name
  await t.test('registerPublicAttendee rejects missing studentName with 400', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      body: { phone: '01011112222' }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.strictEqual(res.getData().success, false);
    assert.strictEqual(res.getData().error, 'اسم الطالب ورقم الهاتف مطلوبان');
  });

  // Negative Case 2: Missing Phone
  await t.test('registerPublicAttendee rejects missing phone with 400', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      body: { studentName: 'أحمد علي' }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.strictEqual(res.getData().success, false);
    assert.strictEqual(res.getData().error, 'اسم الطالب ورقم الهاتف مطلوبان');
  });

  // Negative Case 3: Invalid Phone (too short)
  await t.test('registerPublicAttendee rejects invalid phone (< 8 chars) with 400', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      body: { studentName: 'أحمد علي', phone: '123' }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.strictEqual(res.getData().success, false);
    assert.strictEqual(res.getData().error, 'رقم الهاتف غير صالح');
  });

  // Negative Case 4: Duplicate Phone Registration in Same Demo Day
  await t.test('registerPublicAttendee rejects duplicate phone in same demo session with 409', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      body: {
        studentName: 'سارة مصطفى ثانية',
        phone: '01055554444' // Same phone registered earlier
      }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 409);
    assert.strictEqual(res.getData().success, false);
    assert.strictEqual(res.getData().error, 'رقم الهاتف مسجل بالفعل في هذه الجلسة التجريبية');
  });

  // Negative Case 5: Capacity Full
  await t.test('registerPublicAttendee rejects registration when capacity is full with 400', async () => {
    // Create a mini demo day with capacity = 1
    demoDaysDb.push({
      id: 'demo_full',
      companyId: 'comp-edu-1',
      title: 'جلسة مغلقة ممتلئة',
      capacity: 1,
      status: 'SCHEDULED'
    });
    // Add 1 attendee to reach capacity
    attendeesDb.push({
      id: 'att_full_1',
      companyId: 'comp-edu-1',
      demoDayId: 'demo_full',
      phone: '01099990000',
      studentName: 'طالب أسبق'
    });

    const req = {
      params: { id: 'demo_full' },
      body: {
        studentName: 'طالب متأخر',
        phone: '01088887777'
      }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 400);
    assert.strictEqual(res.getData().success, false);
    assert.strictEqual(res.getData().error, 'عذراً، اكتملت السعة القصوى لهذه الجلسة');
  });

  await t.test('multi-tenant isolation: Company 2 cannot see Company 1 demo days', async () => {
    const reqList = {
      user: { id: 'u2', role: 'OWNER', companyId: 'comp-edu-2' },
      query: {}
    };
    const resList = createMockRes();
    await controller.getAllDemoDays(reqList, resList);
    const listData = resList.getData();
    assert.strictEqual(listData.success, true);
    assert.strictEqual(listData.data.length, 0); // Empty for company 2!
  });

  // --- Attribution & Registrar Feature Tests ---

  await t.test('registerPublicAttendee captures UTM query, body, referer: registeredByType=SELF, sourceChannel, campaignName, adRef, postRef, landingUrl', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      query: {
        utm_source: 'facebook',
        utm_medium: 'paid',
        utm_campaign: 'spring_coding_camp_2026',
        adId: 'fb_ad_101',
        postId: 'fb_post_202'
      },
      body: {
        studentName: 'محمود عبد الرازق',
        guardianName: 'عبد الرازق شريف',
        phone: '01019998877',
        age: 13,
        grade: 'الصف الثاني الإعدادي'
      },
      headers: {
        referer: 'https://maxp.online/lp/spring-camp?utm_source=facebook'
      },
      get: function(h) { return this.headers[h.toLowerCase()]; }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 201);
    const data = res.getData();
    assert.strictEqual(data.success, true);

    const att = attendeesDb.find(a => a.id === data.data.id);
    assert.ok(att);
    assert.strictEqual(att.registeredByType, 'SELF');
    assert.strictEqual(att.sourceChannel, 'FACEBOOK');
    assert.strictEqual(att.sourceRaw, 'facebook');
    assert.strictEqual(att.campaignName, 'spring_coding_camp_2026');
    assert.strictEqual(att.adRef, 'fb_ad_101');
    assert.strictEqual(att.postRef, 'fb_post_202');
    assert.strictEqual(att.landingUrl, 'https://maxp.online/lp/spring-camp?utm_source=facebook');
  });

  await t.test('registerPublicAttendee normalizes unknown channel to OTHER and stores sourceRaw', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      params: { id: demoId },
      query: {
        utm_source: 'snapchat_influencer_khalid',
        utm_campaign: 'influencer_exclusive'
      },
      body: {
        studentName: 'نور أحمد',
        phone: '01077778899',
        age: 10
      },
      headers: {},
      get: function(h) { return this.headers[h.toLowerCase()]; }
    };
    const res = createMockRes();
    await controller.registerPublicAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 201);
    const data = res.getData();

    const att = attendeesDb.find(a => a.id === data.data.id);
    assert.ok(att);
    assert.strictEqual(att.registeredByType, 'SELF');
    assert.strictEqual(att.sourceChannel, 'OTHER');
    assert.strictEqual(att.sourceRaw, 'snapchat_influencer_khalid');
    assert.strictEqual(att.campaignName, 'influencer_exclusive');
  });

  await t.test('registerAttendee sets registeredByType=EMPLOYEE and records user credentials from req.user', async () => {
    const demoId = demoDaysDb[0].id;
    const req = {
      user: { id: 'usr_emp_42', name: 'أحمد محمود (مسؤول القبول)', role: 'EMPLOYEE', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'ياسين أحمد فؤاد',
        phone: '01123456789',
        channel: 'WHATSAPP',
        campaignName: 'حملة العودة للمدارس',
        adRef: 'ad_wa_99',
        notes: 'تم التواصل هاتفياً وتأكيد الحضور'
      }
    };
    const res = createMockRes();
    await controller.registerAttendee(req, res);
    assert.strictEqual(res.getStatusCode(), 201);
    const data = res.getData();

    const att = attendeesDb.find(a => a.id === data.data.id);
    assert.ok(att);
    assert.strictEqual(att.registeredByType, 'EMPLOYEE');
    assert.strictEqual(att.registeredByUserId, 'usr_emp_42');
    assert.strictEqual(att.registeredByName, 'أحمد محمود (مسؤول القبول)');
    assert.strictEqual(att.sourceChannel, 'WHATSAPP');
    assert.strictEqual(att.campaignName, 'حملة العودة للمدارس');
    assert.strictEqual(att.adRef, 'ad_wa_99');
  });

  await t.test('registerAttendee preserves explicit registeredByType for IMPORT and API integration', async () => {
    const demoId = demoDaysDb[0].id;
    // Test IMPORT
    const reqImport = {
      user: { id: 'usr_importer', name: 'خدمة الاستيراد', role: 'ADMIN', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'طالب مستورد من إكسل',
        phone: '01233445566',
        registeredByType: 'IMPORT',
        sourceChannel: 'REFERRAL',
        campaignName: 'استيراد ملف معارض مارس'
      }
    };
    const resImport = createMockRes();
    await controller.registerAttendee(reqImport, resImport);
    assert.strictEqual(resImport.getStatusCode(), 201);
    const attImport = attendeesDb.find(a => a.id === resImport.getData().data.id);
    assert.strictEqual(attImport.registeredByType, 'IMPORT');
    assert.strictEqual(attImport.sourceChannel, 'REFERRAL');

    // Test API
    const reqApi = {
      user: { id: 'usr_api_key', name: 'تكامل Zapier', role: 'INTEGRATION', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'طالب تكامل خارجي',
        phone: '01299887766',
        registeredByType: 'API',
        sourceChannel: 'WEBSITE',
        campaignName: 'Webhook Typeform'
      }
    };
    const resApi = createMockRes();
    await controller.registerAttendee(reqApi, resApi);
    assert.strictEqual(resApi.getStatusCode(), 201);
    const attApi = attendeesDb.find(a => a.id === resApi.getData().data.id);
    assert.strictEqual(attApi.registeredByType, 'API');
  });

  await t.test('customer.leadSource protection: preserves existing specific source, updates only if null or OTHER', async () => {
    const demoId = demoDaysDb[0].id;
    // 1. Create a customer with a specific leadSource
    const existingCust = {
      id: 'cust_specific',
      companyId: 'comp-edu-1',
      phone: '01511223344',
      name: 'ولي أمر سابق',
      leadSource: 'INSTAGRAM',
      status: 'LEAD'
    };
    customersDb.push(existingCust);

    // Register attendee with channel=PHONE
    const req1 = {
      user: { id: 'u1', name: 'الموظف', role: 'EMPLOYEE', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'ابن العميل',
        phone: '01511223344',
        channel: 'PHONE'
      }
    };
    const res1 = createMockRes();
    await controller.registerAttendee(req1, res1);
    assert.strictEqual(res1.getStatusCode(), 201);
    // Must remain INSTAGRAM, NOT overwritten by PHONE
    assert.strictEqual(existingCust.leadSource, 'INSTAGRAM');

    // 2. Create a customer with leadSource='OTHER'
    const otherCust = {
      id: 'cust_other',
      companyId: 'comp-edu-1',
      phone: '01599887766',
      name: 'عميل مصدره غير محدد',
      leadSource: 'OTHER',
      status: 'LEAD'
    };
    customersDb.push(otherCust);

    const req2 = {
      user: { id: 'u1', name: 'الموظف', role: 'EMPLOYEE', companyId: 'comp-edu-1' },
      params: { id: demoId },
      body: {
        studentName: 'طالب جديد',
        phone: '01599887766',
        channel: 'WHATSAPP'
      }
    };
    const res2 = createMockRes();
    await controller.registerAttendee(req2, res2);
    assert.strictEqual(res2.getStatusCode(), 201);
    // Should be upgraded from OTHER to WHATSAPP
    assert.strictEqual(otherCust.leadSource, 'WHATSAPP');
  });

  await t.test('idempotent backfill script runBackfill safely extracts legacy [ATTR: ...] tags without modifying notes', async () => {
    const { runBackfill } = require('../../scripts/backfill_education_demo_attendees_attribution');
    
    // Insert a legacy row with [ATTR: ...] in notes and null attribution columns
    const legacyRow = {
      id: 'att_legacy_test',
      companyId: 'comp-edu-1',
      demoDayId: demoDaysDb[0].id,
      customerId: 'cust_legacy',
      studentName: 'طالب مسجل قديماً',
      phone: '01199998888',
      attendanceStatus: 'REGISTERED',
      conversionStatus: 'PENDING',
      notes: 'تم التسجيل في 17/11 [ATTR: {"source":"INSTAGRAM","campaign":"حملة إنستغرام ربيع 2026","adId":"ad_ig_777","postId":"post_ig_888"}] - ملاحظات إضافية',
      registeredByType: null,
      registeredByUserId: null,
      registeredByName: null,
      sourceChannel: null,
      sourceRaw: null,
      campaignName: null,
      adRef: null,
      postRef: null,
      landingUrl: null,
      createdAt: new Date('2026-11-17T10:00:00Z'),
      updatedAt: new Date('2026-11-17T10:00:00Z')
    };
    attendeesDb.push(legacyRow);

    const originalNotes = legacyRow.notes;

    // Run backfill 1st time
    const silentLogger = { log: () => {}, error: () => {} };
    const result1 = await runBackfill({ prisma: mockPrisma, logger: silentLogger });
    assert.strictEqual(result1.updatedCount >= 1, true);

    // Verify fields updated
    assert.strictEqual(legacyRow.sourceChannel, 'INSTAGRAM');
    assert.strictEqual(legacyRow.campaignName, 'حملة إنستغرام ربيع 2026');
    assert.strictEqual(legacyRow.adRef, 'ad_ig_777');
    assert.strictEqual(legacyRow.postRef, 'post_ig_888');
    assert.strictEqual(legacyRow.registeredByType, 'SELF');
    // STRICT SAFETY RULE CHECK: notes must be completely untouched!
    assert.strictEqual(legacyRow.notes, originalNotes);

    // Run backfill 2nd time: IDEMPOTENCY CHECK
    const result2 = await runBackfill({ prisma: mockPrisma, logger: silentLogger });
    assert.strictEqual(result2.updatedCount, 0, 'Second run must update 0 rows (idempotent)');
  });

  await t.test('getAttributionAnalytics aggregates new attribution columns and preserves response contract', async () => {
    const req = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      query: { period: 'all' }
    };
    const res = createMockRes();
    await controller.getAttributionAnalytics(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    const data = res.getData();
    assert.strictEqual(data.success, true);
    assert.ok(data.data.summary);
    assert.ok(typeof data.data.summary.totalLeads === 'number');
    assert.ok(typeof data.data.summary.overallAttendanceRate === 'string');
    assert.ok(Array.isArray(data.data.campaigns));
    
    // Check campaign entries contain our attribution data
    const igCampaign = data.data.campaigns.find(c => c.channel === 'INSTAGRAM' && c.campaignName === 'حملة إنستغرام ربيع 2026');
    assert.ok(igCampaign, 'Should find backfilled Instagram campaign in attribution analytics');
    assert.strictEqual(igCampaign.adId, 'ad_ig_777');
  });

  await t.test('exportDemoDayAttendees generates UTF-8 BOM CSV with Arabic headers and attribution columns', async () => {
    const req = {
      user: { id: 'u1', role: 'OWNER', companyId: 'comp-edu-1' },
      params: { id: 'all' }
    };
    const res = createMockRes();
    await controller.exportDemoDayAttendees(req, res);
    assert.strictEqual(res.getStatusCode(), 200);
    assert.strictEqual(res.getHeader('content-type'), 'text/csv; charset=utf-8');
    
    const csv = res.getData();
    assert.ok(typeof csv === 'string');
    // Starts with UTF-8 BOM
    assert.strictEqual(csv.startsWith('\uFEFF'), true);

    // Contains Arabic headers
    assert.ok(csv.includes('اسم الطالب'));
    assert.ok(csv.includes('الهاتف'));
    assert.ok(csv.includes('قناة الحجز'));
    assert.ok(csv.includes('اسم الحملة'));
    assert.ok(csv.includes('معرف الإعلان'));
    assert.ok(csv.includes('سجّله'));
    assert.ok(csv.includes('اسم الموظف المسجل'));

    // Contains attendees registered earlier
    assert.ok(csv.includes('محمود عبد الرازق'));
    assert.ok(csv.includes('ياسين أحمد فؤاد'));
    assert.ok(csv.includes('أحمد محمود (مسؤول القبول)'));
    assert.ok(csv.includes('حملة العودة للمدارس'));
  });

  activePrismaGetter = originalGetSharedPrisma;
  sharedDb.getSharedPrismaClient = originalGetSharedPrisma;
});
