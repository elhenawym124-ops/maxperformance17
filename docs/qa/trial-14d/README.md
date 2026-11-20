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

1. **F-14 (أمان أدوار):** `GET /api/v1/hr/employees` يرجع `200` لحساب مدير التسويق — مسار HR محمي بـ `checkAppAccess('hr-core')` فقط بدون فحص `hr.employees`. مسجّل كـ `TS-SEC-03`.
2. **F-14 مكمّل:** `GET /api/v1/education/students` يرجع `403` بشكل صحيح لأي دور بدون `education.view` — سلوك سليم.
3. التينانت معزول بالكامل: كل البيانات مرتبطة بـ `companyId` ولا تلمس أي شركة أخرى.
4. حذف التينانت آمن في أي وقت عبر `--cleanup` (يحذف بياناته وحساباته فقط).
