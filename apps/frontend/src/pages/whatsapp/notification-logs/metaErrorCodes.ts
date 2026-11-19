export interface MetaErrorInfo {
  code: string;
  title: string;
  description: string;
  actionText?: string;
  actionUrl?: string;
}

export const META_ERROR_CODES: Record<string, MetaErrorInfo> = {
  '131042': {
    code: '131042',
    title: 'حساب واتساب عليه مدفوعات معلّقة — لازم تسوية الدفع في Meta',
    description:
      'حساب الدفع في Meta Business بحاجة إلى تسوية الفواتير المعلقة أو تحديث وسيلة الدفع لتتمكن من استئناف إرسال الرسائل.',
    actionText: 'فتح في Meta',
    actionUrl: 'https://business.facebook.com/billing_hub/',
  },
  '141006': {
    code: '141006',
    title: 'خطأ في وسيلة الدفع بحساب Meta (WABA) — الإرسال محظور',
    description:
      'قامت Meta بحظر إرسال الرسائل الصادرة من حساب WhatsApp Business لوجود مشكلة في وسيلة الدفع. يرجى إضافة أو تحديث وسيلة الدفع في Meta لاستئناف الإرسال.',
    actionText: 'تحديث وسيلة الدفع في Meta',
    actionUrl: 'https://business.facebook.com/billing_hub/',
  },
  '131047': {
    code: '131047',
    title: 'خارج نافذة الـ 24 ساعة للرد',
    description:
      'انتهت نافذة الـ 24 ساعة المسموحة للمحادثة المجانية مع العميل. لإرسال رسالة الآن يجب استخدام قالب معتمد من Meta (Template).',
    actionText: 'فتح في Meta',
    actionUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-messages#customer-service-window',
  },
  '132000': {
    code: '132000',
    title: 'قالب غير معتمد أو غير موجود في Meta',
    description:
      'القالب المحدد غير موجود على حساب Meta أو لم تتم الموافقة عليه بعد، أو لا يتطابق كود اللغة المحدد مع القالب المعتمد.',
    actionText: 'إدارة القوالب في Meta',
    actionUrl: 'https://business.facebook.com/wa/manage/message-templates/',
  },
  '132018': {
    code: '132018',
    title: 'خطأ في متغيرات القالب (عدد المتغيرات غير مطابق)',
    description:
      'عدد المتغيرات أو المعاملات المرسلة لا يطابق البنية المعتمدة للقالب في Meta (معاملات زائدة أو ناقصة).',
    actionText: 'توثيق قوالب Meta',
    actionUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/guides/send-message-templates',
  },
  '131026': {
    code: '131026',
    title: 'رقم الهاتف غير مسجل في واتساب',
    description:
      'رقم هاتف المستلم غير مسجل في تطبيق واتساب أو غير متاح لاستقبال الرسائل.',
    actionText: 'دعم Meta',
    actionUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/support/error-codes',
  },
  '130429': {
    code: '130429',
    title: 'تم تجاوز معدل الإرسال المسموح (Rate Limit)',
    description:
      'تم إرسال عدد كبير جداً من الطلبات في وقت قصير وتجاوز حد الإرسال المسموح به من خوادم Meta.',
    actionText: 'حدود الإرسال في Meta',
    actionUrl: 'https://developers.facebook.com/docs/whatsapp/cloud-api/guides/throughput',
  },
  '131053': {
    code: '131053',
    title: 'تم تجاوز حد المراسلة اليومي للحساب (Tier Limit)',
    description:
      'وصل الحساب إلى الحد الأقصى لعدد المحادثات المسموح بها يومياً طبقاً لتصنيف الحساب في Meta.',
    actionText: 'حدود المراسلة في Meta',
    actionUrl: 'https://developers.facebook.com/docs/whatsapp/messaging-limits',
  },
  'NO_SESSION': {
    code: 'NO_SESSION',
    title: 'لا توجد جلسة واتساب متصلة للشركة',
    description:
      'لم يتم العثور على أي جلسة واتساب نشطة أو متصلة بحساب الشركة لإرسال الإشعار. يرجى ربط حساب واتساب (Meta Cloud API أو مسح كود QR) والتأكد من تحديد الجلسة الافتراضية في إعدادات الواتساب.',
    actionText: 'إعدادات جلسات الواتساب',
    actionUrl: '/whatsapp/sessions',
  },
  'NO_TEMPLATE_CONFIGURED': {
    code: 'NO_TEMPLATE_CONFIGURED',
    title: 'لا يوجد قالب معتمد للحدث (Meta Cloud)',
    description:
      'جلسة الواتساب الحالية تعمل عبر Meta Cloud API الرسمي والذي يشترط وجود قالب معتمد (Approved Template) في Meta لإرسال الإشعارات التلقائية. يرجى اعتماد وربط قالب للحدث من صفحة القوالب، أو استخدام ربط Web/QR للإرسال المباشر بدون قيود القوالب.',
    actionText: 'قوالب الواتساب',
    actionUrl: '/whatsapp/templates',
  },
  'SESSION_NOT_CONNECTED': {
    code: 'SESSION_NOT_CONNECTED',
    title: 'جلسة الواتساب غير متصلة حالياً',
    description:
      'جلسة الواتساب المحددة للإرسال انقطع اتصالها أو تحتاج إلى إعادة مسح رمز الـ QR أو إعادة الاتصال من صفحة الجلسات.',
    actionText: 'إعدادات جلسات الواتساب',
    actionUrl: '/whatsapp/sessions',
  },
  'NOTIFICATIONS_DISABLED': {
    code: 'NOTIFICATIONS_DISABLED',
    title: 'إشعارات الواتساب معطلة للشركة',
    description:
      'إرسال إشعارات الواتساب التلقائية معطل حالياً في إعدادات الشركة. يرجى تفعيل مفتاح الإشعارات والضغط على حفظ.',
    actionText: 'إعدادات الإشعارات',
    actionUrl: '/whatsapp/notification-logs',
  },
  'WA_INVALID_RECIPIENT': {
    code: 'WA_INVALID_RECIPIENT',
    title: 'رقم المستلم غير صحيح أو ناقص',
    description:
      'رقم هاتف المستلم غير مكتمل أو غير صالح لإرسال رسائل الواتساب أو البيانات المرسلة ناقصة.',
  },
};

