/* @vitest-environment jsdom */

import React from "react";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocationCaptureSettingsCard } from "../../components/store/LocationCaptureSettingsCard";
import { CustomerLocationPicker } from "../components/CustomerLocationPicker";
import { PostOrderLocationCard } from "../components/PostOrderLocationCard";
import {
  DEFAULT_LOCATION_CAPTURE_SETTINGS,
  matchEgyptGovernorate,
  normalizeLocationCaptureSettings,
  parseLocationLinkClient,
  type LocationCaptureSettings,
} from "../utils/locationCaptureSettings";
import { storefrontApi } from "../../utils/storefrontApi";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("Customer location capture", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("parses Google Maps links and coordinates on client", () => {
    expect(
      parseLocationLinkClient("https://www.google.com/maps?q=30.04442,31.23571"),
    ).toEqual({
      lat: 30.04442,
      lng: 31.23571,
      googleMapsUrl: "https://www.google.com/maps?q=30.04442,31.23571",
    });

    expect(
      parseLocationLinkClient(
        "https://www.google.com/maps/place/Cairo/@30.0512,31.2455,17z",
      ),
    ).toEqual({
      lat: 30.0512,
      lng: 31.2455,
      googleMapsUrl: "https://www.google.com/maps?q=30.0512,31.2455",
    });

    expect(parseLocationLinkClient("29.9602, 31.2569")).toEqual({
      lat: 29.9602,
      lng: 31.2569,
      googleMapsUrl: "https://www.google.com/maps?q=29.9602,31.2569",
    });

    expect(parseLocationLinkClient("invalid text")).toBeNull();
  });

  it("normalizes settings safely and matches Egyptian governorates", () => {
    expect(normalizeLocationCaptureSettings(null)).toEqual(
      DEFAULT_LOCATION_CAPTURE_SETTINGS,
    );
    expect(
      normalizeLocationCaptureSettings({
        mode: "required",
        displayStyle: "inline_map",
        allowMapsLinkPaste: false,
      }),
    ).toMatchObject({
      mode: "required",
      displayStyle: "inline_map",
      allowMapsLinkPaste: false,
      autoFillAddressFromLocation: true,
      applyToQuickOrder: true,
    });
    expect(matchEgyptGovernorate("محافظة القاهرة")?.nameEn).toBe("Cairo");
    expect(matchEgyptGovernorate("Giza Governorate")?.nameEn).toBe("Giza");
  });

  it("renders merchant LocationCaptureSettingsCard and updates mode and display style", () => {
    const onChange = vi.fn();
    const { rerender } = render(
      <LocationCaptureSettingsCard
        settings={DEFAULT_LOCATION_CAPTURE_SETTINGS}
        onChange={onChange}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "اختياري (مُوصى به)" }));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ mode: "optional" }),
    );

    rerender(
      <LocationCaptureSettingsCard
        settings={{ ...DEFAULT_LOCATION_CAPTURE_SETTINGS, mode: "optional" }}
        onChange={onChange}
      />,
    );

    expect(screen.getByText("زر سحب فوري (GPS)")).toBeTruthy();
    expect(screen.getByText("خريطة جاهزة داخل الفورم (Inline Map)")).toBeTruthy();
    expect(
      screen.getByText("في صفحة الشكر بعد الطلب (Post-Order)"),
    ).toBeTruthy();

    fireEvent.click(
      screen.getByText("خريطة جاهزة داخل الفورم (Inline Map)").closest("button")!,
    );
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ displayStyle: "inline_map" }),
    );
  });

  it("renders CustomerLocationPicker across gps_button, map_modal, inline_map and extracts pasted Maps links", async () => {
    const onChange = vi.fn();
    const baseSettings: LocationCaptureSettings = {
      mode: "optional",
      displayStyle: "gps_button",
      allowMapsLinkPaste: true,
      autoFillAddressFromLocation: false,
      applyToQuickOrder: true,
    };

    const { rerender } = render(
      <CustomerLocationPicker
        settings={{ ...baseSettings, mode: "disabled" }}
        value={null}
        onChange={onChange}
      />,
    );
    expect(screen.queryByText("موقع التوصيل على الخريطة")).toBeNull();

    rerender(
      <CustomerLocationPicker
        settings={baseSettings}
        value={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("button", { name: "استخدم موقعي الحالي" })).toBeTruthy();

    // Paste Google Maps link
    fireEvent.click(
      screen.getByRole("button", { name: /أو الصق رابط الموقع/ }),
    );
    const input = screen.getByPlaceholderText("https://maps.app.goo.gl/...");
    fireEvent.change(input, {
      target: { value: "https://www.google.com/maps?q=30.0444,31.2357" },
    });
    fireEvent.click(screen.getByRole("button", { name: "اعتماد" }));

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith(
        expect.objectContaining({
          lat: 30.0444,
          lng: 31.2357,
          source: "maps_link",
          googleMapsUrl: "https://www.google.com/maps?q=30.0444,31.2357",
        }),
      );
    });

    // Switch to map_modal and open modal
    rerender(
      <CustomerLocationPicker
        settings={{ ...baseSettings, displayStyle: "map_modal" }}
        value={null}
        onChange={onChange}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: "تحديد الموقع على الخريطة" }),
    );
    expect(screen.getByRole("dialog")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "تأكيد الموقع" }));
    expect(screen.queryByRole("dialog")).toBeNull();

    // Switch to inline_map
    rerender(
      <CustomerLocationPicker
        settings={{ ...baseSettings, displayStyle: "inline_map" }}
        value={null}
        onChange={onChange}
      />,
    );
    expect(screen.getByRole("application", { name: "خريطة تحديد الموقع" })).toBeTruthy();
  });

  it("saves post-order location via storefrontApi.updateOrderLocation", async () => {
    const updateSpy = vi
      .spyOn(storefrontApi, "updateOrderLocation")
      .mockResolvedValueOnce({
        success: true,
        data: {
          orderNumber: "ORD-123",
          location: {
            lat: 30.0444,
            lng: 31.2357,
            googleMapsUrl: "https://www.google.com/maps?q=30.0444,31.2357",
            source: "post_order",
          },
        },
      });

    render(
      <PostOrderLocationCard
        orderNumber="ORD-123"
        customerPhone="01012345678"
        settings={{
          ...DEFAULT_LOCATION_CAPTURE_SETTINGS,
          mode: "optional",
          displayStyle: "post_order",
          autoFillAddressFromLocation: false,
        }}
      />,
    );

    fireEvent.click(
      screen.getByRole("button", { name: /أو الصق رابط الموقع/ }),
    );
    fireEvent.change(screen.getByPlaceholderText("https://maps.app.goo.gl/..."), {
      target: { value: "https://www.google.com/maps?q=30.0444,31.2357" },
    });
    fireEvent.click(screen.getByRole("button", { name: "اعتماد" }));

    const saveBtn = await screen.findByRole("button", {
      name: "حفظ الموقع على الطلب",
    });
    fireEvent.click(saveBtn);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledWith(
        "ORD-123",
        expect.objectContaining({
          phone: "01012345678",
          lat: 30.0444,
          lng: 31.2357,
          source: "post_order",
        }),
      );
    });

    expect(await screen.findByText("تم ربط موقعك بالطلب بنجاح")).toBeTruthy();
    updateSpy.mockRestore();
  });
});
