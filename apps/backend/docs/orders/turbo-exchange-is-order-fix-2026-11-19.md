# Turbo Exchange Order Type Fix (is_order=1 vs return is_order=2)

**Date**: 2026-11-19  
**Module**: Orders Management / Turbo Express Shipping Integration  
**Files Modified**:
- `apps/backend/prisma/schema/orders.prisma`
- `apps/backend/prisma/verify_schema/ecommerce.prisma`
- `apps/backend/prisma/migrations/20261119_add_order_request_type/migration.sql`
- `apps/backend/routes/enhancedOrders.js`
- `apps/backend/services/enhancedOrderService.js`
- `apps/backend/utils/turbo/orderFormatter.js`
- `apps/backend/services/turbo/shipmentService.js`
- `apps/backend/controller/turbo/shipmentHandlers.js`
- `apps/backend/services/orderService.js`
- `scripts/deploy-remote.sh`
- `apps/backend/tests/services/turbo/shipmentService.test.js`
- `apps/backend/utils/__tests__/turbo-utils.test.js`

---

## 1. المشكلة والشكوى (Problem & Complaint)
عند إنشاء طلب **استبدال** في MaxP، كان يرسل إلى شركة الشحن Turbo Express كـ **مرتجع جزئي** (`is_order: 0` و`return_amount > 0`) بدلاً من أن يذهب كأوردر استبدال جديد (`is_order: 1` و`return_amount: 0`).

### الأدلة من بيئة الإنتاج:
أوردرات استبدال سابقة في `turboMetadata` المسجل من استجابة تربو:
- `ORD-739572-846`: `"is_order": "0"`, `"order_type": "0"`
- `ORD-286546-424`: `"is_order": "0"`, `"order_price": 620`
- `ORD-044936-440`: `"is_order": "0"`
- `ORD-761947-982`: `"is_order": "0"`

---

## 2. السبب الجذري (Root Cause Analysis)
1. **غياب عمود `requestType` في جدول `orders`**:
   جدول `orders` في قاعدة البيانات لم يكن يحتوي على عمود لحفظ نوع الطلب (`requestType`). عند إنشاء طلب استبدال، كان الوسم يعتمد على `req.body.requestType` اللحظي، ولكن عند إعادة جلب الطلب لاحقاً أو في مسارات الشحن التلقائي (`autoCreateTurboShipmentForOrder`) وإعادة المحاولة والفرز الجماعي، لم يكن هناك عمود `requestType` في الطلب المسترجع، ولم يكن يتم تمريره.
2. **fallback في `formatOrderForTurbo`**:
   في `utils/turbo/orderFormatter.js:191`، كان `returnAmount` يرجع قيمة مصاريف الشحن `shippingFee` كقيمة افتراضية لأي طلب ليس من نوع `return` صريح.
3. **branching في `shipmentService.js:299-312`**:
   عندما يكون `requestType` غير معرّف أو مفقود، كان يسقط في الـ `else` الافتراضي الذي يحدد:
   `isOrderVal = 0` و `returnAmt = returnAmount || shippingFeeVal`، مما يرسل لتربو شحنة تحمل `is_order: 0` ومبلغ مرتجع، فيفهمها تربو كـ "مرتجع جزئي".
4. **عدم حظر شحن الأوردر الأصلي المستبدل (`EXCHANGED`)**:
   في `shipmentHandlers.js` و`orderService.js`، لم تكن حالة `EXCHANGED` ضمن الحالات المحظورة من إنشاء شحنة (`invalidStatuses`)، مما سمح بإنشاء شحنة مكررة للطلب الأصلي.

---

## 3. الحل الهندسي المنفّذ (Architecture & Fix)

### 1) حفظ نوع الطلب مع الأوردر في قاعدة البيانات (`requestType`)
- إضافة `requestType String? @default("delivery")` في `orders.prisma` مع فهرس `@@index([requestType])`.
- إنشاء سكريبت ترحيل idempotent `apps/backend/prisma/migrations/20261119_add_order_request_type/migration.sql` يضمن وجود العمود وفهرسه، وترحيل الأوردرات السابقة من `metadata`.
- إضافة السكريبت إلى خطوة النشر في `scripts/deploy-remote.sh`.
- في `enhancedOrderService.js`: حفظ `requestType` في الكائن الأساسي للطلب وفي الـ `metadata` JSON مع fallback دفاعي عند عدم اكتمال الترحيل.

### 2) التمييز الحاسم في مسارات تكامل تربو (Turbo Payload Resolution)
- **طلب استبدال (Exchange)**:
  - يُستنتج عبر `requestType === 'exchange'` أو `orderType === 'EXCHANGE'` أو وجود `originalOrderId` أو `originalOrderNumber`.
  - يُرسل لتربو: `is_order = 1`، `return_amount = 0`، `return_summary = 'طلب استبدال'`.
- **طلب مرتجع حقيقي (Return)**:
  - يُستنتج عبر `requestType === 'return'` أو `orderType === 'RETURN'` أو حالة `RETURNED`.
  - يُرسل لتربو: `is_order = 2`، `return_amount = totalValue`.
- **تسليم جزئي (Partial Delivery)**:
  - يُرسل لتربو: `is_order = 1`، `return_amount = shippingFee`، `return_summary = 'تسليم جزئي'`.
- **تسليم عادي (Standard Delivery)**:
  - يُرسل لتربو: `is_order = 0`، `return_amount = 0`، `return_summary = 'لا يوجد مرتجع'`.

### 3) حظر الشحن المكرر للطلب الأصلي المستبدل (`EXCHANGED`)
- إضافة حالة `EXCHANGED` إلى `invalidStatuses` في:
  - `apps/backend/controller/turbo/shipmentHandlers.js` (الإنشاء اليدوي للشحنة).
  - `apps/backend/controller/turbo/shipmentHandlers.js` (الإنشاء الجماعي للشحنات).
  - `apps/backend/services/orderService.js` (`autoCreateTurboShipmentForOrder`).
- الطلب الأصلي الذي تم استبداله يتحول لحالة `EXCHANGED` ويمنع قطعياً من إنشاء أي بوليصة أو شحنة جديدة.

---

## 4. التحقق والاختبار (Verification)
- تم تشغيل الاختبارات الآلية بنجاح على `formatOrderForTurbo` وتكامل `ShipmentService`.
- تم التأكد من أن:
  - أوردر الاستبدال: ينتج `is_order: 1`, `return_amount: 0`, `return_summary: 'طلب استبدال'`.
  - أوردر المرتجع: ينتج `is_order: 2`, `return_amount: totalValue`.
  - أوردر عادي: ينتج `is_order: 0`, `return_amount: 0`.
