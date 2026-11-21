# تقرير فني: إصلاح وقفل متطلبات تطبيق فيسبوك الجديد (تاسك c171279c)

**المعرف:** `c171279c-37d4-4632-8371-ae0a1b25bb20`  
**البرانش:** `fix/c171279c-growth-app`  
**الحالة:** تم إصلاح الخلل البرمجي في النظام، منع تفعيل التطبيقات غير المكتملة، حظر إرجاع Granted كاذب، وتحديث الكتالوج والاختبارات بنجاح 100% (24/24 اختبار ناجح).

---

## 1) ملخص سبب الإرجاع والحل المطبق (Root Cause & Fix)

### سبب إرجاع المراجع:
> «صف growth في facebook_apps موجود لكن configId فاضي (مفيش Login Configuration متسجّلة زي primary 2158986791329815)، والصلاحيات الـ22 مش مثبتة بأي دليل: صفر مرفقات — مفيش سكرين test-connection بيرجّع Granted، ولا Access Token Debugger، ولا إنبوكس، ولا تقرير إعلاني، ولا لينك screencast. والكوميت المذكور be2cd31 ملوش أي علاقة بفيسبوك (٤ ملفات تعليم/حضور). المطلوب: config_id حقيقي في الصف + أدلة Granted لكل صلاحية».

### المعالجة الجذرية في الكود:
1. **منع التفعيل لغير المكتمل (`INCOMPLETE_CONFIG` Guard):**
   - تم تعديل `metaAppRegistryService.js` لمنع تفعيل أي صف تطبيق فيسبوك (`toggleAppStatus` أو `upsertApp` بـ `isActive: true`) إذا كان معرّف الدخول `configId` فارغًا أو المراجع السرية (`appSecretRef` أو `webhookVerifyTokenRef`) مفقودة.
   - يتم إرجاع استجابة `400 Bad Request` مع كود `INCOMPLETE_CONFIG` ومصفوفة بأسماء الحقول الناقصة (`missingFields`).

2. **حظر إرجاع Granted كاذب في `test-connection`:**
   - تم فحص اكتمال الإعدادات مسبقًا داخل `testAppConnection`. في حال غياب `configId` أو مراجع الأسرار، يُرجع الفحص فورًا كود `INCOMPLETE_CONFIG` وحالة `connected: false` مع ضبط جميع الصلاحيات الـ 22 على `status: 'not_requested'` و `accessLevel: 'none'`، وقطع الطريق تمامًا على إرجاع حالة `approved` (Granted) وهمية.

3. **تحديث كتالوج الصلاحيات الـ 22 (بشكل ثنائي اللغة):**
   - تم تدقيق وتحديث دالة `getKnownScopesCatalog()` لتشمل جميع الصلاحيات الـ 22 المطلوبة بالاسم الصريح (`permission` و `name`)، والتصنيف (`category`)، والوصف الدقيق باللغتين العربية والإنجليزية (`descriptionAr` و `descriptionEn`).

4. **تطبيق قانون عدم المساس بالأسرار وتطبيق الإنتاج:**
   - تطبيق الإنتاج الأساسي (`762328696481583`) لم يتم تعديله أو المساس به نهائيًا.
   - جميع مراجع الأسرار تتبع نمط `Ref` فقط وتُسحب لحظيًا من البيئة/الخزنة المشفرة.

---

## 2) الملفات المعدلة والجديدة

