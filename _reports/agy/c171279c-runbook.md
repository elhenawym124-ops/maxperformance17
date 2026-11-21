# دليل التشغيل الفعلي: إنشاء وإعداد تطبيق فيسبوك الجديد (Growth App) والمراجعة الرسمية

> **المعرف:** `c171279c-37d4-4632-8371-ae0a1b25bb20`  
> **الهدف:** توفير دليل عملي تفصيلي خطوة بخطوة لمالك حساب Meta for Developers لإنشاء تطبيق Growth، تكوين الـ Login Configuration، ضبط الـ 22 صلاحية، اشتراكات الويبهوك، تسجيل فيديوهات المراجعة (Screencasts)، وأمر التسجيل الآمن داخل منصة MaxP.

---

## ⚠️ تنبيه أمني وقانوني حاسم
- **تطبيق الإنتاج الأساسي (Primary App ID: `762328696481583`):** ممنوع لمسه أو تعديل إعداداته نهائيًا.
- **تخزين الأسرار:** يُمنع نهائيًا تخزين السكرت الفعلي كنص خام في قاعدة البيانات أو استدعاؤه في الواجهات؛ يتم تخزين مراجع المتغيرات (`FB_GROWTH_APP_SECRET` و `FB_GROWTH_VERIFY_TOKEN`) فقط وتُسحب القيم لحظيًا من الخزنة المشفرة (Vault/Env).
- **منع الأدلة المزورة:** نظرًا لأن عمليات إنشاء التطبيق وطلب المراجعة تتطلب تسجيل دخول مالك الحساب التجاري المعتمد لدى Meta، يوضح هذا الدليل الخطوات الفعلية الدقيقة بدون تزوير أي أدلة أو شاشات.

---

## 1. خطوات إنشاء تطبيق فيسبوك الجديد في Meta App Dashboard

