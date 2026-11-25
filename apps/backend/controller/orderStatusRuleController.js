const { getSharedPrismaClient } = require("../services/sharedDatabase");
const { isValidOrderStatusEnum } = require("../utils/orderStatusEnum");

// 🛡️ PRODUCTION-FIX (cron-validation-2026-08-23):
// يطابق الـ switch في orderStatusAutoChangeCron.js:12-19 — أي قيمة تانية
// بتتـ default لـ Minutes (silent)، اللي كان يـ enable rule زي
// `fromStatus=DELIVERED toStatus=PENDING waitTime=0` بـ intent خفيث.
const ALLOWED_TIME_UNITS = Object.freeze(['Minutes', 'Hours', 'Days']);

// حد أعلى لوقت الانتظار (525600 = 365 يوم بالدقايق) — يحمي من abuse.
const MAX_WAIT_TIME = 525600;

exports.getRules = async (req, res) => {
  try {
    const companyId = req.user?.effectiveCompanyId || req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "غير مصرح بالوصول" });

    const rules = await getSharedPrismaClient().orderStatusAutoChangeRule.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });
    res.status(200).json({ success: true, data: rules });
  } catch (error) {
    console.error("Error fetching status rules:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم" });
  }
};

exports.createRule = async (req, res) => {
  try {
    const companyId = req.user?.effectiveCompanyId || req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "غير مصرح بالوصول" });

    const { fromStatus, toStatus, waitTime, timeUnit } = req.body || {};

    // 1. Field presence
    if (
      fromStatus === undefined || fromStatus === null || fromStatus === "" ||
      toStatus === undefined || toStatus === null || toStatus === "" ||
      waitTime === undefined || waitTime === null ||
      timeUnit === undefined || timeUnit === null || timeUnit === ""
    ) {
      return res.status(400).json({ success: false, message: "كل الحقول مطلوبة" });
    }

    // 2. Normalize status codes
    const normalizedFrom = String(fromStatus).trim().toUpperCase();
    const normalizedTo = String(toStatus).trim().toUpperCase();

    // 3. Same-status check — القاعدة لازم تنقل لحالة مختلفة
    if (normalizedFrom === normalizedTo) {
      return res.status(400).json({
        success: false,
        message: "حالة المصدر وحالة الهدف يجب أن تكونا مختلفتين",
      });
    }

    // 4. timeUnit whitelist — بيمنع `fortnights`/`Seconds` silent fallback
    const normalizedTimeUnit = String(timeUnit).trim();
    if (!ALLOWED_TIME_UNITS.includes(normalizedTimeUnit)) {
      return res.status(400).json({
        success: false,
        message: `وحدة الوقت يجب أن تكون واحدة من: ${ALLOWED_TIME_UNITS.join("، ")}`,
      });
    }

    // 5. waitTime: integer موجب ضمن حدود معقولة
    // (parseInt("abc") = NaN → كان بيـ poison الـ cron بـ Invalid Date)
    const parsedWaitTime = Number(waitTime);
    if (
      !Number.isInteger(parsedWaitTime) ||
      parsedWaitTime < 1 ||
      parsedWaitTime > MAX_WAIT_TIME
    ) {
      return res.status(400).json({
        success: false,
        message: `وقت الانتظار يجب أن يكون رقماً صحيحاً بين 1 و ${MAX_WAIT_TIME}`,
      });
    }

    const prisma = getSharedPrismaClient();

    // Helper: validate status candidate (either valid enum OR active custom status in orderStatusConfig with mapsToSystem)
    const validateStatusCandidate = async (statusCandidate) => {
      if (isValidOrderStatusEnum(statusCandidate)) {
        return { valid: true, canonicalCode: statusCandidate, isCustom: false };
      }
      try {
        const config = await prisma.orderStatusConfig.findFirst({
          where: {
            companyId,
            code: { equals: statusCandidate, mode: "insensitive" },
            isActive: true,
          },
          select: { code: true, mapsToSystem: true },
        });
        if (config?.mapsToSystem && isValidOrderStatusEnum(String(config.mapsToSystem).toUpperCase())) {
          return {
            valid: true,
            canonicalCode: String(config.code || statusCandidate).trim().toUpperCase(),
            isCustom: true,
            mapsToSystem: String(config.mapsToSystem).toUpperCase(),
          };
        }
      } catch (err) {
        console.warn(`[ORDER-STATUS-RULE-CONTROLLER] Error validating status candidate "${statusCandidate}":`, err.message);
      }
      return { valid: false };
    };

    // 6. fromStatus: إما enum value مباشرة، أو custom code من orderStatusConfig
    // عنده mapsToSystem صالح في إعدادات الشركة
    const fromValidation = await validateStatusCandidate(normalizedFrom);
    if (!fromValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `حالة المصدر "${normalizedFrom}" غير صالحة. يجب أن تكون حالة نظامية معتمدة أو حالة مخصصة مفعلة في إعدادات المتجر ولها ربط بحالات النظام.`,
      });
    }

    // 7. toStatus: إما enum value مباشرة، أو custom code من orderStatusConfig
    // عنده mapsToSystem صالح في إعدادات الشركة
    const toValidation = await validateStatusCandidate(normalizedTo);
    if (!toValidation.valid) {
      return res.status(400).json({
        success: false,
        message: `حالة الهدف "${normalizedTo}" غير صالحة. يجب أن تكون حالة نظامية معتمدة أو حالة مخصصة مفعلة في إعدادات المتجر ولها ربط بحالات النظام.`,
      });
    }

    const finalFrom = fromValidation.canonicalCode;
    const finalTo = toValidation.canonicalCode;

    if (finalFrom === finalTo) {
      return res.status(400).json({
        success: false,
        message: "حالة المصدر وحالة الهدف يجب أن تكونا مختلفتين",
      });
    }

    const rule = await getSharedPrismaClient().orderStatusAutoChangeRule.create({
      data: {
        companyId,
        fromStatus: finalFrom,
        toStatus: finalTo,
        waitTime: parsedWaitTime,
        timeUnit: normalizedTimeUnit,
      },
    });

    // 🛡️ PRODUCTION-FIX: شيلنا الـ console.log اللي كان بيـ leak الـ rule
    // (companyId, fromStatus, toStatus) في production logs.
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    console.error("Error creating status rule:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم" });
  }
};

