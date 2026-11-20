import { GoalRecord, GoalType } from "./types";

export const GOAL_TYPE_LABELS: Record<GoalType, string> = {
  COMPANY: "هدف عام",
  DEPARTMENT: "هدف قسم",
  PROJECT: "هدف مشروع",
  EMPLOYEE: "هدف موظف",
  DAILY: "هدف يومي",
};

export const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-warning ring-warning",
  IN_PROGRESS: "bg-blue-50 text-primary ring-primary",
  COMPLETED: "bg-emerald-50 text-success ring-success",
  CANCELLED: "bg-rose-50 text-destructive ring-destructive",
};

export const priorityLabel = (priority?: string): string => {
  switch (priority) {
    case "URGENT":
      return "عاجل";
    case "HIGH":
      return "عال";
    case "LOW":
      return "منخفض";
    default:
      return "متوسط";
  }
};

export const statusLabel = (status?: string): string => {
  switch (status) {
    case "COMPLETED":
      return "مكتمل";
    case "IN_PROGRESS":
      return "قيد التنفيذ";
    case "CANCELLED":
      return "ملغي";
    default:
      return "معلق";
  }
};

export const formatGoalDateRange = (goal: GoalRecord): string => {
  if (goal.goalType === "DAILY" && goal.goalDate) {
    return new Date(goal.goalDate).toLocaleDateString("ar-EG");
  }

  return `${new Date(goal.startDate).toLocaleDateString("ar-EG")} - ${new Date(
    goal.endDate,
  ).toLocaleDateString("ar-EG")}`;
};

export const getGoalOwnerLabel = (goal: GoalRecord): string => {
  if (goal.employee) {
    return `${goal.employee.firstName} ${goal.employee.lastName}`;
  }

  if (goal.project) {
    return goal.project.name;
  }

  if (goal.department) {
    return goal.department.name;
  }

  return "على مستوى الشركة";
};

export const ensureArray = <T,>(value: unknown): T[] =>
  Array.isArray(value) ? (value as T[]) : [];
