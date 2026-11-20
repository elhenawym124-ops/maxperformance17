# خريطة الهجرة الشاملة إلى Shopify Polaris Track

> **التاريخ:** 2026-11-20 · **المصدر:** مسح آلي كامل لـ`apps/frontend/src` (grep raw-palette) + taste-skill Section 16
> **الهدف:** كل الأسطح التشغيلية تحت كاليبر Shopify Polaris موحّد، مع بوابة تحقق ميكانيكية تضمن المطابقة.

---

## 1. توجيه المسارات (Track Routing — قواعد taste-skill الإلزامية)

⚠️ **«الشغل كله تحت Polaris» يصح على الأسطح التشغيلية فقط.** فرض Polaris على الأسطح العامة سيكون مخالفًا للمهارة نفسها ويخرّب التحويل:

| النوع | الأسطح | القالب | السبب (taste-skill) |
|------|--------|--------|---------------------|
| **Track B / Polaris Track** | كل ما يفتحه التاجر أو الأدمن للعمل: داشبوردات، قوائم، إعدادات، HR، طلبات، مخزون، عملاء، تقارير، inbox toolbars | **Section 16** | «Merchant admin surfaces» — أناتومي Shopify admin |
| **Track A (ممنوع منها Polaris)** | `components/storefront` (501 ملف)، `pages/landing` (139)، صفحات اللاندينج lp_pages، صفحات auth العامة | Sections 0–12 | واجهات استهلاكية/تسويقية — Polaris فيها يعني كسر Editorial law وضياع التحويل |
| **Track B عام (بدون chassis)** | toolbars جوّه الـinbox (whatsapp/facebook/unified) حيث السطح chat-مثلث له أناتومي خاصة | Section 15 + توكنز | السطح محادثات لا قوائم — يكفي التطبيع التوكنزي |

**القاعدة:** `polaris-track` يُطبق على صفحات الكابينة فقط. storefront/landing تُستبعد صراحة في الـpre-flight.

## 2. الخريطة الكاملة (مسح آلي: ملفات × سطور مخالفة)

### الطبقة 0 — منفذة ✅ (الموجات 1–4، كومتات `0e33396be`→`967ab139c`)
| النطاق | الحالة |
|--------|--------|
| `components/dashboard` (12) + `pages/dashboard` (15) | ✅ صفر مخالفات فعلية (2 سطر دلالي success + محاور chart — تُقفل في موجة التنظيف) |
| صفحة المنتجات الرئيسية + مكوناتها (12 ملف) | ✅ صفر مخالفات |
| `divide-x-reverse` منصة كاملة | ✅ 99/99 حُذفت (no-op مثبت v4) |
| taste-skill Section 16 + طبقة التوكنز `polaris-track.css` | ✅ |

### الطبقة 1 — داشبوردات يومية عالية التردد (الأولوية القصوى)
| النطاق | ملفات | مخالفات | ملاحظة |
|--------|-------|---------|--------|
| `pages/super-admin-dashboard` | 11 | 12 | صغيرة — موجة سريعة |
| `pages/tasks` | 115 | 481 | |
| `pages/Analytics` | 95 | 527 | |
| `pages/reports` | 24 | 363 | |
| `pages/admin` (تابات booking/education/داشبوردات فرعية) | 261 | 808 | |

### الطبقة 2 — عمليات التاجر الأساسية
| النطاق | ملفات | مخالفات |
|--------|-------|---------|
| `pages/customers` | 139 | 852 |
| `pages/settings` | 334 | 1,061 |
| `pages/returns` + `inventory` + `treasury-expenses` | 78 | 459 |
| `pages/orders` 🟡 | 527 | 515 | نطاق antigravity — تنسيق معهم |
| `pages/products` الباقي (subdirs) | ~100 | 683 |

### الطبقة 3 — التخصصات العمودية
| النطاق | ملفات | مخالفات |
|--------|-------|---------|
| `pages/hr` 🟡 | 728 | 2,978 | antigravity بدأت الـchassis (37 صفحة) — الباقي تكملة تنسيق |
| `pages/dental-lab` | 304 | 1,626 |
| `pages/radiology` + `lab` | 94 | 1,059 |
| `pages/advertising` | 241 | 1,429 |
| `pages/affiliates` + `marketing` | 86 | 715 |

