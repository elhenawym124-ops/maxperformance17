import { TrainingStatusOption, TrainingTypeOption } from "./types";

export const TRAINING_TYPES: TrainingTypeOption[] = [
  { value: "technical", label: "تقني / فني" },
  { value: "soft-skills", label: "مهارات ناعمة / تواصل" },
  { value: "management", label: "إداري / قيادي" },
  { value: "safety", label: "صحة وسلامة مهنية" },
  { value: "language", label: "لغات" },
  { value: "compliance", label: "امتثال وقوانين" },
  { value: "other", label: "أخرى" },
];

export const TRAINING_STATUS_OPTIONS: TrainingStatusOption[] = [
  {
    value: "PLANNED",
    label: "مخطط",
    color: "bg-blue-100 text-primary border-primary",
  },
  {
    value: "ONGOING",
    label: "قيد التنفيذ",
    color: "bg-amber-100 text-warning border-warning",
  },
  {
    value: "COMPLETED",
    label: "مكتمل",
    color: "bg-emerald-100 text-success border-success",
  },
  {
    value: "CANCELLED",
    label: "ملغي",
    color: "bg-rose-100 text-destructive border-destructive",
  },
];
