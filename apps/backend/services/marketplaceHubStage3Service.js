const zlib = require('zlib');

let sharedDbModule = null;
function safeGetPrisma() {
  if (!sharedDbModule) {
    try {
      sharedDbModule = require('./sharedDatabase');
    } catch {
      return null;
    }
  }
  try {
    return sharedDbModule.getSharedPrismaClient ? sharedDbModule.getSharedPrismaClient() : null;
  } catch {
    return null;
  }
}

// Local in-memory fallback store used only when Prisma model is unavailable (e.g. unit tests)
const memoryConfigs = new Map();

function memBucket(companyId, category) {
  const k = `${String(companyId || 'default')}:${category}`;
  if (!memoryConfigs.has(k)) memoryConfigs.set(k, new Map());
  return memoryConfigs.get(k);
}

async function listConfigs(companyId, category, prisma = safeGetPrisma()) {
  const cid = String(companyId || 'default');
  if (prisma?.marketplaceHubConfig?.findMany) {
    const rows = await prisma.marketplaceHubConfig.findMany({
      where: { companyId: cid, category },
      orderBy: { updatedAt: 'desc' },
    });
    return rows.map((r) => ({ itemKey: r.itemKey, updatedAt: r.updatedAt, ...JSON.parse(r.payloadJson) }));
  }
  return Array.from(memBucket(cid, category).values());
}

async function upsertConfig(companyId, category, itemKey, payload, prisma = safeGetPrisma()) {
  const cid = String(companyId || 'default');
  const key = String(itemKey);
  const now = new Date().toISOString();
  if (prisma?.marketplaceHubConfig?.upsert) {
    const saved = await prisma.marketplaceHubConfig.upsert({
      where: { companyId_category_itemKey: { companyId: cid, category, itemKey: key } },
      update: { payloadJson: JSON.stringify(payload) },
      create: { companyId: cid, category, itemKey: key, payloadJson: JSON.stringify(payload) },
    });
    return { itemKey: saved.itemKey, updatedAt: saved.updatedAt, ...payload };
  }
  const entry = { itemKey: key, updatedAt: now, ...payload };
  memBucket(cid, category).set(key, entry);
  return entry;
}

async function deleteConfig(companyId, category, itemKey, prisma = safeGetPrisma()) {
  const cid = String(companyId || 'default');
  const key = String(itemKey);
  if (prisma?.marketplaceHubConfig?.deleteMany) {
    await prisma.marketplaceHubConfig.deleteMany({
      where: { companyId: cid, category, itemKey: key },
    });
    return { removed: true };
  }
  memBucket(cid, category).delete(key);
  return { removed: true };
}

// ─── 1. Cost Groups & Currency Reporting Policy ──────────────────────────────
const DEFAULT_FX_TO_EGP = { EGP: 1, SAR: 13.2, AED: 13.5, USD: 49.5, KWD: 161, QAR: 13.6, EUR: 53.2 };

async function listCostGroups(companyId, prisma = safeGetPrisma()) {
  return listConfigs(companyId, 'COST_GROUP', prisma);
}

async function saveCostGroup(companyId, payload = {}, prisma = safeGetPrisma()) {
  const name = String(payload.name || '').trim();
  if (!name) {
    const err = new Error('اسم مجموعة التكاليف مطلوب');
    err.statusCode = 400;
    throw err;
  }
  const items = (Array.isArray(payload.items) ? payload.items : [])
    .map((it) => ({
      label: String(it?.label || '').trim(),
      type: String(it?.type || 'FIXED').toUpperCase() === 'PERCENT' ? 'PERCENT' : 'FIXED',
      value: Math.max(0, Number(it?.value || 0)),
    }))
    .filter((it) => it.label);
  const id = String(payload.id || `cg-${Date.now()}`);
  return upsertConfig(companyId, 'COST_GROUP', id, { id, name, items }, prisma);
}

async function deleteCostGroup(companyId, id, prisma = safeGetPrisma()) {
  return deleteConfig(companyId, 'COST_GROUP', id, prisma);
}

