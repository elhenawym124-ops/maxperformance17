/**
 * @module agentMarketplaceCatalogService
 * @description Dynamic Single-Source-of-Truth catalog for MaxP Agents Marketplace.
 * - Auto-discovers every agent under apps/backend/agents/<slug>/agent.json.
 * - Persists Super Admin visibility, pricing, kind, and category overrides in SystemSettings.
 * - Merges live company context (hired agents from ai-service, installed apps, real wallet balance).
 * - Enforces atomic CompanyWallet billing for Pro agents with safe refund on spawn failure.
 */

const fs = require('fs');
const path = require('path');
const { getSharedPrismaClient } = require('./sharedDatabase');
const aiServiceAdminClient = require('./aiServiceAdminClient');

const AGENTS_DIR = path.resolve(__dirname, '../agents');
const SETTINGS_SYSTEM_NAME = 'agent_marketplace_catalog_overrides';
const SUBSCRIPTIONS_SYSTEM_NAME = 'agent_marketplace_subscriptions';
const CACHE_TTL_MS = 15_000;

const VALID_KINDS = ['solo', 'squad', 'vertical', 'internal'];
const VALID_CATEGORIES = [
  'executive',
  'sales',
  'operations',
  'marketing',
  'growth',
  'healthcare',
  'education',
  'hospitality',
  'hr',
];
const VALID_TIERS = ['free', 'pro'];

const CATALOG_CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'executive', label: 'الإدارة التنفيذية' },
  { id: 'sales', label: 'المبيعات وخدمة العملاء' },
  { id: 'operations', label: 'الطلبات والشحن والمخزون' },
  { id: 'marketing', label: 'التسويق والإعلانات' },
  { id: 'growth', label: 'النمو ورفع AOV' },
  { id: 'healthcare', label: 'القطاع الطبي والتجميل' },
  { id: 'education', label: 'التعليم والأكاديميات' },
  { id: 'hospitality', label: 'الفنادق والضيافة' },
  { id: 'hr', label: 'الموارد البشرية' },
];

const CATALOG_KINDS = [
  { id: 'all', label: 'جميع الأنواع' },
  { id: 'solo', label: 'وكيل مستقل' },
  { id: 'squad', label: 'فريق متكامل' },
  { id: 'vertical', label: 'قطاع متخصص' },
];

const CHANNEL_LABELS = {
  whatsapp: 'واتساب',
  facebook: 'فيسبوك وإنستغرام',
  voice: 'مكالمات صوتية',
  dashboard: 'لوحة التحكم',
  storefront: 'المتجر الإلكتروني',
  browser: 'إضافة المتصفح',
};

const TOOL_CAPABILITY_MAP = [
  { prefix: 'company.snapshot', label: 'قراءة مؤشرات أداء الشركة والملخص التنفيذي' },
  { prefix: 'sales.revenue', label: 'تحليل الإيرادات والمبيعات اليومية والشهرية' },
  { prefix: 'order.', label: 'البحث في الطلبات وتحديث حالاتها وتأكيدها' },
  { prefix: 'orders_', label: 'إدارة وتحديث الطلبات ومراجعة نسب التحويل' },
  { prefix: 'shipment.', label: 'تتبع الشحنات والتنسيق مع شركات التوصيل' },
  { prefix: 'shipping.', label: 'إدارة شركات الشحن والأسعار وتذاكر التوصيل' },
  { prefix: 'returns.', label: 'متابعة طلبات الاسترجاع والاستبدال' },
  { prefix: 'product.', label: 'إدارة الكتالوج ومراقبة النواقص والمنتجات الأكثر مبيعاً' },
  { prefix: 'inventory.', label: 'فحص ومراجعة أرصدة المخزون' },
  { prefix: 'facebook_ad', label: 'تحليل وإعداد مسودات حملات إعلانات Meta' },
  { prefix: 'facebook_pages', label: 'متابعة رسائل وتعليقات صفحات فيسبوك' },
  { prefix: 'whatsapp_', label: 'التواصل المباشر وإرسال التحديثات عبر واتساب' },
  { prefix: 'competitor', label: 'رصد إعلانات وأسعار المنافسين في السوق' },
  { prefix: 'offers.', label: 'إدارة العروض والخصومات وباقات زيادة السلة' },
  { prefix: 'conversion.', label: 'تحسين أدوات التحويل ورفع متوسط قيمة الطلب' },
  { prefix: 'hr_', label: 'متابعة الحضور والإجازات وشؤون الموظفين' },
  { prefix: 'team_', label: 'متابعة أداء الفريق وتوزيع المهام' },
  { prefix: 'medical', label: 'إدارة المواعيد والأطباء وحجوزات المركز الطبي' },
  { prefix: 'booking', label: 'حجز وتأكيد وإعادة جدولة المواعيد' },
  { prefix: 'delegate.task', label: 'تفويض المهام ومتابعتها مع باقي الوكلاء' },
  { prefix: 'agent.handoff', label: 'تحويل المحادثات تلقائياً للوكيل المختص' },
  { prefix: 'knowledge.', label: 'الاعتماد على قاعدة معرفة الشركة وسياساتها المعتمدة' },
  { prefix: 'manage.todo', label: 'تنظيم قوائم المهام والتنبيهات التشغيلية' },
];

/**
 * Curated marketplace metadata for the 40 built-in agents.
 * Any newly added agent directory under apps/backend/agents/<slug> is automatically
 * discovered even if not listed here, using agent.json fields + sensible defaults.
 */
