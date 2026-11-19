/* @vitest-environment jsdom */

import React from "react";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SuperAdminDashboard from "../SuperAdminDashboard";
import { formatServiceName, formatServiceCategory, formatResourceUsage } from "../super-admin-dashboard/SuperAdminSystemServices";
import { formatAlertCategory } from "../super-admin-dashboard/SuperAdminAlertsPanel";
import { formatUptime, formatLatency } from "../super-admin-dashboard/SuperAdminSystemHealth";
import { SuperAdminDashboardHeader } from "../super-admin-dashboard/SuperAdminDashboardHeader";
import { SuperAdminSystemServices } from "../super-admin-dashboard/SuperAdminSystemServices";
import { SuperAdminAlertsPanel } from "../super-admin-dashboard/SuperAdminAlertsPanel";
import { SuperAdminSystemHealth } from "../super-admin-dashboard/SuperAdminSystemHealth";

const mockLiveServicesData = [
  {
    systemName: "default_agent_template",
    displayName: "Default Agent Template",
    category: "ai",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "product_embeddings",
    displayName: "Product Embedding Auto Regeneration",
    category: "ai",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "ready_agent_profiles",
    displayName: "Ready Agent Profiles",
    category: "ai",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "kashier_platform",
    displayName: "Kashier Platform Payment Gateway Settings",
    category: "platform",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "platform_onboarding",
    displayName: "Platform onboarding settings",
    category: "platform",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "platform_default_sidebar",
    displayName: "Platform Default Sidebar",
    category: "platform-site",
    isEnabled: true,
    resourceUsage: "unknown",
  },
  {
    systemName: "support_whatsapp",
    displayName: "Support WhatsApp",
    category: "support",
    isEnabled: true,
    resourceUsage: "unknown",
  },
];

const mockLiveAlertsData = [
  {
    id: "alt-1",
    type: "warning",
    message: "محاولة تسجيل دخول جديدة من جهاز غير معروف",
    category: "AUTH",
    action: "REVIEW",
    timestamp: new Date().toISOString(),
  },
  {
    id: "alt-2",
    type: "warning",
    message: "تسجيل دخول غير معتاد",
    category: "AUTH",
    action: "REVIEW",
    timestamp: new Date().toISOString(),
  },
];

const mockDashboardData = {
  overview: {
    totalCompanies: 48,
    activeCompanies: 42,
    totalUsers: 312,
    totalCustomers: 8540,
    totalConversations: 24100,
  },
  comparison: {
    companiesGrowth: 12.5,
    usersGrowth: 8.4,
    customersGrowth: 15.2,
  },
  recentActivity: {
    newCompaniesLast30Days: 6,
    newUsersLast30Days: 24,
    newCustomersLast30Days: 450,
  },
  trends: [
    { date: "2026-10-01", companies: 42, users: 290, customers: 8100 },
    { date: "2026-10-15", companies: 45, users: 300, customers: 8300 },
    { date: "2026-10-24", companies: 48, users: 312, customers: 8540 },
  ],
  health: {
    status: "healthy",
    uptime: 0, // tests 0d 0h -> ٠ يوم ٠ ساعة
    database: "connected",
    dbStats: {
      queryCount: 15200,
      latency: 2, // tests 2ms -> ٢ مللي ثانية
      queue: 0,
      active: 8,
    },
    environment: "production",
    timestamp: new Date().toISOString(),
  },
  systems: mockLiveServicesData,
  alerts: mockLiveAlertsData,
};

let mockAuthUser: any = {
  id: "usr-sa-1",
  firstName: "Super",
  lastName: "Admin",
  role: "SUPER_ADMIN",
};

vi.mock("../../hooks/useAuthSimple", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    isAuthenticated: true,
  }),
}));

vi.mock("../../hooks/useTheme", () => ({
  useTheme: () => ({
    actualTheme: "dark",
  }),
}));

vi.mock("../../components/ActiveUsersMonitor", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="active-users-monitor">
        <span>مراقبة المستخدمين النشطين</span>
        <button onClick={onClose}>إغلاق</button>
      </div>
    ) : null,
}));

vi.mock("../super-admin/dashboard/PlatformOperationsPulse", () => ({
  PlatformOperationsPulse: () => (
    <div data-testid="platform-operations-pulse">نبض العمليات التشغيلية</div>
  ),
}));

global.fetch = vi.fn((url: string | URL | Request) => {
  const urlStr = String(url);
  if (urlStr.includes("admin/dashboard/aggregated")) {
    return Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ success: true, data: mockDashboardData }),
    } as Response);
  }
  return Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({ success: true }),
  } as Response);
});

