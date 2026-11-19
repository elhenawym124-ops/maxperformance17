// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
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

describe("EducationStudentsTab (Server-side Table & Filters)", () => {
  const defaultProps = {
    students: mockStudents,
    studentsTotal: 3,
    studentsTotalPages: 1,
    studentsLoading: false,
    onStudentsQuery: vi.fn().mockResolvedValue({ items: mockStudents, total: 3, totalPages: 1 }),
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
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: [] }),
    } as any);
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

  it("renders matching counter X of Y students from server", () => {
    renderComponent({ studentsTotal: 3 });

    expect(screen.getByText("من")).toBeInTheDocument();
    expect(screen.getByText("طالب")).toBeInTheDocument();
    expect(screen.getAllByText("3")[0]).toBeInTheDocument();
  });

  it("triggers search and calls onStudentsQuery with debounce", async () => {
    const onQueryMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    const setStudentSearchMock = vi.fn();

    renderComponent({
      onStudentsQuery: onQueryMock,
      setStudentSearch: setStudentSearchMock,
    });

    const searchInput = screen.getByPlaceholderText("بحث بالاسم، الكود، الهاتف، ولي الأمر...");
    fireEvent.change(searchInput, { target: { value: "سارة" } });

    expect(setStudentSearchMock).toHaveBeenCalledWith("سارة");

    await waitFor(
      () => {
        expect(onQueryMock).toHaveBeenCalled();
      },
      { timeout: 600 }
    );
  });

  it("triggers status filter and updates query", async () => {
    const onQueryMock = vi.fn().mockResolvedValue({ items: [], total: 0 });
    renderComponent({ onStudentsQuery: onQueryMock });

    const statusSelect = screen.getByLabelText("فلتر الحالة");
    fireEvent.change(statusSelect, { target: { value: "active" } });

    await waitFor(() => {
      expect(onQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: "active" })
      );
    });
  });

  it("renders empty state with 'مسح الفلاتر' when no students match", () => {
    renderComponent({ students: [], studentsTotal: 0 });

    expect(screen.getByText("مفيش طلاب مطابقين للفلاتر")).toBeInTheDocument();
    expect(screen.getByText("مسح الفلاتر")).toBeInTheDocument();
  });

  it("shows bulk bar with action buttons and disabled WhatsApp button on row selection", () => {
    renderComponent();

    const checkboxes = screen.getAllByRole("checkbox");
    // Check first student checkbox
    fireEvent.click(checkboxes[1]);

    // Bulk bar appears
    expect(screen.getByText("تم تحديد 1")).toBeInTheDocument();
    expect(screen.getByText("تنشيط")).toBeInTheDocument();
    expect(screen.getByText("إيقاف")).toBeInTheDocument();
    expect(screen.getByText("إضافة لمجموعة")).toBeInTheDocument();

    // WhatsApp button UI-only: disabled + tooltip
    const waBtn = screen.getByText("أرسل واتساب").closest("button");
    expect(waBtn).toBeDisabled();
    expect(waBtn).toHaveAttribute("title", "هيتوصل بعد اعتماد قناة الواتساب");
  });

  it("triggers CSV export when clicking Export button", async () => {
    const createObjectURLMock = vi.fn().mockReturnValue("blob:mock-url");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        data: mockStudents,
      }),
    } as any);

    renderComponent();

    const exportBtn = screen.getByTitle("تصدير الطلاب المفلترين كـ CSV");
    fireEvent.click(exportBtn);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("all=true"),
        expect.any(Object)
      );
      expect(createObjectURLMock).toHaveBeenCalledTimes(1);
    });
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
