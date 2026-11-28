const crypto = require('crypto');
const TurboService = require('./turboService');
const BostaService = require('./bostaService');
const QpExpressService = require('./qpExpressService');
const { calculateCollectableCodAmount } = require('../utils/shippingFinancialUtils');

const PROVIDER_KEYS = Object.freeze({
  MANUAL: 'MANUAL',
  TURBO: 'TURBO',
  BOSTA: 'BOSTA',
  QP_EXPRESS: 'QP_EXPRESS',
  HASHTAG: 'HASHTAG',
  LG_EXPRESS: 'LG_EXPRESS',
  BOSTA_DEMO: 'BOSTA_DEMO',
  MYLERZ_DEMO: 'MYLERZ_DEMO',
  ARAMEX_DEMO: 'ARAMEX_DEMO',
  MAXP_NETWORK: 'MAXP_NETWORK',
});

const INTEGRATION_MODES = new Set(['MANUAL', 'DEMO', 'LIVE', 'INTERNAL']);

const SHIPMENT_CREATE_TRIGGERS = Object.freeze({
  ON_ORDER: 'ON_ORDER',
  ON_CONFIRM: 'ON_CONFIRM',
  ON_READY: 'ON_READY',
  NONE: 'NONE',
});

const DEMO_CARRIER_DEFINITIONS = Object.freeze([
  {
    providerKey: PROVIDER_KEYS.BOSTA_DEMO,
    integrationMode: 'DEMO',
    name: 'Bosta Demo',
    slug: 'bosta-demo',
    phone: '+201000000710',
    website: 'https://bosta.co',
    apiUrl: 'https://demo.maxp.local/providers/bosta',
    serviceLevel: 'Next-day demo',
  },
  {
    providerKey: PROVIDER_KEYS.QP_EXPRESS,
    integrationMode: 'DEMO',
    name: 'QP Express Demo',
    slug: 'qp-express-demo',
    phone: '19252',
    website: 'https://qpxpress.com',
    apiUrl: 'https://demo.maxp.local/providers/qpexpress',
    serviceLevel: 'Express demo',
  },
  {
    providerKey: PROVIDER_KEYS.MYLERZ_DEMO,
    integrationMode: 'DEMO',
    name: 'Mylerz Demo',
    slug: 'mylerz-demo',
    phone: '+201000000711',
    website: 'https://mylerz.com',
    apiUrl: 'https://demo.maxp.local/providers/mylerz',
    serviceLevel: 'Economy demo',
  },
  {
    providerKey: PROVIDER_KEYS.ARAMEX_DEMO,
    integrationMode: 'DEMO',
    name: 'Aramex Demo',
    slug: 'aramex-demo',
    phone: '+201000000712',
    website: 'https://www.aramex.com',
    apiUrl: 'https://demo.maxp.local/providers/aramex',
    serviceLevel: 'International demo',
  },
]);

const DEMO_PREFIXES = Object.freeze({
  [PROVIDER_KEYS.BOSTA_DEMO]: 'BOSTA',
  [PROVIDER_KEYS.MYLERZ_DEMO]: 'MYLERZ',
  [PROVIDER_KEYS.ARAMEX_DEMO]: 'ARAMEX',
});

