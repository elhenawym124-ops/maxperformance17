/**
 * تشغيل كل سكربتات التجربة بالترتيب مع فواصل زمنية (تجنّب rate-limit).
 *   node apps/backend/scripts/run-all-trial-suites.cjs
 */
const { execFileSync } = require('child_process');
const path = require('path');

const SCRIPTS = [
  ['HR الأساسي', 'hr-api-scenarios.cjs'],
  ['HR الإداري', 'hr-admin-scenarios.cjs'],
  ['HR التقارير', 'hr-reports-scenarios.cjs'],
  ['دورة حياة الموظف', 'hr-lifecycle-scenarios.cjs'],
  ['الأداء والتطوير', 'hr-talent-scenarios.cjs'],
  ['السلف', 'hr-advances-scenarios.cjs'],
  ['المكافآت', 'hr-rewards-scenarios.cjs'],
  ['التعليم المالي', 'edu-money-scenarios.cjs'],
  ['بوابة المدرس + الإسناد', 'edu-teacher-portal-scenarios.cjs'],
  ['التسويق', 'mkt-scenarios.cjs'],
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const summary = [];

(async () => {
  for (const [label, file] of SCRIPTS) {
    const full = path.join(__dirname, file);
    let out = '';
    try {
      out = execFileSync(process.execPath, [full], { encoding: 'utf8', timeout: 10 * 60 * 1000 });
    } catch (e) {
      out = `${e.stdout || ''}\n${e.stderr || ''}`;
    }
    const total = (out.match(/TOTAL\s+(\d+)\s+—\s+PASS\s+(\d+)\s+—\s+FAIL\s+(\d+)/) || []);
    summary.push({
      suite: label,
      total: Number(total[1] || 0),
      pass: Number(total[2] || 0),
      fail: Number(total[3] || 0),
    });
    console.log(`${label.padEnd(26)} ${total[0] || 'NO RESULT'}`);
    await sleep(5000);
  }

  const totals = summary.reduce((acc, s) => ({ total: acc.total + s.total, pass: acc.pass + s.pass, fail: acc.fail + s.fail }), { total: 0, pass: 0, fail: 0 });
  console.log('\n===== SUMMARY =====');
  summary.forEach((s) => console.log(`${s.fail === 0 ? 'OK  ' : 'FAIL'} ${s.suite.padEnd(26)} ${s.pass}/${s.total}`));
  console.log(`TOTAL ${totals.total} — PASS ${totals.pass} — FAIL ${totals.fail}`);
  process.exitCode = totals.fail > 0 ? 1 : 0;
})();
