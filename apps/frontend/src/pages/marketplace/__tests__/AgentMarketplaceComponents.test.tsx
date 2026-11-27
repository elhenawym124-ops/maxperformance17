// @vitest-environment jsdom
import React from "react";
import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import AgentMarketplacePage from "../agents/AgentMarketplacePage";
import { AgentProfileDrawer } from "../agents/AgentProfileDrawer";
import { AgentHireModal } from "../agents/AgentHireModal";
import { AgentListing } from "../agents/agentMarketplaceData";

const { mockApiGet, mockApiPost, mockApiPatch } = vi.hoisted(() => ({
  mockApiGet: vi.fn(),
  mockApiPost: vi.fn(),
  mockApiPatch: vi.fn(),
}));

let mockUserRole = "COMPANY_ADMIN";

vi.mock("../../../services/apiClient", () => ({
  apiClient: {
    get: (...args: unknown[]) => mockApiGet(...args),
    post: (...args: unknown[]) => mockApiPost(...args),
    patch: (...args: unknown[]) => mockApiPatch(...args),
  },
}));

vi.mock("../../../hooks/useAuthSimple", () => ({
  useOptionalAuth: () => ({
    user: { id: "u-1", role: mockUserRole },
  }),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockAgent: AgentListing = {
  id: "agent_facebook_media_buyer",
  slug: "facebook-media-buyer-agent",
  name: "Facebook Media Buyer Agent",
  role: "MEDIA_BUYER",
  position: "مدير إعلانات Meta والأداء التسويقي",
  summary: "تحليل هوامش الربح وبناء مسودات حملات فيسبوك وإنستغرام الآمنة.",
  category: "marketing",
  kind: "solo",
  tier: "pro",
  priceMonthly: 490,
  currency: "ج.م",
  visible: true,
  channels: ["facebook", "dashboard"],
  channelLabels: ["فيسبوك وإنستغرام", "لوحة التحكم"],
  department: "marketing",
  governance: "human_in_loop",
  toolsCount: 5,
  capabilities: [
    "تحليل وإعداد مسودات حملات إعلانات Meta",
    "رصد إعلانات وأسعار المنافسين في السوق",
  ],
  boundaries: [
    "لا ينفذ أي قرار مالي أو تعديل حساس دون موافقة صريحة من مسؤول الحساب.",
  ],
  dialect: "العربية المصرية المهنية",
  isHired: false,
};

const mockSquadAgent: AgentListing = {
  ...mockAgent,
  id: "agent_aov_squad",
  slug: "aov-specialist-agent",
  name: "شادي — فريق AOV",
  role: "AOV_SPECIALIST",
  position: "فريق متكامل لرفع متوسط قيمة الطلب (AOV)",
  category: "growth",
  kind: "squad",
  priceMonthly: 590,
  squadMembers: ["aov-specialist-agent", "aov-analyst-agent"],
  squadMemberDetails: [
    { slug: "aov-specialist-agent", name: "شادي", position: "قائد الفريق", role: "AOV_SPECIALIST" },
    { slug: "aov-analyst-agent", name: "محلل AOV", position: "استخراج المؤشرات", role: "AOV_ANALYST" },
  ],
};

describe("Agent Marketplace Redesigned Components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUserRole = "COMPANY_ADMIN";
    mockApiGet.mockImplementation((url: string) => {
      if (url === "/agent-manager/catalog") {
        return Promise.resolve({
          data: {
            success: true,
            agents: [mockAgent, mockSquadAgent],
            categories: [],
            kinds: [],
            stats: {
              total: 2,
              totalDiscovered: 40,
              visibleCount: 35,
              hiddenCount: 5,
              hiredCount: 0,
              freeCount: 0,
              proCount: 2,
              squadCount: 1,
              soloCount: 1,
              verticalCount: 0,
            },
            walletBalance: 1500,
            defaultNewAgentVisible: true,
            isSuperAdmin: mockUserRole === "SUPER_ADMIN",
          },
        });
      }
      return Promise.resolve({
        data: {
          success: true,
          data: { balance: 1500 },
        },
      });
    });
    mockApiPost.mockResolvedValue({
      status: 201,
      data: { success: true, id: "spawned-1" },
    });
    mockApiPatch.mockResolvedValue({
      status: 200,
      data: { success: true, agent: { ...mockAgent, visible: false } },
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders AgentMarketplacePage from live catalog and filters by agent kind", async () => {
    render(
      <MemoryRouter>
        <AgentMarketplacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText("Facebook Media Buyer Agent")).toBeInTheDocument();
      expect(screen.getByText("شادي — فريق AOV")).toBeInTheDocument();
    });

    // Filter to Squads only
    fireEvent.click(screen.getByRole("button", { name: "فريق متكامل" }));
    expect(screen.getByText("شادي — فريق AOV")).toBeInTheDocument();
    expect(screen.queryByText("Facebook Media Buyer Agent")).not.toBeInTheDocument();
  });

  it("exposes Super Admin visibility controls and calls PATCH /agent-manager/catalog/:slug", async () => {
    mockUserRole = "SUPER_ADMIN";
    render(
      <MemoryRouter>
        <AgentMarketplacePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /إدارة السوق/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /إدارة السوق/i }));

    await waitFor(() => {
      expect(screen.getAllByRole("button", { name: /إخفاء من السوق/i }).length).toBeGreaterThan(0);
    });

    fireEvent.click(screen.getAllByRole("button", { name: /إخفاء من السوق/i })[0]);

    await waitFor(() => {
      expect(mockApiPatch).toHaveBeenCalledWith(
        "/agent-manager/catalog/facebook-media-buyer-agent",
        { visible: false }
      );
    });
  });

  it("renders AgentProfileDrawer with truthful capabilities and governance without fake telemetry", () => {
    const handleClose = vi.fn();
    const handleHire = vi.fn();

    render(
      <MemoryRouter>
        <AgentProfileDrawer
          agent={mockAgent}
          open={true}
          onClose={handleClose}
          onHire={handleHire}
          isHired={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Facebook Media Buyer Agent")).toBeInTheDocument();
    expect(screen.getByText("تحليل وإعداد مسودات حملات إعلانات Meta")).toBeInTheDocument();
    expect(screen.getByText("مسودات بموافقة التاجر")).toBeInTheDocument();

    const hireBtn = screen.getByRole("button", { name: /توظيف الوكيل في فريقي/i });
    fireEvent.click(hireBtn);
    expect(handleHire).toHaveBeenCalledWith(mockAgent);
  });

  it("renders AgentHireModal, checks real wallet balance, and blocks hire when balance fails without faking 2400", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("Network error"));
    const handleClose = vi.fn();
    const handleHired = vi.fn();

    render(
      <MemoryRouter>
        <AgentHireModal
          agent={mockAgent}
          open={true}
          onClose={handleClose}
          onHired={handleHired}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/تعذر التحقق من رصيد المحفظة/i)).toBeInTheDocument();
    });

    const submitBtn = screen.getByRole("button", { name: /تأكيد تعيين الوكيل/i });
    expect(submitBtn).toBeDisabled();
  });

  it("submits hire request cleanly when wallet balance covers Pro price", async () => {
    const handleClose = vi.fn();
    const handleHired = vi.fn();

    render(
      <MemoryRouter>
        <AgentHireModal
          agent={mockAgent}
          open={true}
          onClose={handleClose}
          onHired={handleHired}
        />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(mockApiGet).toHaveBeenCalledWith("/wallet/balance");
      expect(screen.getByText(/الرصيد يغطي الاشتراك/i)).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /تأكيد تعيين الوكيل/i }));

    await waitFor(() => {
      expect(mockApiPost).toHaveBeenCalledWith(
        "/agent-manager/hire",
        expect.objectContaining({
          templateSlug: "facebook-media-buyer-agent",
        })
      );
      expect(handleHired).toHaveBeenCalledWith(
        "facebook-media-buyer-agent",
        "Facebook Media Buyer Agent"
      );
      expect(handleClose).toHaveBeenCalled();
    });
  });
});