const BUILTIN_AGENT_META = {
  'executive-assistant-agent': {
    category: 'executive',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 590,
    featured: true,
    channels: ['dashboard', 'whatsapp'],
    department: 'executive',
    sortOrder: 10,
    position: 'المساعد التنفيذي للمنصة وإدارة العمليات',
    summary: 'متابعة الإيرادات والطلبات، رصد النواقص والمخزون، وتفويض المهام بين وكلاء الشركة.',
  },
  'store-manager-agent': {
    category: 'executive',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 490,
    featured: true,
    channels: ['dashboard', 'whatsapp'],
    department: 'executive',
    sortOrder: 15,
    position: 'مدير تشغيل المتجر اليومي',
    summary: 'مراجعة أداء المتجر يومياً واقتراح قرارات تشغيلية لرفع المبيعات وتقليل المرتجعات.',
  },
  'aov-specialist-agent': {
    category: 'growth',
    kind: 'squad',
    tier: 'pro',
    priceMonthly: 590,
    featured: true,
    channels: ['dashboard', 'storefront'],
    department: 'marketing',
    sortOrder: 20,
    position: 'فريق متكامل لرفع متوسط قيمة الطلب (AOV)',
    summary: 'فريق رباعي (قائد + محلل + مدقق أرقام + منفذ عروض) لرفع سلة الشراء وبناء الباقات المعتمدة.',
    squadMembers: [
      'aov-specialist-agent',
      'aov-analyst-agent',
      'aov-auditor-agent',
      'aov-executor-agent',
    ],
  },
  'aov-analyst-agent': {
    category: 'growth',
    kind: 'internal',
    visible: false,
    tier: 'pro',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'marketing',
    sortOrder: 910,
    position: 'محلل مؤشرات AOV (عضو فريق AOV)',
    summary: 'استخراج مؤشرات متوسط قيمة الطلب اليومية وتجهيز مسودة التقرير التحليلي.',
  },
  'aov-auditor-agent': {
    category: 'growth',
    kind: 'internal',
    visible: false,
    tier: 'pro',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'marketing',
    sortOrder: 911,
    position: 'مدقق أرقام فريق AOV (عضو فريق AOV)',
    summary: 'مراجعة مسودة تقرير AOV والتحقق المستقل من مصدر كل رقم قبل الاعتماد.',
  },
  'aov-executor-agent': {
    category: 'growth',
    kind: 'internal',
    visible: false,
    tier: 'pro',
    priceMonthly: 0,
    channels: ['dashboard', 'storefront'],
    department: 'marketing',
    sortOrder: 912,
    position: 'منفذ العروض والباقات (عضو فريق AOV)',
    summary: 'تنفيذ العروض والباقات المعتمدة من التاجر على المتجر بدقة.',
  },
  'facebook-media-buyer-agent': {
    category: 'marketing',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 490,
    featured: true,
    channels: ['facebook', 'dashboard'],
    department: 'marketing',
    sortOrder: 25,
    position: 'مدير إعلانات Meta والأداء التسويقي',
    summary: 'تحليل هوامش الربح، بناء مسودات حملات فيسبوك وإنستغرام الآمنة، ومراقبة العائد على الإنفاق.',
  },
  'order-confirmation-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 390,
    featured: true,
    channels: ['whatsapp'],
    department: 'operations',
    sortOrder: 30,
    position: 'منسقة تأكيد الطلبات عبر واتساب',
    summary: 'التواصل السريع مع العملاء على واتساب لتأكيد العناوين والكميات وتقليل المرتجعات.',
  },
  'voice-order-confirmation-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 590,
    featured: true,
    channels: ['voice'],
    department: 'operations',
    sortOrder: 35,
    position: 'مسؤولة المكالمات الهاتفية لتأكيد الطلبات',
    summary: 'إجراء مكالمات هاتفية تلقائية لتأكيد طلبات المتجر والتحقق من جدية العميل قبل الشحن.',
  },
  'sales-rep-v2-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 350,
    featured: true,
    channels: ['facebook', 'whatsapp'],
    department: 'sales',
    sortOrder: 40,
    position: 'مندوب مبيعات شامل — الإصدار المطور',
    summary: 'استقبال العملاء على رسائل الصفحة والواتساب والرد على الاستفسارات وإغلاق الطلبات بأسلوب بشري.',
  },
  'facebook-sales-support-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['facebook'],
    department: 'sales',
    sortOrder: 45,
    position: 'مبيعات وخدمة عملاء صفحات فيسبوك',
    summary: 'الرد الطبيعي على رسائل واستفسارات عملاء صفحات فيسبوك وتوجيههم لإتمام الطلب.',
  },
  'sales-rep-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['whatsapp', 'facebook', 'dashboard'],
    department: 'sales',
    sortOrder: 50,
    position: 'مندوب مبيعات متعدد القنوات',
    summary: 'تحويل الزوار إلى عملاء ومتابعة الاستفسارات عبر واتساب وفيسبوك ولوحة التحكم.',
  },
  'smart-seller-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 390,
    channels: ['whatsapp', 'storefront'],
    department: 'sales',
    sortOrder: 55,
    position: 'استراتيجي مبيعات ذكي',
    summary: 'ترشيح المنتجات المناسبة لكل عميل ورفع فرص إغلاق الصفقة وإعادة الشراء.',
  },
  'sas-sales-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['facebook'],
    department: 'sales',
    sortOrder: 60,
    position: 'وكيل مبيعات فيسبوك والكتالوج',
    summary: 'عرض منتجات الكتالوج والرد على استفسارات الأسعار والمقاسات عبر رسائل فيسبوك.',
  },
  'sales-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['storefront', 'whatsapp'],
    department: 'sales',
    sortOrder: 65,
    position: 'مساعد مبيعات المتجر',
    summary: 'توجيه المتسوقين للمنتج الأنسب بدقة مع الالتزام بالأسعار والمخزون الفعلي.',
  },
  'support-agent': {
    category: 'sales',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['whatsapp', 'dashboard'],
    department: 'sales',
    sortOrder: 70,
    position: 'وكيل الدعم الفني وخدمة العملاء',
    summary: 'حل مشكلات العملاء وتقديم خطوات واضحة لمتابعة الشكاوى والاستبدال.',
  },
  'order-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['whatsapp', 'storefront'],
    department: 'operations',
    sortOrder: 75,
    position: 'وكيل متابعة وتعديل الطلبات',
    summary: 'مساعدة العملاء في تتبع حالة الطلب أو تعديل البيانات أو الإلغاء وفق سياسة المتجر.',
  },
  'shipping-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['whatsapp', 'dashboard'],
    department: 'operations',
    sortOrder: 80,
    position: 'منسق الشحن والعمليات اللوجستية',
    summary: 'متابعة الشحنات مع شركات التوصيل، حل تذاكر التأخير، وتحديث العملاء بحالة الطرد.',
  },
  'stock-target-monitor-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 290,
    channels: ['dashboard', 'whatsapp'],
    department: 'operations',
    sortOrder: 85,
    position: 'مراقب المخزون ومستهدفات الأوردرات',
    summary: 'رصد لحظي لنواقص المخزون وتتبع التارجت اليومي والأسبوعي وتنبيه الإدارة مبكراً.',
  },
  'inventory-pricing-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'operations',
    sortOrder: 90,
    position: 'مراقب المخزون والتسعير وهوامش الربح',
    summary: 'مراجعة دقة المخزون واكتشاف المنتجات ذات الهامش الضعيف أو القريبة من النفاد.',
  },
  'product-creator-agent': {
    category: 'operations',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 290,
    channels: ['dashboard', 'storefront'],
    department: 'operations',
    sortOrder: 95,
    position: 'اختصاصي إدارة وإدراج المنتجات',
    summary: 'تحويل بيانات الموردين إلى صفحات منتجات منظمة وجاهزة للنشر في الكتالوج.',
  },
  'competitor-analysis': {
    category: 'marketing',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 390,
    channels: ['dashboard'],
    department: 'marketing',
    sortOrder: 100,
    position: 'محلل المنافسين وذكاء السوق',
    summary: 'مراقبة إعلانات وأسعار وعروض المنافسين وتقديم توصيات عملية للتفوق في السوق.',
  },
  'marketing-agent': {
    category: 'marketing',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'marketing',
    sortOrder: 105,
    position: 'كاتب ومخطط الحملات التسويقية',
    summary: 'إعداد مسودات حملات وعروض تسويقية جاهزة للمراجعة السريعة والنشر.',
  },
  'social-media-image-agent': {
    category: 'marketing',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 290,
    channels: ['dashboard', 'facebook'],
    department: 'marketing',
    sortOrder: 110,
    position: 'وكيل تصميم صور السوشيال ميديا',
    summary: 'توليد وتجهيز الصور الإعلانية ومنشورات السوشيال ميديا المتوافقة مع هوية المتجر.',
  },
  'browser-copilot-agent': {
    category: 'executive',
    kind: 'solo',
    tier: 'pro',
    priceMonthly: 290,
    channels: ['browser', 'dashboard'],
    department: 'executive',
    sortOrder: 115,
    position: 'مساعد المتصفح الفوري (Browser Copilot)',
    summary: 'فحص الطلبات والمخزون وتحليل صفحات الويب وإعلانات المنافسين مباشرة من المتصفح.',
  },
  'manager-ceo': {
    category: 'executive',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'executive',
    sortOrder: 120,
    position: 'المدير التنفيذي المنسق للوكلاء',
    summary: 'تحويل أهداف التاجر إلى خطط تنفيذية آمنة وتنسيق العمل بين وكلاء الشركة.',
  },
  'hr-assistant-agent': {
    category: 'hr',
    kind: 'solo',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'hr',
    requiredAppSlug: 'hr-core',
    sortOrder: 125,
    position: 'مستشارة شؤون الموظفين والدعم الإداري',
    summary: 'الإجابة على استفسارات الموظفين ومتابعة الحضور والإجازات والسياسات الداخلية.',
  },
  'medical-center-agent': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 390,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 200,
    position: 'موظف استقبال وحجوزات المركز الطبي',
    summary: 'استقبال استفسارات المرضى وتنظيم حجوزات الأطباء والتخصصات عبر واتساب.',
  },
  'medical-center-manager': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 490,
    channels: ['whatsapp', 'dashboard'],
    department: 'medical',
    sortOrder: 205,
    position: 'مساعد مدير المركز الطبي',
    summary: 'إدارة الفروع والأطباء والخدمات والمواعيد واستخراج تقارير المركز عبر واتساب.',
  },
  'dental-care-specialist': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 390,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 210,
    position: 'منسقة حجوزات عيادات الأسنان',
    summary: 'طمأنة المرضى وتنظيم مواعيد الكشف والجلسات لعيادات ومراكز الأسنان.',
  },
  'medical-lab-analyst': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 350,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 215,
    position: 'مستشار التحاليل الطبية والمعامل',
    summary: 'الرد على استفسارات شروط الصيام وتجهيزات التحاليل وحجز مواعيد السحب.',
  },
  'physio-coordinator': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 350,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 220,
    position: 'منسق العلاج الطبيعي والتأهيل',
    summary: 'تنظيم جلسات العلاج الطبيعي والتأهيل الرياضي ومتابعة التزام المرضى بالبرنامج.',
  },
  'aesthetic-advisor': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 390,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 225,
    position: 'استشارية التجميل والعناية بالبشرة',
    summary: 'مساعدة العملاء في اختيار جلسات البشرة والشعر المناسبة وحجز الاستشارات.',
  },
  'mental-health-counselor': {
    category: 'healthcare',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 350,
    channels: ['whatsapp'],
    department: 'medical',
    sortOrder: 230,
    position: 'منسقة جلسات الدعم النفسي',
    summary: 'تنظيم حجوزات جلسات الاستشارات النفسية بخصوصية عالية وأسلوب دافئ ومتفهم.',
  },
  'education-center-agent': {
    category: 'education',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 350,
    channels: ['whatsapp'],
    department: 'operations',
    sortOrder: 240,
    position: 'منسقة تسجيل المراكز التعليمية',
    summary: 'الرد على أولياء الأمور والطلاب وتنظيم التسجيل ومواعيد المجموعات الدراسية.',
  },
  'course-coach-agent': {
    category: 'education',
    kind: 'vertical',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'operations',
    sortOrder: 245,
    position: 'كوتش الدورات التعليمية',
    summary: 'مساعدة المتدربين على فهم محتوى الدروس وتطبيق التمارين العملية.',
  },
  'academy-grader-agent': {
    category: 'education',
    kind: 'vertical',
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'operations',
    sortOrder: 250,
    position: 'مصحح تمارين الأكاديمية',
    summary: 'تقييم تسليمات المتدربين وفق معايير القبول والرفض المحددة لكل تمرين.',
  },
  'hotel-agent': {
    category: 'hospitality',
    kind: 'vertical',
    tier: 'pro',
    priceMonthly: 450,
    channels: ['whatsapp'],
    department: 'operations',
    sortOrder: 260,
    position: 'موظف استقبال وحجوزات الفنادق',
    summary: 'فحص توفر الغرف والرد على استفسارات الضيوف وتأكيد حجوزات الإقامة.',
  },
  'customer-ceo': {
    category: 'executive',
    kind: 'internal',
    visible: false,
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'executive',
    sortOrder: 950,
    position: 'منسق توجيه محادثات العملاء (داخلي)',
    summary: 'موجه داخلي يحلل طلب العميل ويحيله للوكيل المختص تلقائياً.',
  },
  blank: {
    category: 'executive',
    kind: 'internal',
    visible: false,
    tier: 'free',
    priceMonthly: 0,
    channels: ['dashboard'],
    department: 'executive',
    sortOrder: 999,
    position: 'قالب وكيل فارغ للتخصيص',
    summary: 'قالب أساسي فارغ لإنشاء وكيل مخصص بالكامل من الصفر.',
  },
};

