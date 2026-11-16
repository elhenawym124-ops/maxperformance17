/**
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { applyNativeSafeArea, _resetNativeSafeAreaForTesting } from "../nativeSafeArea";
import { Capacitor } from "@capacitor/core";

// Mock @capacitor/core
vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(),
  },
}));

// Mock @capacitor/status-bar
const mockSetOverlaysWebView = vi.fn();
const mockGetInfo = vi.fn();

vi.mock("@capacitor/status-bar", () => ({
  StatusBar: {
    setOverlaysWebView: mockSetOverlaysWebView,
    getInfo: mockGetInfo,
  },
}));

describe("applyNativeSafeArea", () => {
  beforeEach(() => {
    _resetNativeSafeAreaForTesting();
    document.documentElement.style.removeProperty("--app-safe-top");
    document.documentElement.style.removeProperty("--app-safe-bottom");
    vi.clearAllMocks();
  });

  afterEach(() => {
    _resetNativeSafeAreaForTesting();
    document.documentElement.style.removeProperty("--app-safe-top");
    document.documentElement.style.removeProperty("--app-safe-bottom");
  });

  it("does nothing on web platform (web no-op)", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);

    await applyNativeSafeArea();

    expect(mockSetOverlaysWebView).not.toHaveBeenCalled();
    expect(mockGetInfo).not.toHaveBeenCalled();
    expect(document.documentElement.style.getPropertyValue("--app-safe-top")).toBe("");
    expect(document.documentElement.style.getPropertyValue("--app-safe-bottom")).toBe("");
  });

  it("sets safe area CSS variables on native platform", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockSetOverlaysWebView.mockResolvedValue(undefined);
    mockGetInfo.mockResolvedValue({
      height: 28,
      overlays: true,
      visible: true,
    });

    // Provide a mocked screen / innerHeight difference for bottom inset
    Object.defineProperty(window, "screen", {
      writable: true,
      configurable: true,
      value: { availHeight: 844 },
    });
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 800,
    });

    await applyNativeSafeArea();

    expect(mockSetOverlaysWebView).toHaveBeenCalledWith({ overlay: false });
    expect(document.documentElement.style.getPropertyValue("--app-safe-top")).toBe("28px");
    expect(document.documentElement.style.getPropertyValue("--app-safe-bottom")).toBe("44px");
  });

  it("does not throw if StatusBar plugin is missing or throws", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockSetOverlaysWebView.mockRejectedValue(new Error("Plugin not implemented"));
    mockGetInfo.mockRejectedValue(new Error("Plugin not implemented"));

    await expect(applyNativeSafeArea()).resolves.toBeUndefined();
  });

  it("is idempotent on repeated invocations", async () => {
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    mockSetOverlaysWebView.mockResolvedValue(undefined);
    mockGetInfo.mockResolvedValue({
      height: 32,
      overlays: true,
      visible: true,
    });

    await applyNativeSafeArea();
    expect(mockSetOverlaysWebView).toHaveBeenCalledTimes(1);
    expect(document.documentElement.style.getPropertyValue("--app-safe-top")).toBe("32px");

    // Second call should return early due to idempotency
    await applyNativeSafeArea();
    expect(mockSetOverlaysWebView).toHaveBeenCalledTimes(1);
  });
});