const safeJsonParse = (value, fallback = {}) => {
  if (!value) return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const safeJsonStringify = (value) => JSON.stringify(value || {});

const normalizeProviderKey = (value, carrier = {}) => {
  const explicit = String(value || '').trim().toUpperCase();
  if (Object.values(PROVIDER_KEYS).includes(explicit)) {
    return explicit;
  }

  const text = `${carrier.slug || ''} ${carrier.name || ''}`.toLowerCase();
  if (explicit === 'MAXP_NETWORK' || text.includes('maxp_network') || text.includes('شبكة') || text.includes('شحن على maxp')) {
    return PROVIDER_KEYS.MAXP_NETWORK;
  }
  if (text.includes('turbo') || text.includes('تربو')) return PROVIDER_KEYS.TURBO;
  if (text.includes('bosta') || text.includes('بوستا')) {
    const mode = String(carrier.integrationMode || '').toUpperCase();
    return mode === 'LIVE' ? PROVIDER_KEYS.BOSTA : PROVIDER_KEYS.BOSTA_DEMO;
  }
  if (text.includes('qp') || text.includes('كيو بي') || text.includes('qpxpress') || text.includes('كيو_بي')) {
    return PROVIDER_KEYS.QP_EXPRESS;
  }
  if (text.includes('hashtag') || text.includes('هاشتاج')) {
    return PROVIDER_KEYS.HASHTAG;
  }
  if (text.includes('lg') || text.includes('accurate') || text.includes('لوجستك') || text.includes('اكيوريت')) {
    return PROVIDER_KEYS.LG_EXPRESS;
  }
  if (text.includes('mylerz') || text.includes('مايلرز')) return PROVIDER_KEYS.MYLERZ_DEMO;
  if (text.includes('aramex') || text.includes('ارامكس') || text.includes('أرامكس')) {
    return PROVIDER_KEYS.ARAMEX_DEMO;
  }

  return PROVIDER_KEYS.MANUAL;
};

const normalizeIntegrationMode = (value, providerKey) => {
  const normalized = String(value || '').trim().toUpperCase();
  if (INTEGRATION_MODES.has(normalized)) {
    return normalized;
  }

  if (providerKey === PROVIDER_KEYS.MAXP_NETWORK) return 'INTERNAL';
  if (providerKey && providerKey.endsWith('_DEMO')) return 'DEMO';
  return providerKey === PROVIDER_KEYS.TURBO ? 'LIVE' : 'MANUAL';
};

const normalizeSettings = (settings, providerKey, integrationMode) => {
  const parsed = safeJsonParse(settings, {});
  const defaultAutoCreate = integrationMode === 'DEMO';
  const autoCreateShipments =
    parsed.autoCreateShipments !== undefined
      ? Boolean(parsed.autoCreateShipments)
      : defaultAutoCreate;

  let shipmentCreateTrigger = parsed.shipmentCreateTrigger;
  const validTriggers = [
    SHIPMENT_CREATE_TRIGGERS.ON_ORDER,
    SHIPMENT_CREATE_TRIGGERS.ON_CONFIRM,
    SHIPMENT_CREATE_TRIGGERS.ON_READY,
  ];

  if (!shipmentCreateTrigger || !validTriggers.includes(shipmentCreateTrigger)) {
    shipmentCreateTrigger = autoCreateShipments
      ? SHIPMENT_CREATE_TRIGGERS.ON_ORDER
      : SHIPMENT_CREATE_TRIGGERS.NONE;
  }

  return {
    ...parsed,
    autoCreateShipments,
    shipmentCreateTrigger,
    providerKey,
    integrationMode,
  };
};

const shouldCreateShipmentNow = (settings, stage) => {
  if (!stage) return false;
  const rawSettings =
    settings && typeof settings === 'object' && settings.settings !== undefined
      ? settings.settings
      : settings;

  const normalized = normalizeSettings(
    rawSettings,
    settings?.providerKey || rawSettings?.providerKey,
    settings?.integrationMode || rawSettings?.integrationMode,
  );

  if (!normalized.autoCreateShipments) {
    return false;
  }

  const trigger = normalized.shipmentCreateTrigger;
  if (!trigger || trigger === SHIPMENT_CREATE_TRIGGERS.NONE) {
    return false;
  }

  const normalizedStage = String(stage).trim().toUpperCase();

  if (trigger === SHIPMENT_CREATE_TRIGGERS.ON_ORDER) {
    return ['ON_ORDER', 'ORDER_CREATED', 'CREATED', 'NEW'].includes(normalizedStage);
  }
  if (trigger === SHIPMENT_CREATE_TRIGGERS.ON_CONFIRM) {
    return ['ON_CONFIRM', 'CONFIRMED', 'ORDER_CONFIRMED'].includes(normalizedStage);
  }
  if (trigger === SHIPMENT_CREATE_TRIGGERS.ON_READY) {
    return [
      'ON_READY',
      'READY',
      'READY_TO_SHIP',
      'READY_FOR_SHIPPING',
      'READY_FOR_PICKUP',
      'PACKAGED',
      'PACKED',
    ].includes(normalizedStage);
  }

  return trigger === normalizedStage;
};

const mergeMetadata = (metadata, patch) => ({
  ...safeJsonParse(metadata, {}),
  ...patch,
});

const shortHash = (value) =>
  crypto.createHash('sha1').update(String(value || Date.now())).digest('hex').slice(0, 8).toUpperCase();

const buildDemoShipmentResult = ({ shipment, providerKey, serviceLevel }) => {
  const prefix = DEMO_PREFIXES[providerKey] || 'DEMO';
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = shortHash(`${shipment.id}:${shipment.merchantOrderId}:${providerKey}`);
  const trackingNumber = `${prefix}-${datePart}-${suffix}`;

  return {
    success: true,
    demo: true,
    providerKey,
    status: 'CREATED',
    externalShipmentId: `${prefix}-SHIP-${suffix}`,
    trackingNumber,
    labelUrl: `https://demo.maxp.local/labels/${prefix.toLowerCase()}/${trackingNumber}.pdf`,
    serviceLevel: serviceLevel || 'Demo shipment',
    cost: null,
    data: {
      carrier: providerKey,
      trackingNumber,
      destinationCity: shipment.destinationCity || null,
      createdAt: new Date().toISOString(),
    },
  };
};

const buildTurboOrderPayload = (shipment) => {
  const order = shipment.order || {};
  const customer = order.customer || null;
  const items = Array.isArray(order.orderItems) ? order.orderItems : [];
  const turboService = new TurboService(null, shipment.companyId);
  return turboService.formatOrderForTurbo(order, customer, items);
};

const createTurboShipment = async (shipment, options = {}) => {
  const settings = normalizeSettings(
    shipment.shippingCompany?.settings,
    PROVIDER_KEYS.TURBO,
    shipment.shippingCompany?.integrationMode || 'LIVE',
  );
  const company = shipment.company || {};

  if (!settings.autoCreateShipments && !options.force && !options.allowLiveCreate) {
    return {
      success: false,
      skipped: true,
      reason: 'LIVE_PROVIDER_AUTO_CREATE_DISABLED',
    };
  }

  const turboApiKey = settings.apiKey || shipment.shippingCompany?.apiKey || company.turboApiKey;
  if (!turboApiKey) {
    return {
      success: false,
      skipped: true,
      reason: 'TURBO_NOT_CONFIGURED',
    };
  }

  const turboService = new TurboService(turboApiKey || null, shipment.companyId);
  const orderData = buildTurboOrderPayload(shipment);
  if (shipment.order) {
    try {
      const { resolveAndApplyTurboLocation } = require('./turbo/turboAiAreaResolver');
      await resolveAndApplyTurboLocation({
        prisma: getSharedPrismaClient(),
        turboService,
        companyId: shipment.companyId,
        order: shipment.order,
        orderData,
      });
    } catch (aiErr) {
      console.warn('⚠️ [SHIPPING-PROVIDER] Turbo AI area resolution skipped:', aiErr?.message);
    }
  }
  const { validateOrderForTurbo } = require('../utils/turbo/shipmentValidator');
  const validation = validateOrderForTurbo(shipment.order || {}, orderData);
  if (!validation.isValid) {
    return {
      success: false,
      skipped: true,
      reason: `VALIDATION_FAILED: ${validation.missingFields.join('، ')}`,
      missingFields: validation.missingFields,
    };
  }
  return turboService.createShipment(orderData);
};

const loadShipment = (prisma, shipmentOrId) => {
  if (shipmentOrId && typeof shipmentOrId === 'object' && shipmentOrId.shippingCompany) {
    return shipmentOrId;
  }

  const id = typeof shipmentOrId === 'object' ? shipmentOrId?.id : shipmentOrId;
  return prisma.shipment.findUnique({
    where: { id },
    include: {
      company: true,
      shippingCompany: true,
      merchant: true,
      merchantOrder: true,
      order: {
        include: {
          customer: true,
          orderItems: {
            include: {
              product: true,
            },
          },
        },
      },
      warehouse: true,
    },
  });
};

const updateShipmentFromProviderResult = async (prisma, shipment, provider, result) => {
  const providerStatus = result.skipped ? 'SKIPPED' : result.status || 'CREATED';
  const metadata = mergeMetadata(shipment.metadata, {
    providerKey: provider.providerKey,
    integrationMode: provider.integrationMode,
    providerStatus,
    providerServiceLevel: result.serviceLevel || provider.serviceLevel || null,
    providerDemo: Boolean(result.demo),
    providerUpdatedAt: new Date().toISOString(),
    providerResponse: result.data || null,
    providerSkipReason: result.reason || null,
  });

  if (result.skipped) {
    return prisma.shipment.update({
      where: { id: shipment.id },
      data: {
        carrierType: provider.providerKey,
        serviceLevel: result.serviceLevel || shipment.serviceLevel || provider.serviceLevel || null,
        metadata: safeJsonStringify(metadata),
      },
    });
  }

  const updatedShipment = await prisma.shipment.update({
    where: { id: shipment.id },
    data: {
      carrierType: provider.providerKey,
      status: result.status || 'CREATED',
      trackingNumber: result.trackingNumber || shipment.trackingNumber || null,
      externalShipmentId: result.externalShipmentId || result.shipmentId || shipment.externalShipmentId || null,
      labelUrl: result.labelUrl || shipment.labelUrl || null,
      serviceLevel: result.serviceLevel || shipment.serviceLevel || provider.serviceLevel || null,
      cost: result.cost !== undefined && result.cost !== null ? result.cost : (shipment.cost || Number(shipment.order?.shipping || 0)),
      metadata: safeJsonStringify(metadata),
    },
  });

  if (shipment.orderId && (result.trackingNumber || shipment.trackingNumber)) {
    try {
      const finalTrackingNumber = result.trackingNumber || shipment.trackingNumber;

      let existingOrderMeta = {};
      try {
        existingOrderMeta = typeof shipment.order?.metadata === 'string'
          ? JSON.parse(shipment.order.metadata)
          : (shipment.order?.metadata || {});
      } catch (e) {}

      existingOrderMeta.trackingNumber = String(finalTrackingNumber);
      existingOrderMeta.shippingCarrier = provider.providerKey;

      await prisma.order.update({
        where: { id: shipment.orderId },
        data: {
          status: 'SHIPPED',
          customStatusCode: null,
          metadata: JSON.stringify(existingOrderMeta),
          ...(provider.providerKey === 'TURBO'
            ? {
                turboTrackingNumber: String(finalTrackingNumber),
                turboShipmentId: result.externalShipmentId || result.shipmentId || shipment.externalShipmentId || null,
                turboShipmentStatus: 'turbo_sent',
              }
            : {}),
          statusHistory: {
            create: {
              status: 'SHIPPED',
              oldStatus: shipment.order?.status || 'PENDING',
              reason: `تم إنشاء الشحنة وتوجيهها لشركة ${provider.providerKey} بنجاح (رقم التتبع: ${finalTrackingNumber})`,
              changedBy: 'SYSTEM',
            },
          },
        },
      });
    } catch (orderSyncErr) {
      console.warn('⚠️ [SHIPPING_PROVIDER] Could not sync order status:', orderSyncErr.message);
    }
  }

  return updatedShipment;
};

const createProviderShipment = async (prisma, shipmentOrId, options = {}) => {
  const shipment = await loadShipment(prisma, shipmentOrId);
  if (!shipment) {
    return { success: false, skipped: true, reason: 'SHIPMENT_NOT_FOUND' };
  }

  const shippingCompany = shipment.shippingCompany;
  if (!shippingCompany) {
    return { success: false, skipped: true, reason: 'NO_SHIPPING_COMPANY' };
  }

  const providerKey = normalizeProviderKey(shippingCompany.providerKey, shippingCompany);
  const integrationMode = normalizeIntegrationMode(shippingCompany.integrationMode, providerKey);
  const settings = normalizeSettings(shippingCompany.settings, providerKey, integrationMode);
  const provider = {
    ...shippingCompany,
    providerKey,
    integrationMode,
    settings,
  };

  if (shipment.externalShipmentId && shipment.trackingNumber && !options.force) {
    return updateShipmentFromProviderResult(prisma, shipment, provider, {
      success: false,
      skipped: true,
      reason: 'SHIPMENT_ALREADY_HAS_PROVIDER_REFERENCE',
      serviceLevel: shipment.serviceLevel,
    });
  }

  if (!settings.autoCreateShipments && !options.force) {
    return updateShipmentFromProviderResult(prisma, shipment, provider, {
      success: false,
      skipped: true,
      reason: 'AUTO_CREATE_DISABLED',
      serviceLevel: provider.serviceLevel,
    });
  }

  if (providerKey === PROVIDER_KEYS.MAXP_NETWORK) {
    const maxpNetworkAdapter = require('./shipping/adapters/maxpNetworkAdapter');
    const result = await maxpNetworkAdapter.createShipment({
      orderId: shipment.orderId,
      shippingCompanyId: shippingCompany.id,
      storeCompanyId: shipment.companyId,
      shipmentId: shipment.id,
      weight: shipment.weight,
      pieces: shipment.pieces,
      codAmount: shipment.codAmount,
    });

    if (!result.success) {
      return {
        success: false,
        error: result.error,
        reason: result.reason || 'MAXP_NETWORK_ERROR',
        statusCode: result.statusCode || 400,
      };
    }

    return updateShipmentFromProviderResult(prisma, shipment, provider, {
      success: true,
      status: 'PENDING',
      externalShipmentId: result.externalShipmentId,
      trackingNumber: result.trackingNumber,
      labelUrl: result.labelUrl,
      serviceLevel: result.serviceLevel || 'MaxP Network Standard',
      cost: null,
      data: result,
    });
  }

  if (integrationMode === 'DEMO' || providerKey.endsWith('_DEMO')) {
    return updateShipmentFromProviderResult(
      prisma,
      shipment,
      provider,
      buildDemoShipmentResult({
        shipment,
        providerKey,
        serviceLevel: settings.serviceLevel || provider.serviceLevel,
      }),
    );
  }

  if (providerKey === PROVIDER_KEYS.TURBO && integrationMode === 'LIVE') {
    if (!options.allowLiveCreate) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: 'LIVE_CREATE_REQUIRES_EXPLICIT_CONFIRMATION',
        serviceLevel: provider.serviceLevel,
      });
    }

    const result = await createTurboShipment(shipment, options);
    return updateShipmentFromProviderResult(prisma, shipment, provider, result);
  }

  if (providerKey === PROVIDER_KEYS.BOSTA && integrationMode === 'LIVE') {
    if (!options.allowLiveCreate) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: 'LIVE_CREATE_REQUIRES_EXPLICIT_CONFIRMATION',
        serviceLevel: provider.serviceLevel,
      });
    }

    const bostaApiKey = settings.apiKey || shipment.shippingCompany?.apiKey;
    const bostaService = new BostaService(bostaApiKey || null, shipment.companyId);
    const payload = bostaService.formatOrderForBosta(shipment.order || {}, shipment.order?.customer || {});
    try {
      const result = await bostaService.createDelivery(payload);
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: true,
        status: 'CREATED',
        externalShipmentId: result._id,
        trackingNumber: result.trackingNumber,
        labelUrl: null,
        serviceLevel: provider.serviceLevel,
        cost: null,
        data: result,
      });
    } catch (error) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: `BOSTA_API_ERROR: ${error.message}`,
        serviceLevel: provider.serviceLevel,
      });
    }
  }

  if (providerKey === PROVIDER_KEYS.QP_EXPRESS && integrationMode === 'LIVE') {
    if (!options.allowLiveCreate) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: 'LIVE_CREATE_REQUIRES_EXPLICIT_CONFIRMATION',
        serviceLevel: provider.serviceLevel,
      });
    }

    const qpService = new QpExpressService({
      username: settings.username || shipment.shippingCompany?.apiKey,
      password: settings.password,
      customerId: settings.customerId ? Number(settings.customerId) : null,
    }, shipment.companyId);

    const codAmount = calculateCollectableCodAmount(shipment.order);
    const customerName =
      shipment.order?.customerName ||
      shipment.order?.customer?.name ||
      (shipment.order?.customer
        ? `${shipment.order.customer.firstName || ''} ${shipment.order.customer.lastName || ''}`.trim()
        : null) ||
      'عميل';

    const orderData = {
      orderId: shipment.order?.id,
      orderNumber: shipment.order?.orderNumber || String(shipment.order?.id),
      customerName,
      customerPhone: shipment.order?.customerPhone || shipment.order?.customer?.phone,
      shippingAddress:
        shipment.order?.shippingAddress ||
        shipment.destinationAddress ||
        shipment.order?.customerAddress,
      customerAddress:
        shipment.order?.customerAddress ||
        shipment.destinationAddress ||
        '',
      city:
        shipment.destinationGovernorate ||
        shipment.destinationCity ||
        shipment.order?.governorate ||
        shipment.order?.city,
      items: shipment.order?.orderItems || [],
      totalAmount: codAmount,
      price: codAmount,
      notes: shipment.order?.notes || '',
      metadata: shipment.order?.metadata || null,
    };

    try {
      const result = await qpService.createShipment(orderData);
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: true,
        status: 'CREATED',
        externalShipmentId: String(result.serial),
        trackingNumber: result.trackingNumber,
        labelUrl: null,
        serviceLevel: provider.serviceLevel,
        cost: Number(result.totalFees || 0),
        data: result,
      });
    } catch (error) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: `QP_EXPRESS_API_ERROR: ${error.message}`,
        serviceLevel: provider.serviceLevel,
      });
    }
  }

  if (providerKey === PROVIDER_KEYS.HASHTAG && integrationMode === 'LIVE') {
    if (!options.allowLiveCreate) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: 'LIVE_CREATE_REQUIRES_EXPLICIT_CONFIRMATION',
        serviceLevel: provider.serviceLevel,
      });
    }

    const HashtagService = require('./hashtagService');
    const { decryptHashtagSettings } = require('./hashtag/hashtagCredentials');
    const hashtagSettings = decryptHashtagSettings(settings);
    const hashtagService = new HashtagService({
      apiName: hashtagSettings.apiName || hashtagSettings.apiKey || hashtagSettings.username || shippingCompany.apiKey,
      apiPassword: hashtagSettings.apiPassword || hashtagSettings.password,
      apiUrl: shippingCompany.apiUrl || hashtagSettings.apiUrl,
      createPath: hashtagSettings.createPath,
      trackPath: hashtagSettings.trackPath,
    }, shipment.companyId);

    const formattedOrder = hashtagService.formatOrderForHashtag(
      shipment.order || {},
      shipment.order?.customer || {},
      shipment.order?.orderItems || []
    );

    try {
      const result = await hashtagService.createShipment(formattedOrder);
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: true,
        status: 'CREATED',
        externalShipmentId: result.externalShipmentId,
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl,
        serviceLevel: provider.serviceLevel || result.serviceLevel,
        cost: result.cost,
        data: result.data,
      });
    } catch (error) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: `HASHTAG_API_ERROR: ${error.message}`,
        serviceLevel: provider.serviceLevel,
      });
    }
  }

  if (providerKey === PROVIDER_KEYS.LG_EXPRESS && integrationMode === 'LIVE') {
    if (!options.allowLiveCreate) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: 'LIVE_CREATE_REQUIRES_EXPLICIT_CONFIRMATION',
        serviceLevel: provider.serviceLevel,
      });
    }

    const LgService = require('./lgService');
    const lgService = new LgService({
      username: settings.username || settings.apiName || shippingCompany.apiKey,
      password: settings.password || settings.apiPassword,
      apiUrl: shippingCompany.apiUrl || settings.apiUrl,
      serviceId: settings.serviceId,
      cachedToken: settings.cachedToken,
      tokenCachedAt: settings.tokenCachedAt,
    }, shipment.companyId);

    const formattedOrder = lgService.formatOrderForLG(
      shipment.order || {},
      shipment.order?.customer || {},
      shipment.order?.orderItems || [],
    );

    try {
      const result = await lgService.createShipment(formattedOrder);
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: true,
        status: 'CREATED',
        externalShipmentId: result.externalShipmentId,
        trackingNumber: result.trackingNumber,
        labelUrl: result.labelUrl,
        serviceLevel: provider.serviceLevel || result.serviceLevel,
        cost: result.cost,
        data: result.data,
      });
    } catch (error) {
      return updateShipmentFromProviderResult(prisma, shipment, provider, {
        success: false,
        skipped: true,
        reason: `LG_EXPRESS_API_ERROR: ${error.message}`,
        serviceLevel: provider.serviceLevel,
      });
    }
  }

  return updateShipmentFromProviderResult(prisma, shipment, provider, {
    success: false,
    skipped: true,
    reason: 'MANUAL_PROVIDER',
    serviceLevel: provider.serviceLevel,
  });
};

