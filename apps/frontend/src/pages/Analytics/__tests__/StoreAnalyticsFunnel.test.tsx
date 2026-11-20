// @vitest-environment jsdom
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import StoreAnalyticsFunnel from "../StoreAnalyticsFunnel";

describe("StoreAnalyticsFunnel", () => {
  it("renders safely when funnelMetrics has FunnelMetric items with value and baselineRate", () => {
    const mockMetrics: any[] = [
      {
        key: "visits",
        label: "زيارات المتجر",
        value: 1250,
        baselineRate: 100,
        visualShare: 100,
        stepRate: null,
        exceedsVisits: false,
      },
      {
        key: "views",
        label: "مشاهدات المنتجات",
        value: 840,
        baselineRate: 67.2,
        visualShare: 67.2,
        stepRate: 67.2,
        exceedsVisits: false,
      },
      {
        key: "purchases",
        label: "إتمام الشراء",
        value: 45,
        baselineRate: 3.6,
        visualShare: 3.6,
        stepRate: 5.4,
        exceedsVisits: false,
      },
    ];

    render(
      <StoreAnalyticsFunnel
        funnelMetrics={mockMetrics}
        visitorToCart="12.5"
        cartToCheckout="45.0"
        checkoutToOrder="30.0"
        dropOffAnalysis={null}
      />
    );

    expect(screen.getByText("زيارات المتجر")).toBeInTheDocument();
    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("(100.0%)")).toBeInTheDocument();
    expect(screen.getByText("إتمام الشراء")).toBeInTheDocument();
    expect(screen.getByText("45")).toBeInTheDocument();
    expect(screen.getByText("(3.6%)")).toBeInTheDocument();
  });

  it("does not throw TypeError when metric count or percent is undefined or null", () => {
    const corruptMetrics: any[] = [
      {
        label: "مرحلة تالفة",
        count: undefined,
        value: undefined,
        percentOfVisits: undefined,
        baselineRate: undefined,
      },
    ];

    expect(() => {
      render(
        <StoreAnalyticsFunnel
          funnelMetrics={corruptMetrics}
          visitorToCart="0.0"
          cartToCheckout="0.0"
          checkoutToOrder="0.0"
          dropOffAnalysis={null}
        />
      );
    }).not.toThrow();

    expect(screen.getByText("مرحلة تالفة")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("(0.0%)")).toBeInTheDocument();
  });

  it("handles empty or null funnelMetrics array gracefully", () => {
    render(
      <StoreAnalyticsFunnel
        funnelMetrics={[] as any}
        visitorToCart="0.0"
        cartToCheckout="0.0"
        checkoutToOrder="0.0"
        dropOffAnalysis={null}
      />
    );

    expect(screen.getByText("لا توجد بيانات قمع تحويل كافية حالياً")).toBeInTheDocument();
  });
});
