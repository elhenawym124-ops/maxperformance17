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
        // Handles both admin (with convertedStudentId & branchId) and legacy inserts
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

        attendeesDb.push({
          id, companyId, demoDayId, customerId, studentName, guardianName, phone, phone2, email, age, grade,
          attendanceStatus: 'REGISTERED', conversionStatus: 'PENDING',
          convertedStudentId, branchId, notes,
          createdAt: new Date(), updatedAt: new Date()
        });
        return 1;
      }
      if (sql.includes('UPDATE "education_demo_attendees"')) {
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
    const res = {
      status: (code) => { statusCode = code; return res; },
      json: (data) => { responseData = data; return res; },
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

  activePrismaGetter = originalGetSharedPrisma;
  sharedDb.getSharedPrismaClient = originalGetSharedPrisma;
});
