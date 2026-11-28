# TASK EEA5C862 (R5) — دليل التنفيذ والقياس على قاعدة QA المحلية (maxp_qa)

## ١. ملخص المشكلة والإصلاح
- **المشكلة:** `GET /api/v1/conversations?search=...&searchScope=messages` كان بيرجع ٢٠٠ محادثة كحد أقصى (بتر ٨٩٪ من نتائج سوان ~١٧٩٦) بسبب:
  1. `LIMIT 1000` على صفوف الرسائل داخل CTE قبل التجميع لكل محادثة في `conversationSearchWhere.js`.
  2. سقف `maxLimit = 500` وطلب الكونترولر `limit: 200` في `conversationCrudController.js`.
- **الإصلاح:**
  1. إزالة سقف `LIMIT 1000` العشوائي لصفوف الرسائل من الـCTE، واستبداله بتجميع لكل محادثة `GROUP BY m."conversationId"` مع `MAX(m."createdAt") AS "lastHitAt"`.
  2. رفع سقف المحادثات إلى `SEARCH_MAX_CONVERSATIONS = 5000`.
  3. تحديث الكونترولر ليمرر `limit: 5000`.
  4. الحفاظ على فلتر الشركة والقناة داخل الـCTE لمنع تسريب أي مستأجر (Tenant Isolation).

---

## ٢. فحوصات الكود (Code Verification)

1. **التحقق من عدم وجود `LIMIT 1000`:**
   ```bash
   grep -c "LIMIT 1000" apps/backend/controller/conversation/conversationSearchWhere.js
   ```
   **النتيجة:** `0`

2. **التحقق من بناء الـCTE وتجميع المحادثات داخل الـCTE:**
   - الـCTE يحتوي `c2."companyId" = $...` و`c2.channel = $...`.
   - الـCTE يحتوي `GROUP BY m."conversationId"` و`MAX(m."createdAt") AS "lastHitAt"`.
   - الـCTE والاستعلام الخارجي مرتبان بـ`ORDER BY "lastHitAt" DESC`.

3. **فحص الصياغة (`node --check`):**
   ```bash
   node --check apps/backend/controller/conversation/conversationSearchWhere.js
   node --check apps/backend/controller/conversation/conversationCrudController.js
   ```
   **النتيجة:** Exit code `0` لكلا الملفين دون أخطاء.

4. **اختبارات الوحدة (Jest Test Suite):**
   - عدد الاختبارات الكلي: **20 اختبار** في `__tests__/conversationSearchWhere.test.js`.
   - جميع الاختبارات: **20 passed, 0 failed**.

---

## ٣. القياس الفعلي على قاعدة QA المحلية (`maxp_qa` على `127.0.0.1:5433`)

### أ. إنشاء بيانات الاختبار (Seed)
تم زرع:
- **300 محادثة + 300 رسالة** بكلمة فريدة `ZQXCAPTEST` لشركة QA Lab (`qr5vitkkllbbksib3tu9walg`).
- **50 محادثة + 50 رسالة** بنفس الكلمة الفريدة لشركة أخرى (`qa-other-co`).

أمر psql للتحقق من أعداد الـSeed:
```sql
SELECT 'qa_lab_conversations (qr5vitkkllbbksib3tu9walg)' AS entity, COUNT(*) AS total 
FROM conversations WHERE id LIKE 'zqx-cap-qa-%'
UNION ALL
SELECT 'qa_lab_messages (ZQXCAPTEST)', COUNT(*) 
FROM messages WHERE id LIKE 'zqx-msg-qa-%'
UNION ALL
SELECT 'other_company_conversations (qa-other-co)', COUNT(*) 
FROM conversations WHERE id LIKE 'zqx-cap-oth-%'
UNION ALL
SELECT 'other_company_messages (ZQXCAPTEST)', COUNT(*) 
FROM messages WHERE id LIKE 'zqx-msg-oth-%';
```
الناتج:
```
entity                      | total 
-------------------------------------------------+-------
 qa_lab_conversations (qr5vitkkllbbksib3tu9walg) |   300
 qa_lab_messages (ZQXCAPTEST)                    |   300
 other_company_conversations (qa-other-co)       |    50
 other_company_messages (ZQXCAPTEST)             |    50
(4 rows)
```

---

