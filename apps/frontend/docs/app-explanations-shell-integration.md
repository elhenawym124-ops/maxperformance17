# شرح المنصة داخل شل التطبيق (App Explanations in-app shell)

**التاريخ:** 2026-11-20 · **الوكيل:** lead

## المشكلة

صفحة `/app-explanations` كانت مسجّلة في بلوك الراوتس العامة (جنب `/privacy` و`/terms`)،
فكانت بتُعرض بهيدر خاص بها وبدون سايدبار المنصة: مفيش طريقة للتنقل منها لأي شاشة،
ومفيش «رجوع للمنصة»، والصفحة بتبان كموقع منفصل جوّه نفس المنتج.

## التغيير

1. `App.tsx`: مسار `/app-explanations` بقى شرطيًا:
   - المستخدم مسجّل دخول → `<Layout><AppExplanationsPage embedded /></Layout>` (السايدبار والهيدر بتاع المنصة).
   - غير مسجّل → نفس الصفحة العامة زي قبل (المشاركة، الـSEO، والـprerender مبيتأثروش).
2. `AppExplanationsPage`: بروب `embedded` اختياري:
   - `min-h-full` بدل `min-h-screen` جوّه لوحة المحتوى بتاعة الشل.
   - حذف الـ`pb-24` (مساحة الـdock) وإخفاء `MobileBottomBar` جوّه الشل لتفادي التعارض مع شريط التنقل السفلي للتطبيق.
   - `scrollPageToTop` بيتمرّر على لوحة `.business-shell-main` بدل `window` جوّه الشل.
3. `ExplanationsHeader`: بروب `embedded` — يخفي رابط «الرئيسية» وسهم الرجوع على الموبايل،
   فالشريط يبقى شريط بحث فرعي تحت هيدر المنصة بدل هيدر مستقل.

## الأثر

- مفيش تغيير في الـAPI ولا في الداتا ولا في أي شاشة تانية.
- الصفحة العامة (غير المسجّلين) بنفس السلوك السابق حرفيًا.
- تم تجهيز `embedded` كـprop اختياري بقيمة افتراضية `false`، فأي استخدام قديم للمكوّن مبيتأثرش.

## التحقق

- `tsc --noEmit` (frontend type-check).
- Jest: `src/pages/public/__tests__/AppExplanationsPage.test.tsx` و`src/components/common/__tests__/PageExplanations.test.tsx`.
- مراجعة يدوية: الراوت لسه بيرندر في الحالتين (مسجّل/غير مسجّل).