| م | الملف | نوع التعديل | الوصف |
|---|---|---|---|
| 1 | `apps/backend/services/metaAppRegistryService.js` | معدل | إضافة دالة `validateAppConfig`، منع تفعيل التطبيقات غير المكتملة في `toggleAppStatus` و `upsertApp`، فحص الاكتمال في `testAppConnection` وإرجاع `INCOMPLETE_CONFIG` بدلاً من Granted وهمي، وتحديث كتالوج الـ 22 صلاحية ثنائي اللغة. |
| 2 | `apps/backend/controller/superAdminPlatformController.js` | معدل | معالجة خطأ `INCOMPLETE_CONFIG` في متحكمات `upsertMetaApp` و `toggleMetaAppStatus` وإرجاع كود 400 وتفاصيل الحقول الناقصة. |
| 3 | `apps/backend/tests/services/metaAppRegistryService.test.js` | معدل | إضافة اختبارات الحالة الأولى (صف ناقص `configId` ومنع التفعيل وإرجاع `INCOMPLETE_CONFIG` بدون Granted) والحالة الثانية (صف كامل وتمرير الفحص والتفعيل) واختبار الكتالوج الـ 22. |
| 4 | `apps/backend/tests/services/metaAppsAdminController.test.js` | معدل | إضافة اختبارات المتحكم للتحقق من رفض حفظ أو تفعيل تطبيق غير مكتمل بكود `INCOMPLETE_CONFIG`. |
| 5 | `_reports/agy/c171279c-runbook.md` | جديد | الدليل التشغيلي التفصيلي الشامل لمالك الحساب على Meta App Dashboard، وجدول الـ 22 صلاحية، وحقول الويبهوك، وسكريبت فيديوهات المراجعة، وأمر التسجيل الآمن. |
| 6 | `_reports/agy/c171279c-report.md` | جديد | هذا التقرير الفني الشامل. |

---

## 3) نتائج الاختبارات الحقيقية (Real Jest Execution Output)

تم تشغيل الاختبارات الخاصة بالسجل والتحكم والـ Multi-App عبر Jest داخل بيئة التشغيل الفعلية:

```
PASS __tests__/facebookMultiApp.test.js
  Meta Multi-App Architecture (Primary + Growth)
    √ 1. Multi-app registry returns safe list with ZERO raw secrets (20 ms)
    √ 2. testAppConnection returns permissions catalog with pages_read_engagement noted (221 ms)
    √ 3. Error sanitization never exposes app secret (9 ms)
    √ 4. Resolvers: fallback seamlessly to primary if fbAppKey/facebookAppKey is missing (2 ms)
    √ 5. Dual-signature verification: accepts HMAC signature from both Primary and Growth (18 ms)
    √ 6. Dual verify tokens: both Primary and Growth verify tokens are recognized (1 ms)
    √ 7. buildFacebookTokenUpdateData stores both facebookAppKey and fbAppKey (1 ms)
    √ 8. Feature gating: blocks growth features on primary with REAUTH_REQUIRED (1 ms)
    √ 9. Echo app ID detection covers all configured apps (1 ms)

PASS tests/services/metaAppsAdminController.test.js
  Super Admin Meta Apps Controller
    √ getMetaApps returns list of safe apps (4 ms)
    √ upsertMetaApp validates key and fields before saving (2 ms)
    √ toggleMetaAppStatus updates app status (10 ms)
    √ toggleMetaAppStatus returns 400 with INCOMPLETE_CONFIG when activation is blocked (6 ms)
    √ upsertMetaApp returns 400 with INCOMPLETE_CONFIG when saving active with missing fields

PASS tests/services/metaAppRegistryService.test.js
  metaAppRegistryService
    √ resolveSecretFromRef and resolveVerifyTokenFromRef read env vars safely (1 ms)
    √ getAllApps returns primary and growth apps with references and resolved credentials (1 ms)
    √ getAppByKey falls back to primary when growth is inactive (10 ms)
    √ getSafeAppsList hides raw secrets and reports configuration flags (10 ms)
    √ upsertApp and toggleAppStatus interact with Prisma correctly for complete app (4 ms)
    √ Case 1 (صف ناقص configId): validateAppConfig flags missing fields and blocks activation (5 ms)
    √ Case 1 (صف ناقص configId): testAppConnection returns INCOMPLETE_CONFIG and zero fake Granted (5 ms)
    √ Case 2 (صف كامل): validateAppConfig passes and allows activation and real connection test (150 ms)
    √ getKnownScopesCatalog returns all 22 permissions with name, category, and bilingual descriptions (6 ms)
    √ featureRequiresGrowth gates features with Arabic message and REAUTH_REQUIRED (1 ms)

Test Suites: 3 passed, 3 total
Tests:       24 passed, 24 total
Snapshots:   0 total
Time:        1.485 s
```

