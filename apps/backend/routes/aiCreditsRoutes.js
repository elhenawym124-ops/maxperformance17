/**
 * @file aiCreditsRoutes.js
 * @description AI Agent, Token & Credit Wallet routes:
 *  - Merchant surface: /api/v1/ai-credits (wallet summary, quote, preferences, 3 top-up methods)
 *  - Super Admin surface: /api/v1/ai-credits/admin (dynamic pricing, model overrides, packages, company grants)
 */

const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const verifyToken = require('../utils/verifyToken');
const { authenticateToken, requireSuperAdmin } = require('../middleware/superAdminMiddleware');
const aiCreditPricingService = require('../services/aiCreditPricingService');

const router = express.Router();
const auth = [verifyToken.authenticateToken, verifyToken.requireCompanyAccess];

// Multer config for manual transfer receipt uploads
const receiptStorage = multer.diskStorage({
  destination(req, file, cb) {
    const uploadDir = 'uploads/payment-receipts';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `ai-credit-receipt-${uniqueSuffix}${path.extname(file.originalname || '.png')}`);
  },
});

const uploadReceipt = multer({
  storage: receiptStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (file.mimetype && file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('يجب أن يكون الملف صورة'), false);
    }
  },
});

function getPrisma() {
  try {
    return require('../services/sharedDatabase').getSharedPrismaClient();
  } catch {
    return null;
  }
}

// ── Merchant Endpoints ────────────────────────────────────────────────────

router.get('/summary', ...auth, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const data = await aiCreditPricingService.getWalletSummary(companyId);
    return res.json({ success: true, data });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

router.post('/quote', ...auth, async (req, res) => {
  try {
    const settings = await aiCreditPricingService.getPricingSettings();
    const quote = aiCreditPricingService.quoteUsageCost(req.body || {}, settings);
    return res.json({ success: true, data: quote });
  } catch (err) {
    return res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/preferences', ...auth, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { autoTopupEnabled, autoTopupPackageId, dailyCreditLimit } = req.body || {};
    const result = await aiCreditPricingService.adminAdjustCompanyCredits({
      companyId,
      creditsDelta: 0,
      overrides: {
        autoTopupEnabled,
        autoTopupPackageId,
        dailyCreditLimit,
      },
    });
    return res.json({ success: true, data: result.wallet });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, message: err.message });
  }
});

// Method 1: Instant purchase from CompanyWallet EGP balance
router.post('/topup/wallet', ...auth, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { packageId } = req.body || {};
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'يجب اختيار باقة الشحن' });
    }
    const data = await aiCreditPricingService.purchasePackageFromCompanyWallet({
      companyId,
      packageId,
      userId: req.user?.id,
    });
    return res.json({
      success: true,
      message: `تم شحن ${data.transaction.creditsDelta.toLocaleString('en-US')} Credit بنجاح`,
      data,
    });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
});

// Method 2: Online top-up via Kashier session
router.post('/topup/kashier', ...auth, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { packageId } = req.body || {};
    if (!packageId) {
      return res.status(400).json({ success: false, message: 'يجب اختيار باقة الشحن' });
    }

    const prisma = getPrisma();
    const settings = await aiCreditPricingService.getPricingSettings(prisma);
    const pkg = (settings.packages || []).find((p) => p.id === packageId && p.isActive !== false);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'الباقة المحددة غير موجودة' });
    }

    const baseDomain = process.env.MAIN_DOMAIN || 'maxp.online';
    const orderNumber = `AIC-${String(companyId).slice(-8)}-${Date.now()}`;
    const webhookUrl = `https://${baseDomain}/api/v1/payment/kashier/webhook`;
    const redirectUrl = `https://${baseDomain}/admin/ai-credits?orderId=${orderNumber}&packageId=${pkg.id}`;

    await aiCreditPricingService.createPendingExternalTopup(
      {
        companyId,
        packageId: pkg.id,
        referenceId: orderNumber,
        method: 'KASHIER',
        metadata: { userId: req.user?.id },
      },
      prisma
    );

    const KashierService = require('../services/kashierService');
    const session = await KashierService.createPaymentSession(
      {
        amount: Number(pkg.priceEgp),
        currency: 'EGP',
        orderId: orderNumber,
        customer: {
          email: req.user?.email || `billing@${baseDomain}`,
          reference: `ai-credits:${companyId}:${pkg.id}`,
        },
        redirectUrl,
        webhookUrl,
        description: `شحن كريدت AI - ${pkg.nameAr}`,
      },
      null,
      {
        metaData: {
          orderId: orderNumber,
          type: 'AI_CREDITS_TOPUP',
          companyId,
          packageId: pkg.id,
          amountEgp: String(pkg.priceEgp),
        },
      }
    );

    if (!session?.success) {
      if (prisma?.aiCreditTransaction?.updateMany) {
        await prisma.aiCreditTransaction
          .updateMany({
            where: { referenceId: orderNumber, status: 'PENDING' },
            data: { status: 'FAILED' },
          })
          .catch(() => {});
      }
      return res.status(502).json({
        success: false,
        message: 'تعذر بدء جلسة الدفع عبر كاشير',
        error: session?.error,
      });
    }

    if (session.sessionId && prisma?.aiCreditTransaction?.updateMany) {
      await prisma.aiCreditTransaction
        .updateMany({
          where: { referenceId: orderNumber, status: 'PENDING' },
          data: { description: `شحن كريدت قيد المعالجة (KASHIER): ${pkg.nameAr} | session:${session.sessionId}` },
        })
        .catch(() => {});
    }

    return res.json({
      success: true,
      data: {
        sessionUrl: session.sessionUrl,
        sessionId: session.sessionId,
        orderNumber,
        package: pkg,
      },
    });
  } catch (err) {
    console.error('[AI-CREDITS-KASHIER] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'خطأ في إنشاء جلسة كاشير' });
  }
});