let cachedDiskAgents = null;
let cachedDiskAt = 0;

function readJsonSafe(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (_) {
    return null;
  }
}

function sanitizeAgentCopy(text = '') {
  return String(text)
    .replace(/\{\{\s*company_name\s*\}\}/gi, 'متجرك')
    .replace(/\*\*/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/^\s*[-•]\s*/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function readSoulExcerpt(agentDir) {
  const soulPath = path.join(agentDir, 'SOUL.md');
  if (!fs.existsSync(soulPath)) return '';
  try {
    const lines = fs
      .readFileSync(soulPath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#') && !l.startsWith('>') && !l.startsWith('---') && !l.startsWith('|'));
    return sanitizeAgentCopy(lines.slice(0, 2).join(' ')).slice(0, 220);
  } catch (_) {
    return '';
  }
}

function readPersonaCv(agentDir) {
  const personaPath = path.join(agentDir, 'PERSONA.md');
  if (!fs.existsSync(personaPath)) {
    return { bio: '', communicationStyle: [] };
  }
  try {
    const rawLines = fs
      .readFileSync(personaPath, 'utf8')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(
        (l) =>
          l &&
          !l.startsWith('#') &&
          !l.startsWith('>') &&
          !l.startsWith('---') &&
          !l.startsWith('|')
      );

    const bullets = rawLines
      .filter((l) => l.startsWith('-') || /^\d+\./.test(l))
      .map((l) => sanitizeAgentCopy(l.replace(/^\d+\.\s*/, '')))
      .filter((l) => l.length > 8 && !/^(who you are|how you speak)$/i.test(l))
      .slice(0, 4);

    const prose = rawLines
      .filter((l) => !l.startsWith('-') && !/^\d+\./.test(l))
      .map((l) => sanitizeAgentCopy(l))
      .filter(Boolean);

    return {
      bio: prose.slice(0, 2).join(' ').slice(0, 280),
      communicationStyle: bullets,
    };
  } catch (_) {
    return { bio: '', communicationStyle: [] };
  }
}

function mapToolsToCapabilities(tools = []) {
  if (!Array.isArray(tools) || tools.length === 0) return [];
  const found = [];
  const seen = new Set();
  for (const rawTool of tools) {
    const t = String(rawTool || '').toLowerCase();
    for (const rule of TOOL_CAPABILITY_MAP) {
      if (t.startsWith(rule.prefix) || t.includes(rule.prefix)) {
        if (!seen.has(rule.label)) {
          seen.add(rule.label);
          found.push(rule.label);
        }
        break;
      }
    }
  }
  return found.slice(0, 6);
}

function buildBoundaries(agentJson) {
  const guardrails = agentJson?.guardrails || {};
  const list = [];
  if (guardrails.requireExplicitConfirmation) {
    list.push('لا ينفذ أي قرار مالي أو تعديل حساس دون موافقة صريحة من مسؤول الحساب.');
  }
  if (guardrails.requireDraftOrders) {
    list.push('يجهز الطلبات كمسودات قابلة للمراجعة قبل الاعتماد النهائي.');
  }
  list.push('يلتزم بالبيانات الفعلية لمتجرك (الأسعار، المخزون، السياسات) دون اختلاق معلومات.');
  list.push('يعمل داخل حدود الصلاحيات المعرفة له فقط مع سجل عمليات قابل للمراجعة.');
  return list;
}

function inferCategoryFromRole(role = '') {
  const r = String(role).toUpperCase();
  if (/MEDIA|MARKETING|COMPETITOR/.test(r)) return 'marketing';
  if (/AOV/.test(r)) return 'growth';
  if (/SALES|SUPPORT/.test(r)) return 'sales';
  if (/ORDER|SHIPPING|INVENTORY|STOCK|PRODUCT/.test(r)) return 'operations';
  if (/MEDICAL|DENTAL|PHYSIO|AESTHETIC|MENTAL/.test(r)) return 'healthcare';
  if (/EDUCATION|COURSE|ACADEMY/.test(r)) return 'education';
  if (/HOTEL/.test(r)) return 'hospitality';
  if (/HR/.test(r)) return 'hr';
  return 'executive';
}

function loadDiskAgents(forceRefresh = false) {
  const now = Date.now();
  if (!forceRefresh && cachedDiskAgents && now - cachedDiskAt < CACHE_TTL_MS) {
    return cachedDiskAgents;
  }

  if (!fs.existsSync(AGENTS_DIR)) {
    cachedDiskAgents = [];
    cachedDiskAt = now;
    return cachedDiskAgents;
  }

  const dirs = fs.readdirSync(AGENTS_DIR, { withFileTypes: true }).filter((d) => d.isDirectory());
  const items = [];

  for (const d of dirs) {
    const slug = d.name;
    const agentDir = path.join(AGENTS_DIR, slug);
    const jsonPath = path.join(agentDir, 'agent.json');
    if (!fs.existsSync(jsonPath)) continue;
    const raw = readJsonSafe(jsonPath);
    if (!raw) continue;

    const builtin = BUILTIN_AGENT_META[slug] || {};
    const fileMarket = raw.marketplace && typeof raw.marketplace === 'object' ? raw.marketplace : {};

    const kind = VALID_KINDS.includes(fileMarket.kind)
      ? fileMarket.kind
      : builtin.kind || 'solo';

    const category = VALID_CATEGORIES.includes(fileMarket.category)
      ? fileMarket.category
      : builtin.category || inferCategoryFromRole(raw.role);

    const tier = VALID_TIERS.includes(fileMarket.tier)
      ? fileMarket.tier
      : builtin.tier || 'free';

    const priceMonthly =
      typeof fileMarket.priceMonthly === 'number'
        ? fileMarket.priceMonthly
        : typeof builtin.priceMonthly === 'number'
        ? builtin.priceMonthly
        : tier === 'pro'
        ? 390
        : 0;

    const channels = Array.isArray(fileMarket.channels) && fileMarket.channels.length
      ? fileMarket.channels
      : builtin.channels || ['dashboard'];

    const explicitDefaultVisible =
      typeof fileMarket.visible === 'boolean'
        ? fileMarket.visible
        : typeof builtin.visible === 'boolean'
        ? builtin.visible
        : null;

    const tools = Array.isArray(raw.allowedTools) ? raw.allowedTools : [];
    const capabilities = mapToolsToCapabilities(tools);
    const soulExcerpt = readSoulExcerpt(agentDir);
    const personaCv = readPersonaCv(agentDir);
    const guardrails = raw.guardrails || {};
    const governance =
      guardrails.requireExplicitConfirmation === false && guardrails.requireDraftOrders === false
        ? 'autonomous'
        : 'human_in_loop';

    const rawName = String(raw.name || slug).trim();
    const summary =
      fileMarket.summary ||
      builtin.summary ||
      raw.description ||
      soulExcerpt ||
      'مرشح متخصص جاهز للانضمام لفريق عمل متجرك.';

    const position =
      fileMarket.position ||
      builtin.position ||
      raw.description ||
      rawName;

    const resolvedCapabilities =
      capabilities.length > 0
        ? capabilities
        : ['العمل وفق قاعدة معرفة الشركة وصلاحيات الدور المحدد'];

    const cvBio =
      personaCv.bio ||
      soulExcerpt ||
      summary;

    const cv = {
      headline: position,
      bio: cvBio,
      communicationStyle:
        personaCv.communicationStyle.length > 0
          ? personaCv.communicationStyle
          : [
              governance === 'human_in_loop'
                ? 'يعرض الإجراءات والقرارات المهمة عليك للموافقة قبل التنفيذ.'
                : 'يتابع المهام اليومية وينفذ الردود مباشرة ضمن ضوابط المتجر.',
            ],
      availability: 'دوام كامل ٢٤/٧',
      workMode:
        governance === 'human_in_loop'
          ? 'يعرض المسودات لاعتمادك قبل التنفيذ'
          : 'تنفيذ مباشر ضمن حدود الدور',
      responsibilities: resolvedCapabilities,
    };

    items.push({
      id: `agent_${slug.replace(/[^a-z0-9]+/gi, '_')}`,
      slug,
      name: rawName,
      role: raw.role || 'CUSTOM',
      version: raw.version || '1.0.0',
      position,
      summary,
      category,
      kind,
      tier,
      priceMonthly,
      currency: 'ج.م',
      featured: Boolean(fileMarket.featured ?? builtin.featured ?? false),
      sortOrder: Number(fileMarket.sortOrder ?? builtin.sortOrder ?? 500),
      channels,
      channelLabels: channels.map((c) => CHANNEL_LABELS[c] || c),
      department: fileMarket.department || builtin.department || 'operations',
      requiredAppSlug: fileMarket.requiredAppSlug || builtin.requiredAppSlug || null,
      squadMembers: Array.isArray(fileMarket.squadMembers)
        ? fileMarket.squadMembers
        : Array.isArray(builtin.squadMembers)
        ? builtin.squadMembers
        : [],
      governance,
      toolsCount: tools.length,
      capabilities: resolvedCapabilities,
      boundaries: buildBoundaries(raw),
      cv,
      dialect:
        raw.personaMeta?.dialect === 'egyptian_urban' || raw.personaMeta?.dialect === 'egyptian'
          ? 'العربية المصرية المهنية'
          : raw.personaMeta?.language === 'arabic'
          ? 'العربية'
          : 'العربية والإنجليزية',
      explicitDefaultVisible,
      isDiscoveredBuiltin: Boolean(BUILTIN_AGENT_META[slug]),
    });
  }

  items.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ar'));
  cachedDiskAgents = items;
  cachedDiskAt = now;
  return items;
}

function invalidateCache() {
  cachedDiskAgents = null;
  cachedDiskAt = 0;
}

async function getOverridesStore(prisma = getSharedPrismaClient()) {
  const fallback = { defaultNewAgentVisible: true, overrides: {} };
  if (!prisma?.systemSettings?.findUnique) return fallback;
  try {
    const row = await prisma.systemSettings.findUnique({
      where: { systemName: SETTINGS_SYSTEM_NAME },
    });
    if (!row?.config) return fallback;
    const parsed = JSON.parse(row.config);
    return {
      defaultNewAgentVisible:
        typeof parsed.defaultNewAgentVisible === 'boolean' ? parsed.defaultNewAgentVisible : true,
      overrides: parsed.overrides && typeof parsed.overrides === 'object' ? parsed.overrides : {},
    };
  } catch (_) {
    return fallback;
  }
}

async function saveOverridesStore(store, prisma = getSharedPrismaClient()) {
  if (!prisma?.systemSettings?.upsert) {
    throw Object.assign(new Error('قاعدة البيانات غير متاحة لحفظ إعدادات السوق'), { statusCode: 503 });
  }
  const serialized = JSON.stringify({
    defaultNewAgentVisible: Boolean(store.defaultNewAgentVisible),
    overrides: store.overrides || {},
  });
  await prisma.systemSettings.upsert({
    where: { systemName: SETTINGS_SYSTEM_NAME },
    update: {
      config: serialized,
      lastStatusChange: new Date(),
    },
    create: {
      systemName: SETTINGS_SYSTEM_NAME,
      displayName: 'Agent Marketplace Catalog Overrides',
      description: 'Super Admin visibility, pricing, and classification overrides for /marketplace/agents',
      category: 'marketplace',
      isEnabled: true,
      config: serialized,
      lastStatusChange: new Date(),
    },
  });
  invalidateCache();
  return store;
}

function applyOverridesToAgent(agent, store, bySlugMap) {
  const ov = store.overrides?.[agent.slug] || {};
  const visible =
    typeof ov.visible === 'boolean'
      ? ov.visible
      : agent.explicitDefaultVisible !== null
      ? agent.explicitDefaultVisible
      : store.defaultNewAgentVisible;

  const tier = VALID_TIERS.includes(ov.tier) ? ov.tier : agent.tier;
  const priceMonthly =
    tier === 'free'
      ? 0
      : typeof ov.priceMonthly === 'number' && ov.priceMonthly >= 0
      ? ov.priceMonthly
      : agent.priceMonthly;

  const category = VALID_CATEGORIES.includes(ov.category) ? ov.category : agent.category;
  const kind = VALID_KINDS.includes(ov.kind) ? ov.kind : agent.kind;
  const featured = typeof ov.featured === 'boolean' ? ov.featured : agent.featured;
  const sortOrder = typeof ov.sortOrder === 'number' ? ov.sortOrder : agent.sortOrder;
  const summary = typeof ov.summary === 'string' && ov.summary.trim() ? ov.summary.trim() : agent.summary;

  const squadMemberDetails = (agent.squadMembers || [])
    .map((mSlug) => {
      const m = bySlugMap.get(mSlug);
      return m ? { slug: m.slug, name: m.name, position: m.position, role: m.role } : null;
    })
    .filter(Boolean);

  return {
    ...agent,
    visible,
    tier,
    priceMonthly,
    category,
    kind,
    featured,
    sortOrder,
    summary,
    squadMemberDetails,
    hasOverride: Object.keys(ov).length > 0,
  };
}

async function resolveCompanyCatalogEntry(slug, prisma = getSharedPrismaClient()) {
  const disk = loadDiskAgents();
  const bySlug = new Map(disk.map((a) => [a.slug, a]));
  const raw = bySlug.get(slug);
  if (!raw) return null;
  const store = await getOverridesStore(prisma);
  return applyOverridesToAgent(raw, store, bySlug);
}

async function getCatalogForCompany(companyId, { includeHidden = false } = {}, prisma = getSharedPrismaClient()) {
  const disk = loadDiskAgents();
  const bySlug = new Map(disk.map((a) => [a.slug, a]));
  const store = await getOverridesStore(prisma);

  const [agentsRes, installedAppsRes, walletRes] = await Promise.allSettled([
    companyId ? aiServiceAdminClient.listAgents(companyId) : Promise.resolve([]),
    companyId && prisma?.companyApp?.findMany
      ? prisma.companyApp.findMany({
          where: { companyId, status: 'ACTIVE' },
          select: { app: { select: { slug: true } } },
        })
      : Promise.resolve([]),
    companyId && prisma?.companyWallet?.findUnique
      ? prisma.companyWallet.findUnique({ where: { companyId }, select: { balance: true } })
      : Promise.resolve(null),
  ]);

  const activeCompanyAgents =
    agentsRes.status === 'fulfilled' && Array.isArray(agentsRes.value)
      ? agentsRes.value.filter((a) => String(a?.status || '').toUpperCase() !== 'ARCHIVED')
      : [];

  const hiredBySlug = new Map();
  for (const a of activeCompanyAgents) {
    const key = a.templateSlug || a.template_slug || a.slug;
    if (key) hiredBySlug.set(key, a);
  }

  const installedAppSlugs = new Set(
    installedAppsRes.status === 'fulfilled' && Array.isArray(installedAppsRes.value)
      ? installedAppsRes.value.map((r) => r?.app?.slug).filter(Boolean)
      : []
  );

  const walletBalance =
    walletRes.status === 'fulfilled' && walletRes.value
      ? Number(walletRes.value.balance || 0)
      : walletRes.status === 'fulfilled'
      ? 0
      : null;

  let merged = disk.map((a) => {
    const resolved = applyOverridesToAgent(a, store, bySlug);
    const hiredRecord = hiredBySlug.get(resolved.slug) || null;
    const prerequisiteMet = !resolved.requiredAppSlug || installedAppSlugs.has(resolved.requiredAppSlug);
    return {
      ...resolved,
      isHired: Boolean(hiredRecord),
      hiredAgentId: hiredRecord?.id || null,
      hiredAgentName: hiredRecord?.name || null,
      prerequisiteMet,
    };
  });

  merged.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'ar'));

  const totalDiscovered = merged.length;
  const visibleCount = merged.filter((a) => a.visible).length;
  const hiddenCount = totalDiscovered - visibleCount;

  if (!includeHidden) {
    merged = merged.filter((a) => a.visible);
  }

  const stats = {
    total: merged.length,
    totalDiscovered,
    visibleCount,
    hiddenCount,
    hiredCount: merged.filter((a) => a.isHired).length,
    freeCount: merged.filter((a) => a.tier === 'free').length,
    proCount: merged.filter((a) => a.tier === 'pro').length,
    squadCount: merged.filter((a) => a.kind === 'squad').length,
    soloCount: merged.filter((a) => a.kind === 'solo').length,
    verticalCount: merged.filter((a) => a.kind === 'vertical').length,
  };

  return {
    agents: merged,
    categories: CATALOG_CATEGORIES,
    kinds: CATALOG_KINDS,
    stats,
    walletBalance,
    defaultNewAgentVisible: store.defaultNewAgentVisible,
  };
}

async function updateAgentOverride(slug, patch = {}, prisma = getSharedPrismaClient()) {
  const disk = loadDiskAgents();
  const bySlug = new Map(disk.map((a) => [a.slug, a]));
  const raw = bySlug.get(slug);
  if (!raw) {
    throw Object.assign(new Error(`الوكيل غير موجود في النظام: ${slug}`), { statusCode: 404 });
  }

  const store = await getOverridesStore(prisma);
  const current = { ...(store.overrides[slug] || {}) };

  if (typeof patch.visible === 'boolean') current.visible = patch.visible;
  if (patch.tier && VALID_TIERS.includes(patch.tier)) current.tier = patch.tier;
  if (patch.priceMonthly !== undefined) {
    const num = Number(patch.priceMonthly);
    if (!Number.isFinite(num) || num < 0) {
      throw Object.assign(new Error('السعر الشهري يجب أن يكون رقماً صحيحاً غير سالب'), { statusCode: 400 });
    }
    current.priceMonthly = Math.round(num);
  }
  if (patch.category && VALID_CATEGORIES.includes(patch.category)) current.category = patch.category;
  if (patch.kind && VALID_KINDS.includes(patch.kind)) current.kind = patch.kind;
  if (typeof patch.featured === 'boolean') current.featured = patch.featured;
  if (patch.sortOrder !== undefined && Number.isFinite(Number(patch.sortOrder))) {
    current.sortOrder = Math.round(Number(patch.sortOrder));
  }
  if (typeof patch.summary === 'string') {
    current.summary = patch.summary.trim().slice(0, 260);
  }

  store.overrides[slug] = current;
  await saveOverridesStore(store, prisma);
  return applyOverridesToAgent(raw, store, bySlug);
}

async function updateCatalogSettings(patch = {}, prisma = getSharedPrismaClient()) {
  const store = await getOverridesStore(prisma);
  if (typeof patch.defaultNewAgentVisible === 'boolean') {
    store.defaultNewAgentVisible = patch.defaultNewAgentVisible;
  }
  await saveOverridesStore(store, prisma);
  return { defaultNewAgentVisible: store.defaultNewAgentVisible };
}

/**
 * Atomic CompanyWallet charge before spawning a Pro agent.
 * Returns { charged: boolean, amount: number, walletId?: string, refCode?: string }
 */
async function chargeCompanyWalletForAgentHire(
  { companyId, agentEntry, userId },
  prisma = getSharedPrismaClient()
) {
  if (!agentEntry || agentEntry.tier !== 'pro' || !(Number(agentEntry.priceMonthly) > 0)) {
    return { charged: false, amount: 0 };
  }

  // If Prisma wallet models aren't wired in lightweight test mocks, skip only when unavailable
  if (!prisma?.$transaction || !prisma?.companyWallet?.findUnique) {
    return { charged: false, amount: 0 };
  }

  const priceEgp = Number(agentEntry.priceMonthly);
  const refCode = `AGT-HIRE-${Date.now()}`;

  return prisma.$transaction(async (tx) => {
    const cw = await tx.companyWallet.findUnique({ where: { companyId } });
    const currentBalance = cw ? Number(cw.balance) : 0;

    if (!cw || currentBalance < priceEgp) {
      const err = new Error(
        `رصيد المحفظة غير كافٍ. المطلوب: ${priceEgp} ج.م، المتوفر: ${currentBalance} ج.م`
      );
      err.statusCode = 402;
      err.code = 'INSUFFICIENT_WALLET_BALANCE';
      err.details = {
        requiredAmount: priceEgp,
        currentBalance,
        currency: 'EGP',
      };
      throw err;
    }

    const debited = await tx.companyWallet.updateMany({
      where: { id: cw.id, balance: { gte: priceEgp } },
      data: {
        balance: { decrement: priceEgp },
        totalSpent: { increment: priceEgp },
      },
    });

    if (!debited || debited.count === 0) {
      const err = new Error('رصيد محفظة الشركة غير كافٍ');
      err.statusCode = 402;
      err.code = 'INSUFFICIENT_WALLET_BALANCE';
      err.details = {
        requiredAmount: priceEgp,
        currentBalance,
        currency: 'EGP',
      };
      throw err;
    }

    const updatedCw = await tx.companyWallet.findUnique({ where: { id: cw.id } });

    if (tx.transaction?.create) {
      await tx.transaction.create({
        data: {
          walletId: cw.id,
          type: 'WITHDRAW',
          amount: priceEgp,
          status: 'COMPLETED',
          description: `توظيف الوكيل الذكي: ${agentEntry.name} (${agentEntry.slug})`,
          referenceId: refCode,
        },
      });
    }

    if (tx.companyWalletTransaction?.create) {
      await tx.companyWalletTransaction.create({
        data: {
          companyId,
          walletId: cw.id,
          type: 'WITHDRAW',
          reason: 'AGENT_MARKETPLACE_HIRE',
          code: refCode,
          amount: priceEgp,
          balanceAfter: updatedCw ? updatedCw.balance : currentBalance - priceEgp,
          notes: `توظيف ${agentEntry.name} (${agentEntry.slug})`,
          createdBy: userId || undefined,
        },
      });
    }

    return {
      charged: true,
      amount: priceEgp,
      walletId: cw.id,
      refCode,
      balanceAfter: updatedCw ? Number(updatedCw.balance) : currentBalance - priceEgp,
    };
  });
}

async function refundCompanyWalletForFailedHire(
  { companyId, walletId, amount, agentName, refCode },
  prisma = getSharedPrismaClient()
) {
  if (!walletId || !(Number(amount) > 0) || !prisma?.$transaction || !prisma?.companyWallet) {
    return;
  }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.companyWallet.update({
        where: { id: walletId },
        data: {
          balance: { increment: amount },
          totalSpent: { decrement: amount },
        },
      });
      if (tx.transaction?.create) {
        await tx.transaction.create({
          data: {
            walletId,
            type: 'REFUND',
            amount,
            status: 'COMPLETED',
            description: `استرداد تلقائي لتعذر تفعيل الوكيل: ${agentName}`,
            referenceId: `${refCode}-REFUND`,
          },
        });
      }
    });
  } catch (err) {
    console.error('[AGENT-MARKETPLACE] Refund failed:', err.message);
  }
}

