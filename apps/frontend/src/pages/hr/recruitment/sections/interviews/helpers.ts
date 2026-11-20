import { NewInterviewForm } from "./types";

export const createInitialInterviewForm = (): NewInterviewForm => ({
  applicantId: "",
  jobId: "",
  date: "",
  time: "",
  type: "VIDEO",
  location: "",
  interviewers: [],
  notes: "",
});

export const getInterviewStatusBadge = (
  status: string,
): { text: string; bg: string } => {
  switch (status) {
    case "SCHEDULED":
      return {
        text: "مجدولة",
        bg: "bg-blue-100 text-primary border-primary",
      };
    case "COMPLETED":
      return {
        text: "مكتملة",
        bg: "bg-green-100 text-success border-success",
      };
    case "CANCELLED":
      return {
        text: "ملغاة",
        bg: "bg-red-100 text-destructive border-destructive",
      };
    case "NO_SHOW":
      return {
        text: "لم يحضر",
        bg: "bg-gray-100 text-foreground border-border",
      };
    default:
      return { text: status, bg: "bg-gray-100 text-foreground" };
  }
};

export const getInterviewTypeText = (type: string): string => {
  switch (type) {
    case "VIDEO":
      return "مكالمة فيديو";
    case "PHONE":
      return "مكالمة هاتفية";
    case "IN_PERSON":
      return "في الشركة";
    default:
      return type;
  }
};

export const normalizeInterviewersList = (
  interviewers: string[] | string | undefined,
): string[] => {
  if (!interviewers) return [];
  if (typeof interviewers === "string") {
    return interviewers
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return interviewers;
};
