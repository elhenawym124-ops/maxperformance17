/**
 * Seed tenant: «شركة التجربة الشاملة» — 14-day full trial company.
 *
 * Creates on the target DB (production when run on the server):
 *   1) Company with trialModeEnabled + trialEndsAt = now + 14 days
 *   2) Team users (owner / HR manager / marketing manager / teacher / agent / employees)
 *   3) Marketplace apps: HR suite + Education + Marketing suite (status TRIAL, valid 14 days)
 *   4) Dummy HR data      : departments, positions, employees, attendance, leaves, payroll,
 *                           trainings, documents, reviews, goals, kudos, benefits, advances
 *   5) Dummy Education    : subjects, packages, teachers, parents, students, groups,
 *                           enrollments, sessions, group sessions, attendance, demo day
 *   6) Dummy Marketing    : coupons, customer lists, occasions, broadcast, FB campaigns/adsets/ads,
 *                           tasks, projects
 *
 * Usage:
 *   node scripts/seed_trial_company_14d.js            # idempotent seed
 *   node scripts/seed_trial_company_14d.js --reset    # wipe this tenant's seeded data first
 *   node scripts/seed_trial_company_14d.js --cleanup  # delete the whole trial tenant
 */
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('../prisma/generated/postgresql_v2');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } },
  log: ['error'],
});

const COMPANY_EMAIL = 'trial.academy@maxp.test';
const COMPANY_SLUG = 'trial-academy-14d';
const COMPANY_NAME = 'أكاديمية النخبة — شركة التجربة الشاملة';
const PASSWORD = 'Maxp@2026';
const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date();
const uid = () => crypto.randomUUID();
const daysFromNow = (n) => new Date(NOW.getTime() + n * DAY);
const at = (dayOffset, h, m = 0) => {
  const d = new Date(NOW.getTime() + dayOffset * DAY);
  d.setHours(h, m, 0, 0);
  return d;
};

const APPS = [
  // HR
  'hr-basic', 'hr-core', 'hr-attendance-pro', 'hr-payroll', 'hr-recruitment', 'hr-assets', 'kudos-recognition',
  // Education
  'education-app', 'academy-app',
  // Marketing
  'facebook-pages-connect', 'facebook-ads-pro', 'coupons-pro', 'conversion-suite', 'campaign-attribution',
  'broadcast-pro', 'marketing-agency-pro', 'competitor-analysis', 'ad-budget-planner', 'campaign-calculator',
  'pricing-strategy', 'profitability-engine', 'blog-pro',
];

const report = [];
const safe = async (label, fn) => {
  try {
    const out = await fn();
    report.push(`OK   ${label}${out !== undefined ? ` -> ${out}` : ''}`);
  } catch (e) {
    report.push(`FAIL ${label} -> ${e.message.split('\n')[0]}`);
  }
};