async function getSubscriptionsStore(prisma = getSharedPrismaClient()) {
  const fallback = [];
  if (!prisma?.systemSettings?.findUnique) return fallback;
  try {
    const row = await prisma.systemSettings.findUnique({
      where: { systemName: SUBSCRIPTIONS_SYSTEM_NAME },
    });
    if (!row?.config) return fallback;
    const parsed = JSON.parse(row.config);
    return Array.isArray(parsed?.subscriptions) ? parsed.subscriptions : fallback;
  } catch (_) {
    return fallback;
  }
}

async function saveSubscriptionsStore(subscriptions, prisma = getSharedPrismaClient()) {
  if (!prisma?.systemSettings?.upsert) return subscriptions;
  const serialized = JSON.stringify({ subscriptions });
  await prisma.systemSettings.upsert({
    where: { systemName: SUBSCRIPTIONS_SYSTEM_NAME },
    update: { config: serialized, lastStatusChange: new Date() },
    create: {
      systemName: SUBSCRIPTIONS_SYSTEM_NAME,
      displayName: 'Agent Marketplace Pro Subscriptions',
      description: 'Active recurring monthly subscriptions for Pro agents hired from /marketplace/agents',
      category: 'marketplace',
      isEnabled: true,
      config: serialized,
      lastStatusChange: new Date(),
    },
  });
  return subscriptions;
}

