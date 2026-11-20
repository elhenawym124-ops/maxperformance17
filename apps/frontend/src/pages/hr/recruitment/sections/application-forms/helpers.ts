import { FormResponse, NewFormDraft, Question, QuestionType } from "./types";

export const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: "TEXT", label: "نص قصير" },
  { value: "TEXTAREA", label: "نص طويل" },
  { value: "SELECT", label: "قائمة منسدلة" },
  { value: "RADIO", label: "اختيار واحد" },
  { value: "CHECKBOX", label: "اختيار متعدد" },
  { value: "FILE", label: "رفع ملف" },
];

export const getApplicantStatusLabel = (status?: string): string => {
  const statusLabels: Record<string, string> = {
    NEW: "جديد",
    REVIEWING: "قيد المراجعة",
    INTERVIEW_SCHEDULED: "مقابلة مجدولة",
    INTERVIEWED: "تمت المقابلة",
    OFFERED: "تم العرض",
    HIRED: "تم التوظيف",
    REJECTED: "مرفوض",
  };

  return statusLabels[status || ""] || "داخل المسار";
};

export const getApplicantStatusBadgeClasses = (status?: string): string => {
  const classes: Record<string, string> = {
    NEW: "bg-blue-100 text-primary dark:bg-primary/30 dark:text-primary",
    REVIEWING:
      "bg-amber-100 text-warning dark:bg-warning/30 dark:text-warning",
    INTERVIEW_SCHEDULED:
      "bg-purple-100 text-primary dark:bg-primary/30 dark:text-primary",
    INTERVIEWED:
      "bg-indigo-100 text-primary dark:bg-primary/30 dark:text-primary",
    OFFERED:
      "bg-green-100 text-success dark:bg-success/30 dark:text-success",
    HIRED:
      "bg-emerald-100 text-success dark:bg-success/30 dark:text-success",
    REJECTED: "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive",
  };

  return (
    classes[status || ""] ||
    "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground"
  );
};

export const createEmptyFormDraft = (): NewFormDraft => ({
  title: "",
  slug: "",
  description: "",
  jobId: "",
  isActive: true,
  questions: [],
});

export const createEmptyQuestionDraft = (): Question => ({
  questionText: "",
  questionType: "TEXT",
  options: [],
  isRequired: false,
  orderIndex: 0,
});

export const reorderQuestions = (
  questions: Question[],
  index: number,
  direction: "up" | "down"
): Question[] => {
  const newQuestions = [...questions];
  const newIndex = direction === "up" ? index - 1 : index + 1;
  if (newIndex < 0 || newIndex >= newQuestions.length) return questions;

  [newQuestions[index], newQuestions[newIndex]] = [
    newQuestions[newIndex],
    newQuestions[index],
  ];
  return newQuestions.map((q, i) => ({ ...q, orderIndex: i }));
};

export const patchResponseInList = (
  list: FormResponse[],
  responseId: string,
  patch: Partial<FormResponse>
): FormResponse[] =>
  list.map((item) => (item.id === responseId ? { ...item, ...patch } : item));