async function main() {
  const mode = process.argv.includes('--cleanup') ? 'cleanup'
    : process.argv.includes('--reset') ? 'reset' : 'seed';
  console.log(`[SEED] mode=${mode} target=${(process.env.POSTGRES_URL || '').replace(/:[^:@/]+@/, ':***@')}`);

  let company = await prisma.company.findUnique({ where: { email: COMPANY_EMAIL } });

  if (mode === 'cleanup') {
    if (!company) { console.log('Nothing to clean.'); await prisma.$disconnect(); return; }
    await wipeCompany(company.id);
    console.log('Deleted trial company:', company.id);
    await prisma.$disconnect();
    return;
  }

  if (!company) {
    company = await prisma.company.create({
      data: {
        name: COMPANY_NAME,
        email: COMPANY_EMAIL,
        slug: COMPANY_SLUG,
        phone: '01099887766',
        address: '٦ شارع التجربة — المعادي، القاهرة',
        currency: 'EGP',
        timezone: 'Africa/Cairo',
        isActive: true,
        sidebarLayout: 'three-tier',
        trialModeEnabled: true,
        trialStartedAt: NOW,
        trialEndsAt: daysFromNow(14),
        notes: 'حلة تجربة كاملة ١٤ يوم — بيانات وهمية (HR + التعليم + التسويق).',
        settings: JSON.stringify({
          trialTenant: true,
          trialDays: 14,
          seededAt: NOW.toISOString(),
          vertical: 'education',
        }),
      },
    });
    report.push(`OK   company created -> ${company.id}`);
  } else {
    company = await prisma.company.update({
      where: { id: company.id },
      data: {
        trialModeEnabled: true,
        trialStartedAt: company.trialStartedAt || NOW,
        trialEndsAt: daysFromNow(14),
        isActive: true,
      },
    });
    report.push(`OK   company reused -> ${company.id} (trial extended to ${daysFromNow(14).toISOString().slice(0, 10)})`);
  }

  if (mode === 'reset') {
    await resetSeedData(company.id);
    report.push('OK   reset: previous seeded rows removed');
  }

  const hash = await bcrypt.hash(PASSWORD, 12);

  // ───────────────────────── users & roles ─────────────────────────
  const upsertUser = async (email, firstName, lastName, role) => {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { companyId: company.id, isActive: true, firstName, lastName },
      });
    }
    return prisma.user.create({
      data: {
        email, password: hash, firstName, lastName, role,
        isActive: true, isEmailVerified: true, emailVerifiedAt: NOW,
        companyId: company.id,
      },
    });
  };

  const owner = await upsertUser('trial.owner@maxp.test', 'منى', 'عبد الرحمن', 'OWNER');

  const ensurePermission = async (key, name, domain) =>
    prisma.permission.upsert({ where: { key }, update: {}, create: { key, name, domain } });

  const ensureRole = async (key, name, description, permKeys) => {
    const role = await prisma.role.upsert({
      where: { key_companyId: { key, companyId: company.id } },
      update: { name, description, isActive: true },
      create: { key, name, description, companyId: company.id, isActive: true, isBuiltIn: false },
    });
    for (const p of permKeys) {
      const perm = await ensurePermission(p.key, p.name, p.domain);
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: {},
        create: { roleId: role.id, permissionId: perm.id },
      });
    }
    return role;
  };

  const hrRole = await ensureRole('MANAGER', 'مدير الموارد البشرية', 'دور تجريبي لإدارة HR', [
    { key: 'dashboard.view', name: 'عرض لوحة التحكم', domain: 'DASHBOARD' },
    { key: 'hr.employees', name: 'إدارة الموظفين', domain: 'HR' },
    { key: 'hr.attendance', name: 'إدارة الحضور', domain: 'HR' },
    { key: 'hr.payroll', name: 'إدارة الرواتب', domain: 'HR' },
    { key: 'reports.view', name: 'عرض التقارير', domain: 'REPORTS' },
  ]);
  const mktRole = await ensureRole('TRIAL_MARKETING_MANAGER', 'مدير التسويق', 'دور تجريبي لإدارة التسويق', [
    { key: 'dashboard.view', name: 'عرض لوحة التحكم', domain: 'DASHBOARD' },
    { key: 'marketing.campaigns', name: 'إدارة الحملات', domain: 'MARKETING' },
    { key: 'marketing.coupons', name: 'إدارة الكوبونات', domain: 'MARKETING' },
    { key: 'marketing.broadcast', name: 'إدارة البث', domain: 'MARKETING' },
    { key: 'facebook.ads', name: 'إعلانات فيسبوك', domain: 'MARKETING' },
    { key: 'customers.view', name: 'عرض العملاء', domain: 'CUSTOMERS' },
    { key: 'reports.view', name: 'عرض التقارير', domain: 'REPORTS' },
  ]);

  const hrUser = await upsertUser('trial.hr@maxp.test', 'خالد', 'سيد', 'MANAGER');  const mktUser = await upsertUser('trial.marketing@maxp.test', 'هبة', 'فؤاد', 'MANAGER');
  const teacherUser = await upsertUser('trial.teacher@maxp.test', 'أستاذ', 'محمود', 'AGENT');
  const agentUser = await upsertUser('trial.agent@maxp.test', 'سارة', 'خدمة العملاء', 'AGENT');

  const linkUser = async (userId, role, roleId) => {
    const existing = await prisma.userCompany.findUnique({ where: { userId_companyId: { userId, companyId: company.id } } });
    if (existing) {
      return prisma.userCompany.update({ where: { id: existing.id }, data: { role, roleId, isActive: true } });
    }
    return prisma.userCompany.create({
      data: { userId, companyId: company.id, role, roleId, isActive: true, isDefault: true },
    });
  };
  await linkUser(owner.id, 'OWNER', null);
  await linkUser(hrUser.id, 'MANAGER', hrRole.id);
  await linkUser(mktUser.id, 'MANAGER', mktRole.id);
  await linkUser(teacherUser.id, 'AGENT', null);
  await linkUser(agentUser.id, 'AGENT', null);
  report.push('OK   users + roles linked');

  // ───────────────────────── apps (module activation) ─────────────────────────
  let appsInstalled = 0;
  for (const slug of APPS) {
    const app = await prisma.marketplaceApp.findUnique({ where: { slug } });
    if (!app) { report.push(`WARN app missing in catalog: ${slug}`); continue; }
    const existing = await prisma.companyApp.findFirst({ where: { companyId: company.id, appId: app.id } });
    const data = {
      status: 'TRIAL',
      installedInTrial: true,
      trialEndsAt: daysFromNow(14),
      validUntil: daysFromNow(14),
      nextBillingAt: daysFromNow(14),
      settings: JSON.stringify({ trialTenant: true }),
    };
    if (existing) {
      await prisma.companyApp.update({ where: { id: existing.id }, data });
    } else {
      await prisma.companyApp.create({ data: { companyId: company.id, appId: app.id, ...data } });
    }    appsInstalled += 1;
  }
  report.push(`OK   apps installed -> ${appsInstalled}/${APPS.length}`);

  // ───────────────────────── HR ─────────────────────────
  const deptDefs = [
    { name: 'الإدارة العامة', nameEn: 'Management' },
    { name: 'الشؤون التعليمية', nameEn: 'Education' },
    { name: 'التسويق', nameEn: 'Marketing' },
    { name: 'خدمة العملاء', nameEn: 'Customer Service' },
  ];
  const depts = {};
  for (const d of deptDefs) {
    const found = await prisma.department.findFirst({ where: { companyId: company.id, name: d.name } });
    depts[d.name] = found || await prisma.department.create({
      data: { companyId: company.id, name: d.name, nameEn: d.nameEn, description: `قسم ${d.name}` },
    });
  }

  const posDefs = [
    { title: 'مدير عام', dept: 'الإدارة العامة' },
    { title: 'منسق تعليمي', dept: 'الشؤون التعليمية' },
    { title: 'مدرس', dept: 'الشؤون التعليمية' },
    { title: 'أخصائي تسويق', dept: 'التسويق' },
    { title: 'موظف خدمة عملاء', dept: 'خدمة العملاء' },
  ];
  const positions = {};
  for (const p of posDefs) {
    const found = await prisma.position.findFirst({ where: { companyId: company.id, title: p.title } });
    positions[p.title] = found || await prisma.position.create({
      data: { companyId: company.id, title: p.title, departmentId: depts[p.dept].id },
    });
  }

  const empDefs = [
    { email: 'trial.owner@maxp.test', userId: owner.id, first: 'منى', last: 'عبد الرحمن', pos: 'مدير عام', dept: 'الإدارة العامة', salary: 30000, hire: -720, phone: '01000000001' },
    { email: 'trial.hr@maxp.test', userId: hrUser.id, first: 'خالد', last: 'سيد', pos: 'مدير عام', dept: 'الإدارة العامة', salary: 18000, hire: -400, phone: '01000000002' },
    { email: 'trial.marketing@maxp.test', userId: mktUser.id, first: 'هبة', last: 'فؤاد', pos: 'أخصائي تسويق', dept: 'التسويق', salary: 15000, hire: -300, phone: '01000000003' },
    { email: 'trial.teacher@maxp.test', userId: teacherUser.id, first: 'أستاذ', last: 'محمود', pos: 'مدرس', dept: 'الشؤون التعليمية', salary: 12000, hire: -200, phone: '01000000004' },
    { email: 'trial.agent@maxp.test', userId: agentUser.id, first: 'سارة', last: 'خدمة العملاء', pos: 'موظف خدمة عملاء', dept: 'خدمة العملاء', salary: 9000, hire: -150, phone: '01000000005' },
    { email: 'trial.emp6@maxp.test', userId: null, first: 'أحمد', last: 'مصطفى', pos: 'مدرس', dept: 'الشؤون التعليمية', salary: 11000, hire: -120, phone: '01000000006' },
    { email: 'trial.emp7@maxp.test', userId: null, first: 'نورهان', last: 'علي', pos: 'موظف خدمة عملاء', dept: 'خدمة العملاء', salary: 8500, hire: -60, phone: '01000000007' },
  ];

  const employees = [];
  let empSeq = 1;
  for (const e of empDefs) {
    let userId = e.userId;
    if (!userId) {
      const u = await upsertUser(e.email, e.first, e.last, 'AGENT');
      await linkUser(u.id, 'AGENT', null);
      userId = u.id;
    }
    const employeeNumber = `EMP-${String(empSeq).padStart(3, '0')}`;
    empSeq += 1;
    const existing = await prisma.employee.findFirst({ where: { companyId: company.id, employeeNumber } });
    const data = {
      userId,
      employeeNumber,
      firstName: e.first,
      lastName: e.last,
      email: e.email,
      phone: e.phone,
      mobile: e.phone,
      hireDate: daysFromNow(e.hire),
      departmentId: depts[e.dept].id,
      positionId: positions[e.pos].id,
      baseSalary: e.salary,
      currency: 'EGP',
      contractType: 'FULL_TIME',
      status: 'ACTIVE',
      workLocation: 'المقر الرئيسي',
      annualLeaveBalance: 21,
      sickLeaveBalance: 7,
    };
    const emp = existing
      ? await prisma.employee.update({ where: { id: existing.id }, data })
      : await prisma.employee.create({ data: { companyId: company.id, ...data } });
    // Legacy HR dashboard counters read User.employeeNumber — keep both records in sync.
    if (userId) {
      await prisma.user.update({ where: { id: userId }, data: { employeeNumber } }).catch(() => {});
    }
    employees.push(emp);
  }
  report.push(`OK   HR employees -> ${employees.length}`);

  // attendance: last 14 days for the 5 users that exist as employees with users
  const attendanceUsers = employees.filter(e => e.userId).slice(0, 5);
  let attCount = 0;
  for (let d = -13; d <= 0; d += 1) {
    const dayDate = at(d, 9, 0);
    const dow = dayDate.getDay(); // 5=Fri, 6=Sat weekend
    if (dow === 5 || dow === 6) continue;
    for (let i = 0; i < attendanceUsers.length; i += 1) {
      const emp = attendanceUsers[i];
      const exists = await prisma.attendance.findFirst({ where: { companyId: company.id, userId: emp.userId, date: new Date(dayDate.toDateString()) } });
      if (exists) continue;
      const late = (d + i) % 7 === 0;
      const absent = (d + i) % 11 === 0;
      await prisma.attendance.create({
        data: {
          companyId: company.id,
          userId: emp.userId,
          employeeRelId: emp.id,
          date: new Date(dayDate.toDateString()),
          status: absent ? 'ABSENT' : late ? 'LATE' : 'PRESENT',
          checkIn: absent ? null : at(d, late ? 9 : 8, late ? 25 : 55),
          checkOut: absent ? null : at(d, 17, 5),
          workHours: absent ? 0 : 8,
          overtimeHours: absent ? 0 : ((d + i) % 5 === 0 ? 1 : 0),
          lateMinutes: late && !absent ? 25 : 0,
          isApproved: true,
          workMode: 'OFFICE',
        },
      });
      attCount += 1;
    }
  }
  report.push(`OK   attendance rows -> ${attCount}`);

  const leaveSeeds = [
    { userId: employees[2].userId, type: 'ANNUAL', from: 6, to: 8, days: 3, status: 'PENDING', reason: 'إجازة سنوية للسفر' },
    { userId: employees[3].userId, type: 'SICK', from: -4, to: -4, days: 1, status: 'APPROVED', reason: 'إجازة مرضية بتقرير طبي' },
    { userId: employees[4].userId, type: 'UNPAID', from: -10, to: -9, days: 2, status: 'REJECTED', reason: 'ظروف عائلية' },
  ];
  for (const l of leaveSeeds) {
    if (!l.userId) continue;
    const exists = await prisma.leaveRequest.findFirst({
      where: { companyId: company.id, userId: l.userId, type: l.type },
    });
    if (exists) continue;
    await prisma.leaveRequest.create({
      data: {
        companyId: company.id,
        userId: l.userId,
        type: l.type,
        startDate: daysFromNow(l.from),
        endDate: daysFromNow(l.to),
        totalDays: l.days,
        reason: l.reason,
        status: l.status,
        approvedBy: l.status === 'APPROVED' ? hrUser.id : null,
        approvedAt: l.status === 'APPROVED' ? daysFromNow(-4) : null,
        rejectionReason: l.status === 'REJECTED' ? 'ضغط عمل في القسم' : null,
      },
    });
  }

  const month = NOW.getMonth() + 1;
  const year = NOW.getFullYear();
  const periodStart = new Date(year, NOW.getMonth(), 1);
  const periodEnd = new Date(year, NOW.getMonth() + 1, 0);
  let payCount = 0;
  for (const emp of employees.slice(0, 5)) {
    const exists = await prisma.payroll.findFirst({ where: { companyId: company.id, userId: emp.userId, month, year } });
    if (exists) continue;
    const base = Number(emp.baseSalary || 0);
    const allowances = 500;
    const deductions = 150;
    await prisma.payroll.create({
      data: {
        companyId: company.id,
        userId: emp.userId,
        employeeRelId: emp.id,
        month, year, periodStart, periodEnd,
        baseSalary: base,
        workingDays: 22, actualWorkDays: 21,
        allowances: JSON.stringify([{ name: 'بدل مواصلات', amount: allowances }]),
        totalAllowances: allowances,
        deductions: JSON.stringify([{ name: 'تأمينات', amount: deductions }]),
        totalDeductions: deductions,
        grossSalary: base + allowances,
        netSalary: base + allowances - deductions,
        socialInsurance: 0, taxAmount: 0,
        status: emp === employees[0] ? 'PROCESSED' : 'DRAFT',
        notes: 'مسير تجريبي — بيانات وهمية',
      },
    });
    payCount += 1;
  }
  report.push(`OK   payroll rows -> ${payCount}`);

  const trainingSeeds = [
    { userId: employees[1].userId, name: 'أساسيات إدارة الموارد البشرية', type: 'INTERNAL', start: -20, status: 'COMPLETED' },
    { userId: employees[2].userId, name: 'كتابة المحتوى التسويقي', type: 'EXTERNAL', start: 5, status: 'PLANNED' },
  ];
  for (const t of trainingSeeds) {
    const exists = await prisma.employeeTraining.findFirst({ where: { companyId: company.id, trainingName: t.name } });
    if (exists) continue;
    await prisma.employeeTraining.create({
      data: {
        companyId: company.id, userId: t.userId, employeeRelId: employees.find(e => e.userId === t.userId)?.id,
        trainingName: t.name, provider: 'أكاديمية داخلية', type: t.type,
        startDate: daysFromNow(t.start), endDate: daysFromNow(t.start + 2),
        duration: 6, currency: 'EGP', cost: 0, status: t.status,
      },
    });
  }

  const docSeeds = [
    { name: 'عقد العمل', type: 'CONTRACT' },
    { name: 'صورة البطاقة', type: 'ID' },
  ];
  for (const d of docSeeds) {
    for (const emp of employees.slice(0, 3)) {
      if (!emp.userId) continue;
      const exists = await prisma.employeeDocument.findFirst({ where: { companyId: company.id, userId: emp.userId, name: d.name } });
      if (exists) continue;
      await prisma.employeeDocument.create({
        data: {
          companyId: company.id, userId: emp.userId, employeeRelId: emp.id,
          name: d.name, type: d.type,
          fileUrl: `https://example.invalid/trial/${d.type.toLowerCase()}-${emp.employeeNumber}.pdf`,
          isVerified: true, verifiedBy: hrUser.id, verifiedAt: NOW,
        },
      });
    }
  }

  const reviewExists = await prisma.performanceReview.findFirst({ where: { companyId: company.id, reviewPeriod: 'Q4-2026' } });
  if (!reviewExists) {
    await prisma.performanceReview.create({
      data: {
        companyId: company.id,
        reviewerId: hrUser.id,
        employeeEmployeeReviewsId: employees[3].id,
        employeeReviewerReviewsId: employees[1].id,
        reviewPeriod: 'Q4-2026',
        periodStart: daysFromNow(-90), periodEnd: daysFromNow(-1),
        overallRating: 4.2,
        strengths: 'التزام بالمواعيد وتفاعل عالي مع الطلاب',
        improvements: 'تطوير استخدام أدوات العرض الرقمية',
        recommendations: 'ترشيح لدورة تدريبية متقدمة',
        status: 'SUBMITTED',
        submittedAt: NOW,
      },
    });
  }

  const goalSeeds = [
    { title: 'زيادة عدد الطلاب المسجلين 20%', target: 20, unit: '%', type: 'COMPANY' },
    { title: 'خفض نسبة غياب الطلاب إلى أقل من 5%', target: 5, unit: '%', type: 'DEPARTMENT' },
    { title: 'إطلاق حملتين تسويقيتين شهريًا', target: 2, unit: 'حملة', type: 'COMPANY' },
  ];
  for (const g of goalSeeds) {
    const exists = await prisma.goal.findFirst({ where: { companyId: company.id, title: g.title } });
    if (exists) continue;
    await prisma.goal.create({
      data: {
        companyId: company.id, title: g.title, description: 'هدف تجريبي لمدة أسبوعين',
        goalType: g.type, priority: 'HIGH', targetValue: g.target, currentValue: 0,
        unit: g.unit, startDate: daysFromNow(-14), endDate: daysFromNow(14), status: 'ACTIVE',
        progress: 0, generationSource: 'MANUAL',
      },
    });
  }

  const kudosExist = await prisma.kudos.findFirst({ where: { companyId: company.id } });
  if (!kudosExist) {
    await prisma.kudos.create({
      data: { companyId: company.id, fromUserId: owner.id, toUserId: hrUser.id, reason: 'تنظيم ملفات الموظفين قبل بدء التجربة', points: 50 },
    });
    await prisma.kudos.create({
      data: { companyId: company.id, fromUserId: hrUser.id, toUserId: teacherUser.id, reason: 'التزام كامل بجدول الحصص', points: 30 },
    });
  }

  const benefitSeeds = [
    { name: 'تأمين طبي', type: 'INSURANCE', cost: 1500 },
    { name: 'وجبة عمل', type: 'MEAL', cost: 300 },
  ];
  for (const b of benefitSeeds) {
    let benefit = await prisma.benefit.findFirst({ where: { companyId: company.id, name: b.name } });
    if (!benefit) {
      benefit = await prisma.benefit.create({
        data: { companyId: company.id, name: b.name, type: b.type, cost: b.cost, currency: 'EGP', isActive: true, description: 'ميزة تجريبية' },
      });
    }
    for (const emp of employees.slice(0, 2)) {
      if (!emp.userId) continue;
      const enr = await prisma.benefitEnrollment.findFirst({ where: { companyId: company.id, benefitId: benefit.id, userId: emp.userId } });
      if (enr) continue;
      await prisma.benefitEnrollment.create({
        data: { companyId: company.id, benefitId: benefit.id, userId: emp.userId, employeeRelId: emp.id, startDate: daysFromNow(-30), status: 'ACTIVE' },
      });
    }
  }

  const advExists = await prisma.advanceRequest.findFirst({ where: { companyId: company.id } });
  if (!advExists) {
    await prisma.advanceRequest.create({
      data: {
        companyId: company.id, userId: employees[4].userId, employeeRelId: employees[4].id,
        amount: 3000, reason: 'سلفة تجريبية', repaymentType: 'MONTHLY',
        installmentsCount: 3, monthlyAmount: 1000, employeeSalary: 9000,
        maxAllowedAmount: 4500, installmentAmount: 1000, remainingBalance: 3000,
        status: 'PENDING',
      },
    });
  }
  report.push('OK   HR extras (trainings/docs/reviews/goals/kudos/benefits/advances)');

  // ───────────────────────── Education ─────────────────────────
  const subjectDefs = [
    { name: 'اللغة العربية', price: 600 },
    { name: 'الرياضيات', price: 700 },
    { name: 'القرآن الكريم', price: 500 },
  ];
  const subjects = {};
  for (const s of subjectDefs) {
    let sub = await prisma.educationSubject.findFirst({ where: { companyId: company.id, name: s.name } });
    if (!sub) {
      sub = await prisma.educationSubject.create({
        data: { companyId: company.id, name: s.name, description: `مسار ${s.name} — تجريبي`, price: s.price, isActive: true },
      });
    }
    subjects[s.name] = sub;
  }

  const pkgDefs = [
    { subject: 'اللغة العربية', name: 'باقة 12 ساعة', hours: 12, price: 1800, level: 1, type: 'GROUP' },
    { subject: 'الرياضيات', name: 'باقة 8 ساعات', hours: 8, price: 1600, level: 1, type: 'PRIVATE' },
    { subject: 'القرآن الكريم', name: 'باقة 16 ساعة', hours: 16, price: 2000, level: 2, type: 'GROUP' },
  ];
  const packages = [];
  for (const p of pkgDefs) {
    let pkg = await prisma.educationPackage.findFirst({ where: { companyId: company.id, name: p.name } });
    if (!pkg) {
      pkg = await prisma.educationPackage.create({
        data: {
          companyId: company.id, subjectId: subjects[p.subject].id, name: p.name,
          description: 'باقة تجريبية', hoursCount: p.hours, sessionDuration: 60, price: p.price,
          levelNumber: p.level, packageType: p.type, isActive: true,
        },
      });
    }
    packages.push(pkg);
  }

  const teacherDefs = [
    { name: 'أ. محمود حسن', subject: 'اللغة العربية', employeeId: employees[3].id, rate: 120 },
    { name: 'أ. إيمان صابر', subject: 'الرياضيات', employeeId: null, rate: 150 },
    { name: 'الشيخ عبد الله', subject: 'القرآن الكريم', employeeId: null, rate: 100 },
  ];
  const teachers = [];
  for (const t of teacherDefs) {
    let teacher = await prisma.educationTeacher.findFirst({ where: { companyId: company.id, name: t.name } });
    if (!teacher) {
      teacher = await prisma.educationTeacher.create({
        data: {
          companyId: company.id, name: t.name, employeeId: t.employeeId,
          phone: '0110000' + String(teachers.length + 1).padStart(4, '0'),
          email: `teacher${teachers.length + 1}@trial.maxp.test`,
          password: hash,
          bio: 'مدرس تجريبي ضمن شركة الاختبار',
          qualifications: 'بكالوريوس تربية',
          isActive: true,
        },
      });
    } else {
      teacher = await prisma.educationTeacher.update({ where: { id: teacher.id }, data: { password: hash } });
    }
    await prisma.educationTeacherSubject.upsert({
      where: { teacherId_subjectId: { teacherId: teacher.id, subjectId: subjects[t.subject].id } },
      update: { hourlyRate: t.rate },
      create: { teacherId: teacher.id, subjectId: subjects[t.subject].id, hourlyRate: t.rate },
    });
    teachers.push(teacher);
  }

  const parentDefs = [
    { first: 'نهى', last: 'إبراهيم', phone: '01110000001' },
    { first: 'عمرو', last: 'الشريف', phone: '01110000002' },
    { first: 'دعاء', last: 'كامل', phone: '01110000003' },
    { first: 'ياسر', last: 'منصور', phone: '01110000004' },
  ];
  const parents = [];
  for (const p of parentDefs) {
    let parent = await prisma.customer.findFirst({ where: { companyId: company.id, phone: p.phone } });
    if (!parent) {
      parent = await prisma.customer.create({
        data: {
          companyId: company.id, firstName: p.first, lastName: p.last, phone: p.phone,
          email: `${p.phone}@trial.maxp.test`, status: 'ACTIVE',
          leadSource: 'REFERRAL', leadStage: 'CONVERTED',
          notes: 'ولي أمر — عميل تجريبي',
        },
      });
    }
    parents.push(parent);
  }

  const studentDefs = [
    { parent: 0, first: 'مالك', last: 'إبراهيم', age: 9, grade: 'الصف الثالث', level: 1, gender: 'MALE' },
    { parent: 0, first: 'ليلى', last: 'إبراهيم', age: 12, grade: 'الصف السادس', level: 2, gender: 'FEMALE' },
    { parent: 1, first: 'يوسف', last: 'الشريف', age: 10, grade: 'الصف الرابع', level: 1, gender: 'MALE' },
    { parent: 2, first: 'مريم', last: 'كامل', age: 13, grade: 'الصف السابع', level: 3, gender: 'FEMALE' },
    { parent: 3, first: 'عمر', last: 'منصور', age: 8, grade: 'الصف الثاني', level: 1, gender: 'MALE' },
  ];
  const students = [];
  for (let i = 0; i < studentDefs.length; i += 1) {
    const s = studentDefs[i];
    const code = `ST-${String(i + 1).padStart(3, '0')}`;
    let student = await prisma.educationStudent.findFirst({ where: { companyId: company.id, code } });
    if (!student) {
      student = await prisma.educationStudent.create({
        data: {
          companyId: company.id, customerId: parents[s.parent].id, code,
          firstName: s.first, lastName: s.last, grade: s.grade,
          gender: s.gender, currentLevel: s.level,
          phone: parents[s.parent].phone, address: 'القاهرة — تجريبي',
          isActive: true, notes: 'طالب تجريبي',
        },
      });
    }
    students.push(student);
  }

  // groups
  const groupDefs = [
    { name: 'مجموعة العربية — المستوى الأول', subject: 'اللغة العربية', teacher: 0, capacity: 10, fee: 600 },
    { name: 'مجموعة القرآن — المستوى الثاني', subject: 'القرآن الكريم', teacher: 2, capacity: 12, fee: 500 },
  ];
  const groups = [];
  for (let i = 0; i < groupDefs.length; i += 1) {
    const g = groupDefs[i];
    const exists = await prisma.educationGroup.findFirst({ where: { companyId: company.id, name: g.name } });
    const group = exists || await prisma.educationGroup.create({
      data: {
        id: uid(), companyId: company.id, name: g.name, code: `GRP-${i + 1}`,
        subjectId: subjects[g.subject].id, teacherId: teachers[g.teacher].id,
        level: `المستوى ${i + 1}`, capacity: g.capacity, feeType: 'MONTHLY', feeAmount: g.fee,
        teacherRateType: 'PERCENTAGE', teacherRateValue: 50,
        scheduleDays: ['Sunday', 'Tuesday'],
        startTime: '17:00', endTime: '18:30', room: `قاعة ${i + 1}`,
        status: 'OPEN', startDate: daysFromNow(-14), endDate: daysFromNow(30),
      },
    });
    groups.push(group);
  }

  const groupMembers = [
    { group: 0, student: 0 }, { group: 0, student: 2 }, { group: 1, student: 3 }, { group: 1, student: 4 },
  ];
  for (const gm of groupMembers) {
    const exists = await prisma.educationGroupMember.findFirst({
      where: { companyId: company.id, groupId: groups[gm.group].id, studentId: students[gm.student].id },
    });
    if (exists) continue;
    await prisma.educationGroupMember.create({
      data: {
        id: uid(), companyId: company.id, groupId: groups[gm.group].id, studentId: students[gm.student].id,
        status: 'ACTIVE', joinedAt: daysFromNow(-12), paymentStatus: 'PAID', amountPaid: 600,
        nextRenewalDate: daysFromNow(18),
      },
    });
  }

  const enrollDefs = [
    { student: 0, pkg: 0, teacher: 0, paid: 1800 },
    { student: 2, pkg: 1, teacher: 1, paid: 800 },
    { student: 3, pkg: 2, teacher: 2, paid: 2000 },
    { student: 1, pkg: 0, teacher: 0, paid: 0 },
  ];
  const enrollments = [];
  for (const e of enrollDefs) {
    const pkg = packages[e.pkg];
    const exists = await prisma.educationEnrollment.findFirst({
      where: { companyId: company.id, studentId: students[e.student].id, packageId: pkg.id },
    });
    const enrollment = exists || await prisma.educationEnrollment.create({
      data: {
        companyId: company.id, studentId: students[e.student].id, packageId: pkg.id,
        teacherId: teachers[e.teacher].id,
        remainingHours: pkg.hoursCount - 2, totalHours: pkg.hoursCount,
        amountPaid: e.paid, paymentStatus: e.paid > 0 ? 'COMPLETED' : 'PENDING',
        enrollmentDate: daysFromNow(-10), expiresAt: daysFromNow(50), isActive: true,
      },
    });
    enrollments.push({ enrollment, teacherId: teachers[e.teacher].id, subjectId: pkg.subjectId });
  }

  let sessionCount = 0;
  for (let i = 0; i < enrollments.length; i += 1) {
    const { enrollment, teacherId, subjectId } = enrollments[i];
    for (let k = 0; k < 4; k += 1) {
      const offset = -8 + k * 3;
      const scheduledAt = at(offset, 17 + (k % 2), 0);
      const topic = ['مراجعة عامة', 'درس جديد', 'تطبيق عملي', 'تقييم'][k % 4];
      const exists = await prisma.educationSession.findFirst({
        where: { companyId: company.id, enrollmentId: enrollment.id, topic },
      });
      if (exists) continue;
      const isPast = offset < 0;
      await prisma.educationSession.create({
        data: {
          companyId: company.id, enrollmentId: enrollment.id, teacherId, studentId: enrollment.studentId,
          subjectId, scheduledAt, plannedDuration: 60,
          actualDuration: isPast ? 55 : null,
          status: isPast ? 'CONFIRMED' : 'SCHEDULED',
          sessionType: 'PRIVATE',
          topic, notes: isPast ? 'حضر الطالب وأتم التكليف' : null,
        },
      });
      sessionCount += 1;
    }
  }

  // group sessions + attendance
  for (const group of groups) {
    for (let k = 0; k < 3; k += 1) {
      const sessionDate = at(-7 + k * 3, 17, 0);
      const gsTopic = `حصة جماعية ${k + 1}`;
      const exists = await prisma.educationGroupSession.findFirst({
        where: { companyId: company.id, groupId: group.id, topic: gsTopic },
      });
      if (exists) continue;
      const gs = await prisma.educationGroupSession.create({
        data: {
          id: uid(), companyId: company.id, groupId: group.id, teacherId: group.teacherId,
          sessionDate, topic: gsTopic, homework: 'حل التدريبات ص ١٢',
          status: 'COMPLETED',
        },
      });
      const members = await prisma.educationGroupMember.findMany({ where: { groupId: group.id } });
      for (const m of members) {
        await prisma.educationGroupAttendance.create({
          data: {
            id: uid(), companyId: company.id, sessionId: gs.id, groupId: group.id,
            studentId: m.studentId, status: 'PRESENT', notifiedParentAt: NOW,
          },
        });
      }
      sessionCount += 1;
    }
  }
  report.push(`OK   education students -> ${students.length} | sessions -> ${sessionCount}`);

  // demo day + attendees
  const demoExists = await prisma.educationDemoDay.findFirst({ where: { companyId: company.id } });
  if (!demoExists) {
    const demo = await prisma.educationDemoDay.create({
      data: {
        id: uid(), companyId: company.id, title: 'يوم تجربة مجاني — اللغة العربية',
        description: 'حصة تجريبية للتعريف بالبرنامج', subjectId: subjects['اللغة العربية'].id,
        teacherId: teachers[0].id, scheduledAt: daysFromNow(3), durationMinutes: 60,
        locationType: 'ONLINE', meetingLink: 'https://meet.example.invalid/trial-demo',
        capacity: 20, status: 'SCHEDULED',
      },
    });
    for (let i = 0; i < 3; i += 1) {
      await prisma.educationDemoAttendee.create({
        data: {
          id: uid(), companyId: company.id, demoDayId: demo.id,
          customerId: parents[i].id, studentName: studentDefs[i].first + ' ' + studentDefs[i].last,
          guardianName: parents[i].firstName + ' ' + parents[i].lastName,
          phone: parents[i].phone, age: studentDefs[i].age, grade: studentDefs[i].grade,
          attendanceStatus: i === 0 ? 'ATTENDED' : 'REGISTERED',
          conversionStatus: i === 0 ? 'CONVERTED' : 'PENDING',
        },
      });
    }
  }

  // ───────────────────────── Academy (LMS) ─────────────────────────
  const courseDefs = [
    { title: 'أساسيات اللغة العربية للأطفال', modules: ['مدخل إلى الحروف', 'القراءة والكتابة'] },
    { title: 'الرياضيات التفاعلية — المستوى الأول', modules: ['الأعداد والعمليات', 'الأشكال والقياس'] },
    { title: 'حفظ القرآن مع التجويد', modules: ['أحكام التجويد', 'خطة الحفظ الأسبوعية'] },
  ];
  let academyLessons = 0;
  for (const c of courseDefs) {
    const exists = await prisma.academyCourse.findFirst({ where: { companyId: company.id, title: c.title } });
    if (exists) { academyLessons += 4; continue; }
    const course = await prisma.academyCourse.create({
      data: {
        companyId: company.id, title: c.title, slug: `trial-${academyLessons}-${Date.now()}`,
        description: 'كورس تجريبي داخل شركة الاختبار',
        price: 0, isPublished: true, isGlobal: false, freePreviewLessons: 1,
        visibility: 'PUBLIC',
      },
    });
    let order = 0;
    for (const mTitle of c.modules) {
      const mod = await prisma.academyModule.create({
        data: { companyId: company.id, courseId: course.id, title: mTitle, sortOrder: order },
      });
      order += 1;
      for (let l = 1; l <= 2; l += 1) {
        await prisma.academyLesson.create({
          data: {
            companyId: company.id, courseId: course.id, moduleId: mod.id,
            title: `${mTitle} — الدرس ${l}`, sortOrder: l,
            durationMin: 12, isFreePreview: l === 1,
            scriptText: 'نص تجريبي للدرس.',
          },
        });
        academyLessons += 1;
      }
    }
  }
  report.push(`OK   academy lessons -> ${academyLessons}`);

  // ───────────────────────── Marketing ─────────────────────────
  const leadDefs = [
    { first: 'ريم', last: 'سالم', phone: '01220000001', source: 'FACEBOOK', status: 'LEAD' },
    { first: 'طارق', last: 'حسن', phone: '01220000002', source: 'WHATSAPP', status: 'ACTIVE' },
    { first: 'مروة', last: 'عادل', phone: '01220000003', source: 'INSTAGRAM', status: 'LEAD' },
    { first: 'سيد', last: 'رمضان', phone: '01220000004', source: 'CALL', status: 'ACTIVE' },
    { first: 'أمينة', last: 'خليل', phone: '01220000005', source: 'WEBSITE', status: 'LEAD' },
    { first: 'حسن', last: 'الجندي', phone: '01220000006', source: 'TIKTOK', status: 'ACTIVE' },
  ];
  const leads = [];
  for (const l of leadDefs) {
    let c = await prisma.customer.findFirst({ where: { companyId: company.id, phone: l.phone } });
    if (!c) {
      c = await prisma.customer.create({
        data: {
          companyId: company.id, firstName: l.first, lastName: l.last, phone: l.phone,
          email: `${l.phone}@trial.maxp.test`, status: l.status,
          leadSource: l.source, leadStage: l.status === 'ACTIVE' ? 'CONVERTED' : 'CONTACTED',
          leadPriority: 'WARM', assignedToId: agentUser.id,
          notes: 'ليد تجريبي للحملات',
        },
      });
    }
    leads.push(c);
  }

  const couponDefs = [
    { code: 'TRIAL10', name: 'خصم ١٠٪ تجربة', type: 'PERCENTAGE', value: 10 },
    { code: 'WELCOME100', name: 'خصم ١٠٠ جنيه', type: 'FIXED_AMOUNT', value: 100 },
    { code: 'FREESHIP', name: 'شحن مجاني', type: 'FREE_SHIPPING', value: 0 },
  ];
  for (const c of couponDefs) {
    const exists = await prisma.coupon.findFirst({ where: { companyId: company.id, code: c.code } });
    if (exists) continue;
    await prisma.coupon.create({
      data: {
        companyId: company.id, code: c.code, name: c.name, type: c.type, value: c.value,
        validFrom: daysFromNow(-5), validTo: daysFromNow(20), isActive: true,
        usageLimit: 100, minOrderAmount: 300, createdBy: mktUser.id,
      },
    });
  }

  const listDefs = [
    { name: 'مهتمون بالدورات', criteria: JSON.stringify({ status: 'LEAD' }), count: 4 },
    { name: 'عملاء نشطون', criteria: JSON.stringify({ status: 'ACTIVE' }), count: 3 },
  ];
  for (const l of listDefs) {
    const exists = await prisma.customerList.findFirst({ where: { companyId: company.id, name: l.name } });
    if (exists) continue;
    await prisma.customerList.create({
      data: { companyId: company.id, name: l.name, criteria: l.criteria, count: l.count, isDefault: false },
    });
  }

  const occasionDefs = [
    { name: 'تهنئة بداية الترم', message: 'أهلاً {customerName}، الترم الجديد بدأ! سجّل الآن واحصل على خصم ١٠٪.', at: 2 },
    { name: 'عرض نهاية الأسبوع', message: 'عرض خاص لنهاية الأسبوع على باقات اللغة العربية.', at: 5 },
  ];
  for (const o of occasionDefs) {
    const exists = await prisma.occasion.findFirst({ where: { companyId: company.id, name: o.name } });
    if (exists) continue;
    await prisma.occasion.create({
      data: {
        companyId: company.id, name: o.name, message: o.message,
        scheduledAt: daysFromNow(o.at), recurrence: 'ONCE', customerListIds: '[]',
        status: 'SCHEDULED', sendLimit: 100, throttlePerRun: 20,
      },
    });
  }

  const broadcastExists = await prisma.broadcastCampaign.findFirst({ where: { companyId: company.id } });
  if (!broadcastExists) {
    await prisma.broadcastCampaign.create({
      data: {
        companyId: company.id, creatorId: mktUser.id,
        name: 'حملة تعريف بالباقات', channel: 'WHATSAPP', priority: 'NORMAL',
        message: 'أهلاً {اسم العميل} 👋 عندنا باقات تعليمية جديدة. رد بـ ١ لمعرفة التفاصيل.',
        targetAudience: 'ALL_CUSTOMERS', status: 'DRAFT', audienceMode: 'ALL',
        recipientCount: leads.length, sentCount: 0, deliveredCount: 0, openedCount: 0,
        clickedCount: 0, failedCount: 0, includeImages: false, trackClicks: true,
        autoResend: false, recurrence: 'NONE', recurrenceInterval: 1,
        failureRateThreshold: 10, maxRecipientsPerRun: 500,
      },
    });
    await prisma.broadcastCampaign.create({
      data: {
        companyId: company.id, creatorId: mktUser.id,
        name: 'تذكير بموعد يوم التجربة', channel: 'WHATSAPP', priority: 'HIGH',
        message: '{اسم العميل}، فاضل يومين على يوم التجربة المجاني. تأكيد الحضور؟',
        targetAudience: 'LEADS', status: 'SCHEDULED', audienceMode: 'LIST',
        scheduledAt: daysFromNow(1), recipientCount: 4, sentCount: 0, deliveredCount: 0,
        openedCount: 0, clickedCount: 0, failedCount: 0, includeImages: false,
        trackClicks: true, autoResend: false, recurrence: 'NONE',
        recurrenceInterval: 1, failureRateThreshold: 10, maxRecipientsPerRun: 500,
      },
    });
  }

  const fbExists = await prisma.facebookCampaign.findFirst({ where: { companyId: company.id } });
  if (!fbExists) {
    const camp1 = await prisma.facebookCampaign.create({
      data: {
        companyId: company.id, name: 'حملة تسجيل الترم الجديد', objective: 'OUTCOME_LEADS',
        status: 'PAUSED', budgetType: 'DAILY', budgetAmount: 300,
        startDate: daysFromNow(-3), endDate: daysFromNow(11),
        settings: JSON.stringify({ trial: true }),
      },
    });
    const set1 = await prisma.facebookAdset.create({
      data: {
        campaignId: camp1.id, name: 'أولياء أمور — القاهرة', status: 'PAUSED',
        budgetType: 'DAILY', budgetAmount: 300, ageMin: 28, ageMax: 48,
        genders: 'ALL', locations: JSON.stringify(['Cairo', 'Giza']),
        targeting: JSON.stringify({ geo: ['Cairo', 'Giza'] }),
        optimizationGoal: 'LEAD_GENERATION', billingEvent: 'IMPRESSIONS',
      },
    });
    await prisma.facebookAd.create({
      data: {
        adSetId: set1.id, companyId: company.id, name: 'إعلان — حصة تجريبية مجانية',
        status: 'PAUSED', creativeType: 'IMAGE',
        primaryText: 'حصة تجريبية مجانية لطفلك في اللغة العربية والقرآن. احجز الآن!',
        headline: 'احجز حصة تجريبية مجانية', description: 'أكاديمية النخبة',
        callToAction: 'SIGN_UP', linkUrl: 'https://maxp.online/trial-academy-14d',
      },
    });
    const camp2 = await prisma.facebookCampaign.create({
      data: {
        companyId: company.id, name: 'حملة إعادة استهداف العملاء', objective: 'OUTCOME_SALES',
        status: 'DRAFT', budgetType: 'LIFETIME', budgetAmount: 1500,
        startDate: daysFromNow(4), endDate: daysFromNow(14),
      },
    });
    const set2 = await prisma.facebookAdset.create({
      data: {
        campaignId: camp2.id, name: 'عملاء سابقون', status: 'DRAFT',
        budgetType: 'LIFETIME', budgetAmount: 1500,
        ageMin: 25, ageMax: 55, genders: 'ALL',
        targeting: JSON.stringify({ customAudiences: ['existing-customers'] }),
      },
    });
    await prisma.facebookAd.create({
      data: {
        adSetId: set2.id, companyId: company.id, name: 'إعلان — عودة الطلاب',
        status: 'DRAFT', creativeType: 'IMAGE',
        primaryText: 'وحشتنا! خصم ١٠٪ على تجديد الباقة هذا الأسبوع.',
        headline: 'خصم التجديد', description: 'لفترة محدودة',
        callToAction: 'SHOP_NOW',
      },
    });
  }

  // tasks
  const taskDefs = [
    { title: 'مراجعة ملفات الموظفين الجدد', desc: 'استكمال عقود وبطاقات ٣ موظفين جدد.', assigned: hrUser.id, status: 'IN_PROGRESS', priority: 'HIGH', due: 2 },
    { title: 'إطلاق حملة الترم الجديد', desc: 'تجهيز الكرييتيف والجمهور وإطلاق الحملة.', assigned: mktUser.id, status: 'PENDING', priority: 'URGENT', due: 1 },
    { title: 'تأكيد حضور يوم التجربة', desc: 'الاتصال بأولياء الأمور المسجلين في يوم التجربة.', assigned: agentUser.id, status: 'PENDING', priority: 'MEDIUM', due: 2 },
    { title: 'تسجيل نتائج اختبار الأسبوع الأول', desc: 'رفع تقييم الطلاب بعد أول ٤ حصص.', assigned: teacherUser.id, status: 'COMPLETED', priority: 'MEDIUM', due: -1 },
  ];
  for (const t of taskDefs) {
    const exists = await prisma.task.findFirst({ where: { companyId: company.id, title: t.title } });
    if (exists) continue;
    await prisma.task.create({
      data: {
        companyId: company.id, title: t.title, description: t.desc,
        assignedTo: t.assigned, createdBy: owner.id,
        status: t.status, priority: t.priority, type: 'GENERAL',
        dueDate: daysFromNow(t.due), progress: t.status === 'COMPLETED' ? 100 : t.status === 'IN_PROGRESS' ? 40 : 0,
        completedDate: t.status === 'COMPLETED' ? NOW : null,
      },
    });
  }

  // project
  const projExists = await prisma.project.findFirst({ where: { companyId: company.id, name: 'تجربة التشغيل الكاملة — ١٤ يوم' } });
  if (!projExists) {
    await prisma.project.create({
      data: {
        companyId: company.id, name: 'تجربة التشغيل الكاملة — ١٤ يوم',
        description: 'مشروع تجريبي لتشغيل HR والتعليم والتسويق معًا وقياس رحلة العميل.',
        status: 'ACTIVE', priority: 'HIGH', managerId: owner.id,
        startDate: daysFromNow(-1), endDate: daysFromNow(13), progress: 10,
        teamMembers: JSON.stringify([hrUser.id, mktUser.id, teacherUser.id, agentUser.id]),
      },
    });
  }

  report.push('OK   marketing (leads/coupons/lists/occasions/broadcast/FB ads)');
  report.push('OK   tasks + project');

  // ───────────────────────── summary ─────────────────────────
  console.log('\n================ SEED REPORT ================');
  report.forEach(r => console.log(r));
  console.log('=============================================');
  console.log(JSON.stringify({
    companyId: company.id,
    companySlug: COMPANY_SLUG,
    companyEmail: COMPANY_EMAIL,
    trialEndsAt: daysFromNow(14).toISOString(),
    logins: {
      owner: 'trial.owner@maxp.test',
      hrManager: 'trial.hr@maxp.test',
      marketingManager: 'trial.marketing@maxp.test',
      teacher: 'trial.teacher@maxp.test',
      agent: 'trial.agent@maxp.test',
      password: PASSWORD,
    },
    appsInstalled,
    counts: {
      employees: employees.length,
      attendance: attCount,
      students: students.length,
      sessions: sessionCount,
      leads: leads.length,
    },
  }, null, 2));

  await prisma.$disconnect();
}