const ensureDemoShippingCompanies = async (prisma, companyId) => {
  const carriers = [];

  for (const definition of DEMO_CARRIER_DEFINITIONS) {
    const settings = normalizeSettings(
      {
        autoCreateShipments: true,
        serviceLevel: definition.serviceLevel,
        demoOnly: true,
      },
      definition.providerKey,
      definition.integrationMode,
    );

    const carrier = await prisma.shippingCompany.upsert({
      where: {
        companyId_slug: {
          companyId,
          slug: definition.slug,
        },
      },
      update: {
        name: definition.name,
        phone: definition.phone,
        website: definition.website,
        apiUrl: definition.apiUrl,
        providerKey: definition.providerKey,
        integrationMode: definition.integrationMode,
        settings: safeJsonStringify(settings),
        isActive: true,
      },
      create: {
        companyId,
        name: definition.name,
        slug: definition.slug,
        phone: definition.phone,
        website: definition.website,
        apiUrl: definition.apiUrl,
        providerKey: definition.providerKey,
        integrationMode: definition.integrationMode,
        settings: safeJsonStringify(settings),
        isActive: true,
      },
    });

    carriers.push(carrier);
  }

  return carriers;
};

const TICKET_PROVIDERS = {
  TURBO: require('./shipping/adapters/turboTicketAdapter'),
  DEMO: require('./shipping/adapters/demoTicketAdapter'),
  MANUAL: require('./shipping/adapters/manualTicketAdapter'),
};

