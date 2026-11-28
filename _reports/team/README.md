# فريق الوكلاء — فهرس التسليمات

آخر تحديث: 2026-11-21 · المدير: Hermes · 20 مهمة من مهام محمد عبد المنعم.

كل التقارير موجودة داخل المشروع في `_reports/team/<agent>/`، ونسخة التشغيل الأصلية في `C:\Users\Administrator\maxp-team\runs\`.

## حالة الجلسات في الواجهات

- **OpenCode:** الجلسات ظاهرة بالفعل في `session list` (مش محتاجة سync). عناوينها مثل `d400ef3a: بحث الويب...` و`CodeTreps: ٣٥ تعليقاً بلا رد`.
- **DeepSeek Harness:** اتشغّل `dsh-sync` وسجّل **12 جلسة** في `workspace.json`؛ محتاج **إعادة تشغيل التطبيق** لتظهر في الشريط الجانبي.
- **Antigravity:** جلسات `agy` موجودة في تاريخ Antigravity، لكن `agentapi` بينشئها بـ`workspaces: []` — يعني **مش هتظهر تحت مجلد المشروع**، وبتظهر كدردشة عامة. عناوينها كلها متشابهة لأن الـwrapper بياخد أول 40 حرف من البرومبت. التقرير نفسه محفوظ جوه المشروع.
- **ZCode:** صفر جلسات — الـCLI واقف على `Select a model before sending`.

## خريطة الجلسات

### Antigravity (conversation IDs)

| المهمة | Conversation ID |
|---|---|
| ايجنت بصلاحيات موظف | `ab382c4e-abf2-4bfe-921c-7304067200f1` |
| تيكيت وشات داخلي | `d5c37245-78e8-4759-9a06-a29a53b6beb2` |
| تبويب widget | `b3a7ca92-e6fa-42c3-b307-5b18159a452c` |
| كتالوج البوت | `356fede7-f180-47c5-9dfe-bea0e48f440c` |
| الرد بالصوت | `b669f290-267a-416d-bec4-dda88eec06eb` |
| GitHub لمحمد | `0d5d8973-b1b7-42ee-9e6b-0c2707447205` |
| قوالب 3D | `a0d52a72-0bbc-4425-8939-7f5d99d71587` |
| تدريب Hermes | `6aa318b6-fdae-4245-9895-3a734d7e6b2e` |

### OpenCode (session IDs)

| المهمة | Session ID |
|---|---|
| HR موبايل | `ses_e0054a777ffekAGVw5Nfovka5k` |
| Demo Day تسجيل | `ses_e0049d028ffeinRsJFoZreUke5` |
| تدريب الوكيل | `ses_e004f1fe1ffeVm8lDL6K4Ya34C` |
| استفسارات المعرفة | `ses_e0049cdd6ffefRWkFAv3B7TMA8` |
| dry-run الباقات | `ses_e0043060dffeQeIpUeS9ppHqlp` |
| CodeTreps | `ses_e0043a0d4ffelPRY3IGRSVSDo5` |
| Lead Generation | `ses_e0043057fffeuKg9MpddjlBPC3` |
| بحث الإنترنت | `ses_e003f5278ffe3tr3mehiJxvKsN` |

## جدول الـ20 مهمة

| # | المهمة | المنفّذ | الحكم | MaxP | التقرير |
|---|---|---|---|---|---|
| 1 | ايجنت بصلاحيات موظف | Antigravity | PASS | IN_REVIEW 90% | `agy/5d6f3f09-....md` |
| 2 | تيكيت وشات داخلي | Antigravity | PASS | IN_REVIEW 90% | `agy/2730b9b7-....md` |
| 3 | تبويب widget | Antigravity | PASS | IN_REVIEW 90% | `agy/86c6eb95-....md` |
| 4 | كتالوج البوت | Antigravity | PASS | IN_REVIEW 90% | `agy/ce04721e-....md` |
| 5 | الرد بالصوت | Antigravity | PASS design | IN_REVIEW 90% | `agy/8f786521-....md` |
| 6 | OpenCode provider | DeepSeek | BLOCKED/PARTIAL | IN_REVIEW 80% | `dsh/...` |
| 7 | هاشتاج | Repo + Hermes | DONE verified | IN_REVIEW 100% | commit `df3a729f3` |
| 8 | كاشف التعارض | Repo + Hermes | PARTIAL (7/8) | IN_REVIEW 85% | `dsh/...` |
| 9 | مصدر الديمو داي | Repo + Hermes | DONE (19/19) | IN_REVIEW 90% | commit `24914eadb` |
| 10 | CodeTreps | OpenCode | FAIL | IN_REVIEW 40% | `opencode/...` |
| 11 | HR موبايل | OpenCode | PARTIAL | IN_REVIEW 80% | `opencode/...` |
| 12 | Demo Day تسجيل | OpenCode + Hermes | FIXED (19/19) | IN_REVIEW 90% | commit `03ae6b9d8` |
| 13 | تدريب الوكيل | OpenCode | FAIL | IN_REVIEW 70% | `opencode/...` |
| 14 | استفسارات المعرفة | OpenCode | PARTIAL | IN_REVIEW 75% | `opencode/...` |
| 15 | dry-run الباقات | OpenCode | PARTIAL | COMPLETED | `opencode/...` |
| 16 | GitHub لمحمد | Antigravity | RUNBOOK | IN_REVIEW 70% | `agy/...` |
| 17 | Lead Generation | OpenCode | PARTIAL | IN_REVIEW 75% | `opencode/...` |
| 18 | قوالب 3D | Antigravity | SPEC | IN_REVIEW 75% | `agy/...` |
| 19 | تدريب Hermes | Antigravity | PLAN | IN_REVIEW 75% | `agy/...` |
| 20 | بحث الإنترنت | OpenCode | PARTIAL | IN_REVIEW 70% | `opencode/...` |

## أهم العيوب المؤكدة

1. **CodeTreps** — فلتر الكلمات مفروض `true` ويحذف/يخفي تعليقات بدون موافقة؛ `respondedAt` بيتكتب قبل نجاح الإرسال؛ مفيش retry ولا تنبيه شكاوى.
2. **Demo Day** — `source` غير معرّف في إشعار الواتساب (`:620` و`:1258`) — **اتصلح** في `03ae6b9d8`؛ فحص السعة غير ذري.
3. **تدريب الوكيل** — `source_id=train_{uuid}` عشوائي فيمنع الـupsert ويكرر المعرفة.
4. **بحث الإنترنت** — audit log بيكتب أعمدة غير موجودة ويبتلع الخطأ؛ 6/10 نتائج غير مطابقة.
5. **استفسارات المعرفة** — فشل الحفظ يظهر كنجاح في `AIKnowledgeQuestionsPage.tsx:103`.
6. **HR موبايل** — جداول `min-w 720/760/800` وزر 38px.

## الموانع

- **ZCode:** `Select a model before sending` — لا model flag ولا registry في الـheadless.
- **OpenCode live smoke:** لا `OPENCODE_API_KEY` ولا Postgres؛ اتثبت 401 حقيقي فقط.
- **التحقق الحي:** معظم المراجعات قراءة فقط؛ لا red-line/DB.