### ب. قياس الاستعلام القديم (Old Query: LIMIT 1000 صف رسايل + LIMIT 200 محادثة)
أمر psql:
```sql
WITH old_results AS (
    WITH matched_messages AS (
        SELECT m."conversationId"
        FROM messages m
        JOIN conversations c2 ON c2.id = m."conversationId"
        WHERE m.content ILIKE '%ZQXCAPTEST%'
          AND m."createdAt" >= NOW() - INTERVAL '180 days'
          AND c2."companyId" = 'qr5vitkkllbbksib3tu9walg'
          AND c2.channel = 'FACEBOOK'
        ORDER BY m."createdAt" DESC
        LIMIT 1000
    )
    SELECT DISTINCT c.id
    FROM conversations c
    JOIN matched_messages mm ON c.id = mm."conversationId"
    WHERE c."companyId" = 'qr5vitkkllbbksib3tu9walg'
      AND c.channel = 'FACEBOOK'
    LIMIT 200
)
SELECT COUNT(*) AS old_query_results_count FROM old_results;
```
الناتج:
```
old_query_results_count 
-------------------------
                     200
(1 row)
```
**النتيجة:** الاستعلام القديم بتر النتائج عند **200 محادثة بالضبط**.

---

### ج. قياس الاستعلام الجديد (New Query: GROUP BY per-conversation + سقف 5000)
أمر psql:
```sql
WITH new_results AS (
    WITH matched_messages AS (
        SELECT m."conversationId" AS "conversationId", MAX(m."createdAt") AS "lastHitAt"
        FROM messages m
        JOIN conversations c2 ON c2.id = m."conversationId"
        WHERE m.content ILIKE '%ZQXCAPTEST%'
          AND m."createdAt" >= NOW() - INTERVAL '180 days'
          AND c2."companyId" = 'qr5vitkkllbbksib3tu9walg'
          AND c2.channel = 'FACEBOOK'
        GROUP BY m."conversationId"
        ORDER BY "lastHitAt" DESC
        LIMIT 5000
    )
    SELECT c.id
    FROM conversations c
    JOIN matched_messages mm ON c.id = mm."conversationId"
    WHERE c."companyId" = 'qr5vitkkllbbksib3tu9walg'
      AND c.channel = 'FACEBOOK'
    ORDER BY mm."lastHitAt" DESC
    LIMIT 5000
)
SELECT COUNT(*) AS new_query_results_count FROM new_results;
```
الناتج:
```
new_query_results_count 
-------------------------
                     300
(1 row)
```
**النتيجة:** الاستعلام الجديد أعاد **300 محادثة بالكامل** (100% من مطابقات QA Lab).

---

### د. التحقق من عزل المستأجرين (Tenant Isolation)
أمر psql للتأكد من عدم تسرب أي محادثة للشركة الأخرى:
```sql
WITH new_results AS (
    WITH matched_messages AS (
        SELECT m."conversationId" AS "conversationId", MAX(m."createdAt") AS "lastHitAt"
        FROM messages m
        JOIN conversations c2 ON c2.id = m."conversationId"
        WHERE m.content ILIKE '%ZQXCAPTEST%'
          AND m."createdAt" >= NOW() - INTERVAL '180 days'
          AND c2."companyId" = 'qr5vitkkllbbksib3tu9walg'
          AND c2.channel = 'FACEBOOK'
        GROUP BY m."conversationId"
        ORDER BY "lastHitAt" DESC
        LIMIT 5000
    )
    SELECT c.id
    FROM conversations c
    JOIN matched_messages mm ON c.id = mm."conversationId"
    WHERE c."companyId" = 'qr5vitkkllbbksib3tu9walg'
      AND c.channel = 'FACEBOOK'
    ORDER BY mm."lastHitAt" DESC
    LIMIT 5000
)
SELECT COUNT(*) AS other_company_leaked_count
FROM new_results
WHERE id LIKE 'zqx-cap-oth-%';
```
الناتج:
```
other_company_leaked_count 
----------------------------
                          0
(1 row)
```
**النتيجة:** عدد محادثات الشركة الأخرى المتسربة = **0** (عزل كامل 100%).

---

### هـ. تنظيف بيانات الـSeed
أمر psql للتنظيف:
```sql
BEGIN;
DELETE FROM messages WHERE id LIKE 'zqx-msg-%';
DELETE FROM conversations WHERE id LIKE 'zqx-cap-%';
COMMIT;
```
التحقق من الحذف:
```sql
SELECT COUNT(*) AS remaining_test_records
FROM (
    SELECT id FROM conversations WHERE id LIKE 'zqx-cap-%'
    UNION ALL
    SELECT id FROM messages WHERE id LIKE 'zqx-msg-%'
) t;
```
الناتج:
```
remaining_test_records 
------------------------
                      0
(1 row)
```
**النتيجة:** تم تنظيف جميع سجلات الـseed بالكامل (0 سجل متبقي).
