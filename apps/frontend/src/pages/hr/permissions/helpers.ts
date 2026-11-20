import {
  Clock,
  Check,
  X,
  Receipt,
  Zap,
  Timer,
  RefreshCcw,
} from "lucide-react";
import { PermissionType, PermissionStatus, PermissionFormData } from "./types";

export const permissionTypeConfig: Record<
  PermissionType,
  { labelKey: string; icon: any; color: string; descKey: string }
> = {
  DEDUCTIBLE: {
    labelKey: "exitDeductible",
    icon: Receipt,
    color: "bg-red-100 text-destructive border-destructive",
    descKey: "exitDeductibleDesc",
  },
  NON_DEDUCTIBLE: {
    labelKey: "emergencyNonDeductible",
    icon: Zap,
    color: "bg-blue-100 text-primary border-primary",
    descKey: "emergencyNonDeductibleDesc",
  },
  FIXED_HOURS: {
    labelKey: "externalAssignment",
    icon: Timer,
    color: "bg-purple-100 text-primary border-primary",
    descKey: "externalAssignmentDesc",
  },
  COMPENSATORY: {
    labelKey: "compensatory",
    icon: RefreshCcw,
    color: "bg-green-100 text-success border-success",
    descKey: "compensatoryDesc",
  },
};

export const statusConfig: Record<
  PermissionStatus,
  { labelKey: string; color: string; icon: any }
> = {
  PENDING: {
    labelKey: "pendingTab",
    color: "bg-yellow-100 text-warning",
    icon: Clock,
  },
  APPROVED: {
    labelKey: "approvedStatus",
    color: "bg-green-100 text-success",
    icon: Check,
  },
  REJECTED: {
    labelKey: "rejectedStatus",
    color: "bg-red-100 text-destructive",
    icon: X,
  },
};

export const calculateHours = (start: string, end: string): string => {
  if (!start || !end) return "0.00";
  const [h1, m1] = start.split(":").map(Number);
  const [h2, m2] = end.split(":").map(Number);
  let diff = (h2 ?? 0) * 60 + (m2 ?? 0) - ((h1 ?? 0) * 60 + (m1 ?? 0));
  if (diff < 0) diff += 24 * 60;
  return (diff / 60).toFixed(2);
};

export const createDefaultPermissionForm = (): PermissionFormData => ({
  employeeId: "",
  type: "DEDUCTIBLE",
  date: new Date().toISOString().split("T")[0] ?? "",
  startTime: "09:00",
  endTime: "11:00",
  reason: "",
  details: "",
  isUrgent: false,
  isCompensated: false,
  compensationDate: "",
  compensationNotes: "",
  attachments: "",
});
