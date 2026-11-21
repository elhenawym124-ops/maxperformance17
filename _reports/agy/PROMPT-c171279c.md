أنت تشتغل على منصة MaxP. المستودع: C:/Users/Administrator/projects/maxperformance17 (origin = elhenawym124-ops/maxperformance17).

مهمتك: تاسك البورد c171279c-37d4-4632-8371-ae0a1b25bb20 «أنشئ تطبيق فيسبوك جديد بكل الصلاحيات وارفع فيديوهات المراجعة».

سبب الإرجاع من المراجع (لازم يتقفل بالحرف):
«صف growth في facebook_apps موجود لكن configId فاضي (مفيش Login Configuration متسجّلة زي primary 2158986791329815)، والصلاحيات الـ22 مش مثبتة بأي دليل: صفر مرفقات — مفيش سكرين test-connection بيرجّع Granted، ولا Access Token Debugger، ولا إنبوكس، ولا تقرير إعلاني، ولا لينك screencast. والكوميت المذكور be2cd31 ملوش أي علاقة بفيسبوك (٤ ملفات تعليم/حضور). المطلوب: config_id حقيقي في الصف + أدلة Granted لكل صلاحية».

معايير القبول: صف growth نشط والقيم refs · test-connection كل الصلاحيات Granted · رسالة إنبوكس حقيقية مسجلة على growth · قراءة تقرير إعلاني · التطبيق 762328696481583 زي ما هو · الأسرار في الفولت · سجل حالة كل صلاحية.

حقيقة لازم تتعامل معاها بصراحة: إنشاء تطبيق ميتا نفسه وLogin Configuration وطلب الصلاحيات ورفع فيديوهات المراجعة كلها محتاجة تسجيل دخول مالك الحساب على Meta for Developers — إنت مش قادر تعملها وممنوع تزوّر أي دليل عليها.

المطلوب منك (الكود + الـrunbook فقط):
1. اشتغل في git worktree منفصل عشان مفيش تعارض مع شغل تاني شغال على نفس المستودع:
   git fetch origin
   git worktree add C:/Users/Administrator/projects/maxp-fb-growth -b fix/c171279c-growth-app origin/main
   وكل شغلك جوه C:/Users/Administrator/projects/maxp-fb-growth
2. راجع services/metaAppRegistryService.js (أو مكان getKnownScopesCatalog الفعلي) وحدّد أي صلاحية من الـ22 دي ناقصة من الكتالوج وضيفها باسم + category + description (عربي/إنجليزي):
   public_profile, email, pages_show_list, pages_messaging, pages_manage_metadata, pages_read_engagement, pages_manage_engagement, pages_read_user_content, pages_manage_posts, ads_read, ads_management, pages_manage_ads, business_management, read_insights, leads_retrieval, catalog_management, instagram_basic, instagram_manage_messages, instagram_manage_comments, instagram_content_publish, whatsapp_business_messaging, whatsapp_business_management.
3. أغلق العيب الحقيقي اللي خلّى المراجع يرجّع: صف تطبيق بـ configId فاضي أو refs ناقصة (appSecretRef/webhookVerifyTokenRef) لازم يتمنع من التفعيل (toggle/active) و test-connection يرجّع حالة واضحة INCOMPLETE_CONFIG بأسماء الحقول الناقصة — مش Granted كاذب. خليك مقتصر على الملفات المعنية بالتعديل ده.
4. ضيف/حدّث تستات للحالتين (صف ناقص configId / صف كامل) بنفس طريقة التستات الموجودة في الريبو، وشغّلها واعرض الناتج الحقيقي.
5. اكتب runbook تفصيلي في _reports/agy/c171279c-runbook.md بالعربي: خطوة بخطوة في Meta App Dashboard (إنشاء Business app باسم Growth → منتج Facebook Login for Business → إنشاء Login Configuration → نسخ config_id)، جدول الـ22 صلاحية مقسّمة (أساسي/صفحات/إعلانات/قياسات/كتالوج/إنستجرام/واتساب) وكل واحدة في أنهي شاشة تُطلب، حقول الويبهوك المطلوبة (messages, messaging_postbacks, message_deliveries, message_reads, comments, feed)، سكريبت الـscreencast (إيه اللي يظهر في الفيديو لكل مجموعة صلاحيات)، وبعد كده أمر التسجيل الفعلي POST /super-admin/meta-apps بالقيم refs فقط: appId / appSecretRef=FB_GROWTH_APP_SECRET / configId / webhookVerifyTokenRef=FB_GROWTH_VERIFY_TOKEN.
6. commit على البرانش + push + افتح PR بـ gh (base main). ممنوع merge وممنوع push على main.
7. تقرير في _reports/agy/c171279c-report.md: الملفات اللي اتغيرت، نتيجة التستات (ناتج حقيقي)، اللي فاضل يدوي على ميتا (بالترتيب)، وأي حاجة مش قادر تتحقق منها اكتبها «مش متاح من الجهاز».

قواعد صارمة:
- ممنوع تزوّر Screenshot أو config_id أو Granted. أي دليل مش حقيقي يتكتب «لم يُنفّذ».
- ممنوع تعديل تطبيق الإنتاج 762328696481583.
- ممنوع لمس أي ملف بره نطاق المهمة.
- متعلّمش التاسك مكتمل على البورد ومتعتمدش حاجة.
- في آخر رد: REPORT_PATH + ملخص 5 سطور + اسم البرانش/الـPR.