1. **تسجيل الدخول إلى بوابة المطورين:**
   - الدخول إلى [Meta for Developers](https://developers.facebook.com/) بحساب Business Admin المعتمد.
   - الانتقال إلى **My Apps** ← الضغط على زر **Create App**.

2. **اختيار نوع التطبيق (App Type):**
   - اختيار نوع التطبيق: **Business** (للأعمال والربط المؤسسي).
   - الضغط على **Next**.

3. **تفاصيل التطبيق الأساسية (App Details):**
   - **App Display Name:** `MaxPerformance Growth` (أو `MaxP Growth`).
   - **App Contact Email:** البريد الرسمي لإدارة المنصة (مثل `tech@maxp.online` أو بريد الأدمن).
   - **Business Account:** ربطه بنفس المحفظة التجارية الرسمية لشركة MaxP (`Meta Business Account`).
   - الضغط على **Create App**.

4. **تفعيل منتج Facebook Login for Business:**
   - من القائمة الجانبية: **Add Product** ← اختيار **Facebook Login for Business** ← الضغط على **Set Up**.
   - من القائمة الجانبية تحت Facebook Login for Business: الدخول إلى **Configurations**.

5. **إنشاء وتكوين Login Configuration:**
   - الضغط على **Create Configuration**.
   - إدخال اسم التكوين: `MaxP Growth Login Flow`.
   - اختيار الـ Permissions الأساسية المطلوبة للربط الأولي.
   - حفظ التكوين، وسيظهر معرّف التكوين الرقمي المخصص: **Configuration ID** (مثال رقمي: `381257910000000`).
   - **نسخ معرّف التكوين (`config_id`)**؛ هذا الرقم إلزامي ولا يمكن تفعيل التطبيق بدونه.

6. **نسخ معرّفات وسر التطبيق:**
   - الانتقال إلى **App Settings** ← **Basic**.
   - نسخ **App ID**.
   - نسخ **App Secret** وحفظه فورًا وبشكل آمن داخل مديري الأسرار/الخزنة تحت المفتاح `FB_GROWTH_APP_SECRET`.
   - تحديد نطاقات النطاق المسموح بها (App Domains): `maxp.online`، `app.maxp.online`.
   - إدخال روابط سياسة الخصوصية وشروط الخدمة المعتمدة.

---

## 2. جدول الصلاحيات الـ 22 مقسمة حسب الشاشات والمجموعات

| م | الصلاحية (Scope) | المجموعة (Category) | الشاشة/الوحدة في MaxP التي تطلبها | مستوى الوصول المطلوب | الغرض الوظيفي الرسمي |
|---|---|---|---|---|---|
| 1 | `public_profile` | Authentication | شاشة ربط المتجر / تسجيل الدخول | Advanced Access | مصادقة التاجر والتحقق من هوية مدير الحساب. |
| 2 | `email` | Authentication | شاشة ربط المتجر / البريد | Advanced Access | التواصل وتأكيد الحساب وإشعارات النظام الحرجة. |
| 3 | `pages_show_list` | Pages | نافذة اختيار الصفحات للربط | Advanced Access | عرض قائمة صفحات فيسبوك المتاحة للتاجر لاختيار الصفحة المراد ربطها. |
| 4 | `pages_messaging` | Messenger | صندوق الوارد الموحد (Unified Inbox) | Advanced Access | إرسال واستقبال رسائل العملاء والرد الآلي الذكي عبر ماسنجر. |
| 5 | `pages_manage_metadata` | Pages | إعدادات الويب هوك والربط الفني | Advanced Access | الاشتراك التلقائي في أحداث الويب هوك وتحديث بيانات الصفحة. |
| 6 | `pages_read_engagement` | Pages | تحليلات التفاعل والتعليقات | Standard Access | قراءة التفاعلات على المنشورات لتحليل اهتمامات العملاء (ملاحظة: يُبقى Standard تجنبًا لمشاكل OAuth). |
| 7 | `pages_manage_engagement` | Pages | إدارة التعليقات والرد الآلي | Advanced Access | الرد الفوري على تعليقات المنشورات وإرسال رسائل خاصة استجابة لتعليق العميل. |
| 8 | `pages_read_user_content` | Pages | مركز خدمة العملاء والشكاوى | Advanced Access | قراءة استفسارات ومحتوى رسائل المستخدمين لدعم مسؤولي خدمة العملاء. |
| 9 | `pages_manage_posts` | Pages | ناشر المحتوى ومزامنة المنتجات | Advanced Access | نشر وتعديل المنشورات الترويجية للمنتجات مباشرة من لوحة التحكم. |
| 10 | `ads_read` | Ads | لوحة مؤشرات الحملات الإعلانية | Advanced Access | قراءة تقارير الصرف، التكلفة لكل رسالة/طلب، والـ ROAS اللحظي. |
| 11 | `ads_management` | Ads | مركز إطلاق وإدارة الحملات | Advanced Access | إنشاء الحملات الإعلانية وتحسين الميزانيات وإيقاف الحملات ضعيفة الأداء آليًا. |
| 12 | `pages_manage_ads` | Ads | ربط هوية الصفحة بالإعلان | Advanced Access | ربط الصفحة كمعلن (Ad Identity) في إعلانات Click-to-Messenger / Click-to-WhatsApp. |
| 13 | `business_management` | Business | الربط المتقدم بمحافظ الأعمال | Advanced Access | ربط الأصول التجارية، بيكسل فيسبوك، وكتالوج الأعمال عبر Business Portfolio. |
| 14 | `read_insights` | Insights | تقارير نمو المتاجر وتحليلات الأداء | Advanced Access | قراءة إحصائيات وصول الصفحات، التفاعل الأسبوعي، ومعدل التحويل. |
| 15 | `leads_retrieval` | Leads | قمع العملاء المحتملين (Lead Gen) | Advanced Access | استرجاع بيانات المشتركين في نماذج Lead Ads ومزامنتها فورًا مع سجل العملاء والطلبات. |
| 16 | `catalog_management` | Catalog | مزامنة المنتجات والمتاجر | Advanced Access | تصدير كتالوج المنتجات وتحديث الأسعار والمخزون في Facebook & Instagram Shops. |
| 17 | `instagram_basic` | Instagram | إعدادات ربط حساب إنستجرام التجاري | Advanced Access | قراءة الملف التجاري لحساب Instagram المربوط بالصفحة وعرض بياناته. |
| 18 | `instagram_manage_messages` | Instagram | صندوق الوارد الموحد (IG Direct) | Advanced Access | استقبال والرد على رسائل الدايركت (DMs) والستوري في منصة خدمة العملاء. |
| 19 | `instagram_manage_comments` | Instagram | أتمتة الردود على إنستجرام | Advanced Access | إدارة والرد التلقائي على تعليقات منشورات وريلز إنستجرام. |
| 20 | `instagram_content_publish` | Instagram | جدولة ونشر محتوى إنستجرام | Advanced Access | نشر صور وفيديوهات المنتجات والريلز تلقائيًا على إنستجرام. |
| 21 | `whatsapp_business_messaging` | WhatsApp | محادثات وقوالب واتساب السحابية | Advanced Access | إرسال تحديثات تتبع الطلبات، تأكيد الشحن، ورسائل السلة المتروكة عبر WhatsApp Cloud API. |
| 22 | `whatsapp_business_management` | WhatsApp | إدارة حسابات WABA والأرقام | Advanced Access | إدارة قوالب الرسائل المعتمدة (HSM)، رصيد الإرسال، وأرقام الهواتف الرسمية. |

---

## 3. حقول اشتراك الويب هوك الإلزامية (Webhooks Configuration)

في لوحة التطبيق (App Dashboard ← Webhooks ← Page):
يجب الاشتراك في الأحداث التالية وإدخال رابط الـ Callback:
- **Callback URL:** `https://api.maxp.online/api/v1/meta/webhook`
- **Verify Token Ref:** `FB_GROWTH_VERIFY_TOKEN` (القيمة السرية المخزنة في الخزنة).

### الحقول الإلزامية:
1. `messages`: استقبال نصوص ووسائط ومرفقات رسائل العملاء عبر ماسنجر.
2. `messaging_postbacks`: استقبال تفاعلات الأزرار السريعة والقوائم في الشات بوت.
3. `message_deliveries`: تأكيد تسليم الرسائل لحساب العميل وتحديث حالة الإرسال.
4. `message_reads`: قراءة مؤشر اطلاع العميل على الرسالة (Read Receipts).
5. `feed`: رصد المنشورات الجديدة وتفاعلات الجدار على الصفحة.
6. `comments`: رصد التعليقات الجديدة على المنشورات للرد الآلي الفوري أو إرسال رسالة خاصة.

---

## 4. سكريبت وإرشادات تسجيل فيديوهات المراجعة (Screencast Script)

تشترط Meta تسجيل فيديو توضيحي (Screencast) عالي الدقة لكل مجموعة صلاحيات تطلب Advanced Access:

### إرشادات عامة للتسجيل:
- مدة الفيديو لكل ميزة: من دقيقة إلى دقيقتين.
- إظهار شاشة الدخول وتسجيل الدخول بـ Meta Login بوضوح وظهور اسم التطبيق وشعاره.
- إظهار مربع حوار الصلاحيات (OAuth Consent Dialog) وتحديد الصلاحيات الممنوحة.
- إظهار الأثر المباشر داخل واجهة MaxP بعد منح الصلاحية (Zero Marketing Fluff — خطوات تقنية مباشرة).

### سيناريوهات الفيديوهات المحددة:
1. **فيديو ماسنجر والصفحات (`pages_messaging`, `pages_manage_metadata`, `pages_manage_engagement`):**
   - **البداية:** الدخول إلى صفحة المتاجر في MaxP ← الضغط على "ربط صفحة فيسبوك".
   - **الخطوة 2:** ظهور الـ OAuth dialog ← الموافقة على صفحة الاختبار.
   - **الخطوة 3:** إرسال رسالة من هاتف تجريبي إلى الصفحة على ماسنجر ← إظهار ظهور الرسالة فورًا في الـ Unified Inbox داخل MaxP.
   - **الخطوة 4:** كتابة رد من داخل MaxP ← إظهار وصول الرد فورًا لهاتف العميل على ماسنجر.
   - **الخطوة 5:** كتابة تعليق على منشور ← إظهار الرد التلقائي الفوري من المنصة.

2. **فيديو الإعلانات والـ Insights (`ads_read`, `ads_management`, `pages_manage_ads`, `read_insights`):**
   - **البداية:** الدخول إلى شاشة الحملات الإعلانية في MaxP.
   - **الخطوة 2:** استعراض قراءة تقارير الصرف والمبيعات اللحظية المسترجعة من الـ Graph API.
   - **الخطوة 3:** الضغط على "إنشاء إعلان Click-to-Messenger" ← اختيار الصفحة كـ Ad Identity ← إرسال الحملة والتحقق من حالتها في Meta Ads Manager.

3. **فيديو النماذج والعملاء المحتملين (`leads_retrieval`):**
   - **البداية:** ملء نموذج Lead Ad اختباري عبر Meta Lead Ads Testing Tool.
   - **الخطوة 2:** الانتقال إلى شاشة "العملاء المحتملين" في MaxP ← ظهور بيانات العميل المشترك لحظيًا ومطابقتها.

4. **فيديو إنستجرام (`instagram_basic`, `instagram_manage_messages`, `instagram_manage_comments`, `instagram_content_publish`):**
   - **البداية:** إظهار ربط حساب Instagram Professional المتصل بالصفحة.
   - **الخطوة 2:** إرسال رسالة Direct تجريبية ← الرد عليها من Inbox المنصة.
   - **الخطوة 3:** نشر صورة منتج من لوحة التحكم ← ظهور المنشور على إنستجرام.

5. **فيديو واتساب (`whatsapp_business_messaging`, `whatsapp_business_management`):**
   - **البداية:** استعراض إرسال إشعار تأكيد طلب بقالب معتمد (Approved Template).
   - **الخطوة 2:** إظهار وصول الإشعار لهاتف المستلم في الحال مع روابط التتبع.

---

## 5. أمر التسجيل الفعلي داخل المنصة (Safe Multi-App Registration)

بعد الانتهاء من تجهيز التطبيق في Meta والحصول على `appId` و `config_id` وتخزين الأسرار في الخزنة:

يتم استدعاء مسار التسجيل الآمن الخاص بـ Super Admin عبر الـ API بالقيم المرجعية (Refs) فقط:

### استدعاء cURL:
```bash
curl -X POST https://api.maxp.online/api/v1/super-admin/platform/meta-apps \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "key": "growth",
    "appId": "YOUR_ACTUAL_GROWTH_APP_ID",
    "appSecretRef": "FB_GROWTH_APP_SECRET",
    "configId": "YOUR_ACTUAL_LOGIN_CONFIG_ID",
    "webhookVerifyTokenRef": "FB_GROWTH_VERIFY_TOKEN",
    "isActive": true
  }'
```

### فحص الاتصال الرسمي:
```bash
curl -X POST https://api.maxp.online/api/v1/super-admin/platform/meta-apps/growth/test-connection \
  -H "Authorization: Bearer <SUPER_ADMIN_JWT_TOKEN>"
```

### النتيجة المتوقعة بعد اكتمال الإعدادات الحقيقية:
- استجابة `200 OK` بحالة `status: "CONNECTED"` و `connected: true`.
- جدول الصلاحيات يعكس بدقة الحالات المعتمدة (`approved` / `advanced`) بدون أي تزييف.
- حظر تفعيل أي صف غير مكتمل مسبقًا برمز `INCOMPLETE_CONFIG`.
