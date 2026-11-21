# توثيق إضافة شركة شحن هاشتاج إكسبريس (Hashtag Express) لكافة حسابات المنصة
**التاريخ:** 2026-11-21  
**النطاق:** إدارة شركات الشحن والربط اللوجستي (Orders & Shipping Companies Infrastructure)

---

## 1. الهدف والمطلب
إضافة شركة الشحن المعتمدة **هاشتاج إكسبريس (Hashtag Express)** في جميع حسابات ومتاجر البرنامج الحالية والمستقبلية تلقائياً:
- **المستأجرون الحاليون:** إدراج سجل شركة الشحن `هاشتاج إكسبريس (Hashtag Express)` لكل شركة مسجلة بالمنصة بقاعدة البيانات عبر هجرة SQL وسكربت بذر آمن ومطابق للمواصفات.
- **المستأجرون الجدد / التجهيز اللحظي:** تضمين هاشتاج إكسبريس ضمن دالة `ensureDefaultShippingCompanies` بحيث يتم إنشاؤها تلقائياً لكل متجر أو حساب عند فتح صفحة شركات الشحن أو عند استدعاء نقطة النهاية `/api/v1/shipping-companies`.

---

## 2. تفاصيل الإعداد المعتمد لشركة هاشتاج
* **الاسم (Name):** `هاشتاج إكسبريس (Hashtag Express)`
* **المعرف البرمجي (Slug):** `hashtag`
* **مفتاح المزود (Provider Key):** `HASHTAG`
* **نمط التكامل (Integration Mode):** `LIVE`
* **الموقع الإلكتروني (Website):** `https://hashtag-express.com`
* **رابط الـ API الافتراضي (API URL):** `https://hashtag-express.com/app`
* **حالة التفعيل الافتراضية (isActive):** `false` (غير مفعلة حتى يقوم التاجر بإدخال مفاتيحه: API NAME و API PASSWORD وحفظ الإعدادات).

---

## 3. التعديلات المنجزة

### 3.1 مسارات الباك إند (`apps/backend/routes/shippingCompaniesRoutes.js`)
1. **دالة `ensureDefaultShippingCompanies`:**
   إضافة فحص تلقائي لوجود مزود `HASHTAG` أو معرّف `hashtag`، وإنشاء بطاقة الشركة الافتراضية إذا لم تكن موجودة.
2. **حماية الحذف المدمج (`DELETE /:id`):**
   إدراج `HASHTAG` و `hashtag` / `hashtag-express` ضمن مجموعات `BUILTIN_PROVIDER_KEYS` و `BUILTIN_SLUGS` لمنع حذفها بالخطأ وتوجيه المستخدم لإيقاف التفعيل بدلاً من الحذف.

### 3.2 واجهة المستخدم وتجربة المتاجر (`apps/frontend/`)
1. **`types.ts`:**
   تحديث `BUILTIN_SHIPPING_PROVIDER_KEYS` و `BUILTIN_SLUGS` لدعم `HASHTAG`.
2. **`useShippingCompaniesData.ts`:**
   إدراج `HASHTAG` في وزن الأولوية وقائمة إزالة التكرار `seenStandardKeys`.
3. **`useShippingCompanyForm.ts`:**
   تعيين رابط الـ API الافتراضي لشركة هاشتاج `https://hashtag-express.com/app`.

### 3.3 وكلاء الذكاء الاصطناعي (`apps/ai-service/src/tools/repositories/shipping_repository.py`)
إضافة دعم صريح لشركة هاشتاج إكسبريس في أداة `connect_shipping_company` للوكيل الذكي سليم وباقي وكلاء المنصة.

### 3.4 هجرة البيانات وسكربت البذر
1. **هجرة SQL:** `apps/backend/prisma/migrations/20261121_add_hashtag_shipping_all_companies.sql`
2. **سكربت بذر آمن وتكراري:** `apps/backend/scripts/seed_hashtag_all_companies.js`
3. **دمج بسكربت النشر الآلي:** `scripts/deploy-remote.sh`