function getTicketAdapter({ providerKey, integrationMode, credentials } = {}) {
  const rawKey = String(providerKey || '').trim().toUpperCase();
  const rawMode = String(integrationMode || '').trim().toUpperCase();
  const normKey = normalizeProviderKey(providerKey);
  const normMode = normalizeIntegrationMode(integrationMode);

  // NOTE: PROVIDER_KEYS has no 'DEMO' entry (DEMO is an integration mode), so a
  // raw providerKey of 'DEMO' normalizes to MANUAL. Honour it explicitly here.
  if (rawKey === 'DEMO' || rawMode.endsWith('_DEMO') || normMode.endsWith('_DEMO') || normKey === 'DEMO' || normKey.endsWith('_DEMO')) {
    return TICKET_PROVIDERS.DEMO;
  }
  if (normKey === 'TURBO') {
    return TICKET_PROVIDERS.TURBO;
  }
  return TICKET_PROVIDERS.MANUAL;
}

const NON_TURBO_INVALID_ORDER_STATUSES = new Set([
  'EXCHANGED', 'CANCELLED', 'DUPLICATE_ORDER', 'RETURNED', 'REFUNDED', 'TRASH', 'LOST',
]);

/**
 * Auto-create shipments for any active non-Turbo integrated carrier (BOSTA, QP_EXPRESS,
 * HASHTAG, LG_EXPRESS, MAXP_NETWORK, or *_DEMO) configured with autoCreateShipments + matching stage.
 */
