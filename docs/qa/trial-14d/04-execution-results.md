# نتائج تنفيذ HR — الحزم ١ إلى ٤

> تنفيذ فعلي على التينانت `trial-academy-14d` على `maxp.online` — 2026-11-20.
> السكربت القابل لإعادة التشغيل: `apps/backend/scripts/hr-api-scenarios.cjs`

## ١. الملخص

| البند | النتيجة |
|---|---|
| سيناريوهات منفّذة (API) | **30** |
| Pass | **30** |
| Fail | **0** |
| أخطاء حقيقية اكتُشفت وأُصلحت | **10** |
| سكربتات اختبار جديدة | 1 (قابل لإعادة التشغيل) |
| اختبارات آلية للـHR بعد الإصلاح | 79/79 (3 suites) |

## ٢. مصفوفة النتائج

| ID | المجال | السيناريو | النتيجة |
|---|---|---|---|
| SETUP-1 | setup | دخول الأدوار الثلاثة (مالك / HR / موظف) | PASS |
| SETUP-2 | setup | قراءة الأقسام والوظائف | PASS |
| HR-01 | employees | إضافة موظف جديد | PASS (201 · EMP00001) |
| HR-02 | employees | رفض بريد غير صحيح | PASS (400) |
| HR-03 | employees | منع نفس البريد مرتين | PASS (409) |
| HR-04 | employees | منع تصعيد الدور إلى SUPER_ADMIN | PASS (403) |
| HR-05 | employees | الموظف لا يضيف موظفين | PASS (403) |
| HR-06 | employees | الموظف الجديد يظهر في القائمة | PASS |
| HR-07 | employees | تعديل بيانات الموظف | PASS (200) |
| HR-08 | attendance | تسجيل حضور | PASS (200 / 400 «مسجّل مسبقًا» = صحيح) |
| HR-09 | attendance | منع حضور مكرر | PASS (400) |
| HR-10 | attendance | تسجيل انصراف | PASS (200) |
| HR-11 | attendance | حضور يدوي بوقت دخول/خروج | PASS (201 · 09:00→17:00) |
| HR-12 | attendance | رفض حالة غير صحيحة | PASS (400) |
| HR-13 | attendance | سجلات الحضور للفترة | PASS |
| HR-14 | leaves | الموظف يقدّم إجازة | PASS (201 · PENDING) |
| HR-15 | leaves | رفض نوع غير صحيح | PASS (400) |
| HR-16 | leaves | رفض تاريخ نهاية قبل البداية | PASS (400) |
| HR-17 | leaves | رفض إجازة تتجاوز الرصيد | PASS (400) |
| HR-18 | leaves | اعتماد الإجازة | PASS (APPROVED) |
| HR-19 | leaves | منع الاعتماد مرتين | PASS (400) |
| HR-20 | leaves | الرصيد ينقص بعد الاعتماد | PASS (21 → 18) |
| HR-21 | leaves | الموظف لا يعتمد إجازته | PASS (403) |
| HR-22 | payroll | توليد مسير شهر جديد | PASS |
| HR-23 | payroll | ملخص المسير | PASS (9 موظف · صافي 782.61) |
| HR-24 | payroll | إعادة التوليد لا تُضاعف | PASS |
| HR-25 | payroll | اعتماد مسير | PASS |
| HR-26 | payroll | صرف مسير | PASS |
| HR-27 | payroll | الموظف لا يولّد مسيرًا | PASS (403) |
| HR-28 | payroll | الموظف يرى سجله فقط | PASS |

## ٣. الأخطاء المكتشفة والمُصلحة

