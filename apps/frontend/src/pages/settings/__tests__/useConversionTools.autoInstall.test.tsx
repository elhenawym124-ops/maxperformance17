/* @vitest-environment jsdom */

import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "../../../i18n";
import { useConversionTools } from "../useConversionTools";
import { findToolById } from "../conversionToolMeta";

const { mockGet, mockPost, mockPut } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockPost: vi.fn(),
  mockPut: vi.fn(),
}));

vi.mock("../../../hooks/useAuthSimple", () => ({
  useAuth: () => ({
    isLoading: false,
    isAuthenticated: true,
    user: {
      id: "user-1",
      companyId: "company-1",
      company: { slug: "mystore" },
    },
  }),
}));

vi.mock("../../../services/apiClient", () => ({
  apiClient: {
    get: mockGet,
    post: mockPost,
    put: mockPut,
  },
}));

describe("useConversionTools auto-install behavior", () => {
  it("allows toggling and auto-installs app when parent app is not initially installed", async () => {
    let appsInDb: any[] = [];

    mockGet.mockImplementation(async (url: string) => {
      if (url === "/my-apps") {
        return { data: { data: appsInDb } };
      }
      return { data: {} };
    });

    mockPost.mockImplementation(async (url: string) => {
      if (url.includes("/marketplace/apps/conversion-suite/install")) {
        const newApp = {
          id: "new-installed-app-id",
          status: "ACTIVE",
          app: { slug: "conversion-suite", name: "Conversion Suite" },
          settings: {
            general: { enabled: true },
            modules: {},
          },
        };
        appsInDb = [newApp];
        return {
          data: {
            success: true,
            data: newApp,
          },
        };
      }
      return { data: {} };
    });

    mockPut.mockResolvedValue({ data: { success: true } });

    const stickyTool = findToolById("stickyAddToCart")?.tool;
    expect(stickyTool).toBeDefined();

    const { result } = renderHook(() => useConversionTools(["conversion-suite"]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Check availability is true even if not installed
    const availability = result.current.getToolAvailability(stickyTool!);
    expect(availability.available).toBe(true);

    // Enabled should initially be false
    expect(result.current.getToolEnabled(stickyTool!)).toBe(false);

    // Toggle tool ON
    await act(async () => {
      await result.current.handleToolToggle(stickyTool!, true);
    });

    // Verify install was called
    expect(mockPost).toHaveBeenCalledWith("/marketplace/apps/conversion-suite/install", {});

    // Verify put settings was called
    expect(mockPut).toHaveBeenCalledWith(
      "/my-apps/new-installed-app-id/settings",
      expect.objectContaining({
        settings: expect.objectContaining({
          general: expect.objectContaining({ enabled: true }),
          modules: expect.objectContaining({ stickyAddToCart: true }),
        }),
      }),
    );

    // Verify tool is now enabled in state
    expect(result.current.getToolEnabled(stickyTool!)).toBe(true);
  });

  it("auto-installs and saves field when editing a tool field before app is installed", async () => {
    let appsInDb: any[] = [];

    mockGet.mockImplementation(async (url: string) => {
      if (url === "/my-apps") {
        return { data: { data: appsInDb } };
      }
      return { data: {} };
    });

    mockPost.mockImplementation(async (url: string) => {
      if (url.includes("/marketplace/apps/conversion-suite/install")) {
        const newApp = {
          id: "field-installed-app-id",
          status: "ACTIVE",
          app: { slug: "conversion-suite", name: "Conversion Suite" },
          settings: {
            general: { enabled: true },
            modules: {},
            thresholds: {},
          },
        };
        appsInDb = [newApp];
        return {
          data: {
            success: true,
            data: newApp,
          },
        };
      }
      return { data: {} };
    });

    mockPut.mockResolvedValue({ data: { success: true } });

    const freeShippingTool = findToolById("freeShippingBar")?.tool;
    expect(freeShippingTool).toBeDefined();
    const thresholdField = freeShippingTool?.fields?.[0];
    expect(thresholdField).toBeDefined();

    const { result } = renderHook(() => useConversionTools(["conversion-suite"]));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Save field before app is installed
    await act(async () => {
      await result.current.handleToolFieldSave(
        freeShippingTool!,
        thresholdField!,
        "500",
      );
    });

    // Verify install was called
    expect(mockPost).toHaveBeenCalledWith(
      "/marketplace/apps/conversion-suite/install",
      {},
    );

    // Verify settings were saved with updated field
    expect(mockPut).toHaveBeenCalledWith(
      "/my-apps/field-installed-app-id/settings",
      expect.objectContaining({
        settings: expect.objectContaining({
          thresholds: expect.objectContaining({
            freeShippingAmount: 500,
          }),
        }),
      }),
    );
  });
});
