import { describe, expect, it } from "vitest";
import { calculateInstallmentSchedule } from "../educationSharedHelpers";

describe("calculateInstallmentSchedule", () => {
  it("creates 3 monthly installments for a 3-month level (first paid now)", () => {
    const plans = calculateInstallmentSchedule(3000, 3, "2026-12-01");
    expect(plans).toHaveLength(3);
    expect(plans[0].status).toBe("PAID");
    expect(plans[1].status).toBe("PENDING");
    expect(plans[2].status).toBe("PENDING");
    expect(plans.map((p) => p.dueDate)).toEqual(["2026-12-01", "2027-01-01", "2027-02-01"]);
    expect(plans.reduce((sum, p) => sum + p.amount, 0)).toBe(3000);
  });

  it("supports any count from 2 to 24 and keeps the total exact", () => {
    for (const count of [2, 4, 6, 12, 24]) {
      const plans = calculateInstallmentSchedule(1000, count);
      expect(plans).toHaveLength(count);
      expect(plans.reduce((sum, p) => sum + p.amount, 0)).toBe(1000);
    }
  });

  it("returns a single fully paid plan for count 1", () => {
    const plans = calculateInstallmentSchedule(500, 1);
    expect(plans).toHaveLength(1);
    expect(plans[0].status).toBe("PAID");
    expect(plans[0].amount).toBe(500);
  });
});