| # | الخطأ | الأثر | السبب الجذري | الإصلاح |
|---|---|---|---|---|
| F-21 | صرف الراتب 500 | **لا يمكن صرف أي راتب** | `prisma.payroll.findUnique({ include: { user: true } })` — لا يوجد علاقة `user` على Payroll | حذف الـinclude غير الصحيح |
| F-22 | إجازة 60 يومًا تُقبل | رصيد سالب/تلاعب | الفحص على `User.annualLeaveBalance` وهو `null` فيمرّ | قراءة الرصيد من `hr_employees` مع fallback |
| F-23 | رصيد الإجازات يرجع `total: null` | شاشة الرصيد فارغة | نفس المصدر القديم + تجاهل الحساب المحسوب | حساب `balance/used/total` أرقامًا من Employee |
| F-24 | التقرير السنوي 500 | تقرير الرواتب معطّل | `year` غير مُمرَّر → `NaN` | سنة افتراضية = السنة الحالية |
| F-25 | قائمة تقييمات الأداء 500 | شاشة التقييمات لا تفتح | `JSON.parse` على نص عربي عادي في `recommendations` | `parseJsonSafe` لكل حقول JSON |
| F-26 | `/leaves/stats` و`/leaves/calendar` = 404 | تقارير الإجازات غير متاحة | تعريفهما بعد `/leaves/:id` | إعادة الترتيب قبل `/leaves/:id` |
| F-27 | اعتماد/رفض مكرر = 500 | معالجة أخطاء خاطئة | `throw new Error` بدون `statusCode` | أخطاء بحالة 400/403 |
| F-28 | راتب رقمي مرفوض 400 | كل عميل يرسل رقمًا يُرفض | تحقق يفرض `string` فقط | قبول الرقم والنص |
| F-29 | استجابة إنشاء الموظف تُرجع هاش كلمة المرور | **تسريب أمني** | إرجاع كائن الموظف كما هو | حذف `password` من الاستجابة |
| F-30 | check-out = 500 (numeric overflow) | لا يمكن تسجيل الانصراف | سجل إجازة/عطلة بلا بصمة يُلتقط كسجل مفتوح → ساعات ضخمة | فلترة `checkIn != null` واستثناء حالات الإجازة/العطلة + سقف 999.99 |

## ٤. مسح التغطية (35 مسار قراءة)

| الحالة | المسارات |
|---|---|
| 200 | departments · positions · shifts · attendance/today · attendance/stats · exception-requests · missing-punches · leaves · payroll · payroll/summary · payroll/auto-status · deductions · benefits · warnings · goals · promotions · resignations · assets · audit-logs · recruitment/jobs · settings · online-team · employees/stats · organization-chart · advances · reporting/forms |
| 200 بعد الإصلاح | leaves/stats · leaves/calendar · payroll/annual-report · performance-reviews |
| 404 (أسماء مختلفة في الـrouter — تحتاج تصحيح خريطة التغطية) | training · kudos · rewards · company-policy · reports/monthly |
| 400 (يحتاج باراميتر) | reports/absent-days |

## ٥. ما لم يُغطَّ بعد

| الحزمة | الحالة |
|---|---|
| ١ الموظفون | ✅ مغطاة (ما عدا: تعطيل/إعادة تفعيل، ربط حساب موجود، إعادة تعيين كلمة السر) |
| ٢ الحضور | ✅ الأساسي مغطى (المتبقي: إغلاق تلقائي، استثناءات، إقفال بصمة ناقصة، ورديات) |
| ٣ الإجازات | ✅ مغطى (المتبقي: نصف يوم، إعادة فتح، تداخل إجازات) |
| ٤ الرواتب | ✅ الأساسي مغطى (المتبقي: صحة احتساب التأخير/الغياب/السلف/الإضافي مقابل قاعدة العمل) |
| ٥ الإداري | ⏳ أقسام (إنشاء/حذف ✅) — مناوبات/خصومات/مزايا/مكافآت لم تُنفَّذ دوراتها |
| ٦ الأداء والتطوير | ⏳ قراءة فقط |
| ٧ التقارير والإعدادات | ⏳ قراءة + تحديث إعدادات ✅ |

## ٦. إعادة التشغيل

```bash
node apps/backend/scripts/hr-api-scenarios.cjs
```

السكربت ينشئ بيانات بوسم `QA` ويحاول حذفها في النهاية، ولا يلمس أي شركة أخرى.