exports.deleteRule = async (req, res) => {
  try {
    const companyId = req.user?.effectiveCompanyId || req.user?.companyId;
    const { id } = req.params;

    if (!companyId) return res.status(401).json({ success: false, message: "غير مصرح بالوصول" });

    // 🛡️ PRODUCTION-FIX: استخدم deleteMany بـ compound where عشان:
    // 1. يتجنب TOCTOU بين الـ findUnique والـ delete.
    // 2. الـ response shape يبقى consistent مع باقي الـ APIs.
    const result = await getSharedPrismaClient().orderStatusAutoChangeRule.deleteMany({
      where: { id, companyId },
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, message: "القاعدة غير موجودة" });
    }

    res.status(200).json({ success: true, message: "تم حذف القاعدة بنجاح" });
  } catch (error) {
    console.error("Error deleting status rule:", error);
    res.status(500).json({ success: false, message: "خطأ في الخادم" });
  }
};

exports.getAutomationReports = async (req, res) => {
  try {
    const companyId = req.user?.effectiveCompanyId || req.user?.companyId;
    if (!companyId) return res.status(401).json({ success: false, message: "غير مصرح بالوصول" });

    const { startDate, endDate, type, fromStatus, toStatus } = req.query || {};

    let start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();
    if (Number.isNaN(start.getTime())) start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    if (Number.isNaN(end.getTime())) end = new Date();
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const prisma = getSharedPrismaClient();

    // 1. Fetch company automation settings
    const company = await prisma.company.findUnique({
      where: { id: companyId },
      select: { settings: true },
    });
    let cs = {};
    if (company?.settings) {
      try {
        cs = typeof company.settings === "string" ? JSON.parse(company.settings) : company.settings;
      } catch (_) {}
    }

    // 2. Fetch active rules
    const rules = await prisma.orderStatusAutoChangeRule.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
    });

    // 3. Count total status transitions vs automated transitions in date range
    const totalsRaw = await prisma.$queryRawUnsafe(`
      SELECT
        COUNT(*)::int AS "totalTransitions",
        COUNT(*) FILTER (
          WHERE (
            UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%SYSTEM%'
            OR UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%AUTO%'
            OR UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%CRON%'
          )
        )::int AS "autoTransitions"
      FROM "OrderStatusHistory" h
      LEFT JOIN "orders" o ON o."id" = h."orderId"
      LEFT JOIN "GuestOrder" go ON go."id" = h."guestOrderId"
      WHERE (o."companyId" = $1 OR go."companyId" = $1)
        AND h."createdAt" >= $2
        AND h."createdAt" <= $3
    `, companyId, start, end);

    const totalTransitions = totalsRaw?.[0]?.totalTransitions || 0;
    const autoTransitionsCount = totalsRaw?.[0]?.autoTransitions || 0;
    const autoRate = totalTransitions > 0 ? Math.round((autoTransitionsCount / totalTransitions) * 1000) / 10 : 0;

    // 4. Fetch automated transition records
    const autoRows = await prisma.$queryRawUnsafe(`
      SELECT
        h.id,
        COALESCE(h."orderId", h."guestOrderId") AS "orderId",
        COALESCE(o."orderNumber", go."orderNumber", 'N/A') AS "orderNumber",
        COALESCE(o."customerName", go."guestName", 'N/A') AS "customerName",
        COALESCE(o."customerPhone", go."guestPhone", '') AS "customerPhone",
        COALESCE(o."total", go."total", 0)::float AS "total",
        COALESCE(o."status"::text, go."status"::text, 'UNKNOWN') AS "currentOrderStatus",
        h."oldStatus",
        h."status" AS "newStatus",
        h."changedBy",
        h."userName",
        h."reason",
        h."createdAt"
      FROM "OrderStatusHistory" h
      LEFT JOIN "orders" o ON o."id" = h."orderId"
      LEFT JOIN "GuestOrder" go ON go."id" = h."guestOrderId"
      WHERE (o."companyId" = $1 OR go."companyId" = $1)
        AND h."createdAt" >= $2
        AND h."createdAt" <= $3
        AND (
          UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%SYSTEM%'
          OR UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%AUTO%'
          OR UPPER(COALESCE(h."changedBy", '') || ' ' || COALESCE(h."userName", '')) LIKE '%CRON%'
        )
      ORDER BY h."createdAt" DESC
      LIMIT 1000
    `, companyId, start, end);

    // Classification helper
    const classify = (row) => {
      const reason = String(row.reason || "").toLowerCase();
      const changedBy = String(row.changedBy || "").toUpperCase();
      if (reason.includes("auto-changed by rule") || changedBy === "SYSTEM_AUTO") return "RULE";
      if (reason.includes("طباعة") || reason.includes("print")) return "PRINT";
      if (reason.includes("تربو") || reason.includes("turbo")) return "TURBO";
      return "OTHER_AUTO";
    };

    let rulesCount = 0;
    let printCount = 0;
    let turboCount = 0;
    let otherCount = 0;
    let totalRevenue = 0;
    const uniqueOrdersSet = new Set();
    const dailyMap = new Map();

    const enrichedRows = (autoRows || []).map((row) => {
      const rowType = classify(row);
      const total = Number(row.total || 0);

      if (rowType === "RULE") rulesCount++;
      else if (rowType === "PRINT") printCount++;
      else if (rowType === "TURBO") turboCount++;
      else otherCount++;

      if (row.orderId && !uniqueOrdersSet.has(row.orderId)) {
        uniqueOrdersSet.add(row.orderId);
        totalRevenue += total;
      }

      const dayKey = new Date(row.createdAt).toISOString().slice(0, 10);
      const dayStat = dailyMap.get(dayKey) || { date: dayKey, rules: 0, print: 0, turbo: 0, other: 0, total: 0 };
      if (rowType === "RULE") dayStat.rules++;
      else if (rowType === "PRINT") dayStat.print++;
      else if (rowType === "TURBO") dayStat.turbo++;
      else dayStat.other++;
      dayStat.total++;
      dailyMap.set(dayKey, dayStat);

      return {
        id: row.id,
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        customerName: row.customerName,
        customerPhone: row.customerPhone,
        total,
        currentOrderStatus: row.currentOrderStatus,
        oldStatus: row.oldStatus,
        newStatus: row.newStatus,
        reason: row.reason,
        type: rowType,
        createdAt: row.createdAt,
      };
    });

    // 5. Compute pending counts and outcomes for each rule
    const rulesPerformance = await Promise.all(
      rules.map(async (rule) => {
        const fromUpper = String(rule.fromStatus || "").trim().toUpperCase();
        const toUpper = String(rule.toStatus || "").trim().toUpperCase();

        const ruleExecutions = enrichedRows.filter(
          (r) => r.type === "RULE" &&
            String(r.oldStatus || "").toUpperCase() === fromUpper &&
            String(r.newStatus || "").toUpperCase() === toUpper
        );

        let executionsRevenue = 0;
        const ruleOrders = new Set();
        let delivered = 0;
        let cancelled = 0;
        let inProgress = 0;

        for (const ex of ruleExecutions) {
          if (!ruleOrders.has(ex.orderId)) {
            ruleOrders.add(ex.orderId);
            executionsRevenue += ex.total;
            const cur = String(ex.currentOrderStatus || "").toUpperCase();
            if (cur === "DELIVERED" || cur === "PARTIALLY_DELIVERED") delivered++;
            else if (cur === "CANCELLED" || cur === "RETURNED" || cur === "LOST") cancelled++;
            else inProgress++;
          }
        }

        // Current pending count in fromStatus
        let pendingCount = 0;
        try {
          const pendingRaw = await prisma.$queryRawUnsafe(`
            SELECT COUNT(*)::int AS count
            FROM "orders" o
            WHERE o."companyId" = $1
              AND (
                (o."status"::text = $2 AND (o."customStatusCode" IS NULL OR o."customStatusCode" = ''))
                OR LOWER(o."customStatusCode") = LOWER($2)
              )
          `, companyId, rule.fromStatus);
          pendingCount = pendingRaw?.[0]?.count || 0;
        } catch (_) {}

        return {
          id: rule.id,
          fromStatus: rule.fromStatus,
          toStatus: rule.toStatus,
          waitTime: rule.waitTime,
          timeUnit: rule.timeUnit,
          isActive: rule.isActive,
          executionsCount: ruleExecutions.length,
          totalRevenue: Math.round(executionsRevenue * 100) / 100,
          pendingCount,
          outcomes: {
            delivered,
            cancelled,
            inProgress,
          },
        };
      })
    );

    // 6. Events summary (Print & Turbo)
    let printRevenue = 0;
    const printOrders = new Set();
    enrichedRows.filter((r) => r.type === "PRINT").forEach((r) => {
      if (!printOrders.has(r.orderId)) {
        printOrders.add(r.orderId);
        printRevenue += r.total;
      }
    });

    let turboRevenue = 0;
    const turboOrders = new Set();
    enrichedRows.filter((r) => r.type === "TURBO").forEach((r) => {
      if (!turboOrders.has(r.orderId)) {
        turboOrders.add(r.orderId);
        turboRevenue += r.total;
      }
    });

    const eventsSummary = {
      print: {
        enabled: Boolean(cs.printAutomationEnabled),
        targetStatus: cs.printAutomationStatus || "",
        executionsCount: printCount,
        totalRevenue: Math.round(printRevenue * 100) / 100,
      },
      turbo: {
        enabled: Boolean(cs.turboAutomationEnabled),
        targetStatus: cs.turboAutomationStatus || "",
        executionsCount: turboCount,
        totalRevenue: Math.round(turboRevenue * 100) / 100,
      },
    };

    // Sort daily trends chronologically
    const dailyTrends = Array.from(dailyMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Optional filters applied to recent logs
    let filteredLogs = enrichedRows;
    if (type && type !== "all") {
      filteredLogs = filteredLogs.filter((r) => r.type === type.toUpperCase());
    }
    if (fromStatus) {
      filteredLogs = filteredLogs.filter((r) => String(r.oldStatus || "").toUpperCase() === String(fromStatus).toUpperCase());
    }
    if (toStatus) {
      filteredLogs = filteredLogs.filter((r) => String(r.newStatus || "").toUpperCase() === String(toStatus).toUpperCase());
    }

    res.status(200).json({
      success: true,
      data: {
        kpis: {
          totalTransitions: autoTransitionsCount,
          uniqueOrders: uniqueOrdersSet.size,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          autoRate,
          rulesTransitions: rulesCount,
          printTransitions: printCount,
          turboTransitions: turboCount,
          otherTransitions: otherCount,
        },
        rulesPerformance,
        eventsSummary,
        dailyTrends,
        recentLogs: filteredLogs.slice(0, 100),
      },
    });
  } catch (error) {
    console.error("Error generating automation reports:", error);
    res.status(500).json({ success: false, message: "خطأ في تحميل تقارير الأتمتة" });
  }
};
