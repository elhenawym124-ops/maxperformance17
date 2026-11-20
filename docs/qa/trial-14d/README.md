# شركة التجربة الشاملة — ١٤ يوم (بيانات وهمية)

تينانت حقيقي على `maxp.online` لتشغيل تجربة شركة كاملة: **موارد بشرية + نظام تعليمي + أدوات تسويق**، ببيانات وهمية جاهزة، مع خريطة تجربة عميل وسيناريوهات اختبار مستخرجة منها.

## ما تم إنشاؤه

| البند | القيمة |
|---|---|
| اسم الشركة | أكاديمية النخبة — شركة التجربة الشاملة |
| Tenant ID | `cmwp4ot8p0000juzaeqeysfg3` |
| Slug | `trial-academy-14d` |
| بريد الشركة | `trial.academy@maxp.test` |
| بداية/نهاية التجربة | 2026-11-20 → **2026-12-04** |
| `trialModeEnabled` | `true` |
| التطبيقات | **22** تطبيق بحالة `TRIAL` وصالحة حتى نهاية التجربة |

### الوحدات المفعّلة

- **HR (7):** `hr-basic`, `hr-core`, `hr-attendance-pro`, `hr-payroll`, `hr-recruitment`, `hr-assets`, `kudos-recognition`
- **تعليم (2):** `education-app` (المركز التعليمي), `academy-app` (كورسات LMS)
- **تسويق (13):** `facebook-pages-connect`, `facebook-ads-pro`, `coupons-pro`, `conversion-suite`, `campaign-attribution`, `broadcast-pro`, `marketing-agency-pro`, `competitor-analysis`, `ad-budget-planner`, `campaign-calculator`, `pricing-strategy`, `profitability-engine`, `blog-pro`

## الحسابات

| الدور | البريد | كلمة السر | الصلاحيات |
|---|---|---|---|
| مالك | `trial.owner@maxp.test` | `Maxp@2026` | OWNER |
| مدير HR | `trial.hr@maxp.test` | `Maxp@2026` | MANAGER + `TRIAL_HR_MANAGER` |
| مدير تسويق | `trial.marketing@maxp.test` | `Maxp@2026` | MANAGER + `TRIAL_MARKETING_MANAGER` |
| مدرس | `trial.teacher@maxp.test` | `Maxp@2026` | AGENT + بوابة المدرس |
| خدمة عملاء | `trial.agent@maxp.test` | `Maxp@2026` | AGENT |

> الدخول من: `https://maxp.online/login`

## البيانات المزروعة (ملخص)

| الوحدة | البيانات |
|---|---|
| HR | 7 موظفين · 4 أقسام · 5 وظائف · 50 سجل حضور · 3 إجازات (معلّقة/معتمدة/مرفوضة) · 5 مسيرات رواتب (11/2026) · 2 تدريب · 6 مستندات · تقييم Q4 · 3 أهداف · 2 Kudos · ميزتان · سلفة معلّقة |
| تعليم | 3 مواد · 3 باقات · 3 مدرسين · 4 أولياء أمور · 5 طلاب · مجموعتان · 4 اشتراكات · 16 حصة فردية · 6 حصص مجموعات + حضور · يوم تجربة + 3 مسجلين |
| أكاديمية | 3 كورسات منشورة · 12 درس |
| تسويق | 10 عملاء/ليدز · 3 كوبونات · قائمتان · مناسبتان · حملتا بث · حملتا فيسبوك + 2 Adset + 2 Ad · 4 مهام · مشروع واحد |

## الملفات

| الملف | المحتوى |
|---|---|
| `01-customer-experience-map.md` | خريطة تجربة العميل: 7 شخصيات، 6 مراحل، Service Blueprint، 8 لحظات حقيقة، 14 نقطة احتكاك، KPIs |
| `02-test-scenarios.md` | **76 سيناريو اختبار** (P0=41) موزّعة على 9 مجالات، مع بيانات الاختبار وخطة 14 يوم |
| `03-14-day-runbook.md` | خطة التشغيل اليومية ومن ينفّذ ماذا ومتى |
| `evidence/index.html` | **دليل التحقق البصري** — 16 لقطة شاشة مع الحالة لكل شاشة |

