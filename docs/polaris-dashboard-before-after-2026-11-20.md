# مقال: داشبورد التاجر — قبل وبعد (موجة Polaris Track)

> **التاريخ:** 2026-11-20 · **النطاق:** `apps/frontend/src/pages/dashboard` + `apps/frontend/src/components/dashboard` + `apps/frontend/src/styles/polaris-track.css` (جديد) + مهارة taste-skill
> **الهدف:** تحويل شكل داشبورد التاجر من تهجين مكسور إلى كاليبر Shopify Polaris الموثق، وإصلاح جذر المشكلة: مهارة التصميم نفسها كانت تمنع الشكل المطلوب.

---

## 1. قراءة التصميم (Design Read)

«سطح تشغيلي لتاجر SMB مصري، عربي-first، بلغة Shopify Polaris — كانفاس رمادي `#f1f1f1` وكروت بيضا عايمة radius 12/8 وظل bevel، أكسنت المنصة الواحد، IBM Plex Sans Arabic للنص وPlex Mono tabular-nums للأرقام.» — Track B مع Track الجديد (Section 16) الذي يفك اشتباك قواعد كانت تحظر شكل Shopify صراحةً.

---

## 2. قبل: التشخيص بديماج مباشر (12 عيبًا بأدلة)

| # | العيب | الدليل |
|---|-------|--------|
| 1 | **ترويسات متحاربة مكدسة:** عنوان ترحيب `h1` (text-2xl bold) + فوقه كارت فيه عنوان تخصص ثانٍ (text-base bold) + شريط تاريخ + شريط حالة = **4 أشرطة قبل أول محتوى حقيقي** | `MainDashboardPage.tsx:184` + `SpecialtyDashboardHeader.tsx:74` |
| 2 | **حشو تسويقي تحت العنوان:** «مركز القيادة والعمليات التشغيلية التخصصية» — نفس العيب الذي اتصحح في موجة الكابينة 12 | `SpecialtyDashboardHeader.tsx:90-92` |
| 3 | **شارة ميتة بنقطة نابضة:** «نشط ومتصل» + `animate-pulse` — لا تعكس أي حالة نظامية (Slop Flag #10) | `SpecialtyDashboardHeader.tsx:85-88` |
| 4 | **قوس قزح في أيقونة التخصص:** rose/indigo/amber/emerald حسب التخصص — تكسر Accent Lock | `SpecialtyDashboardHeader.tsx:61-69` |
| 5 | **أرقام KPI بأربعة أكسنتات متزاحمة** في شريط واحد | `SpecialtyDashboardHeader.tsx:210/276/309/342` |
| 6 | **7 hex خام** في خريطة أنواع النشاط (`#25D366`×2، `#f59e0b`، `#3b82f6`، `#ef4444`، `#a855f7` + fallbacks `#6366f1`/`#22c55e`) — مخالفة مباشرة لقانون Tokens Over Raw Values | `DashboardActivityFeed.tsx:25-31,70,78` |
| 7 | **`divide-x-reverse`** — RTL hack هش على شريط المقاييس | `SpecialtyDashboardHeader.tsx:205` |
| 8 | **تضخم radius:** `--theme-radius: 14px` يجعل `rounded-lg`=14px و`rounded-xl`=18px و`rounded-2xl`=22px — حساء زوايا | `styles/index.css:203,471-476` |
| 9 | **ظلال صندوقية عامة** بدل bevel Polaris | كل كروت الداشبورد `shadow-xs/2xs` |
| 10 | **كانفاس طينة:** خلفية `oklch(0.977)` مقابل كروت `oklch(1.000)` — تباين شبه معدوم؛ هذا هو «العك» الحسي | `styles/index.css:176,189` |
| 11 | **كود ميت سام:** `surfaceStyles.ts` بتدرجات `linear-gradient` وظل glow `0 28px 72px -48px` — **صفر مستهلكين**، قنبلة لأي إيجنت يستوردها لاحقًا | `components/dashboard/surfaceStyles.ts` |
| 12 | **بنفسجي تسويقي عائم:** كارت إعلانات بborder بنفسجي متدرج hover + فئات تطبيقات purple/rose | `SaaSAnnouncements.tsx:40-42`، `InstalledAppsDashboard.tsx:75-77` |

## 3. الجذر: لماذا وُلّد هذا الشكل أصلًا؟

المهارة (taste-skill، 1,405 سطرًا) كانت:

1. **تغطية Polaris = 7 أسطر** من 1,405 (اسم في جدول + CDN + 3 لينكات قديمة) — صفر توكنز، صفر أناتومي، صفر تركيبات.
2. **تحظر شكل Shopify صراحةً:** Slop Flag #7 «يحظر الكروت العايمة فوق خلفية رمادية» + Section 15.1 «يحظر `bg-slate-100 gap-6 rounded-2xl`» — بينما أناتومي Shopify admin **هي** بالتعريف كروت بيضا على كانفاس رمادي. الامتثال للمهارة = استحالة رياضية لإنتاج شكل شوبفاي → تهجين لا Linear ولا Shopify = «العك».
3. **Track B = 115 سطر قوانين سلبية** (احظر/ممنوع) بلا مواصفة بنّاءة واحدة: لا spacing، لا قيم، لا تركيبة صفحة.
4. **الـBlock Library الموعودة فاضية** («will be added iteratively» — والمجلد غير موجود).
5. **توجيه Appendix A غلط لسياقنا:** `cdn.shopify.com/.../polaris.js` مخصص لتطبيقات مدمجة داخل Shopify admin (App Bridge) — MaxP منصة مستقلة تحتاج الكاليبر بأدواتها (Tailwind + shadcn/Radix)، وليس مكتبة Polaris React.

## 4. بعد: ما نُفذ (الموجة)

### 4.1 إصلاح المهارة — Section 16 «Shopify Polaris Track» (~120 سطرًا، النسختان `.zcode/` و`.agents/`)

- **فك اشتباك صريح:** Flag #7 و15.1 لا ينطبقان على صفحات الـPolaris Track؛ الكروت العايمة على كانفاس رمادي **مطلوبة**.
- **جدول توكنز Polaris v13 بقيم فعلية:** canvas `#f1f1f1`/`#1a1a1a`، surface `#ffffff`/`#202020`، text `#303030`/`#e3e3e3`، border `#e3e3e3`/`#303030`، radius كارت 12/تحكم 8، ظل bevel.
- **3 تركيبات صفحة (Recipes):** داشبورد نظرة عامة / صفحة قائمة / صفحة إعدادات — بديل القوانين السلبية.
- **جدول معايرة مكوّنات** بـshadcn/Radix (PageHeader/Card/Banner/Badge/Tabs/IndexTable/SaveBar) مع حظر صريح لتثبيت Polaris React.
- **قائمة Pre-Flight خاصة بالـTrack** (6 بنود قابلة للفحص الميكانيكي).
- لينكات Appendix B تحدثت (`polaris.shopify.com` بدل deprecated).

### 4.2 طبقة التوكنز — `styles/polaris-track.css` (جديد، مستورد في index.css)

- `.polaris-track`: كانفاس `#f1f1f1` **full-bleed** بهامش سالب يساوي gutter الـshell (16/24px) — بدون لمس `Layout.tsx` المشترك (عزل تغيير صارم).
- `--theme-radius: 8px` داخل النطاق → `rounded-lg`=8 (أزرار) و`rounded-xl`=12 (كروت) تلقائيًا لكل مكونات الصفحة، بسطر واحد.
- override محصور: `shadow-xs/2xs/sm` داخل الصفحة → bevel Polaris `0 1px 0 rgba(26,26,26,.07), 0 1.5px 3px rgba(0,0,0,.06)`.
- Dark schema كامل: canvas `#1a1a1a` / surface `#202020` / border `#303030` مع إعادة ربط `--color-card/--color-border/--color-background` داخل النطاق فقط.
- `prefers-reduced-transparency` مدعوم.

### 4.3 الجراحات على المكونات

| الملف | التغيير |
|-------|---------|
| `MainDashboardPage.tsx` | جذر الصفحة + حالة الخطأ ← `polaris-track` (كانفاس يبقع كامل العرض) |
| `SpecialtyDashboardHeader.tsx` | العنوان الثانوي انخفض إلى **سم شريط تخصص** (h2 text-sm) — الترحيب h1 يصبح الترويسة الوحيدة؛ حذف الحشو؛ حذف النبض؛ الشارة = شارة Polaris muted باسم التخصص عند توفره فقط؛ الأيقونات والأرقام الخمسة ← `text-primary` موحد؛ شريط المقاييس بدون `bg-muted/20` ولا `divide-x-reverse` (grid نظيف RTL-آمن) |
| `DashboardActivityFeed.tsx` | الـ7 hex ← 5 توكنز دلالية (`--color-primary/success/warning/info/destructive`)؛ نبضة «لايف» بقيت لأنها حالة نظامية حقيقية (عدد websocket) |
| `surfaceStyles.ts` | **حُذف** (كود ميت) |

### 4.4 الموجة 2 — إغلاق المتبقي (نفس اليوم)

- **`MetricCard.tsx`:** خريطة الأكسنت — violet/cyan → primary، rose → destructive، وشارات الاتجاه rose → destructive tokens.
- **`SaaSAnnouncements.tsx`:** كارت «جديد» البنفسجي → primary tokens (Flag #2 ميت).
- **`InstalledAppsDashboard.tsx`:** قوس قزح الفئات الثمانية (purple/rose/cyan/pink) → شارة Polaris محايدة واحدة — الفلاتر فوقها هي التي تحمل حالة الاختيار.
- **`registry.ts`:** whatsapp `#25D366` → `var(--color-success)` · **`AppWidgetCard/Mini`:** حالات error rose → destructive + `bg-gray-400` → `bg-muted-foreground/60`.
- **`DashboardExportMenu.tsx`:** أيقونة PDF rose → destructive · **`InsightsPanel.tsx`:** 10 fallback hexes خاملة → vars نظيفة.
- **باج تاريخي اتصلح:** `RevenueTrendChart.tsx:34` كان ينهار `data.some` على null والاختبار يتوقع empty state — `(data ?? []).some` → **jest 30/30**.
- **النتيجة:** صفر مخالفات palette خام في مجلدات الداشبورد كاملة (مسح grep آلي).

### 4.5 ما بقي فعلاً (خارج نطاق الداشبورد)

- نصوص عربية hardcoded في السويتشر (`لوحة التخصص والأعمال`): i18n موجة مستقلة.
- `divide-x-reverse` المنتشرة في وحدات أخرى (admin/hr/store): برا نطاق الداشبورد.

## 5. المتوقع (ما سيراه التاجر)

1. **الاحتكاك الأول انخفض من 4 أشرطة إلى 2** (ترويسة + شريط تحكم) قبل أول كارت محتوى.
2. **كانفاس رمادي صريح** يفصل الكروت البيضا بتباين Polaris الحقيقي — بدل الطينة الشبه بيضا.
3. **زوايا وأظلال موحدة:** كل كارت 12px بظل bevel خفيف، كل زر/chip 8px — نظام واحد بدل حساء 14-22px.
4. **لون واحد يقود القرار** (أكسنت المنصة) بدل قوس قزح خماسي.
5. **صفر حشو:** لا «مركز القيادة»، لا نبضة زخرفية، لا شارة ميتة.
6. Dark mode بنفس النظام (`#1a1a1a/#202020/#303030`).
7. أي صفحة جديدة تُبنى بعد اليوم على نفس المهارة ستولد بنفس الكاليبر مباشرة (الإصلاح في المصدر).

## 6. التحقق

- **jest:** 32/33 نجحوا (`dashboard-utils` 23، `TopProductsPanel` 2، `RevenueTrendChart` 4، `companyDashboardDateRange` 3). الوحيد الفاشل: `MainDashboardPage.onboarding.test.tsx` **فشل parse في `utils/storeUrl.ts:28` (`import.meta.env` غير محوَّل في jest) — ملف خارج نطاق الموجة، baseline سابق** (تأكيد: `git diff --name-only` لا يشمل storeUrl).
- `MyDashboard.test.tsx` (كابينة الموظف HR — صفحة غير متعلقة): فاشل baseline أيضًا (`toBeInTheDocument` بلا jest-dom في vitest).
- tsc + build: شوط تحقق مستقل (أُضيف بعدها في نفس الموجة).
- ملاحظة: الاختبارات أعلاه لا تغطي className-level changes؛ التحقق البصري النهائي (متصفح 390px + desktop، صفر أخطاء كونسول) مطلوب قبل الاعتماد النهائي وفق القانون §6.1.

## 7. بروتوكول التنسيق

- القفل: `zcode` — مهمة «Polaris Track wave: merchant dashboard calibration» — نطاق `pages/dashboard` + `components/dashboard` + `styles`.
- تزامن مع antigravity (كان يحمل القفل على HR/Orders Polaris — تحرر قبل بدء كود الـTSX، وصفر تداخل ملفات).
- النشر: عبر `coord.cjs guard --push` فقط.
