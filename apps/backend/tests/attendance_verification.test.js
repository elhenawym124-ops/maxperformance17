/**
 * اختبار منطق التحقق من البصمة (بدون قاعدة بيانات)
 * node apps/backend/tests/attendance_verification.test.js
 * npx jest tests/attendance_verification.test.js --runInBand --testTimeout=30000 --forceExit
 */
const assert = require("assert");

process.env.POSTGRES_URL =
  process.env.POSTGRES_URL || "postgresql://u:p@127.0.0.1:5432/maxp_test";
process.env.DIRECT_URL = process.env.DIRECT_URL || process.env.POSTGRES_URL;

const service = require("../services/hr/attendanceService");

const OFFICE = { lat: 31.21155, lng: 29.96625 };

const rows = [];
const fakePrisma = {
  hrAttendanceAttempt: {
    create: async ({ data }) => {
      const row = { id: `attempt-${rows.length + 1}`, ...data };
      rows.push(row);
      return row;
    },
    update: async () => ({}),
  },
};

Object.defineProperty(service, "prisma", {
  value: fakePrisma,
  configurable: true,
});

const baseSettings = {
  geofenceEnabled: true,
  officeLatitude: OFFICE.lat,
  officeLongitude: OFFICE.lng,
  geofenceRadius: 250,
  branchNetworkEnabled: false,
  branchIpAllowlist: null,
  allowRemoteCheckIn: false,
};

const locationAt = (meters, accuracy) => ({
  // ~1 degree latitude = 111_320 m
  latitude: OFFICE.lat + meters / 111320,
  longitude: OFFICE.lng,
  accuracy,
});

const call = ({ hrSettings, ...overrides } = {}) =>
  service._verifyPunch({
    companyId: "c1",
    userId: "u1",
    action: "CHECK_IN",
    data: { method: "self_service", workMode: "OFFICE" },
    context: { ip: "41.33.10.5", userAgent: "Mozilla/5.0 (Windows NT 10.0)", deviceType: "DESKTOP", actorRole: "AGENT" },
    attendanceDate: new Date("2026-10-19T00:00:00.000Z"),
    ...overrides,
    hrSettings: { ...baseSettings, ...(hrSettings || {}) },
  });

const tests = [];
const isJest = typeof describe === "function" && typeof test === "function";

const describeBlock = isJest ? describe : (name, fn) => { fn(); };
const testCase = isJest ? test : (name, fn) => { tests.push({ name, fn }); };

