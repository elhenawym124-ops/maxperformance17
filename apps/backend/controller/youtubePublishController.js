/**
 * youtubePublishController.js
 * Express controllers for YouTube publishing, video scheduling, and lifecycle management.
 */

const { getSharedPrismaClient } = require('../services/sharedDatabase');
const youtubeOAuthService = require('../services/youtube/youtubeOAuthService');
const youtubePublishService = require('../services/youtube/youtubePublishService');

const prisma = () => getSharedPrismaClient();
const getCompanyId = (req) => req.user?.companyId;

const PRIVACY_VALUES = ['private', 'unlisted', 'public'];
const MAX_UPLOADS_CEILING = 50;

function maskClientId(clientId) {
  const value = String(clientId || '').trim();
  if (!value) return null;
  return value.length <= 12 ? '••••' : `••••${value.slice(-12)}`;
}

async function serializeSettings(companyId) {
  const settings = await youtubeOAuthService.getSettings(companyId);
  const quota = await youtubePublishService.getUploadQuota(prisma(), companyId);

  return {
    isEnabled: quota.isEnabled,
    defaultPrivacy: settings?.defaultPrivacy || 'private',
    defaultCategoryId: settings?.defaultCategoryId || '22',
    maxUploadsPerDay: quota.max,
    usedToday: quota.used,
    remainingToday: quota.remaining,
    hasCredentials: Boolean(settings?.clientId && settings?.clientSecret),
    clientIdHint: maskClientId(settings?.clientId),
    redirectUri: settings?.redirectUri || youtubeOAuthService.getRedirectUri(),
  };
}

exports.getAccountStatus = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const account = await youtubeOAuthService.getAccount(companyId);
    if (!account) {
      return res.json({
        success: true,
        data: { connected: false },
      });
    }

    return res.json({
      success: true,
      data: {
        connected: true,
        channelId: account.channelId,
        channelTitle: account.channelTitle,
        avatarUrl: account.avatarUrl,
        status: account.status,
        tokenExpiresAt: account.tokenExpiresAt,
      },
    });
  } catch (error) {
    console.error('❌ [YouTube Publish] getAccountStatus error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب حالة حساب YouTube' });
  }
};

exports.createVideo = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const {
      title,
      description,
      tags,
      privacy,
      privacyStatus,
      mediaUrl,
      scheduledAt,
      madeForKids,
      categoryId,
    } = req.body;

    // 1) Validate title
    if (!title || typeof title !== 'string' || !title.trim() || title.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: 'عنوان الفيديو مطلوب ويجب ألا يتجاوز 100 حرف',
      });
    }

    // 2) Validate media file exists on disk
    if (!mediaUrl || typeof mediaUrl !== 'string' || !mediaUrl.trim()) {
      return res.status(400).json({
        success: false,
        error: 'رابط ملف الفيديو مطلوب',
      });
    }

    const localFile = youtubePublishService.resolveLocalFilePath(mediaUrl.trim());
    if (!localFile) {
      return res.status(400).json({
        success: false,
        error: 'ملف الفيديو غير موجود على السيرفر',
      });
    }

    // 3) Validate connected account
    const account = await youtubeOAuthService.getAccount(companyId);
    if (!account) {
      return res.status(400).json({
        success: false,
        error: 'اربط قناة YouTube أولاً',
      });
    }

    // 4) Enforce company enablement + daily upload cap
    let quota;
    try {
      quota = await youtubePublishService.assertUploadAllowed(prisma(), companyId);
    } catch (limitError) {
      if (limitError.code === 'PUBLISH_DISABLED') {
        return res.status(403).json({
          success: false,
          code: 'PUBLISH_DISABLED',
          error: limitError.message,
        });
      }
      if (limitError.code === 'DAILY_LIMIT_REACHED') {
        return res.status(429).json({
          success: false,
          code: 'DAILY_LIMIT_REACHED',
          error: limitError.message,
        });
      }
      throw limitError;
    }

    // 5) Determine scheduled time
    let scheduleDate = new Date();
    if (scheduledAt) {
      const parsed = new Date(scheduledAt);
      if (!Number.isNaN(parsed.getTime())) {
        scheduleDate = parsed;
      }
    }

    const finalPrivacy = privacy || privacyStatus || quota.settings?.defaultPrivacy || 'private';

    const video = await prisma().youTubeVideo.create({
      data: {
        companyId,
        accountId: account.id,
        title: title.trim(),
        description: description ? String(description).slice(0, 5000) : null,
        tags: tags ? String(tags) : null,
        categoryId: categoryId || quota.settings?.defaultCategoryId || '22',
        privacyStatus: ['private', 'unlisted', 'public'].includes(finalPrivacy) ? finalPrivacy : 'private',
        madeForKids: Boolean(madeForKids),
        mediaUrl: mediaUrl.trim(),
        status: 'SCHEDULED',
        scheduledAt: scheduleDate,
        attempts: 0,
      },
    });

    return res.status(201).json({
      success: true,
      data: video,
    });
  } catch (error) {
    console.error('❌ [YouTube Publish] createVideo error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جدولة الفيديو' });
  }
};

