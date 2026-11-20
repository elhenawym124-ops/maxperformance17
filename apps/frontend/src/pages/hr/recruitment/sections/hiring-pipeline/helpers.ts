import { PipelineStage, StageApplicant } from "./types";

export const DEFAULT_PIPELINE_STAGES: PipelineStage[] = [
  { id: "NEW", name: "جديد", count: 0, color: "blue" },
  { id: "REVIEWING", name: "قيد المراجعة", count: 0, color: "amber" },
  {
    id: "INTERVIEW_SCHEDULED",
    name: "مقابلة مجدولة",
    count: 0,
    color: "purple",
  },
  { id: "INTERVIEWED", name: "تمت المقابلة", count: 0, color: "indigo" },
  { id: "OFFERED", name: "تم العرض", count: 0, color: "green" },
  { id: "HIRED", name: "تم التوظيف", count: 0, color: "emerald" },
  { id: "REJECTED", name: "مرفوض", count: 0, color: "red" },
];

export const normalizeStageApplicant = (applicant: any): StageApplicant => ({
  ...applicant,
  id: applicant?.id || "",
  name: applicant?.name || "بدون اسم",
  email: applicant?.email || "بدون بريد",
  phone: applicant?.phone || "",
  status: applicant?.status || "NEW",
  createdAt: applicant?.createdAt,
  jobTitle: applicant?.jobTitle || applicant?.job?.title || "بدون وظيفة",
  job: applicant?.job || null,
});

export const getPipelineStageColorClasses = (color: string): string => {
  const colors: Record<string, string> = {
    blue: "bg-blue-100 border-blue-300 text-blue-700",
    amber: "bg-amber-100 border-warning text-warning",
    purple: "bg-purple-100 border-primary text-primary",
    indigo: "bg-indigo-100 border-primary text-primary",
    green: "bg-green-100 border-success text-success",
    emerald: "bg-emerald-100 border-success text-success",
    red: "bg-red-100 border-destructive text-destructive",
  };

  return colors[color] || colors.blue;
};
