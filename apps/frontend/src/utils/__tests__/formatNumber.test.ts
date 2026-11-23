import { describe, it, expect } from "vitest";
import {
  NUMBER_LOCALE,
  formatNumber,
  formatCurrency,
  formatPercent,
  formatRatio,
} from "../formatNumber";

describe("formatNumber utility", () => {
  it("defines NUMBER_LOCALE as 'ar-EG'", () => {
    expect(NUMBER_LOCALE).toBe("ar-EG");
  });

  describe("formatNumber", () => {
    it("formats 0 as '٠'", () => {
      expect(formatNumber(0)).toBe("٠");
    });

    it("formats 27459 as '٢٧٬٤٥٩'", () => {
      expect(formatNumber(27459)).toBe("٢٧٬٤٥٩");
    });

    it("formats 195155 as '١٩٥٬١٥٥'", () => {
      expect(formatNumber(195155)).toBe("١٩٥٬١٥٥");
    });

    it("returns '—' for null, undefined, and NaN", () => {
      expect(formatNumber(null)).toBe("—");
      expect(formatNumber(undefined)).toBe("—");
      expect(formatNumber(NaN)).toBe("—");
    });

    it("supports maxFractionDigits as number", () => {
      expect(formatNumber(12.3456, 1)).toBe("١٢٫٣");
      expect(formatNumber(12.3456, 2)).toBe("١٢٫٣٥");
    });

    it("supports maxFractionDigits as options object", () => {
      expect(formatNumber(12.3456, { maxFractionDigits: 1 })).toBe("١٢٫٣");
      expect(formatNumber(12.3456, { maxFractionDigits: 2 })).toBe("١٢٫٣٥");
    });
  });

  describe("formatCurrency", () => {
    it("formats currency with default symbol 'ج.م'", () => {
      expect(formatCurrency(195155)).toBe("١٩٥٬١٥٥ ج.م");
    });

    it("returns '—' for null, undefined, or NaN", () => {
      expect(formatCurrency(null)).toBe("—");
      expect(formatCurrency(undefined)).toBe("—");
      expect(formatCurrency(NaN)).toBe("—");
    });

    it("supports custom currency symbol", () => {
      expect(formatCurrency(100, "$")).toBe("١٠٠ $");
    });
  });

  describe("formatPercent", () => {
    it("formats percentage with Arabic percent ٪ suffix and clamps", () => {
      expect(formatPercent(75)).toBe("٧٥٪");
      expect(formatPercent(33.3)).toBe("٣٣٫٣٪");
      expect(formatPercent(100)).toBe("١٠٠٪");
      expect(formatPercent(143)).toBe("١٠٠٪");
      expect(formatPercent(0)).toBe("٠٪");
      expect(formatPercent(-5)).toBe("٠٪");
    });

    it("returns '—' for null, undefined, or NaN", () => {
      expect(formatPercent(null)).toBe("—");
      expect(formatPercent(undefined)).toBe("—");
      expect(formatPercent(NaN)).toBe("—");
    });
  });

  describe("formatRatio", () => {
    it("satisfies exact prompt specification", () => {
      expect(formatRatio(143, 100)).toBe("١٠٠٪");
      expect(formatRatio(5, 0)).toBe("—");
      expect(formatRatio(3, 4)).toBe("٧٥٪");
      expect(formatRatio(-2, 10)).toBe("٠٪");
    });

    it("handles edge cases and negative denominators", () => {
      expect(formatRatio(5, -1)).toBe("—");
      expect(formatRatio(null as any, 100)).toBe("—");
      expect(formatRatio(50, null as any)).toBe("—");
      expect(formatRatio(NaN, 100)).toBe("—");
    });
  });
});
