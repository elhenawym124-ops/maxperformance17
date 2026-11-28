const axios = require('axios');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

async function main() {
  console.log('====================================================');
  console.log('🔍 TURBO DUPLICATE DIAGNOSTIC & INVESTIGATION TOOL');
  console.log('Target Order: ORD-751652-608');
  console.log('Target Shipments: 39185858 (Saved), 39185859 (Ghost)');
  console.log('====================================================\n');

  const { getSharedPrismaClientAsync } = require('../services/sharedDatabase');
  const prisma = await getSharedPrismaClientAsync();

  // 1. Order details in Order and GuestOrder
  console.log('--- 1. DATABASE: ORDER DETAILS ---');
  const order = await prisma.order.findFirst({
    where: { orderNumber: 'ORD-751652-608' },
    include: {
      customer: true,
      shipments: true,
      company: {
        select: {
          id: true,
          name: true,
          turboApiKey: true,
          turboEnabled: true,
          turboAutoCreate: true,
          settings: true
        }
      }
    }
  });

  console.log('Order from `orders` table:', JSON.stringify(order, null, 2));

  const guestOrder = await prisma.guestOrder.findFirst({
    where: { orderNumber: 'ORD-751652-608' }
  });
  console.log('Order from `guest_orders` table:', JSON.stringify(guestOrder, null, 2));

  // 2. All shipments matching orderId or tracking numbers
  console.log('\n--- 2. DATABASE: MATCHING SHIPMENTS ---');
  const targetIds = ['39185858', '39185859'];
  const allShipments = await prisma.shipment.findMany({
    where: {
      OR: [
        ...(order ? [{ orderId: order.id }] : []),
        { externalShipmentId: { in: targetIds } },
        { trackingNumber: { in: targetIds } }
      ]
    }
  });
  console.log('Found shipments count:', allShipments.length);
  console.log(JSON.stringify(allShipments, null, 2));

  // 3. Carrier Settings
  console.log('\n--- 3. DATABASE: CARRIER SETTINGS ---');
  const companyId = order?.companyId || guestOrder?.companyId;
  let turboCarrier = null;
  if (companyId) {
    turboCarrier = await prisma.shippingCompany.findFirst({
      where: { companyId, providerKey: 'TURBO' }
    });
    console.log('ShippingCompany Turbo:', JSON.stringify(turboCarrier, null, 2));
  }

  // 4. Resolve Turbo API key and client code
  let apiKey = order?.company?.turboApiKey;
  let mainClientCode = 37321; // default fallback
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

  console.log(`\nResolved Turbo credentials: apiKey=${apiKey ? apiKey.substring(0, 8) + '...' : 'NULL'}, mainClientCode=${mainClientCode}`);

  // 5. Grep Logs for exact timeline (08:12 to 08:15)
  console.log('\n--- 4. SERVER LOGS: SEARCHING ORD-751652-608 & SHIPMENT CODES ---');
  const logCommands = [
    'grep -in "ORD-751652-608" /var/www/backend2/logs/*.log 2>/dev/null || true',
    'grep -in "39185858" /var/www/backend2/logs/*.log 2>/dev/null || true',
    'grep -in "39185859" /var/www/backend2/logs/*.log 2>/dev/null || true',
    'grep -in "TURBO-AUTO" /var/www/backend2/logs/*.log | grep -E "751652|3918585" 2>/dev/null || true',
    'grep -in "TURBO" /var/www/backend2/logs/*.log | grep "ORD-751652-608" 2>/dev/null || true'
  ];

  for (const cmd of logCommands) {
    console.log(`\n[LOG EXEC] ${cmd}`);
    try {
      const out = execSync(cmd, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
      console.log(out || '(No matching lines)');
    } catch (e) {
      console.log(`Error running grep: ${e.message}`);
    }
  }

  // Also check PM2 logrotate rotated logs if available
  try {
    const rotatedGrep = 'grep -in "ORD-751652-608" /root/.pm2/logs/*.log /var/www/backend2/logs/*/*.log 2>/dev/null || true';
    console.log(`\n[LOG EXEC] ${rotatedGrep}`);
    const rOut = execSync(rotatedGrep, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 });
    console.log(rOut || '(No matching lines)');
  } catch (_) {}

  // 6. Query Turbo API directly for both 39185858 and 39185859
  console.log('\n--- 5. TURBO API: DIRECT LIVE QUERY ---');
  if (!apiKey) {
    console.log('❌ Cannot query Turbo API: No API key found.');
  } else {
    const baseUrl = process.env.TURBO_API_URL || 'https://platform.turbo.info/external-api';
    console.log(`Using Turbo Base URL: ${baseUrl}`);

    for (const code of ['39185858', '39185859']) {
      console.log(`\n========================================`);
      console.log(`🔍 Checking Turbo status for code: ${code}`);
      console.log(`========================================`);

      // Try search-order
      try {
        const res = await axios.post(`${baseUrl}/search-order`, {
          authentication_key: apiKey,
          main_client_code: mainClientCode,
          search_key: code
        }, { timeout: 15000 });
        console.log(`[search-order] Response for ${code}:`, JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.log(`[search-order] Error for ${code}:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
      }

      // Try get-order-status
      try {
        const res = await axios.post(`${baseUrl}/get-order-status`, {
          authentication_key: apiKey,
          main_client_code: mainClientCode,
          search_Key: code
        }, { timeout: 15000 });
        console.log(`[get-order-status] Response for ${code}:`, JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.log(`[get-order-status] Error for ${code}:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
      }

      // Try get-order
      try {
        const res = await axios.post(`${baseUrl}/get-order`, {
          authentication_key: apiKey,
          main_client_code: mainClientCode,
          search_Key: code
        }, { timeout: 15000 });
        console.log(`[get-order] Response for ${code}:`, JSON.stringify(res.data, null, 2));
      } catch (err) {
        console.log(`[get-order] Error for ${code}:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
      }
    }

    // Also check if Turbo has any other orders with invoice_number ORD-751652-608
    console.log(`\n========================================`);
    console.log(`🔍 Searching Turbo for invoice_number: ORD-751652-608`);
    console.log(`========================================`);
    try {
      const res = await axios.post(`${baseUrl}/search-order`, {
        authentication_key: apiKey,
        main_client_code: mainClientCode,
        search_key: 'ORD-751652-608'
      }, { timeout: 15000 });
      console.log(`[search-order by invoice] Response:`, JSON.stringify(res.data, null, 2));
    } catch (err) {
      console.log(`[search-order by invoice] Error:`, err.response?.status, JSON.stringify(err.response?.data || err.message));
    }
  }

  // 7. Reconciliation: Compare Turbo shipments for the last 30 days
  console.log('\n--- 6. RECONCILIATION: TURBO LAST 30 DAYS ---');
  if (apiKey) {
    try {
      const today = new Date().toISOString().split('T')[0];
      const from30 = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      console.log(`Fetching Turbo status feed from ${from30} to ${today}...`);

      const statusRes = await axios.post('https://api.turbodelivery.net/get-status', {
        authentication_key: apiKey,
        from: from30,
        to: today
      }, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 45000
      }).catch(async (e) => {
        console.warn('api.turbodelivery.net failed, trying platform.turbo.info/external-api/get-status...');
        return await axios.post('https://platform.turbo.info/external-api/get-status', {
          authentication_key: apiKey,
          from: from30,
          to: today
        }, { timeout: 45000 });
      });

      const turboShipments = statusRes?.data?.data || statusRes?.data?.feed || [];
      console.log(`Total Turbo shipments returned in last 30 days: ${turboShipments.length}`);

      if (turboShipments.length > 0) {
        // Find 39185858 and 39185859 in the feed
        const hit58 = turboShipments.find(s => String(s.code) === '39185858' || String(s.bar_code) === '39185858');
        const hit59 = turboShipments.find(s => String(s.code) === '39185859' || String(s.bar_code) === '39185859');
        console.log(`Feed contains 39185858:`, Boolean(hit58), hit58 ? JSON.stringify(hit58) : '');
        console.log(`Feed contains 39185859:`, Boolean(hit59), hit59 ? JSON.stringify(hit59) : '');

        // Extract all tracking codes from Turbo
        const turboCodes = turboShipments.map(s => String(s.code || s.bar_code)).filter(Boolean);

        // Find existing shipments in DB
        const dbShipments = await prisma.shipment.findMany({
          where: {
            companyId,
            carrierType: 'TURBO',
            OR: [
              { externalShipmentId: { in: turboCodes } },
              { trackingNumber: { in: turboCodes } }
            ]
          },
          select: { externalShipmentId: true, trackingNumber: true, orderId: true }
        });

        const dbOrders = await prisma.order.findMany({
          where: {
            companyId,
            OR: [
              { turboShipmentId: { in: turboCodes } },
              { turboTrackingNumber: { in: turboCodes } }
            ]
          },
          select: { turboShipmentId: true, turboTrackingNumber: true, orderNumber: true }
        });

        const dbGuestOrders = await prisma.guestOrder.findMany({
          where: {
            companyId,
            OR: [
              { turboShipmentId: { in: turboCodes } },
              { turboTrackingNumber: { in: turboCodes } }
            ]
          },
          select: { turboShipmentId: true, turboTrackingNumber: true, orderNumber: true }
        });

        const knownCodesInDb = new Set();
        dbShipments.forEach(s => {
          if (s.externalShipmentId) knownCodesInDb.add(String(s.externalShipmentId));
          if (s.trackingNumber) knownCodesInDb.add(String(s.trackingNumber));
        });
        dbOrders.forEach(o => {
          if (o.turboShipmentId) knownCodesInDb.add(String(o.turboShipmentId));
          if (o.turboTrackingNumber) knownCodesInDb.add(String(o.turboTrackingNumber));
        });
        dbGuestOrders.forEach(g => {
          if (g.turboShipmentId) knownCodesInDb.add(String(g.turboShipmentId));
          if (g.turboTrackingNumber) knownCodesInDb.add(String(g.turboTrackingNumber));
        });

        const ghostShipments = [];
        for (const ts of turboShipments) {
          const code = String(ts.code || ts.bar_code || '');
          if (code && !knownCodesInDb.has(code)) {
            ghostShipments.push({
              code,
              invoice_number: ts.invoice_number || ts.remote_order_id || ts.order_id,
              receiver: ts.receiver || ts.customer_name,
              phone: ts.phone1 || ts.phone,
              status: ts.status,
              created_at: ts.created_at || ts.date
            });
          }
        }

        console.log(`\n📊 RECONCILIATION REPORT (Last 30 Days):`);
        console.log(`- Total Turbo shipments: ${turboShipments.length}`);
        console.log(`- Verified in MaxP DB: ${turboShipments.length - ghostShipments.length}`);
        console.log(`- Ghost/Unlinked shipments at Turbo: ${ghostShipments.length}`);
        if (ghostShipments.length > 0) {
          console.log('List of Ghost Shipments at Turbo:');
          console.log(JSON.stringify(ghostShipments, null, 2));
        }
      }
    } catch (e) {
      console.error('Reconciliation error:', e.message);
    }
  }

  console.log('\n====================================================');
  console.log('✅ DIAGNOSTIC RUN COMPLETED');
  console.log('====================================================');
}

main().catch(console.error).finally(() => process.exit(0));
