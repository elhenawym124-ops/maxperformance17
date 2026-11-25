# بحث الاسم «سناء» — إنتاج maxp.online (٢٥/١١/٢٠٢٦)

أمر curl مصادق (حساب سوان، `GET /api/v1/conversations?search=سناء&platform=FACEBOOK&page=1&limit=50`) — الناتج الخام من السكربت `maxp-qa/run-2026-11-25/tests/eea5c862_g3_criterion1.py`:

```
http/time: 200 1.919871 n: 10 target_present: True
first_ids: ['cmwdu6asp024djujxp4h5ebbx', 'cmwfeltfp04cojuzz1iu2nac9', 'cmofv4i2u0j4tju01ov1zyysk', 'cmmlaeoj8038cjuhzd8aml0dv', 'cmmrmxad9f4ydju2ctybe7jzm']
```

`target_present: True` = المحادثة المطلوبة في معايير القبول `cmwfeltfp04cojuzz1iu2nac9` موجودة في أول ١٠ نتائج، والزمن 1.92s < 3s.