const autoCreateNonTurboShipmentsForOrder = async (prisma, orderOrId, companyId, options = {}) => {
  if (!prisma || !companyId || !options.stage) {
    return { skipped: true, reason: 'MISSING_ARGS' };
  }
  if (!prisma.shippingCompany?.findMany || !prisma.shipment?.findFirst) {
    return { skipped: true, reason: 'PRISMA_MODELS_UNAVAILABLE' };
  }

  const orderId = typeof orderOrId === 'string' ? orderOrId : orderOrId?.id;
  if (!orderId) return { skipped: true, reason: 'MISSING_ORDER_ID' };

  const activeCarriers = await prisma.shippingCompany.findMany({
    where: {
      companyId,
      isActive: true,
      providerKey: { not: PROVIDER_KEYS.TURBO },
      integrationMode: { not: 'MANUAL' },
    },
  }).catch(() => []);

  const eligibleCarriers = (activeCarriers || []).filter((carrier) => {
    const pKey = normalizeProviderKey(carrier.providerKey, carrier);
    if (pKey === PROVIDER_KEYS.TURBO || pKey === PROVIDER_KEYS.MANUAL) return false;
    return shouldCreateShipmentNow(
      {
        settings: carrier.settings,
        providerKey: pKey,
        integrationMode: normalizeIntegrationMode(carrier.integrationMode, pKey),
      },
      options.stage,
    );
  });

  if (eligibleCarriers.length === 0) {
    return { skipped: true, reason: 'NO_ELIGIBLE_CARRIER' };
  }

  const { acquireDispatchLock, releaseDispatchLock } = require('./shipping/shipmentDispatchLock');
  const lock = await acquireDispatchLock([`provider:${companyId}:${orderId}`]);
  if (!lock.acquired) {
    return { skipped: true, reason: 'IN_FLIGHT' };
  }

  try {
    const order = await prisma.order.findFirst({
      where: { id: orderId, companyId },
      include: { shipments: { select: { id: true, trackingNumber: true, externalShipmentId: true } } },
    });
    if (!order) return { skipped: false, reason: 'ORDER_NOT_FOUND' };

    const statusUpper = String(order.status || '').toUpperCase();
    if (NON_TURBO_INVALID_ORDER_STATUSES.has(statusUpper)) {
      return { skipped: true, reason: 'INVALID_STATUS', status: statusUpper };
    }

    const orderMeta = safeJsonParse(order.metadata, {});
    if (orderMeta.discountApprovalStatus === 'PENDING_APPROVAL') {
      return { skipped: true, reason: 'DISCOUNT_APPROVAL_PENDING' };
    }

    const existingDispatched = (order.shipments || []).find(
      (s) => s.trackingNumber || s.externalShipmentId,
    );
    if (existingDispatched) {
      return { skipped: true, reason: 'ALREADY_HAS_SHIPMENT', trackingNumber: existingDispatched.trackingNumber };
    }

    const carrier = eligibleCarriers[0];
    const pKey = normalizeProviderKey(carrier.providerKey, carrier);
    let shipment = await prisma.shipment.findFirst({
      where: { orderId: order.id, companyId },
    });

    if (!shipment) {
      shipment = await prisma.shipment.create({
        data: {
          companyId,
          orderId: order.id,
          shippingCompanyId: carrier.id,
          carrierType: pKey,
          status: 'PENDING',
          destinationGovernorate: order.governorate || null,
          destinationCity: order.city || null,
          destinationAddress: order.customerAddress || order.shippingAddress || null,
          cost: order.shipping !== undefined && order.shipping !== null ? Number(order.shipping) : null,
          currency: order.currency || 'EGP',
        },
      });
    }

    return await createProviderShipment(prisma, shipment.id, {
      allowLiveCreate: true,
      force: Boolean(options.force),
    });
  } finally {
    await releaseDispatchLock(lock);
  }
};

module.exports = {
  PROVIDER_KEYS,
  SHIPMENT_CREATE_TRIGGERS,
  DEMO_CARRIER_DEFINITIONS,
  TICKET_PROVIDERS,
  normalizeProviderKey,
  normalizeIntegrationMode,
  normalizeSettings,
  shouldCreateShipmentNow,
  createProviderShipment,
  autoCreateNonTurboShipmentsForOrder,
  ensureDemoShippingCompanies,
  getTicketAdapter,
  safeJsonParse,
  safeJsonStringify,
};
