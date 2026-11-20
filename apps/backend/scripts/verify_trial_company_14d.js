/**
 * Verify the 14-day trial tenant seed.
 *   node scripts/verify_trial_company_14d.js
 */
const path = require('path');
const { PrismaClient } = require('../prisma/generated/postgresql_v2');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production'), quiet: true });
require('dotenv').config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.POSTGRES_URL || process.env.DATABASE_URL } },
  log: ['error'],
});

async function main() {
  const company = await prisma.company.findUnique({ where: { email: 'trial.academy@maxp.test' } });
  if (!company) { console.log('COMPANY NOT FOUND'); return; }

  const cid = { companyId: company.id };
  const count = (m) => prisma[m].count({ where: cid });

  const [
    users, employees, departments, positions, attendance, leaves, payroll,
    trainings, documents, reviews, goals, kudos, benefits,
    students, teachers, subjects, packages, enrollments, sessions, groups, groupMembers, demoDays,
    courses, lessons, customers, coupons, lists, occasions, broadcasts, fbCampaigns, fbAdsets, fbAds, tasks, projects, apps,
  ] = await Promise.all([
    count('user'), count('employee'), count('department'), count('position'), count('attendance'), count('leaveRequest'), count('payroll'),
    count('employeeTraining'), count('employeeDocument'), count('performanceReview'), count('goal'), count('kudos'), count('benefit'),
    count('educationStudent'), count('educationTeacher'), count('educationSubject'), count('educationPackage'), count('educationEnrollment'),
    count('educationSession'), count('educationGroup'), count('educationGroupMember'), count('educationDemoDay'),
    count('academyCourse'), count('academyLesson'), count('customer'), count('coupon'), count('customerList'), count('occasion'),
    count('broadcastCampaign'), count('facebookCampaign'),
    prisma.facebookAdset.count({ where: { facebookCampaign: { companyId: company.id } } }),
    count('facebookAd'), count('task'), count('project'),
    count('companyApp'),
  ]);

  const installed = await prisma.companyApp.findMany({
    where: cid,
    select: { status: true, trialEndsAt: true, validUntil: true, app: { select: { slug: true } } },
  });

  const attSample = await prisma.attendance.findMany({ where: cid, take: 3, select: { date: true, status: true, userId: true } });
  const sesSample = await prisma.educationSession.findMany({ where: cid, take: 3, select: { scheduledAt: true, status: true, topic: true } });

  console.log(JSON.stringify({
    company: {
      id: company.id, name: company.name, slug: company.slug, email: company.email,
      trialModeEnabled: company.trialModeEnabled, trialStartedAt: company.trialStartedAt, trialEndsAt: company.trialEndsAt,
      isActive: company.isActive,
    },
    counts: {
      users, employees, departments, positions, attendance, leaves, payroll,
      trainings, documents, reviews, goals, kudos, benefits,
      students, teachers, subjects, packages, enrollments, sessions, groups, groupMembers, demoDays,
      courses, lessons, customers, coupons, lists, occasions, broadcasts, fbCampaigns, fbAdsets, fbAds, tasks, projects, apps,
    },
    apps: installed.map((a) => `${a.app.slug}:${a.status}`),
    attSample, sesSample,
  }, null, 2));

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