exports.listVideos = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { page, limit, status } = req.query;
    const result = await youtubePublishService.listPosts({
      companyId,
      page,
      limit,
      status: status || undefined,
    });

    return res.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
    });
  } catch (error) {
    console.error('❌ [YouTube Publish] listVideos error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب قائمة الفيديوهات' });
  }
};

exports.getVideo = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { id } = req.params;
    const db = prisma();
    const video = await db.youTubeVideo.findFirst({
      where: { id, companyId },
    });

    if (!video) {
      return res.status(404).json({ success: false, error: 'الفيديو غير موجود' });
    }

    // Refresh status if uploading or processing
    if (video.status === 'PROCESSING' || video.status === 'UPLOADING') {
      const refreshed = await youtubePublishService.pollStatus(db, video);
      return res.json({ success: true, data: refreshed });
    }

    return res.json({ success: true, data: video });
  } catch (error) {
    console.error('❌ [YouTube Publish] getVideo error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب تفاصيل الفيديو' });
  }
};

exports.updateScheduledVideo = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { id } = req.params;
    const updated = await youtubePublishService.updateScheduledVideo({
      companyId,
      id,
      ...req.body,
    });

    return res.json({ success: true, data: updated });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('❌ [YouTube Publish] updateScheduledVideo error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء تعديل الفيديو' });
  }
};

exports.retryVideo = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { id } = req.params;
    const retried = await youtubePublishService.retry({ companyId, id });

    return res.json({ success: true, data: retried });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('❌ [YouTube Publish] retryVideo error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إعادة محاولة الفيديو' });
  }
};

exports.cancelVideo = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { id } = req.params;
    const cancelled = await youtubePublishService.cancel({ companyId, id });

    return res.json({ success: true, data: cancelled });
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return res.status(404).json({ success: false, error: error.message });
    }
    if (error.code) {
      return res.status(400).json({ success: false, error: error.message });
    }
    console.error('❌ [YouTube Publish] cancelVideo error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء إلغاء الفيديو' });
  }
};

exports.getSettings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    return res.json({ success: true, data: await serializeSettings(companyId) });
  } catch (error) {
    console.error('❌ [YouTube Publish] getSettings error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء جلب إعدادات YouTube' });
  }
};

exports.updateSettings = async (req, res) => {
  try {
    const companyId = getCompanyId(req);
    if (!companyId) {
      return res.status(401).json({ success: false, error: 'غير مصرح' });
    }

    const { isEnabled, defaultPrivacy, defaultCategoryId, maxUploadsPerDay, clientId, clientSecret, redirectUri } =
      req.body || {};

    const data = {};

    if (isEnabled !== undefined) {
      if (typeof isEnabled !== 'boolean') {
        return res.status(400).json({ success: false, error: 'قيمة التفعيل غير صالحة' });
      }
      data.isEnabled = isEnabled;
    }

    if (defaultPrivacy !== undefined) {
      if (!PRIVACY_VALUES.includes(defaultPrivacy)) {
        return res.status(400).json({ success: false, error: 'مستوى الخصوصية غير صالح' });
      }
      data.defaultPrivacy = defaultPrivacy;
    }

    if (defaultCategoryId !== undefined) {
      const category = String(defaultCategoryId).trim();
      if (!category) {
        return res.status(400).json({ success: false, error: 'تصنيف الفيديو غير صالح' });
      }
      data.defaultCategoryId = category.slice(0, 10);
    }

    if (maxUploadsPerDay !== undefined) {
      const max = Number(maxUploadsPerDay);
      if (!Number.isInteger(max) || max < 1 || max > MAX_UPLOADS_CEILING) {
        return res.status(400).json({
          success: false,
          error: `الحد اليومي يجب أن يكون رقماً بين 1 و ${MAX_UPLOADS_CEILING}`,
        });
      }
      data.maxUploadsPerDay = max;
    }

    if (clientId !== undefined) {
      const value = String(clientId).trim();
      if (!value) {
        return res.status(400).json({ success: false, error: 'Client ID غير صالح' });
      }
      data.clientId = value;
    }

    if (clientSecret !== undefined) {
      const value = String(clientSecret).trim();
      if (!value) {
        return res.status(400).json({ success: false, error: 'Client Secret غير صالح' });
      }
      data.clientSecret = value;
    }

    if (redirectUri !== undefined) {
      const value = String(redirectUri).trim();
      if (!/^https?:\/\//i.test(value)) {
        return res.status(400).json({ success: false, error: 'رابط إعادة التوجيه غير صالح' });
      }
      data.redirectUri = value;
    }

    if (Object.keys(data).length > 0) {
      await prisma().youTubeSettings.upsert({
        where: { companyId },
        create: { companyId, ...data },
        update: data,
      });
    }

    return res.json({ success: true, data: await serializeSettings(companyId) });
  } catch (error) {
    console.error('❌ [YouTube Publish] updateSettings error:', error);
    return res.status(500).json({ success: false, error: 'حدث خطأ أثناء حفظ إعدادات YouTube' });
  }
};

