import { describe, it, expect } from "vitest";
import {
  formatNumber,
  formatPercent,
  clamp,
  clampPercent,
  isEnglishLocale,
  resolveAppLocale,
} from "../formatNumber";

describe("formatNumber utility", () => {
  describe("isEnglishLocale & resolveAppLocale", () => {
    it("identifies English locales properly", () => {
      expect(isEnglishLocale("en")).toBe(true);
      expect(isEnglishLocale("en-US")).toBe(true);
      expect(isEnglishLocale("en-GB")).toBe(true);
      expect(isEnglishLocale("ar")).toBe(false);
      expect(isEnglishLocale("ar-EG")).toBe(false);
    });

    it("resolves app locale correctly with overrides", () => {
      expect(resolveAppLocale("en-US")).toBe("en-US");
      expect(resolveAppLocale("ar-EG")).toBe("ar-EG");
    });
  });

  describe("clamp & clampPercent", () => {
    it("clamps values between min and max", () => {
      expect(clamp(150, 0, 100)).toBe(100);
      expect(clamp(-20, 0, 100)).toBe(0);
      expect(clamp(45.5, 0, 100)).toBe(45.5);
      expect(clamp(NaN, 0, 100)).toBe(0);
    });

    it("clamps percentages safely with defaults 0-100", () => {
      expect(clampPercent(120)).toBe(100);
      expect(clampPercent(-10)).toBe(0);
      expect(clampPercent(75.5)).toBe(75.5);
      expect(clampPercent(null)).toBe(0);
      expect(clampPercent(undefined)).toBe(0);
      expect(clampPercent("invalid")).toBe(0);
    });
  });

  describe("formatNumber", () => {
    it("handles null, undefined, empty string, and NaN with fallback", () => {
      expect(formatNumber(null)).toBe("0");
      expect(formatNumber(undefined)).toBe("0");
      expect(formatNumber("")).toBe("0");
      expect(formatNumber(NaN)).toBe("0");
      expect(formatNumber(null, { fallback: "—" })).toBe("—");
    });

    it("formats standard numbers with English locale", () => {
      expect(formatNumber(1000, { locale: "en-US" })).toBe("1,000");
      expect(formatNumber(1234567, { locale: "en-US" })).toBe("1,234,567");
      expect(formatNumber(0, { locale: "en-US" })).toBe("0");
    });

    it("supports passing maximumFractionDigits as a number parameter", () => {
      expect(formatNumber(12.3456, 2)).toBeDefined();
      expect(formatNumber(12.3456, { locale: "en-US", maximumFractionDigits: 2 })).toBe("12.35");
      expect(formatNumber(12.3456, { locale: "en-US", maximumFractionDigits: 1 })).toBe("12.3");
    });

    it("formats numbers with Arabic locale", () => {
      const formatted = formatNumber(1000, { locale: "ar-EG" });
      expect(formatted).toBeDefined();
      expect(formatted.length).toBeGreaterThan(0);
    });

    it("handles negative numbers", () => {
      const enFormatted = formatNumber(-500, { locale: "en-US" });
      expect(enFormatted).toBe("-500");
    });
  });

  describe("formatPercent", () => {
    it("clamps by default between 0 and 100%", () => {
      const enHigh = formatPercent(150, { locale: "en-US" });
      expect(enHigh).toBe("100%");

      const enLow = formatPercent(-25, { locale: "en-US" });
      expect(enLow).toBe("0%");

      const enNormal = formatPercent(45.5, { locale: "en-US", maximumFractionDigits: 1 });
      expect(enNormal).toBe("45.5%");
    });

    it("supports disabling clamp when explicitly requested", () => {
      const enUnclamped = formatPercent(150, { locale: "en-US", clamp: false });
      expect(enUnclamped).toBe("150%");
    });

    it("safely handles null and undefined in percentages", () => {
      expect(formatPercent(null, { locale: "en-US" })).toBe("0%");
      expect(formatPercent(undefined, { locale: "en-US" })).toBe("0%");
    });
  });
});
