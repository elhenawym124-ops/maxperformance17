import { describe, expect, it } from "vitest";

type Row = { id: string; isActive?: boolean };

/** Mirrors the filter used by EducationEnrollmentsTab (active is the default view). */
const filterEnrollments = (rows: Row[], filter: "active" | "inactive" | "all") =>
  rows.filter((e) =>
    filter === "all" ? true : filter === "active" ? e.isActive !== false : e.isActive === false
  );

const rows: Row[] = [
  { id: "a", isActive: true },
  { id: "b", isActive: false },
  { id: "c" }, // legacy rows without the flag count as active
  { id: "d", isActive: true },
];

describe("enrollments activation filter", () => {
  it("shows only active subscriptions by default", () => {
    expect(filterEnrollments(rows, "active").map((r) => r.id)).toEqual(["a", "c", "d"]);
  });

  it("shows only inactive subscriptions when asked", () => {
    expect(filterEnrollments(rows, "inactive").map((r) => r.id)).toEqual(["b"]);
  });

  it("shows everything under the all filter", () => {
    expect(filterEnrollments(rows, "all")).toHaveLength(4);
  });
});