function addOneMonthIso(fromDate = new Date()) {
  const d = new Date(fromDate);
  d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

async function recordAgentSubscription(
  { companyId, agentId, templateSlug, agentName, monthlyPrice, currency = 'EGP' },
  prisma = getSharedPrismaClient()
) {
  if (!companyId || !agentId || !(Number(monthlyPrice) > 0)) return null;
  if (!prisma?.systemSettings?.upsert) return null;

  const list = await getSubscriptionsStore(prisma);
  const nowIso = new Date().toISOString();
  const nextIso = addOneMonthIso(nowIso);
  const idx = list.findIndex((s) => s.companyId === companyId && s.agentId === agentId);

  const entry = {
    id: idx >= 0 ? list[idx].id : `agsub_${companyId}_${agentId}`,
    companyId,
    agentId,
    templateSlug: templateSlug || null,
    agentName: agentName || templateSlug || 'Pro Agent',
    monthlyPrice: Number(monthlyPrice),
    currency,
    status: 'ACTIVE',
    failedAttempts: 0,
    startedAt: idx >= 0 ? list[idx].startedAt : nowIso,
    lastBillingAt: nowIso,
    nextBillingAt: nextIso,
  };

  if (idx >= 0) {
    list[idx] = entry;
  } else {
    list.push(entry);
  }
  await saveSubscriptionsStore(list, prisma);
  return entry;
}

async function cancelAgentSubscription({ companyId, agentId }, prisma = getSharedPrismaClient()) {
  if (!companyId || !agentId || !prisma?.systemSettings?.findUnique) return false;
  const list = await getSubscriptionsStore(prisma);
  const idx = list.findIndex((s) => s.companyId === companyId && s.agentId === agentId && s.status !== 'CANCELLED');
  if (idx < 0) return false;
  list[idx] = {
    ...list[idx],
    status: 'CANCELLED',
    cancelledAt: new Date().toISOString(),
  };
  await saveSubscriptionsStore(list, prisma);
  return true;
}

async function listCompanyAgentSubscriptions(companyId, prisma = getSharedPrismaClient()) {
  if (!companyId) return [];
  const list = await getSubscriptionsStore(prisma);
  return list.filter((s) => s.companyId === companyId && s.status !== 'CANCELLED');
}

/**
 * Shared governed hire pipeline used by both POST /agent-manager/hire and POST /agent/agents.
 * Prevents bypassing visibility or Pro wallet billing through alternate routes.
 */
async function executeGovernedAgentHire(
  { companyId, userId, isSuperAdmin = false, templateSlug, spawnFn, onSquadMemberSpawn },
  prisma = getSharedPrismaClient()
) {
  let walletCharge = null;
  let catalogEntry = null;

  try {
    if (templateSlug) {
      catalogEntry = await resolveCompanyCatalogEntry(templateSlug, prisma);
      if (catalogEntry && !catalogEntry.visible && !isSuperAdmin) {
        const err = new Error('هذا الوكيل غير متاح حالياً للتوظيف في السوق');
        err.statusCode = 403;
        err.code = 'AGENT_NOT_AVAILABLE';
        throw err;
      }
      if (catalogEntry) {
        walletCharge = await chargeCompanyWalletForAgentHire(
          { companyId, agentEntry: catalogEntry, userId },
          prisma
        );
      }
    }

    const result = await spawnFn();
    if (!result || result.success === false) {
      if (walletCharge?.charged) {
        await refundCompanyWalletForFailedHire(
          {
            companyId,
            walletId: walletCharge.walletId,
            amount: walletCharge.amount,
            agentName: catalogEntry?.name || templateSlug || 'agent',
            refCode: walletCharge.refCode,
          },
          prisma
        );
      }
      const err = new Error(result?.error || 'فشل تعيين الوكيل');
      err.statusCode = 400;
      throw err;
    }

    const spawnedAgentId = result.id || result.data?.id || result.agent?.id || null;
    let subscription = null;
    if (walletCharge?.charged && spawnedAgentId) {
      try {
        subscription = await recordAgentSubscription(
          {
            companyId,
            agentId: spawnedAgentId,
            templateSlug: catalogEntry?.slug || templateSlug,
            agentName: result.name || catalogEntry?.name || templateSlug,
            monthlyPrice: walletCharge.amount,
          },
          prisma
        );
      } catch (subErr) {
        console.warn('[AGENT-MARKETPLACE] Subscription record failed:', subErr.message);
      }
    }

    const squadSpawned = [];
    if (
      typeof onSquadMemberSpawn === 'function' &&
      catalogEntry?.kind === 'squad' &&
      Array.isArray(catalogEntry.squadMembers) &&
      catalogEntry.squadMembers.length > 1
    ) {
      const otherSlugs = catalogEntry.squadMembers.filter((s) => s !== templateSlug);
      for (const memberSlug of otherSlugs) {
        try {
          const memberRes = await onSquadMemberSpawn(memberSlug, catalogEntry);
          if (memberRes?.id) squadSpawned.push(memberRes.id);
        } catch (_) {
          // Non-fatal if member already exists
        }
      }
    }

    return {
      ...result,
      ...(walletCharge?.charged
        ? { chargedAmount: walletCharge.amount, walletBalanceAfter: walletCharge.balanceAfter }
        : {}),
      ...(subscription ? { subscription } : {}),
      ...(squadSpawned.length > 0 ? { squadSpawned } : {}),
    };
  } catch (error) {
    if (walletCharge?.charged) {
      await refundCompanyWalletForFailedHire(
        {
          companyId,
          walletId: walletCharge.walletId,
          amount: walletCharge.amount,
          agentName: catalogEntry?.name || templateSlug || 'agent',
          refCode: walletCharge.refCode,
        },
        prisma
      );
    }
    throw error;
  }
}

/**
 * Daily billing cron handler: renews due Pro agent subscriptions from CompanyWallet
 * and pauses agents via ai-service when wallet balance is insufficient.
 */
async function processDueAgentSubscriptions(
  prisma = getSharedPrismaClient(),
  adminClient = aiServiceAdminClient
) {
  if (!prisma?.systemSettings?.findUnique || !prisma?.$transaction || !prisma?.companyWallet) {
    return { processed: 0, renewed: 0, suspended: 0 };
  }

  const list = await getSubscriptionsStore(prisma);
  if (list.length === 0) return { processed: 0, renewed: 0, suspended: 0 };

  const tomorrow = new Date();
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);

  let processed = 0;
  let renewed = 0;
  let suspended = 0;
  let dirty = false;
  const toPause = [];

  for (let i = 0; i < list.length; i++) {
    const sub = list[i];
    if (sub.status !== 'ACTIVE' || !(Number(sub.monthlyPrice) > 0)) continue;
    const dueAt = new Date(sub.nextBillingAt);
    if (Number.isNaN(dueAt.getTime()) || dueAt > tomorrow) continue;

    processed++;
    const fee = Number(sub.monthlyPrice);
    const refCode = `AGT-REN-${Date.now()}-${i}`;

    try {
      const outcome = await prisma.$transaction(async (tx) => {
        const wallet = await tx.companyWallet.findUnique({ where: { companyId: sub.companyId } });
        const currentBalance = wallet ? Number(wallet.balance) : 0;

        if (!wallet || currentBalance < fee) {
          if (tx.billingHistory?.create) {
            await tx.billingHistory.create({
              data: {
                companyId: sub.companyId,
                type: 'AGENT_SUBSCRIPTION',
                amount: fee,
                description: `فشل تجديد اشتراك الوكيل ${sub.agentName} - رصيد غير كافٍ`,
                status: 'FAILED',
                referenceId: sub.id,
              },
            });
          }
          return { ok: false };
        }

        const debited = await tx.companyWallet.updateMany({
          where: { id: wallet.id, balance: { gte: fee } },
          data: {
            balance: { decrement: fee },
            totalSpent: { increment: fee },
          },
        });
        if (!debited || debited.count === 0) {
          return { ok: false };
        }

        const updatedCw = await tx.companyWallet.findUnique({ where: { id: wallet.id } });
        if (tx.transaction?.create) {
          await tx.transaction.create({
            data: {
              walletId: wallet.id,
              type: 'DEDUCT',
              amount: fee,
              status: 'COMPLETED',
              description: `تجديد اشتراك الوكيل الذكي: ${sub.agentName}`,
              referenceId: refCode,
            },
          });
        }
        if (tx.companyWalletTransaction?.create) {
          await tx.companyWalletTransaction.create({
            data: {
              companyId: sub.companyId,
              walletId: wallet.id,
              type: 'WITHDRAW',
              reason: 'AGENT_SUBSCRIPTION_RENEWAL',
              code: refCode,
              amount: fee,
              balanceAfter: updatedCw ? updatedCw.balance : currentBalance - fee,
              notes: `تجديد شهري للوكيل ${sub.agentName}`,
            },
          });
        }
        if (tx.billingHistory?.create) {
          await tx.billingHistory.create({
            data: {
              companyId: sub.companyId,
              type: 'AGENT_SUBSCRIPTION',
              amount: fee,
              description: `تجديد اشتراك الوكيل الذكي: ${sub.agentName}`,
              status: 'SUCCESS',
              referenceId: sub.id,
            },
          });
        }
        return { ok: true };
      });

      if (outcome.ok) {
        const nowIso = new Date().toISOString();
        list[i] = {
          ...sub,
          lastBillingAt: nowIso,
          nextBillingAt: addOneMonthIso(sub.nextBillingAt),
          failedAttempts: 0,
        };
        renewed++;
        dirty = true;
      } else {
        list[i] = {
          ...sub,
          status: 'SUSPENDED',
          failedAttempts: Number(sub.failedAttempts || 0) + 1,
          suspendedAt: new Date().toISOString(),
        };
        suspended++;
        dirty = true;
        toPause.push(sub.agentId);
      }
    } catch (err) {
      console.error(`[AGENT-BILLING] Error renewing subscription ${sub.id}:`, err.message);
    }
  }

  if (dirty) {
    await saveSubscriptionsStore(list, prisma);
  }

  for (const agentId of toPause) {
    try {
      await adminClient.updateAgentStatus(agentId, 'INACTIVE');
    } catch (_) {
      // Non-fatal if ai-service is temporarily unreachable
    }
  }

  return { processed, renewed, suspended };
}

module.exports = {
  CATALOG_CATEGORIES,
  CATALOG_KINDS,
  VALID_KINDS,
  VALID_CATEGORIES,
  VALID_TIERS,
  loadDiskAgents,
  invalidateCache,
  getCatalogForCompany,
  resolveCompanyCatalogEntry,
  updateAgentOverride,
  updateCatalogSettings,
  chargeCompanyWalletForAgentHire,
  refundCompanyWalletForFailedHire,
  recordAgentSubscription,
  cancelAgentSubscription,
  listCompanyAgentSubscriptions,
  executeGovernedAgentHire,
  processDueAgentSubscriptions,
};