## السكربتات

| السكربت | الاستخدام |
|---|---|
| `apps/backend/scripts/seed_trial_company_14d.js` | إنشاء/تحديث التينانت والبيانات. Idempotent. |
| `apps/backend/scripts/verify_trial_company_14d.js` | التحقق من الأعداد والتطبيقات وتواريخ التجربة |

```bash
# على السيرفر (production)
cd /var/www/backend2
NODE_ENV=production node scripts/seed_trial_company_14d.js            # زرع/تحديث
NODE_ENV=production node scripts/seed_trial_company_14d.js --reset    # مسح بيانات التينانت وإعادة الزرع
NODE_ENV=production node scripts/seed_trial_company_14d.js --cleanup  # حذف التينانت بالكامل
NODE_ENV=production node scripts/verify_trial_company_14d.js          # تقرير التحقق
```

## ملاحظات ونتائج أولية

### التحقق البصري (Playwright — 2026-11-20)

| الشاشة | النتيجة |
|---|---|
| الدخول + التطبيقات (16 تطبيق) | ✅ الوحدات الثلاث ظاهرة: الموارد البشرية · المراكز التعليمية · أكاديمية ماكس بي · التسويق والإعلانات · وكالة التسويق · تحليل المنافسين |
| HR: لوحة 7 موظف / 4 أقسام · موظفون EMP-001…007 · حضور · 5 مسيرات | ✅ |
| التعليم: 5 طلاب ST-001…005 · مجموعتان · 16 حصة | ✅ |
| كوبونات 3 · مهام 4 · أكاديمية 3 كورسات | ✅ |
| موبايل 390px (HR + تعليم) | ✅ بلا تمرير أفقي |
| Console errors | ✅ صفر على كل الصفحات |
| حملات Meta | ⚠️ تحتاج ربط حساب إعلاني (الحملات المحلية لا تظهر) |

**ملفات الأدلة:** `docs/qa/trial-14d/evidence/`

### الأخطاء المؤكدة أثناء التحقق

1. **F-15 (HR — عالية):** لوحة الموارد البشرية كانت تعرض **0 موظف** رغم وجود 7 في `/hr/employees`. السبب: `employeeService.getEmployeeStats` يحسب من `User.employeeNumber` (نموذج قديم) بينما شاشة الموظفين تقرأ جدول `hr_employees`، و`createEmployee` لا يضبط `user.employeeNumber`. أُضيف الحقل في الـ seed مؤقتًا (`TS-HR-18`)، لكن الإصلاح الحقيقي يجب أن يكون في الخدمة نفسها.
2. **F-16 (HR — متوسطة):** يوم الجمعة (عطلة) يُظهر «7 غائب» بدل تصنيف عطلة (`TS-HR-19`).
3. **F-17 (تسويق — متوسطة):** شاشة حملات فيسبوك تقرأ Meta الحية؛ الحملات المزروعة محليًا غير مرئية بدون ربط حساب (`TS-MKT-14`).
4. **F-18 (تسويق UI — منخفضة):** خلية اسم الكوبون تلصق «الحد الأقصى» بنفس السطر (`TS-MKT-15`).
5. **F-14 (أمان — عالية):** `GET /api/v1/hr/employees` يرجع `200` لحساب مدير التسويق — الحماية `checkAppAccess('hr-core')` فقط بدون فحص `hr.employees` (`TS-SEC-03`).
6. **سلوك سليم:** `GET /api/v1/education/students` يرجع `403` لأي دور بدون `education.view`.
7. التينانت معزول بالكامل، وحذفه آمن في أي وقت عبر `--cleanup`.