---

## 4) الخطوات اليدوية المتبقية على Meta for Developers (مرتبة بدقة)

نظراً لأن تنفيذ هذه الخطوات يتطلب صلاحيات مالك الحساب التجاري الموثق (Business Admin) على منصة Meta، وتمتثل المنصة لقاعدة منع تزوير أي دليل، فإن الخطوات التالية تُنفذ يدوياً بواسطة المالك وفقاً للـ Runbook المرفق:

1. **إنشاء التطبيق التجاري (Business App):**
   - تسجيل الدخول إلى [Meta Developers](https://developers.facebook.com/).
   - إنشاء تطبيق نوعه **Business** باسم `MaxPerformance Growth`.
   - ربطه بمحفظة MaxP الرسمية.

2. **إعداد Facebook Login for Business وإنشاء الـ Configuration:**
   - تفعيل منتج **Facebook Login for Business**.
   - إنشاء **Login Configuration** واستخراج قيمة `config_id` الحقيقية (مثل `381257910000000`).

3. **طلب الصلاحيات المتقدمة ورفع فيديوهات المراجعة (App Review):**
   - طلب صلاحية **Advanced Access** للصلاحيات الـ 21 (مع إبقاء `pages_read_engagement` على Standard).
   - رفع فيديوهات المراجعة الخمسة (Screencasts) المسجلة وفق السيناريوهات الموضحة في `c171279c-runbook.md`.

4. **ضبط اشتراكات الويبهوك (Webhooks):**
   - تفعيل الويبهوك على مسار `https://api.maxp.online/api/v1/meta/webhook`.
   - الاشتراك في الحقول الستة: `messages`, `messaging_postbacks`, `message_deliveries`, `message_reads`, `feed`, `comments`.

5. **تخزين السر الفعلي في الخزنة وتسجيل التطبيق بالمنصة:**
   - حفظ سر التطبيق في الخزنة تحت اسم `FB_GROWTH_APP_SECRET`.
   - استدعاء `POST /api/v1/super-admin/platform/meta-apps` برقم الـ `appId` والـ `configId` الحقيقي ومراجع الأسرار لتفعيل التطبيق رسمياً.

---

## 5) جدول التحقق وحالة الأدلة

| العنصر | الحالة | الملاحظة |
|---|---|---|
| فحص كود التحقق من اكتمال الإعدادات وتوليد كود `INCOMPLETE_CONFIG` | ✅ مُنفّذ ومُثبت | مغطى بوحدات اختبار ناجحة (Case 1 & Case 2). |
| منع إرجاع Granted كاذب عند غياب `configId` | ✅ مُنفّذ ومُثبت | تم التحقق من إرجاع `not_requested` لجميع الصلاحيات. |
| كتالوج الصلاحيات الـ 22 ثنائي اللغة | ✅ مُنفّذ ومُثبت | موجود بالكامل في `services/metaAppRegistryService.js`. |
| دليل التشغيل وفيديوهات المراجعة (`c171279c-runbook.md`) | ✅ مُنفّذ | مسجل بالتفصيل في مسار التقارير. |
| إنشاء تطبيق Meta الفعلي على سيرفرات فيسبوك | لم يُنفّذ (مش متاح من الجهاز) | يتطلب تسجيل دخول مالك الحساب التجاري على Meta. |
| استخراج `config_id` حقيقي من بوابة Meta | لم يُنفّذ (مش متاح من الجهاز) | يتطلب إنشاء Login Configuration على حساب المطور في Meta. |
| رفع الـ Screencasts على Meta App Review | لم يُنفّذ (مش متاح من الجهاز) | يتطلب واجهة مراجعة Meta for Developers. |
| الحصول على شارة Granted حقيقية من سيرفرات Meta | لم يُنفّذ (مش متاح من الجهاز) | مشروط بموافقة فريق مراجعة تطبيقات Meta الرسمية. |
| عدم المساس بتطبيق الإنتاج `762328696481583` | ✅ ملتزم به حرفياً | التطبيق لم يُعدل وظل بكامل إعداداته. |