async function getCurrencyPolicy(companyId, prisma = safeGetPrisma()) {
  const list = await listConfigs(companyId, 'CURRENCY_POLICY', prisma);
  const current = list[0];
  return current || {
    reportingCurrency: 'EGP',
    amountView: 'NATIVE',
    fxSource: 'BILLING_REGISTRY',
    conversionTiming: 'AT_ORDER_CREATION',
    freezeHistoricalRates: true,
    ratesToEgp: DEFAULT_FX_TO_EGP,
  };
}

async function saveCurrencyPolicy(companyId, payload = {}, prisma = safeGetPrisma()) {
  const policy = {
    reportingCurrency: String(payload.reportingCurrency || 'EGP').toUpperCase(),
    amountView: String(payload.amountView || 'NATIVE').toUpperCase() === 'REPORTING' ? 'REPORTING' : 'NATIVE',
    fxSource: String(payload.fxSource || 'BILLING_REGISTRY').toUpperCase(),
    conversionTiming: String(payload.conversionTiming || 'AT_ORDER_CREATION').toUpperCase(),
    freezeHistoricalRates: payload.freezeHistoricalRates !== false,
    ratesToEgp: { ...DEFAULT_FX_TO_EGP, ...(payload.ratesToEgp || {}) },
  };
  return upsertConfig(companyId, 'CURRENCY_POLICY', 'default', policy, prisma);
}

// ─── 2. ZIP Bulk SKU Images Unpacker + Dynamic Product Custom Fields ─────────
function readZipEntries(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 22) {
    const err = new Error('ملف ZIP غير صالح');
    err.statusCode = 400;
    throw err;
  }
  // Locate End of Central Directory (PK\x05\x06)
  let eocdOffset = -1;
  for (let i = buffer.length - 22; i >= Math.max(0, buffer.length - 65557); i--) {
    if (buffer.readUInt32LE(i) === 0x06054b50) {
      eocdOffset = i;
      break;
    }
  }
  if (eocdOffset < 0) {
    const err = new Error('تعذر قراءة فهرس ملف ZIP');
    err.statusCode = 400;
    throw err;
  }

  const cdOffset = buffer.readUInt32LE(eocdOffset + 16);
  const totalEntries = buffer.readUInt16LE(eocdOffset + 10);
  const entries = [];
  let ptr = cdOffset;

  for (let idx = 0; idx < totalEntries && ptr + 46 <= eocdOffset; idx++) {
    if (buffer.readUInt32LE(ptr) !== 0x02014b50) break;
    const method = buffer.readUInt16LE(ptr + 10);
    const compSize = buffer.readUInt32LE(ptr + 20);
    const nameLen = buffer.readUInt16LE(ptr + 28);
    const extraLen = buffer.readUInt16LE(ptr + 30);
    const commentLen = buffer.readUInt16LE(ptr + 32);
    const localHeaderOffset = buffer.readUInt32LE(ptr + 42);
    const fileName = buffer.subarray(ptr + 46, ptr + 46 + nameLen).toString('utf8');
    ptr += 46 + nameLen + extraLen + commentLen;

    if (fileName.endsWith('/') || !/\.(jpg|jpeg|png|webp)$/i.test(fileName)) continue;

    let previewDataUrl = null;
    if (localHeaderOffset + 30 <= buffer.length && buffer.readUInt32LE(localHeaderOffset) === 0x04034b50) {
      const lNameLen = buffer.readUInt16LE(localHeaderOffset + 26);
      const lExtraLen = buffer.readUInt16LE(localHeaderOffset + 28);
      const dataStart = localHeaderOffset + 30 + lNameLen + lExtraLen;
      const compSlice = buffer.subarray(dataStart, dataStart + compSize);
      try {
        const raw = method === 0 ? compSlice : method === 8 ? zlib.inflateRawSync(compSlice) : null;
        if (raw && raw.length <= 2 * 1024 * 1024) {
          const ext = fileName.toLowerCase().endsWith('.png') ? 'png' : fileName.toLowerCase().endsWith('.webp') ? 'webp' : 'jpeg';
          previewDataUrl = `data:image/${ext};base64,${raw.toString('base64')}`;
        }
      } catch {
        // Keep metadata even if an individual entry compressed bytes can't decode
      }
    }
    entries.push({ fileName, previewDataUrl });
  }
  return entries;
}

