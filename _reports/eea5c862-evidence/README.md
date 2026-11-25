# eea5c862 — أدلة البحث في الإنبوكس (قبل/بعد) على قاعدة الإنتاج

التاسك: «إصلاح فشل بحث الإنبوكس (timeout 30s) + فهرس trigram على messages».
الكوميتات: `55ff2dedc` (إلغاء سقف 200 + تجميع الـCTE per conversation) و`1a935848d` + كوميت الـgate-4
(scoped retry + client deadline).

## 1) EXPLAIN قبل (٢٣/١١/٢٠٢٦ — الاستعلام القديم: LIMIT 1000 صف رسايل + LIMIT 200 محادثة)

منسوخ من `maxp-qa/task-runner/state.json` → `prod_explain` (قياس read-only على إنتاج maxp):

```
query:        CTE «المقاسات» 180 يوم LIMIT 1000 + فلتر companyId/channel خارجي
Execution Time: 5647.868 ms
index:          Bitmap Index Scan on idx_messages_content_trgm
rows_returned:  164        (إجمالي المحادثات اللي رجعت)
rows_for_swan:  0          (صفر محادثة لشركة سوان)
Nested Loop:    rows=0 loops=1000
```

## 2) EXPLAIN بعد (٢٥/١١/٢٠٢٦ — الاستعلام الجديد، نفس الفلتر والشركة)

`explain-after.txt` = `EXPLAIN (ANALYZE, BUFFERS)` كامل، ملخصه:

```
Bitmap Index Scan on idx_messages_content_trgm   rows=39285
Bitmap Index Scan on messages_createdAt_idx      rows=2074552
Index Scan using conversations_pkey              loops=1858
Execution Time: 621.380 ms
```

## 3) قياس API على maxp.online (٢٥/١١ — بعد النشر)

| القياس | قبل | بعد |
|---|---|---|
| «المقاسات» scope=messages | 200 محادثة (سقف) | **1858** محادثة على 19 صفحة |
| «المقاسات» scope=all | 329 | **1882** |
| زمن «المقاسات» | 3.17s+ | p50 **2.09s** · max 3.7s |
| «سناء» بالاسم | 1.35s | **1.63s** + `cmwfeltfp04cojuzz1iu2nac9` موجود |
| كل بحث نص الرسايل | 422 MESSAGE_SEARCH_UNAVAILABLE (من ٢٤/١١) | 200 |

## 4) سكرين شوت قبل/بعد

- `screens/before-2026-11-23_maqasat.png` — /facebook-inbox بحساب سوان، بحث «المقاسات» **قبل** الإصلاح
  (٢٣/١١ ١٦:٥٤، الكود بسقف 200).
- `screens/after-2026-11-25_maqasat.png` — نفس الصفحة والنفس البحث **بعد** الإصلاح (٢٥/١١ ١١:٤٧).

## 5) الاختبارات
`jest.log` = `npx jest __tests__/conversationSearchWhere.test.js` → **20 passed / 20 total**
(يشمل: مفيش سقف 1000، 300 نتيجة، قصّ 99999→5000، fallback للـtransaction، وعدم إعادة المحاولة عند
timeout/cancel أو خطأ SQL حقيقي).

## 6) دليل QA (الموديول الحقيقي + Postgres محلي)
seed 250 محادثة لشركة + 30 لشركة تانية بنفس الكلمة: الاستعلام القديم **200** / الجديد **250** /
تسريب **0** / `limit: 200` صريح **200**.