router.post('/topup/kashier/verify', ...auth, async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { orderId } = req.body || {};
    if (!orderId) {
      return res.status(400).json({ success: false, message: 'رقم الطلب مطلوب' });
    }

    const prisma = getPrisma();
    const tx = await prisma?.aiCreditTransaction?.findFirst({
      where: { companyId: String(companyId), referenceId: String(orderId) },
    });
    if (!tx) {
      return res.status(404).json({ success: false, message: 'طلب الشحن غير موجود' });
    }
    if (tx.status === 'COMPLETED') {
      const summary = await aiCreditPricingService.getWalletSummary(companyId, prisma);
      return res.json({ success: true, verified: true, message: 'تم شحن الكريدت بالفعل', data: summary });
    }

    const sessionMatch = String(tx.description || '').match(/session:([^\s|]+)/);
    const sessionId = sessionMatch ? sessionMatch[1] : null;
    const KashierService = require('../services/kashierService');
    const sessionRes = sessionId
      ? await KashierService.getSessionStatus(sessionId, companyId).catch(() => null)
      : null;

    const statusUpper = String(sessionRes?.status || '').toUpperCase();
    const capAmt = Number(sessionRes?.capturedAmount || sessionRes?.amount || 0);
    if (sessionRes?.success && (['SUCCESS', 'CAPTURED', 'PAID', 'APPROVED'].includes(statusUpper) || capAmt > 0)) {
      await aiCreditPricingService.fulfillExternalTopup(
        {
          companyId,
          referenceId: orderId,
          method: 'KASHIER',
          approvedBy: 'kashier_verify',
        },
        prisma
      );
      const summary = await aiCreditPricingService.getWalletSummary(companyId, prisma);
      return res.json({ success: true, verified: true, message: 'تم تأكيد الدفع وإضافة الكريدت', data: summary });
    }

    return res.json({
      success: true,
      verified: false,
      status: statusUpper || 'PENDING',
      message: 'لم يتم تأكيد الدفع من بوابة كاشير بعد',
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// Method 3: Manual transfer (Vodafone Cash / InstaPay / Wallet) + receipt upload
router.post('/topup/receipt', ...auth, uploadReceipt.single('receipt'), async (req, res) => {
  try {
    const companyId = req.user?.companyId;
    const { packageId, walletNumberId } = req.body || {};

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'يجب رفع صورة إيصال التحويل' });
    }
    if (!walletNumberId || !packageId) {
      return res.status(400).json({ success: false, message: 'يجب اختيار الباقة ورقم المحفظة المحوّل إليها' });
    }

    const prisma = getPrisma();
    const walletNumber = await prisma.walletNumber.findUnique({ where: { id: walletNumberId } });
    if (!walletNumber || !walletNumber.isActive) {
      return res.status(400).json({ success: false, message: 'رقم المحفظة غير صالح أو غير نشط' });
    }

    const settings = await aiCreditPricingService.getPricingSettings(prisma);
    const pkg = (settings.packages || []).find((p) => p.id === packageId && p.isActive !== false);
    if (!pkg) {
      return res.status(404).json({ success: false, message: 'الباقة المحددة غير موجودة' });
    }

    const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber: `AIC-${Date.now()}`,
        companyId,
        totalAmount: pkg.priceEgp,
        subtotal: pkg.priceEgp,
        status: 'DRAFT',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        notes: `AI_CREDITS_TOPUP:${pkg.id}:${totalCredits} | ${pkg.nameAr}`,
      },
    });

    const receipt = await prisma.paymentReceipt.create({
      data: {
        invoiceId: invoice.id,
        walletNumberId,
        receiptImage: req.file.path,
        status: 'PENDING',
      },
    });

    await aiCreditPricingService.createPendingExternalTopup(
      {
        companyId,
        packageId: pkg.id,
        referenceId: invoice.id,
        method: 'RECEIPT',
        metadata: { invoiceNumber: invoice.invoiceNumber, receiptId: receipt.id, walletNumberName: walletNumber.name },
      },
      prisma
    );

    return res.json({
      success: true,
      message: 'تم إرسال الإيصال بنجاح وسيتم إضافة الكريدت فور مراجعته من الإدارة',
      data: { receipt, invoice },
    });
  } catch (err) {
    console.error('[AI-CREDITS-RECEIPT] Error:', err);
    return res.status(500).json({ success: false, message: err.message || 'خطأ في رفع الإيصال' });
  }
});