async function processBulkSkuImagesZip(companyId, zipBase64, prisma = safeGetPrisma()) {
  const cleanB64 = String(zipBase64 || '').replace(/^data:[^;]+;base64,/, '').trim();
  const buf = Buffer.from(cleanB64, 'base64');
  const rawEntries = readZipEntries(buf);
  const bySku = new Map();

  for (const item of rawEntries) {
    const parts = item.fileName.replace(/\\/g, '/').split('/').filter(Boolean);
    if (parts.length < 2) continue;
    const sku = parts[parts.length - 2];
    const base = parts[parts.length - 1];
    if (!bySku.has(sku)) bySku.set(sku, { sku, mainImage: null, gallery: [] });
    const grp = bySku.get(sku);
    const isMain = /^1\.(jpg|jpeg|png|webp)$/i.test(base);
    if (isMain && !grp.mainImage) {
      grp.mainImage = { fileName: base, previewDataUrl: item.previewDataUrl };
    } else {
      grp.gallery.push({ fileName: base, previewDataUrl: item.previewDataUrl });
    }
  }

  const groups = Array.from(bySku.values());
  if (prisma?.product?.findFirst) {
    for (const grp of groups) {
      const prod = await prisma.product.findFirst({
        where: { companyId: String(companyId), sku: grp.sku, deletedAt: null },
        select: { id: true, name: true },
      }).catch(() => null);
      grp.matchedProduct = prod || null;
    }
  }
  return { totalImages: rawEntries.length, skuCount: groups.length, groups };
}

async function listCustomFields(companyId, prisma = safeGetPrisma()) {
  return listConfigs(companyId, 'CUSTOM_FIELD', prisma);
}

async function saveCustomField(companyId, payload = {}, prisma = safeGetPrisma()) {
  const name = String(payload.name || '').trim();
  if (!name) {
    const err = new Error('اسم الحقل المخصص مطلوب');
    err.statusCode = 400;
    throw err;
  }
  const id = String(payload.id || `cf-${Date.now()}`);
  const fieldKey = String(payload.fieldKey || name.toLowerCase().replace(/[^a-z0-9]+/g, '_')).replace(/^_|_$/g, '') || id;
  return upsertConfig(companyId, 'CUSTOM_FIELD', id, {
    id,
    name,
    fieldKey,
    fieldType: ['TEXT', 'NUMBER', 'PERCENT', 'SELECT'].includes(String(payload.fieldType).toUpperCase())
      ? String(payload.fieldType).toUpperCase()
      : 'TEXT',
    scope: String(payload.scope || 'PRODUCT').toUpperCase() === 'VARIANT' ? 'VARIANT' : 'PRODUCT',
    options: Array.isArray(payload.options) ? payload.options.filter(Boolean) : [],
  }, prisma);
}

async function deleteCustomField(companyId, id, prisma = safeGetPrisma()) {
  return deleteConfig(companyId, 'CUSTOM_FIELD', id, prisma);
}

// ─── 3. Inventory Sync Policy & Discrepancy Tickets ──────────────────────────
async function getInventorySyncPolicy(companyId, prisma = safeGetPrisma()) {
  const list = await listConfigs(companyId, 'INVENTORY_SYNC_POLICY', prisma);
  return list[0] || {
    frequencyMin: 60,
    toleranceQty: 2,
    zeroAction: 'MARK_OUT_OF_STOCK',
    conflictPolicy: 'MANUAL_REVIEW',
  };
}

async function saveInventorySyncPolicy(companyId, payload = {}, prisma = safeGetPrisma()) {
  const policy = {
    frequencyMin: Math.max(5, Math.min(1440, Math.floor(Number(payload.frequencyMin || 60)))),
    toleranceQty: Math.max(0, Math.floor(Number(payload.toleranceQty ?? 2))),
    zeroAction: ['IGNORE', 'DISABLE', 'MARK_OUT_OF_STOCK'].includes(String(payload.zeroAction).toUpperCase())
      ? String(payload.zeroAction).toUpperCase()
      : 'MARK_OUT_OF_STOCK',
    conflictPolicy: String(payload.conflictPolicy || '').toUpperCase() === 'AUTO_RESOLVE'
      ? 'AUTO_RESOLVE'
      : 'MANUAL_REVIEW',
  };
  return upsertConfig(companyId, 'INVENTORY_SYNC_POLICY', 'default', policy, prisma);
}

