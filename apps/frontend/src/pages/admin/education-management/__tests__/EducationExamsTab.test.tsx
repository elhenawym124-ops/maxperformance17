// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

const api = vi.hoisted(() => ({
  fetchExamsApi: vi.fn(),
  fetchExamDetailApi: vi.fn(),
  createExamApi: vi.fn(),
  saveExamResultsApi: vi.fn(),
  publishExamApi: vi.fn(),
  closeExamApi: vi.fn(),
  deleteExamApi: vi.fn(),
  fetchCertificatesApi: vi.fn(),
  issueCertificateApi: vi.fn(),
  deleteCertificateApi: vi.fn(),
  certificatePdfUrl: (id: string) => `/api/v1/education/certificates/${id}/pdf`,
}));

vi.mock("../api", () => api);
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ i18n: { language: "ar" }, t: (key: string) => key }),
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

import { EducationExamsTab } from "../EducationExamsTab";

const exam = {
  id: "exam-1",
  title: "اختبار الوحدة الأولى",
  type: "QUIZ",
  maxScore: 50,
  status: "DRAFT",
  resultsCount: 0,
  scheduledAt: "2026-11-25",
};

beforeEach(() => {
  Object.values(api).forEach((value) => {
    if (typeof value === "function" && "mockReset" in value) value.mockReset();
  });
  api.fetchExamsApi.mockResolvedValue({ exams: [exam], pagination: { total: 1, page: 1, limit: 50, totalPages: 1 } });
  api.fetchCertificatesApi.mockResolvedValue({ certificates: [], pagination: { total: 0, page: 1, limit: 50, totalPages: 1 } });
  api.fetchExamDetailApi.mockResolvedValue({
    exam,
    students: [
      { studentId: "stu-1", studentName: "سارة محمد", code: "S-1", score: null, maxScore: 50, grade: null, certificateId: null },
      { studentId: "stu-2", studentName: "عمر علي", code: "S-2", score: 40, maxScore: 50, grade: "B", certificateId: null },
    ],
  });
  api.saveExamResultsApi.mockResolvedValue([]);
  api.createExamApi.mockResolvedValue({ id: "exam-2" });
  api.issueCertificateApi.mockResolvedValue({ id: "cert-1" });
});

afterEach(() => cleanup());

describe("EducationExamsTab", () => {
  it("lists exams with status and grading count", async () => {
    render(<EducationExamsTab />);

    expect(await screen.findByText("اختبار الوحدة الأولى")).toBeInTheDocument();
    expect(screen.getByText("مسودة")).toBeInTheDocument();
    expect(screen.getByText(/50 درجة/)).toBeInTheDocument();
  });

  it("opens the grade sheet and saves entered scores", async () => {
    render(<EducationExamsTab />);
    await screen.findByText("اختبار الوحدة الأولى");

    fireEvent.click(screen.getByText("الدرجات"));
    expect(await screen.findByText("سارة محمد")).toBeInTheDocument();
    expect(screen.getByText("عمر علي")).toBeInTheDocument();

    const inputs = screen.getAllByPlaceholderText("—");
    fireEvent.change(inputs[0], { target: { value: "45" } });
    fireEvent.click(screen.getByText("حفظ الدرجات"));

    await waitFor(() => expect(api.saveExamResultsApi).toHaveBeenCalledWith("exam-1", [
      { studentId: "stu-1", score: 45 },
      { studentId: "stu-2", score: 40 },
    ]));
  });

  it("publishes results after confirmation", async () => {
    const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
    render(<EducationExamsTab />);
    await screen.findByText("اختبار الوحدة الأولى");

    fireEvent.click(screen.getByText("الدرجات"));
    await screen.findByText("سارة محمد");
    fireEvent.click(screen.getByText("نشر النتائج"));

    await waitFor(() => expect(api.publishExamApi).toHaveBeenCalledWith("exam-1"));
    confirmSpy.mockRestore();
  });

  it("switches to certificates and links the PDF", async () => {
    api.fetchCertificatesApi.mockResolvedValue({
      certificates: [{
        id: "cert-1",
        title: "شهادة تفوق",
        type: "ACHIEVEMENT",
        serialNumber: "CERT-202611-0001",
        studentName: "سارة محمد",
        issuedAt: "2026-11-20",
      }],
      pagination: { total: 1, page: 1, limit: 50, totalPages: 1 },
    });

    render(<EducationExamsTab />);
    await screen.findByText("اختبار الوحدة الأولى");

    fireEvent.click(screen.getByText("الشهادات"));
    expect(await screen.findByText("شهادة تفوق")).toBeInTheDocument();
    expect(screen.getByText("PDF")).toBeInTheDocument();
    expect(api.fetchCertificatesApi).toHaveBeenCalled();
  });
});