describe("SuperAdminDashboard - Complete Arabic Localization", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthUser = {
      id: "usr-sa-1",
      firstName: "Super",
      lastName: "Admin",
      role: "SUPER_ADMIN",
    };
  });

  afterEach(() => {
    cleanup();
  });

  it("translates greeting 'Super Admin' into 'مدير النظام' and avoids 'Super Admin'", async () => {
    render(<SuperAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("لوحة تحكم مدير النظام")).toBeTruthy();
      expect(screen.getByText(/مرحباً مدير النظام/)).toBeTruthy();
      expect(screen.queryByText(/Super Admin/i)).toBeNull();
    });
  });

  it("displays regular user name when user is not Super Admin", () => {
    render(
      <SuperAdminDashboardHeader
        user={{ firstName: "مختار", lastName: "الحناوي" }}
        isRefreshing={false}
        onOpenActiveUsers={vi.fn()}
        onRefresh={vi.fn()}
      />
    );

    expect(screen.getByText(/مرحباً مختار الحناوي/)).toBeTruthy();
    expect(screen.queryByText(/Super Admin/i)).toBeNull();
  });

  it("translates all 7 live system services to Arabic", async () => {
    render(<SuperAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("خدمات النظام الأساسية")).toBeTruthy();
      expect(screen.getByText("القالب الافتراضي للمساعد الذكي")).toBeTruthy();
      expect(screen.getByText("التحديث التلقائي لتضمين المنتجات")).toBeTruthy();
      expect(screen.getByText("الملفات الجاهزة للمساعد الذكي")).toBeTruthy();
      expect(screen.getByText("إعدادات بوابة دفع كاشير للمنصة")).toBeTruthy();
      expect(screen.getByText("إعدادات التهيئة والترحيب بالمنصة")).toBeTruthy();
      expect(screen.getByText("الشريط الجانبي الافتراضي للمنصة")).toBeTruthy();
      expect(screen.getByText("دعم واتساب الفني للمنصة")).toBeTruthy();
    });
  });

  it("translates all service categories (ai, platform, platform-site, support) to Arabic", () => {
    expect(formatServiceCategory("ai")).toBe("ذكاء اصطناعي");
    expect(formatServiceCategory("platform")).toBe("المنصة");
    expect(formatServiceCategory("platform-site")).toBe("موقع المنصة");
    expect(formatServiceCategory("support")).toBe("الدعم");
  });

  it("translates 'unknown' resource usage to 'غير معروف' for all 7 services with zero regression", async () => {
    render(<SuperAdminSystemServices systems={mockLiveServicesData} />);

    const unknownBadges = screen.getAllByText("غير معروف");
    expect(unknownBadges.length).toBe(7);
    expect(screen.queryByText("unknown")).toBeNull();
  });

  it("translates 'AUTH' category in alerts panel to 'دخول' with zero 'AUTH'", async () => {
    render(<SuperAdminAlertsPanel alerts={mockLiveAlertsData} />);

    // Check that exact category badge rendered 'دخول' for both alerts
    const categoryBadges = screen.getAllByText((content, element) => {
      return element?.tagName.toLowerCase() === "p" && content.startsWith("دخول ·");
    });
    expect(categoryBadges.length).toBe(2);
    expect(screen.queryByText(/AUTH/)).toBeNull();
  });

  it("formats uptime '0d 0h' into Arabic '٠ يوم ٠ ساعة' and eliminates English units", () => {
    expect(formatUptime(0)).toBe("٠ يوم ٠ ساعة");
    expect(formatUptime(172800)).toBe("٢ يوم ٠ ساعة");

    render(
      <SuperAdminSystemHealth
        health={{
          status: "healthy",
          uptime: 0,
          database: "connected",
          dbStats: { queryCount: 100, latency: 2, queue: 0, active: 1 },
          environment: "production",
          timestamp: new Date().toISOString(),
        }}
      />
    );

    expect(screen.getByText("٠ يوم ٠ ساعة")).toBeTruthy();
    expect(screen.queryByText(/0d\s*0h/i)).toBeNull();
  });

  it("formats latency in Arabic (2ms -> ٢ مللي ثانية, 3404ms -> ٣٫٤ ثانية)", () => {
    expect(formatLatency(2)).toBe("٢ مللي ثانية");
    expect(formatLatency(3404)).toBe("٣٫٤ ثانية");

    render(
      <SuperAdminSystemHealth
        health={{
          status: "healthy",
          uptime: 3600,
          database: "connected",
          dbStats: { queryCount: 100, latency: 2, queue: 0, active: 1 },
          environment: "production",
          timestamp: new Date().toISOString(),
        }}
      />
    );

    expect(screen.getByText("٢ مللي ثانية")).toBeTruthy();
    expect(screen.queryByText(/2ms/i)).toBeNull();
  });

  it("satisfies all acceptance criteria: zero unknown, zero AUTH, zero 0d 0h, zero ms, zero Super Admin", async () => {
    const { container } = render(<SuperAdminDashboard />);

    await waitFor(() => {
      expect(screen.getByText("خدمات النظام الأساسية")).toBeTruthy();
    });

    const textContent = container.textContent || "";

    // Criterion 1: Zero "unknown"
    expect(textContent).not.toContain("unknown");

    // Criterion 2: Zero "AUTH" (case-sensitive badge/category)
    expect(textContent).not.toMatch(/\bAUTH\b/);

    // Criterion 3: Zero "0d 0h"
    expect(textContent).not.toMatch(/0d\s*0h/i);

    // Criterion 4: Zero English ms latency
    expect(textContent).not.toMatch(/\b\d+ms\b/);

    // Criterion 5: Zero "Super Admin"
    expect(textContent).not.toMatch(/Super\s*Admin/i);
  });
});