async function listStockTickets(companyId, prisma = safeGetPrisma()) {
  return listConfigs(companyId, 'STOCK_TICKET', prisma);
}

async function scanStockDiscrepancies(companyId, payload = {}, prisma = safeGetPrisma()) {
  const policy = await getInventorySyncPolicy(companyId, prisma);
  const snapshots = Array.isArray(payload.snapshots) ? payload.snapshots : [];
  const created = [];

  for (const snap of snapshots) {
    const sku = String(snap?.sku || '').trim();
    if (!sku) continue;
    const channel = String(snap?.channel || 'amazon').toLowerCase();
    let maxpQty = snap?.maxpQty !== undefined ? Number(snap.maxpQty) : null;
    if (maxpQty === null && prisma?.product?.findFirst) {
      const prod = await prisma.product.findFirst({
        where: { companyId: String(companyId), sku, deletedAt: null },
        select: { stock: true },
      }).catch(() => null);
      maxpQty = prod ? Number(prod.stock || 0) : 0;
    }
    maxpQty = Number(maxpQty || 0);
    const channelQty = Number(snap?.channelQty || 0);
    const diff = channelQty - maxpQty;

    if (Math.abs(diff) <= policy.toleranceQty) continue;

    const id = `tkt-${sku}-${channel}`;
    const autoResolved = policy.conflictPolicy === 'AUTO_RESOLVE';
    const ticket = await upsertConfig(companyId, 'STOCK_TICKET', id, {
      id,
      sku,
      productName: String(snap?.productName || sku),
      channel,
      maxpQty,
      channelQty,
      diff,
      status: autoResolved ? 'RESOLVED' : 'UNRESOLVED',
      resolution: autoResolved ? 'AUTO_SYNCED_TO_MAXP' : null,
      createdAt: new Date().toISOString(),
    }, prisma);
    created.push(ticket);
  }

  return { policy, scannedCount: snapshots.length, ticketsCreatedOrUpdated: created.length, tickets: await listStockTickets(companyId, prisma) };
}

async function resolveStockTicket(companyId, id, resolution = 'USE_MAXP', prisma = safeGetPrisma()) {
  const all = await listStockTickets(companyId, prisma);
  const found = all.find((t) => t.id === id || t.itemKey === id);
  if (!found) {
    const err = new Error('التذكرة غير موجودة');
    err.statusCode = 404;
    throw err;
  }
  return upsertConfig(companyId, 'STOCK_TICKET', found.itemKey || found.id, {
    ...found,
    status: 'RESOLVED',
    resolution,
    resolvedAt: new Date().toISOString(),
  }, prisma);
}

async function resolveAllStockTickets(companyId, resolution = 'USE_MAXP', prisma = safeGetPrisma()) {
  const all = await listStockTickets(companyId, prisma);
  let resolvedCount = 0;
  for (const t of all) {
    if (t.status === 'UNRESOLVED') {
      await upsertConfig(companyId, 'STOCK_TICKET', t.itemKey || t.id, {
        ...t,
        status: 'RESOLVED',
        resolution,
        resolvedAt: new Date().toISOString(),
      }, prisma);
      resolvedCount += 1;
    }
  }
  return { resolvedCount, tickets: await listStockTickets(companyId, prisma) };
}

module.exports = {
  listCostGroups,
  saveCostGroup,
  deleteCostGroup,
  getCurrencyPolicy,
  saveCurrencyPolicy,
  readZipEntries,
  processBulkSkuImagesZip,
  listCustomFields,
  saveCustomField,
  deleteCustomField,
  getInventorySyncPolicy,
  saveInventorySyncPolicy,
  listStockTickets,
  scanStockDiscrepancies,
  resolveStockTicket,
  resolveAllStockTickets,
};
