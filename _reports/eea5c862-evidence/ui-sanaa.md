# بحث «سناء» من الواجهة الحقيقية (بوابة ٢) — ٢٥/١١/٢٠٢٦

Chrome حقيقي (puppeteer) على `https://maxp.online/facebook-inbox` بحساب سوان، كتابة «سناء» في خانة «بحث في المحادثات...» ثم Enter. الناتج الخام:

```json
{
 "target": "cmwfeltfp04cojuzz1iu2nac9",
 "elapsed_s": 11.6,
 "calls": [
  {
   "status": 200,
   "url": "https://maxp.online/api/v1/conversations?companyId=cmleybpf70028juo2wwpmp8rt&limit=50&page=1&tab=unreplied&search=%D8%B3%D9%86%D8%A7%D8%A1&channel=FACEBOOK"
  }
 ],
 "dom_has_sanaa": true,
 "dom_has_target_name": true,
 "body_sample": "S\nSwan\nOperations OS\nلوحة التحكم\nالإعدادات\nصندوق الوارد\nفريق الايجنت\nفيسبوك\nصندوق فيسبوك\nإحصائيات صفحة فيسبوك\nإدارة المنشورات و التعليقات\nتقارير أداء الموظفين\nإحصائيات الرسائل المرسلة\nربط فيسبوك وإنستجرام\nالعملاء المحظورين\nالردود الذكية\nواتساب\nأتمتة المحادثات\nتليجرام\nإدارة الطلبات\nالشحن\nتقارير الوكلاء\nتحليلات الطلبات\nالمنتجات\nإدارة المتجر\nالعملاء\nالخزينة والنفقات ورأس المال\nالبيع بالجملة\nالمخزون\nالتسويق والإعلانات\nحسابي\nإدارة شركاتي\nالموارد البشرية\nالمواعيد والتقويم\nنظام معمل الأسنان\nنماذج التسج",
 "shot": "C:\\Users\\ali wazery\\maxp-qa\\run-2026-11-25\\evidence\\eea5c862_g2_sanaa_1125.png"
}
```

`dom_has_sanaa`/`dom_has_target_name` = True (اسم العميلة «سناء ابوالنجا» ظاهر في القايمة)، الطلب 200، والسكرين: `screens/after-2026-11-25_sanaa.png`.
