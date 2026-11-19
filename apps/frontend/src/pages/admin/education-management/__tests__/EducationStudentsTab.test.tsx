// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { EducationStudentsTab } from "../EducationStudentsTab";
import type { EducationStudent, EducationSubject } from "../types";

const mockStudents: EducationStudent[] = [
  {
    id: "s1",
    customerId: "c1",
    code: "101",
    firstName: "أحمد",
    lastName: "محمود",
    phone: "01011111111",
    phone2: "01022222222",
    address: "القاهرة - المعادي",
    grade: "الصف الأول الثانوي",
    isActive: true,
    customer: {
      id: "c1",
      firstName: "محمود",
      lastName: "علي",
      phone: "01099999999",
    },
    subjects: ["sub1"],
    enrollments: [{ id: "e1" } as any],
  },
  {
    id: "s2",
    customerId: "c2",
    code: "102",
    firstName: "سارة",
    lastName: "إبراهيم",
    phone: "01122222222",
    address: "الجيزة - الدقي",
    grade: "الصف الثاني الثانوي",
    isActive: false,
    customer: {
      id: "c2",
      firstName: "إبراهيم",
      lastName: "حسن",
      phone: "01188888888",
    },
    subjects: ["sub2"],
    enrollments: [],
  },
  {
    id: "s3",
    customerId: "c3",
    code: "103",
    firstName: "عمر",
    lastName: "طارق",
    phone: "01233333333",
    grade: "الصف الأول الثانوي",
    isActive: true,
    customer: {
      id: "c3",
      firstName: "طارق",
      lastName: "سعيد",
      phone: "01277777777",
    },
    subjects: ["sub1"],
    enrollments: [{ id: "e2" } as any],
  },
];

const mockSubjects: EducationSubject[] = [
  { id: "sub1", name: "رياضيات", isActive: true },
  { id: "sub2", name: "فيزياء", isActive: true },
];

describe("EducationStudentsTab (Table & Filters)", () => {
  const defaultProps = {
    students: mockStudents,
    subjects: mockSubjects,
    enableSubjects: true,
    customers: [],
    customerResults: [],
    studentSearch: "",
    setStudentSearch: vi.fn(),
    studentModal: undefined,
    setStudentModal: vi.fn(),
    searchCustomers: vi.fn().mockResolvedValue(undefined),
    handleSaveStudent: vi.fn().mockResolvedValue(undefined),
    handleToggleStudent: vi.fn().mockResolvedValue(undefined),
    handleDeleteStudent: vi.fn().mockResolvedValue(undefined),
  };

  const renderComponent = (props = {}) =>
    render(
      <BrowserRouter>
        <EducationStudentsTab {...defaultProps} {...props} />
      </BrowserRouter>
    );

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders desktop table with correct columns and student records", () => {
    renderComponent();

    // Check table headers
    expect(screen.getByText("الطالب / الكود")).toBeInTheDocument();
    expect(screen.getByText("الصف الدراسي")).toBeInTheDocument();
    expect(screen.getByText("هاتف الطالب")).toBeInTheDocument();
    expect(screen.getByText("ولي الأمر")).toBeInTheDocument();
    expect(screen.getByText("العنوان")).toBeInTheDocument();
    expect(screen.getByText("المواد")).toBeInTheDocument();
    expect(screen.getByText("الحالة")).toBeInTheDocument();

    // Check student names rendered
    expect(screen.getAllByText("أحمد محمود")[0]).toBeInTheDocument();
    expect(screen.getAllByText("سارة إبراهيم")[0]).toBeInTheDocument();
    expect(screen.getAllByText("عمر طارق")[0]).toBeInTheDocument();

    // Check codes
    expect(screen.getAllByText("#101")[0]).toBeInTheDocument();
    expect(screen.getAllByText("#102")[0]).toBeInTheDocument();
  });

  it("renders matching counter X of Y students", () => {
    renderComponent();

    // Matching counter: 3 of 3 students
    expect(screen.getByText("من")).toBeInTheDocument();
    expect(screen.getByText("طالب")).toBeInTheDocument();
  });

  it("filters students by search input", () => {
    renderComponent();

    const searchInput = screen.getByPlaceholderText("بحث بالاسم، الكود، الهاتف، ولي الأمر...");
    fireEvent.change(searchInput, { target: { value: "سارة" } });

    // Should only show Sarah
    expect(screen.getAllByText("سارة إبراهيم")[0]).toBeInTheDocument();
    expect(screen.queryByText("أحمد محمود")).not.toBeInTheDocument();
    expect(screen.queryByText("عمر طارق")).not.toBeInTheDocument();
  });

  it("filters students by active/inactive status", () => {
    renderComponent();

    const statusSelect = screen.getByLabelText("فلتر الحالة");

    // Select Active Only
    fireEvent.change(statusSelect, { target: { value: "active" } });
    expect(screen.getAllByText("أحمد محمود")[0]).toBeInTheDocument();
    expect(screen.getAllByText("عمر طارق")[0]).toBeInTheDocument();
    expect(screen.queryByText("سارة إبراهيم")).not.toBeInTheDocument();

    // Select Inactive Only
    fireEvent.change(statusSelect, { target: { value: "inactive" } });
    expect(screen.getAllByText("سارة إبراهيم")[0]).toBeInTheDocument();
    expect(screen.queryByText("أحمد محمود")).not.toBeInTheDocument();
  });

  it("filters students by grade", () => {
    renderComponent();

    const gradeSelect = screen.getByLabelText("فلتر الصف");
    fireEvent.change(gradeSelect, { target: { value: "الصف الثاني الثانوي" } });

    expect(screen.getAllByText("سارة إبراهيم")[0]).toBeInTheDocument();
    expect(screen.queryByText("أحمد محمود")).not.toBeInTheDocument();
  });

  it("triggers CSV export when clicking Export button", () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    renderComponent();

    const exportBtn = screen.getByTitle("تصدير الطلاب المفلترين كـ CSV");
    fireEvent.click(exportBtn);

    expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    expect(revokeObjectURLMock).toHaveBeenCalledTimes(1);
  });

  it("triggers toggle status and delete handlers", async () => {
    const handleToggle = vi.fn().mockResolvedValue(undefined);
    const handleDelete = vi.fn().mockResolvedValue(undefined);

    renderComponent({
      handleToggleStudent: handleToggle,
      handleDeleteStudent: handleDelete,
    });

    const toggleBtns = screen.getAllByTitle("تعطيل");
    fireEvent.click(toggleBtns[0]);
    expect(handleToggle).toHaveBeenCalledWith("s1", true);

    const deleteBtns = screen.getAllByTitle("حذف");
    fireEvent.click(deleteBtns[0]);
    expect(handleDelete).toHaveBeenCalledWith("s1");
  });
});
