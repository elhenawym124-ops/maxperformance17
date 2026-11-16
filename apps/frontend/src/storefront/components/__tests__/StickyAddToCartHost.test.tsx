// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import { render, screen, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import StickyAddToCartHost from "../StickyAddToCartHost";

const {
  mockUseLocation,
  mockUseProduct,
  mockUseStorefrontSettings,
  mockGetMarketplaceSettings,
  mockIsMarketplaceEnabled,
} = vi.hoisted(() => ({
  mockUseLocation: vi.fn(),
  mockUseProduct: vi.fn(),
  mockUseStorefrontSettings: vi.fn(),
  mockGetMarketplaceSettings: vi.fn(),
  mockIsMarketplaceEnabled: vi.fn(),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => mockUseLocation(),
}));

vi.mock("../../hooks/useProduct", () => ({
  useProduct: (...args: unknown[]) => mockUseProduct(...args),
}));

vi.mock("../../hooks/useStorefrontSettings", () => ({
  useStorefrontSettings: () => mockUseStorefrontSettings(),
}));

vi.mock("../../engine/ThemeProvider", () => ({
  useStorefrontTheme: () => ({
    theme: {
      id: "modern-electronics",
      direction: "rtl",
    },
  }),
}));

vi.mock("../../utils/marketplaceApps", () => ({
  getStorefrontMarketplaceAppSettings: (...args: unknown[]) =>
    mockGetMarketplaceSettings(...args),
  isStorefrontMarketplaceAppEnabled: (...args: unknown[]) =>
    mockIsMarketplaceEnabled(...args),
}));

vi.mock("../../utils/appUsageTracking", () => ({
  trackStorefrontAppUsage: vi.fn(),
}));

describe("StickyAddToCartHost", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseLocation.mockReturnValue({
      pathname: "/products/product-123",
      search: "",
    });

    mockUseProduct.mockReturnValue({
      product: {
        id: "product-123",
        name: "منتج تجريبي",
        price: 150,
        images: ["https://example.com/image.jpg"],
      },
    });

    mockUseStorefrontSettings.mockReturnValue({
      settings: {
        productPageCheckout: true,
      },
    });

    mockIsMarketplaceEnabled.mockReturnValue(true);

    mockGetMarketplaceSettings.mockImplementation((_settings, slug) => {
      if (slug === "conversion-suite") {
        return {
          general: { enabled: true },
          modules: { stickyAddToCart: true },
          ui: { stickyStyle: "compact" },
        };
      }
      return {};
    });
  });

  afterEach(() => {
    const el = document.getElementById("storefront-buy-actions");
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  });

  it("renders the sticky add to cart bar on standard themes when buy box is not visible even with inline checkout enabled", async () => {
    // Add buybox element in DOM
    const buybox = document.createElement("div");
    buybox.id = "storefront-buy-actions";
    document.body.appendChild(buybox);

    let observerCallback: ((entries: IntersectionObserverEntry[]) => void) | null = null;

    class MockIntersectionObserver {
      constructor(callback: (entries: IntersectionObserverEntry[]) => void) {
        observerCallback = callback;
      }
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }

    window.IntersectionObserver = MockIntersectionObserver as unknown as typeof IntersectionObserver;

    render(<StickyAddToCartHost />);

    // Trigger intersection observer callback with isIntersecting = false (scrolled past)
    expect(observerCallback).toBeTruthy();
    act(() => {
      observerCallback!([
        {
          isIntersecting: false,
          target: buybox,
        } as unknown as IntersectionObserverEntry,
      ]);
    });

    // Product name and price should be rendered inside sticky bar
    expect(await screen.findByText("منتج تجريبي")).toBeInTheDocument();
    expect(screen.getByText(/150/)).toBeInTheDocument();

    document.body.removeChild(buybox);
  });
});