// ── Super Admin Endpoints ─────────────────────────────────────────────────

const superAdminRouter = express.Router();
superAdminRouter.use(authenticateToken);
superAdminRouter.use(requireSuperAdmin);

superAdminRouter.get('/settings', async (req, res) => {
  try {
    const settings = await aiCreditPricingService.getPricingSettings(undefined, { bypassCache: true });
    const modelCatalog = aiCreditPricingService.getEffectiveModelCatalog(settings);
    return res.json({ success: true, data: { settings, modelCatalog } });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

superAdminRouter.put('/settings', async (req, res) => {
  try {
    const allowed = [
      'usdToEgp',
      'creditPriceEgp',
      'flashMarkupPercent',
      'proMarkupPercent',
      'minCreditsPerChat',
      'minCreditsPerAgentRun',
      'agentStepFeeCredits',
      'byokFreeTokens',
      'enforcementMode',
      'trialBonusCredits',
      'defaultDailyCreditLimit',
      'modelCostOverrides',
      'packages',
    ];
    const patch = {};
    for (const key of allowed) {
      if (req.body?.[key] !== undefined) patch[key] = req.body[key];
    }
    const settings = await aiCreditPricingService.updatePricingSettings(patch);
    const modelCatalog = aiCreditPricingService.getEffectiveModelCatalog(settings);
    return res.json({ success: true, data: { settings, modelCatalog } });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

superAdminRouter.post('/simulate', async (req, res) => {
  try {
    const base = await aiCreditPricingService.getPricingSettings();
    const draftSettings = req.body?.settings ? { ...base, ...req.body.settings } : base;
    const quote = aiCreditPricingService.quoteUsageCost(req.body?.usage || req.body || {}, draftSettings);
    return res.json({ success: true, data: quote });
  } catch (err) {
    return res.status(400).json({ success: false, error: err.message });
  }
});

superAdminRouter.get('/companies', async (req, res) => {
  try {
    const prisma = getPrisma();
    const search = String(req.query.search || '').trim();
    const limit = Math.min(100, Math.max(10, Number(req.query.limit) || 30));

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {};

    const companies = await prisma.company.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, isActive: true },
    });

    const companyIds = companies.map((c) => c.id);
    const [wallets, byokKeys] = await Promise.all([
      prisma.aiCreditWallet?.findMany
        ? prisma.aiCreditWallet.findMany({ where: { companyId: { in: companyIds } } }).catch(() => [])
        : [],
      prisma.aiKey?.findMany
        ? prisma.aiKey
            .findMany({
              where: { companyId: { in: companyIds }, isActive: true, keyType: 'COMPANY' },
              select: { companyId: true },
            })
            .catch(() => [])
        : [],
    ]);

    const walletMap = new Map(wallets.map((w) => [w.companyId, w]));
    const byokSet = new Set(byokKeys.map((k) => k.companyId));
    const settings = await aiCreditPricingService.getPricingSettings(prisma);

    const rows = companies.map((c) => {
      const w = walletMap.get(c.id);
      return {
        companyId: c.id,
        name: c.name,
        email: c.email,
        isActive: c.isActive,
        byokActive: byokSet.has(c.id),
        balance: w ? w.balance : settings.trialBonusCredits,
        includedBalance: w ? w.includedBalance : 0,
        totalPurchased: w ? w.totalPurchased : 0,
        totalUsed: w ? w.totalUsed : 0,
        dailyCreditLimit: w?.dailyCreditLimit ?? null,
        pricingMode: w?.pricingMode || 'DEFAULT',
        autoTopupEnabled: w?.autoTopupEnabled || false,
      };
    });

    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

superAdminRouter.post('/companies/:companyId/adjust', async (req, res) => {
  try {
    const { companyId } = req.params;
    const { creditsDelta = 0, reason = '', overrides = null } = req.body || {};
    const result = await aiCreditPricingService.adminAdjustCompanyCredits({
      companyId,
      creditsDelta,
      reason,
      adminId: req.user?.id || req.user?.email,
      overrides,
    });
    return res.json({ success: true, data: result });
  } catch (err) {
    return res.status(err.statusCode || 400).json({ success: false, error: err.message });
  }
});

superAdminRouter.get('/transactions', async (req, res) => {
  try {
    const prisma = getPrisma();
    const companyId = req.query.companyId ? String(req.query.companyId) : undefined;
    const limit = Math.min(200, Math.max(10, Number(req.query.limit) || 50));
    const rows = prisma.aiCreditTransaction?.findMany
      ? await prisma.aiCreditTransaction.findMany({
          where: companyId ? { companyId } : undefined,
          orderBy: { createdAt: 'desc' },
          take: limit,
        })
      : [];
    return res.json({ success: true, data: rows });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

router.superAdminRouter = superAdminRouter;
module.exports = router;