### الطبقة 4 — الإدارة والبوابات
| النطاق | ملفات | مخالفات |
|--------|-------|---------|
| `pages/super-admin` | 221 | 460 |
| `pages/employee` | 38 | 411 |
| `pages/marketplace` | 133 | 303 |
| `pages/owner` + `merchants` | 51 | 467 |
| بوابات (shipping-client/ops, courier, wholesale, parent/patient/teacher portals) | ~90 | ~700 |

### خارج النطاق عمدًا (Track A — لا Polaris)
`components/storefront` (501)، `pages/landing` (139)، صفحات auth العامة، معاينات القوالب.

**الإجمالي التقريبي:** ~3,000 ملف، ~18,000 سطر مخالفة، ~50 داشبورد صفحة. برنامج موجات لا يوم واحد — الوصفة ميكانيكية وسرعتها مثبتة (الموجة 4: 12 ملفًا في جلسة واحدة).

## 3. عقد المطابقة (Polaris Conformance Contract — ضمان «مطابق لشوبفاي»)

قيم مقفلة من Polaris v13، تُقاس آليًا ولا تُخترع لكل موجة:

| العنصر | القيمة الحاكمة | كيف يتأكد آليًا |
|--------|----------------|------------------|
| Canvas | `#f1f1f1` فاتح / `#1a1a1a` داكن — full-bleed خلف الصفحة | grep: كل صفحة قائمة/داشبورد بجذر `polaris-track` |
| Surface | كروت `#ffffff` / `#202020` — radius **12px** | لا `rounded-2xl+` في كروت النطاق (scale 8/12 فقط) |
| Controls | أزرار/مداخل/chips — radius **8px** | `--theme-radius: 8px` تلقائي |
| Elevation | bevel فقط: `0 1px 0 rgba(26,26,26,.07), 0 1.5px 3px rgba(0,0,0,.06)` | لا `shadow-lg/2xl` على كروت، لا glow gradients |
| Text | `#303030` / `#e3e3e3` + `#616161` subdued | صفر `gray-[0-9]` خام في النطاق |
| Borders | `#e3e3e3` / `#303030` — hairline | `border-border/70` فقط |
| Typography | IBM Plex Sans Arabic للعربي، `font-mono tabular-nums` للأرقام فقط | pre-flight بند ثابت |
| Accent | أكسنت المنصة `--color-primary` فقط (حالة: success/warning/destructive/info) | صفر rose/purple/indigo/pink/cyan خام |
| Anatomy | هيدر واحد + شريط تحكم واحد قبل أول كارت؛ فلاتر chips، جدول كارت واحد، SaveBar sticky عند dirty | Recipes A/B/C في Section 16 |

**بوابة التحقق لكل موجة (إلزامية، بنفس ترتيب الموجة 4):**
1. **مسبق:** جرد grep للمخالفات (قبل/بعد بالأرقام).
2. **كومبايل:** esbuild على كل ملف معدل + `curl vite :5173/<file>` = 200.
3. **اختبارات:** jest على suites النطاق (الموجة 4: 10/10).
4. **البصرية:** متصفح على dev/prod — desktop + 390px + dark، صفر كونسول، مقارنة بعينية مع أناتومي Shopify admin.
5. **coord:** claim → commit بمسارات صريحة → guard push → تحقق origin → release.

## 4. الموجة 0 المقترحة — بوابة التدقيق الآلي (أداة الضمان الدائمة)

سكربت `scripts/audit-polaris-track.cjs` (نود، بلا dependencies):
- يستقبل مسار نطاق، يفحص: raw palette hex/classes، `divide-x-reverse`، soup radius (`rounded-2xl` خارج النطاق المسموح)، `ml-/mr-/pl-/pr-` فيزيائية، hex خام في JSX، حضور `polaris-track` في صفحات كابينة.
- يخرج **Polaris Score لكل ملف/مجلد** (0–100) ويعمل كـCI gate اختياري: أي ملف جديد يتعدى 0 مخالفات يرفض.
- **الفائدة:** «التأكد من المطابقة» يصير رقمًا مقيسًا يُعرض بعد كل موجة بدل الانطباع — ويعمل عقبًا ضد الرجوع للوراء (regression gate).