describeBlock("Attendance Verification (geofence & network bypass)", () => {
  testCase("1) inside geofence → SUCCESS", async () => {
    const res = await call({ data: { method: "self_service", workMode: "OFFICE", location: locationAt(80, 100) } });
    assert.strictEqual(res.method, "self_service");
    assert.strictEqual(rows.at(-1).result, "SUCCESS");
    assert.strictEqual(rows.at(-1).reason, "inside_geofence");
  });

  testCase("2) far + weak accuracy → WEAK_ACCURACY logged with distance/accuracy/IP", async () => {
    const farWeak = locationAt(2900, 2607);
    await assert.rejects(
      () => call({ data: { method: "self_service", workMode: "OFFICE", location: farWeak } }),
      (err) => {
        assert.strictEqual(err.statusCode, 403);
        assert.strictEqual(err.geofenceData.failure, "WEAK_ACCURACY");
        assert.ok(err.geofenceData.attemptId);
        return true;
      },
    );
    const weakRow = rows.at(-1);
    assert.strictEqual(weakRow.result, "WEAK_ACCURACY");
    assert.strictEqual(weakRow.clientIp, "41.33.10.5");
    assert.strictEqual(weakRow.deviceType, "DESKTOP");
    assert.ok(weakRow.distanceMeters >= 2800);
    assert.strictEqual(weakRow.accuracyMeters, 2607);
  });

  testCase("3) far + good accuracy → OUT_OF_RANGE, message has no weak-GPS sentence", async () => {
    await assert.rejects(
      () => call({ data: { method: "self_service", workMode: "OFFICE", location: locationAt(1200, 40) } }),
      (err) => {
        assert.strictEqual(err.geofenceData.failure, "OUT_OF_RANGE");
        assert.ok(!/ضعيفة/.test(err.message), "out-of-range message must not mention weak GPS");
        return true;
      },
    );
    assert.strictEqual(rows.at(-1).result, "GEOFENCE_FAILED");
  });

  testCase("4) branch network IP (branchNetworkEnabled=true) → SUCCESS + reason: branch_network", async () => {
    const res = await call({
      hrSettings: { branchNetworkEnabled: true, branchIpAllowlist: "41.33.0.0/16\n196.210.10.5" },
    });
    assert.strictEqual(res.method, "network");
    assert.strictEqual(rows.at(-1).branchIpMatch, true);
    assert.strictEqual(rows.at(-1).reason, "branch_network");
  });

  testCase("5) HOME without allowRemoteCheckIn is still geofenced", async () => {
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "HOME", location: locationAt(3000, 60) },
      }),
      (err) => {
        assert.strictEqual(err.geofenceData.failure, "OUT_OF_RANGE");
        return true;
      },
    );
  });

  testCase("6) HOME with allowRemoteCheckIn → SUCCESS", async () => {
    const res = await call({
      data: { method: "self_service", workMode: "HOME" },
      hrSettings: { allowRemoteCheckIn: true },
    });
    assert.strictEqual(res.method, "home");
  });

  testCase("7) manual from non-admin is geofenced (no client-side bypass)", async () => {
    await assert.rejects(
      () => call({ data: { method: "manual", workMode: "OFFICE", location: locationAt(3000, 60) } }),
      (err) => err.geofenceData?.failure === "OUT_OF_RANGE",
    );
  });

  testCase("8) manual from MANAGER → SUCCESS", async () => {
    const res = await call({
      data: { method: "manual", workMode: "OFFICE" },
      context: { ip: "41.33.10.5", userAgent: "x", deviceType: "DESKTOP", actorRole: "MANAGER" },
    });
    assert.strictEqual(res.method, "manual");
  });

  testCase("9) missing location → LOCATION_MISSING logged", async () => {
    await assert.rejects(
      () => call({ data: { method: "self_service", workMode: "OFFICE", location: null } }),
      (err) => err.geofenceData?.requiresLocation === true,
    );
    assert.strictEqual(rows.at(-1).result, "LOCATION_MISSING");
    assert.strictEqual(rows.at(-1).clientIp, "41.33.10.5");
  });

  // --- حالات حراسة الإصلاح (DC1D533D) ---
  testCase("10) branchNetworkEnabled=false + IP in allowlist (no location) → LOCATION_MISSING (no bypass)", async () => {
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "OFFICE", location: null },
        hrSettings: { branchNetworkEnabled: false, branchIpAllowlist: "41.33.0.0/16\n196.210.10.5" },
      }),
      (err) => err.geofenceData?.requiresLocation === true,
    );
    const lastRow = rows.at(-1);
    assert.notStrictEqual(lastRow.result, "SUCCESS");
    assert.strictEqual(lastRow.result, "LOCATION_MISSING");
    assert.strictEqual(lastRow.branchIpMatch, false);
  });

  testCase("11) branchNetworkEnabled=false + IP in allowlist + out-of-range location → GEOFENCE_FAILED (no bypass)", async () => {
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "OFFICE", location: locationAt(2000, 30) },
        hrSettings: { branchNetworkEnabled: false, branchIpAllowlist: "41.33.0.0/16\n196.210.10.5" },
      }),
      (err) => err.geofenceData?.failure === "OUT_OF_RANGE",
    );
    const lastRow = rows.at(-1);
    assert.notStrictEqual(lastRow.result, "SUCCESS");
    assert.strictEqual(lastRow.result, "GEOFENCE_FAILED");
  });

  testCase("12) branchNetworkEnabled=false + matching SSID → LOCATION_MISSING (no bypass)", async () => {
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "OFFICE", wifiSsid: "BranchOffice-5G", location: null },
        hrSettings: { branchNetworkEnabled: false, branchWifiSsid: "BranchOffice-5G", branchIpAllowlist: null },
      }),
      (err) => err.geofenceData?.requiresLocation === true,
    );
    const lastRow = rows.at(-1);
    assert.notStrictEqual(lastRow.result, "SUCCESS");
    assert.strictEqual(lastRow.result, "LOCATION_MISSING");
  });

  testCase("13) branchNetworkEnabled=true + matching SSID → SUCCESS with reason: branch_network_ssid", async () => {
    const res = await call({
      data: { method: "self_service", workMode: "OFFICE", wifiSsid: "BranchOffice-5G" },
      hrSettings: { branchNetworkEnabled: true, branchWifiSsid: "BranchOffice-5G", branchIpAllowlist: null },
    });
    assert.strictEqual(res.method, "network");
    const lastRow = rows.at(-1);
    assert.strictEqual(lastRow.result, "SUCCESS");
    assert.strictEqual(lastRow.reason, "branch_network_ssid");
  });

  testCase("14) branchNetworkEnabled missing / null / undefined → fail-closed (LOCATION_MISSING)", async () => {
    // null toggle
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "OFFICE", wifiSsid: "BranchOffice-5G", location: null },
        hrSettings: { branchNetworkEnabled: null, branchWifiSsid: "BranchOffice-5G", branchIpAllowlist: "41.33.0.0/16" },
      }),
      (err) => err.geofenceData?.requiresLocation === true,
    );
    assert.strictEqual(rows.at(-1).result, "LOCATION_MISSING");

    // undefined toggle (omitted from hrSettings)
    const { branchNetworkEnabled, ...settingsWithoutToggle } = baseSettings;
    await assert.rejects(
      () => call({
        data: { method: "self_service", workMode: "OFFICE", wifiSsid: "BranchOffice-5G", location: null },
        hrSettings: { ...settingsWithoutToggle, branchWifiSsid: "BranchOffice-5G", branchIpAllowlist: "41.33.0.0/16" },
      }),
      (err) => err.geofenceData?.requiresLocation === true,
    );
    assert.strictEqual(rows.at(-1).result, "LOCATION_MISSING");
  });
});

if (!isJest) {
  (async () => {
    for (const { name, fn } of tests) {
      await fn();
      console.log(`✅ ${name}`);
    }
    console.log("\nAll attendance verification tests passed.");
  })().catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  });
}
