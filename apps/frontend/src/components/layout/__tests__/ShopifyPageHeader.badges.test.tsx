/** @vitest-environment jsdom */
import { describe, it, expect } from "vitest";
import "@testing-library/jest-dom/vitest";
import React from "react";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ShopifyPageHeader } from "../ShopifyPageHeader";
import { EnhancedPagination } from "@/components/hr/EnhancedPagination";

describe("ShopifyPageHeader & EnhancedPagination resilience", () => {
  it("renders ShopifyPageHeader with object array badges without throwing Minified React Error #31", () => {
    const badges = [
      { label: "10 موظف", variant: "default" },
      { label: "5 حاضر اليوم", variant: "secondary" },
      { label: "2 طلب بانتظار الإجراء", variant: "destructive" },
    ];

    expect(() => {
      render(
        <BrowserRouter>
          <ShopifyPageHeader
            title="لوحة قيادة الموارد البشرية"
            subtitle="وصف الشاشة"
            badges={badges}
          />
        </BrowserRouter>
      );
    }).not.toThrow();

    expect(screen.getByText("10 موظف")).toBeInTheDocument();
    expect(screen.getByText("5 حاضر اليوم")).toBeInTheDocument();
    expect(screen.getByText("2 طلب بانتظار الإجراء")).toBeInTheDocument();
  });

  it("renders ShopifyPageHeader with raw JSX badge nodes", () => {
    render(
      <BrowserRouter>
        <ShopifyPageHeader
          title="شاشة الاختبار"
          badges={<span data-testid="raw-badge">شارة تجريبية</span>}
        />
      </BrowserRouter>
    );

    expect(screen.getByTestId("raw-badge")).toBeInTheDocument();
  });

  it("renders EnhancedPagination with grouped pagination prop without throwing", () => {
    expect(() => {
      render(
        <EnhancedPagination
          pagination={{ page: 1, totalPages: 5, limit: 10, total: 50 }}
          setPagination={() => {}}
        />
      );
    }).not.toThrow();

    expect(screen.getByText("10 / صفحة")).toBeInTheDocument();
  });

  it("renders EnhancedPagination with individual props", () => {
    render(
      <EnhancedPagination
        currentPage={2}
        totalPages={10}
        pageSize={20}
        totalItems={200}
        onPageChange={() => {}}
        onPageSizeChange={() => {}}
      />
    );

    expect(screen.getByText("20 / صفحة")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });
});
