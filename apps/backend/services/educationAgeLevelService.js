const crypto = require('crypto');

const AGE_BRACKETS = [
  {
    key: 'EARLY',
    label: 'مرحلة البراعم (4 - 6 سنوات)',
    ageFrom: 4,
    ageTo: 6,
    levels: [
      { id: 'early-1', name: 'تمهيدي أ (Pre-1) - استكشاف وأساسيات', levelNumber: 1 },
      { id: 'early-2', name: 'تمهيدي ب (Pre-2) - تهيئة وتفاعل', levelNumber: 2 },
      { id: 'early-3', name: 'تأسيس مبكر (Early Foundation)', levelNumber: 3 }
    ]
  },
  {
    key: 'JUNIOR',
    label: 'مرحلة الناشئين (7 - 9 سنوات)',
    ageFrom: 7,
    ageTo: 9,
    levels: [
      { id: 'junior-1', name: 'المستوى 1: مبتدئ (Beginner)', levelNumber: 1 },
      { id: 'junior-2', name: 'المستوى 2: ابتدائي (Elementary)', levelNumber: 2 },
      { id: 'junior-3', name: 'المستوى 3: مشاريع تطبيقية', levelNumber: 3 }
    ]
  },
  {
    key: 'INTERMEDIATE',
    label: 'مرحلة اليافعين (10 - 13 سنة)',
    ageFrom: 10,
    ageTo: 13,
    levels: [
      { id: 'mid-1', name: 'المستوى 1: استكشاف ومنطق برمجيات', levelNumber: 1 },
      { id: 'mid-2', name: 'المستوى 2: متوسط (Intermediate)', levelNumber: 2 },
      { id: 'mid-3', name: 'المستوى 3: حل مشكلات وتطبيقات ذكية', levelNumber: 3 },
      { id: 'mid-4', name: 'المستوى 4: متقدم يافعين', levelNumber: 4 }
    ]
  },
  {
    key: 'SENIOR',
    label: 'مرحلة المتقدمين والشباب (14 - 18+ سنة)',
    ageFrom: 14,
    ageTo: 99,
    levels: [
      { id: 'senior-1', name: 'المستوى التأسيسي المكثف', levelNumber: 1 },
      { id: 'senior-2', name: 'المستوى المتوسط المتقدم', levelNumber: 2 },
      { id: 'senior-3', name: 'المستوى المتقدم والاحتراف', levelNumber: 3 },
      { id: 'senior-4', name: 'مستوى مشاريع التخرج والشهادات', levelNumber: 4 }
    ]
  }
];

function getLevelsForAge(age) {
  let bracket = null;
  let levels = [];

  if (!age || isNaN(Number(age))) {
    bracket = null;
    levels = AGE_BRACKETS.flatMap(b => b.levels.map(l => ({ ...l, code: l.id, bracketLabel: b.label, ageRange: `${b.ageFrom}-${b.ageTo}` })));
  } else {
    const numAge = Number(age);
    const matched = AGE_BRACKETS.find(b => numAge >= b.ageFrom && numAge <= b.ageTo);
    if (matched) {
      bracket = matched;
      levels = matched.levels.map(l => ({ ...l, code: l.id, bracketLabel: matched.label, ageRange: `${matched.ageFrom}-${matched.ageTo}` }));
    } else if (numAge < 4) {
      bracket = AGE_BRACKETS[0];
      levels = AGE_BRACKETS[0].levels.map(l => ({ ...l, code: l.id, bracketLabel: AGE_BRACKETS[0].label, ageRange: `${AGE_BRACKETS[0].ageFrom}-${AGE_BRACKETS[0].ageTo}` }));
    } else {
      const senior = AGE_BRACKETS[AGE_BRACKETS.length - 1];
      bracket = senior;
      levels = senior.levels.map(l => ({ ...l, code: l.id, bracketLabel: senior.label, ageRange: `${senior.ageFrom}+` }));
    }
  }

  const result = [...levels];
  result.bracket = bracket;
  result.levels = levels;
  return result;
}

function generateUserCredentials(studentName = '', phone = '', code = '') {
  let cleanName = '';
  if (studentName) {
    cleanName = studentName
      .trim()
      .split(/\s+/)[0]
      .replace(/[^\w\d]/g, '')
      .toLowerCase();
  }

  const randSuffix = Math.floor(1000 + Math.random() * 9000);
  let username = '';
  if (code && code.trim()) {
    username = code.trim().toLowerCase().replace(/[^\w\d_-]/g, '');
  } else if (cleanName) {
    username = `stu_${cleanName}_${randSuffix}`;
  } else if (phone && phone.length >= 4) {
    username = `stu_${phone.slice(-4)}_${randSuffix}`;
  } else {
    username = `stu_${randSuffix}`;
  }

  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randStr = '';
  for (let i = 0; i < 4; i++) {
    randStr += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const password = `Edu@${randStr}${Math.floor(10 + Math.random() * 90)}`;

  return { username, password };
}

module.exports = {
  AGE_BRACKETS,
  getLevelsForAge,
  generateUserCredentials
};
