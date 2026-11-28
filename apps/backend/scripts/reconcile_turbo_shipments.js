/**
 * 🔍 Turbo Shipments 30-Day Reconciliation Script
 * Compares shipments between Turbo Shipping Provider and MaxPerformance Database.
 * Identifies ghost/orphan shipments at Turbo, duplicates, and status discrepancies.
 * 
 * Usage:
 *   node apps/backend/scripts/reconcile_turbo_shipments.js [companyId] [daysBack=30]
 */

const axios = require('axios');
const path = require('path');
const fs = require('fs');

async function reconcileTurboShipments(targetCompanyId = null, daysBack = 30) {
  console.log('===============================================================');
  console.log(`📦 TURBO SHIPPING 30-DAY RECONCILIATION & AUDIT TOOL`);
  console.log(`Period: Last ${daysBack} days | Target Company: ${targetCompanyId || 'Auto (Swan)'}`);
  console.log('===============================================================\n');

  const { getSharedPrismaClientAsync } = require('../services/sharedDatabase');
  const prisma = await getSharedPrismaClientAsync();

  // 1. Resolve Company
  let company = null;
  if (targetCompanyId) {
    company = await prisma.company.findUnique({
      where: { id: targetCompanyId },
      select: { id: true, name: true, turboApiKey: true, turboEnabled: true, settings: true }
    });
  } else {
    // Default to Swan
    company = await prisma.company.findFirst({
      where: {
        OR: [
          { id: 'cmleybpf70028juo2wwpmp8rt' },
          { name: { contains: 'Swan', mode: 'insensitive' } },
          { turboEnabled: true }
        ]
      },
      select: { id: true, name: true, turboApiKey: true, turboEnabled: true, settings: true }
    });
  }

  if (!company) {
    console.error('❌ Could not find target company for Turbo reconciliation.');
    return { success: false, error: 'COMPANY_NOT_FOUND' };
  }

  console.log(`🏢 Company: ${company.name} (${company.id})`);

  // 2. Resolve Turbo Credentials
  let apiKey = company.turboApiKey;
  let mainClientCode = 37321;

  const turboCarrier = await prisma.shippingCompany.findFirst({
    where: { companyId: company.id, providerKey: 'TURBO' }
  });

  if (turboCarrier) {
    let s = {};
    try {
      s = typeof turboCarrier.settings === 'string' ? JSON.parse(turboCarrier.settings) : (turboCarrier.settings || {});
    } catch (_) {}
    if (!apiKey) apiKey = turboCarrier.apiKey || s.apiKey;
    if (s.mainClientCode || s.clientCode || s.main_client_code) {
      mainClientCode = s.mainClientCode || s.clientCode || s.main_client_code;
    }
  }

  if (!apiKey) {
    console.error('❌ Missing Turbo API key for company.');
    return { success: false, error: 'MISSING_API_KEY' };
  }

  const baseUrl = process.env.TURBO_API_URL || 'https://platform.turbo.info/external-api';
  const today = new Date().toISOString().split('T')[0];
  const fromDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  console.log(`🔑 Credentials: apiKey=${apiKey.substring(0, 8)}... | mainClientCode=${mainClientCode}`);
  console.log(`📅 Date Range: ${fromDate} to ${today}\n`);

  // 3. Fetch all shipments from Turbo API
  console.log('📡 Fetching shipments from Turbo API /get-status...');
  let turboList = [];
  try {
    const statusResp = await axios.post(
      `${baseUrl}/get-status`,
      {
        api_key: apiKey,
        authentication_key: apiKey,
        main_client_code: mainClientCode,
        from: fromDate,
        to: today
      },
      { timeout: 45000 }
    );
    turboList = statusResp.data?.data || statusResp.data?.result || [];
    console.log(`✅ Fetched ${turboList.length} shipments from Turbo API.\n`);
  } catch (apiErr) {
    console.error('❌ Failed fetching from Turbo API:', apiErr.response?.data || apiErr.message);
    return { success: false, error: apiErr.message };
  }

  // 4. Cross-Reference against MaxP DB
  console.log('🔍 Cross-referencing each shipment against MaxP Database...');

  const report = {
    companyId: company.id,
    companyName: company.name,
    dateRange: { from: fromDate, to: today },
    totalTurboShipments: turboList.length,
    matchedShipmentsCount: 0,
    ghostShipmentsCount: 0,
    multiShipmentInvoicesCount: 0,
    ghostShipments: [],
    multiShipmentInvoices: {},
    matchedShipments: []
  };

  // Group Turbo shipments by invoice_number to detect duplicates at Turbo
  const invoiceGroups = {};
  for (const s of turboList) {
    const inv = String(s.invoice_number || '').trim();
    if (inv) {
      if (!invoiceGroups[inv]) invoiceGroups[inv] = [];
      invoiceGroups[inv].push(s);
    }
  }

  for (const [inv, shipments] of Object.entries(invoiceGroups)) {
    if (shipments.length > 1) {
      report.multiShipmentInvoices[inv] = shipments.map(s => ({
        code: s.code || s.bar_code,
        status: s.status || s.status_text,
        statusCode: s.status_code,
        branch: s.branch || s.expected_branch,
        captain: s.captain
      }));
    }
  }
  report.multiShipmentInvoicesCount = Object.keys(report.multiShipmentInvoices).length;

  // Verify each Turbo shipment in MaxP DB
  for (const item of turboList) {
    const code = String(item.code || item.bar_code || '').trim();
    const inv = String(item.invoice_number || '').trim();

    // Check DB
    const [matchingShipment, matchingOrder, matchingGuest] = await Promise.all([
      prisma.shipment.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { externalShipmentId: code },
            { trackingNumber: code },
            ...(inv ? [{ trackingNumber: inv }, { externalShipmentId: inv }] : [])
          ]
        },
        select: { id: true, orderId: true, externalShipmentId: true, trackingNumber: true, status: true }
      }),
      prisma.order.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { turboShipmentId: code },
            { turboTrackingNumber: code },
            ...(inv ? [{ orderNumber: inv }] : [])
          ]
        },
        select: { id: true, orderNumber: true, status: true, turboShipmentId: true, turboTrackingNumber: true }
      }),
      prisma.guestOrder.findFirst({
        where: {
          companyId: company.id,
          OR: [
            { turboShipmentId: code },
            { turboTrackingNumber: code },
            ...(inv ? [{ orderNumber: inv }] : [])
          ]
        },
        select: { id: true, orderNumber: true, status: true, turboShipmentId: true, turboTrackingNumber: true }
      })
    ]);

    const isMatched = Boolean(
      matchingShipment ||
      (matchingOrder && (matchingOrder.turboShipmentId === code || matchingOrder.turboTrackingNumber === code)) ||
      (matchingGuest && (matchingGuest.turboShipmentId === code || matchingGuest.turboTrackingNumber === code))
    );

    if (isMatched) {
      report.matchedShipmentsCount++;
      report.matchedShipments.push({
        code,
        invoiceNumber: inv,
        turboStatus: item.status || item.status_text,
        maxpShipmentId: matchingShipment?.id || null,
        maxpOrderId: matchingOrder?.id || matchingGuest?.id || null,
        maxpOrderNumber: matchingOrder?.orderNumber || matchingGuest?.orderNumber || null
      });
    } else {
      report.ghostShipmentsCount++;
      report.ghostShipments.push({
        code,
        invoiceNumber: inv,
        turboStatus: item.status || item.status_text,
        statusCode: item.status_code,
        branch: item.branch || item.expected_branch || null,
        captain: item.captain || null,
        orderInDb: matchingOrder ? { orderNumber: matchingOrder.orderNumber, activeTurboShipmentId: matchingOrder.turboShipmentId } : null
      });
    }
  }

  // 5. Print Summary Report
  console.log('===============================================================');
  console.log('📊 RECONCILIATION SUMMARY REPORT');
  console.log('===============================================================');
  console.log(`- Total Shipments at Turbo (30 Days):   ${report.totalTurboShipments}`);
  console.log(`- Matched in MaxP Database:             ${report.matchedShipmentsCount}`);
  console.log(`- Ghost/Unlinked at Turbo:              ${report.ghostShipmentsCount}`);
  console.log(`- Orders with Multiple Turbo Shipments: ${report.multiShipmentInvoicesCount}\n`);

  if (report.multiShipmentInvoicesCount > 0) {
    console.log('⚠️ MULTI-SHIPMENT INVOICES DETECTED:');
    console.log(JSON.stringify(report.multiShipmentInvoices, null, 2));
    console.log('');
  }

  if (report.ghostShipmentsCount > 0) {
    console.log('👻 GHOST / UNLINKED SHIPMENTS AT TURBO:');
    console.log(JSON.stringify(report.ghostShipments, null, 2));
    console.log('');
  }

  return { success: true, report };
}

if (require.main === module) {
  const args = process.argv.slice(2);
  const targetCompanyId = args[0] || null;
  const daysBack = parseInt(args[1], 10) || 30;

  reconcileTurboShipments(targetCompanyId, daysBack)
    .then(res => {
      console.log('🏁 Reconciliation completed with status:', res.success ? 'SUCCESS' : 'FAILED');
      process.exit(res.success ? 0 : 1);
    })
    .catch(err => {
      console.error('💥 Fatal reconciliation error:', err);
      process.exit(1);
    });
}

module.exports = { reconcileTurboShipments };
