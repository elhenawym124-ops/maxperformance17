import { describe, expect, it } from "vitest";
import { computeRenewalExpiry } from "../educationSharedHelpers";

describe("computeRenewalExpiry", () => {
  // local-time reference: 24 Nov 2026 (no UTC shift, matches how the form shows dates)
  const now = new Date(2026, 10, 24, 9, 0, 0);

  it("counts from today when the subscription has no expiry yet", () => {
    expect(computeRenewalExpiry(null, 3, now)).toBe("2027-02-24");
  });

  it("extends from the existing expiry when it is still in the future", () => {
    expect(computeRenewalExpiry("2027-02-24", 1, now)).toBe("2027-03-24");
    expect(computeRenewalExpiry("2027-02-24", 3, now)).toBe("2027-05-24");
  });

  it("falls back to today when the stored expiry is already in the past", () => {
    expect(computeRenewalExpiry("2026-01-10", 1, now)).toBe("2026-12-24");
  });

  it("clamps the duration to 1..24 months", () => {
    expect(computeRenewalExpiry(null, 0, now)).toBe("2026-12-24");
    expect(computeRenewalExpiry(null, 99, now)).toBe("2028-11-24");
  });
});