## 5. صحة استخدام taste-skill (الضمان المنهجي)

- **التشغيل الصحيح:** المهارة تُقرأ أول كل موجة → Design Read → Track routing (بند 1 أعلاه) → Section 16 للأسطح التشغيلية → **Pre-Flight القسمين 14 + 16.5** قبل تسليم كل موجة.
- **فخ الازدواج مسدود:** Section 16 يلغي Flag #7 و15.1 داخل النطاق صراحة — لا تهجين «لا Linear ولا Shopify» كما كان قبل الموجة 1.
- **فخ Track A مسدود:** صفحات اللاندينج/storefront تبقى محكومة بSections 0–12 — الفحص الآلي يستبعدها من عداد Polaris.
- **فخ تثبيت polaris-react مسدود:** Section 16.4 يحظر حزم Shopify الرسمية (App Bridge) — الكاليبر يُنفذ بالتوكنز وshadcn/Radix الموجودين.

## 6. برنامج الموجات — سجل التنفيذ (2026-11-20، جلسة التلقائي)

| # | الموجة | النطاق | كومت لايف | النتيجة |
|---|--------|--------|-----------|---------|
| 0a | أدوات: `audit-polaris-track.cjs` + `polaris-tokenize.cjs` + بقايا الداشبورد | `3c66a3319` | dashboards 70% |
| 0b | إغلاق الأزواج الهجينة + em-dash ظاهرة | `ba7df5b1c` | 87% |
| 0c | ألوان ودجتس → vars | `b0f821e2c` | hex صفر |
| 1 | tasks + reports + Analytics + super-admin-dashboard (178 ملف + 7 wraps) | `751d05f56` | 44% نظيف |
| 2 | customers + settings (312 ملف + 4 wraps: CustomerList/Lists/Details/Settings) | `aa3284497` | 47% |
| 3 | pages/admin (198 ملف — التابات المدمجة بلا wrap عمدًا) | `54d1cf6e7` | 43%، radius/phys صفر |
| 4 | products subdirs + returns + inventory + treasury (126 ملف) | `e8221e305` | 58% |
| 5 | dental-lab + radiology + lab + advertising (452 ملف) | `0a9f75934` | jest **42/42** |
| 6 | affiliates + marketing + marketplace + owner + merchants (177 ملف) | `d71408236` | baseline مثبت |
| 7 | super-admin + employee + shipping/courier/wholesale portals + broadcast (265 ملف) | `95da695c6` | اختبار acceptance كان مقفولًا على `"amber"` خام → حدث للتوكن `"warning"` |

**الحصيلة العالمية:** 33% → **41% نظيف** (114,250 → **61,787** مخالفة). صفر regressions — كل فشل مُقابل بـstash-comparison على HEAD نظيف.

### الموجات المتبقية (8+)
| النطاق | مخالفات | ملاحظة |
|--------|---------|--------|
| `pages/hr` 🟡 | ~12,260 | antigravity scope — تنسيق |
| `pages/orders` 🟡 | ~4,789 | antigravity scope |
| `pages/shipping` + shipping-ops بقايا | ~1,700 | |
| `pages/whatsapp` + inbox toolbars | ~1,600 | توكنز فقط (Section 15، بلا track) |
| `pages/manufacturing` | ~1,550 | |
| `components/{advertising,store,procurement,layout,orders,tasks,...}` | ~5,500 | |
| `pages/conversations` + inbox areas | ~850 | |
| بقايا palette معقدة في الموجات 1-7 (hex charts، أنماط مركبة) | ~5,000 | جولات residual |
| em-dash (9.G) في التعليقات والنصوص | ~1,200 | مراجعة يدوية لكل حالة (تعليقات = مقبولة) |