/**
 * Extracts any HTTP/HTTPS or business.facebook.com URL from raw text.
 */
export function extractUrlFromMessage(text?: string | null): string | null {
  if (!text) return null;
  const match = text.match(/(https?:\/\/[^\s),]+|business\.facebook\.com[^\s),]+)/i);
  if (!match) return null;
  let url = match[1];
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Resolves comprehensive Arabic error details and guidance for Meta/WhatsApp errors.
 */
export function getMetaErrorInfo(
  code?: string | null,
  failureReason?: string | null
): MetaErrorInfo {
  const normalizedCode = code ? String(code).trim() : '';
  const reasonText = failureReason ? String(failureReason).toLowerCase() : '';
  const urlInMessage = extractUrlFromMessage(failureReason);

  // 1. Direct code lookup
  if (normalizedCode && META_ERROR_CODES[normalizedCode]) {
    const info = META_ERROR_CODES[normalizedCode];
    return {
      ...info,
      actionUrl: urlInMessage || info.actionUrl,
      actionText: info.actionText || (urlInMessage ? 'فتح في Meta' : undefined),
    };
  }

  // 2. Infer from failureReason or code keywords if exact code not directly matched
  if (normalizedCode === 'NO_SESSION' || reasonText.includes('no_session') || reasonText.includes('no session')) {
    return META_ERROR_CODES['NO_SESSION'];
  }
  if (normalizedCode === 'NO_TEMPLATE_CONFIGURED' || reasonText.includes('no_template_configured') || reasonText.includes('مفيش قالب ميتا')) {
    return META_ERROR_CODES['NO_TEMPLATE_CONFIGURED'];
  }
  if (reasonText.includes('141006') || reasonText.includes('payment method')) {
    return META_ERROR_CODES['141006'];
  }
  if (reasonText.includes('session_not_connected') || reasonText.includes('not connected')) {
    return META_ERROR_CODES['SESSION_NOT_CONNECTED'];
  }
  if (reasonText.includes('notifications_disabled') || reasonText.includes('disabled')) {
    return META_ERROR_CODES['NOTIFICATIONS_DISABLED'];
  }
  if (normalizedCode === 'WA_INVALID_RECIPIENT' || reasonText.includes('invalid_recipient') || reasonText.includes('رقم المستلم غير صحيح')) {
    return META_ERROR_CODES['WA_INVALID_RECIPIENT'];
  }

  if (normalizedCode) {
    return {
      code: normalizedCode,
      title: 'كود غير معروف — التفاصيل التقنية تحت',
      description:
        'لم يتم التعرف على كود الخطأ تلقائياً. يرجى مراجعة التفاصيل التقنية أدناه لمعرفة السبب بالتفصيل.',
      actionText: urlInMessage ? 'فتح في Meta' : undefined,
      actionUrl: urlInMessage || undefined,
    };
  }

  return {
    code: '',
    title: 'فشل إرسال الإشعار',
    description:
      'تعذر إرسال الإشعار. يرجى مراجعة سبب الفشل والتفاصيل التقنية أدناه لمعرفة السبب.',
    actionText: urlInMessage ? 'فتح في Meta' : undefined,
    actionUrl: urlInMessage || undefined,
  };
}