async function resetSeedData(companyId) {
  const cid = { companyId };
  // order matters (children first)
  await prisma.educationGroupAttendance.deleteMany({ where: cid });
  await prisma.educationGroupSession.deleteMany({ where: cid });
  await prisma.educationGroupMember.deleteMany({ where: cid });
  await prisma.educationGroup.deleteMany({ where: cid });
  await prisma.educationDemoAttendee.deleteMany({ where: cid });
  await prisma.educationDemoDay.deleteMany({ where: cid });
  await prisma.educationSession.deleteMany({ where: cid });
  await prisma.educationEnrollment.deleteMany({ where: cid });
  await prisma.educationStudent.deleteMany({ where: cid });
  await prisma.educationTeacherSubject.deleteMany({ where: { teacher: { companyId } } });
  await prisma.educationTeacher.deleteMany({ where: cid });
  await prisma.educationPackage.deleteMany({ where: cid });
  await prisma.educationSubject.deleteMany({ where: cid });
  await prisma.attendance.deleteMany({ where: cid });
  await prisma.leaveRequest.deleteMany({ where: cid });
  await prisma.payroll.deleteMany({ where: cid });
  await prisma.employeeTraining.deleteMany({ where: cid });
  await prisma.employeeDocument.deleteMany({ where: cid });
  await prisma.performanceReview.deleteMany({ where: cid });
  await prisma.goal.deleteMany({ where: cid });
  await prisma.kudos.deleteMany({ where: cid });
  await prisma.benefitEnrollment.deleteMany({ where: cid });
  await prisma.benefit.deleteMany({ where: cid });
  await prisma.advanceRequest.deleteMany({ where: cid });
  await prisma.employeeWarning.deleteMany({ where: cid });
  await prisma.employee.deleteMany({ where: cid });
  await prisma.position.deleteMany({ where: cid });
  await prisma.department.deleteMany({ where: cid });
  await prisma.task.deleteMany({ where: cid });
  await prisma.project.deleteMany({ where: cid });
  await prisma.broadcastCampaign.deleteMany({ where: cid });
  await prisma.academyLesson.deleteMany({ where: cid });
  await prisma.academyModule.deleteMany({ where: cid });
  await prisma.academyCourse.deleteMany({ where: cid });
  await prisma.facebookAd.deleteMany({ where: cid });
  await prisma.facebookAdset.deleteMany({ where: { facebookCampaign: { companyId } } });
  await prisma.facebookCampaign.deleteMany({ where: cid });
  await prisma.coupon.deleteMany({ where: cid });
  await prisma.customerList.deleteMany({ where: cid });
  await prisma.occasion.deleteMany({ where: cid });
  await prisma.customer.deleteMany({ where: cid });
  await prisma.rolePermission.deleteMany({ where: { role: { companyId } } });
  await prisma.userCompany.deleteMany({ where: cid });
  await prisma.role.deleteMany({ where: cid });
}

async function wipeCompany(companyId) {
  await resetSeedData(companyId);
  await prisma.companyApp.deleteMany({ where: { companyId } });
  await prisma.user.deleteMany({ where: { companyId } });
  await prisma.company.delete({ where: { id: companyId } });
}

main()
  .catch((e) => { console.error('[SEED] fatal:', e); process.exitCode = 1; })
  .finally(async () => { try { await prisma.$disconnect(); } catch (_) {} });
