import { EmployeeFormData } from "./types";

export const statusColors: Record<string, string> = {
  ACTIVE: "bg-green-100 text-success",
  ON_LEAVE: "bg-yellow-100 text-warning",
  SUSPENDED: "bg-red-100 text-destructive",
  TERMINATED: "bg-gray-100 text-foreground",
  RESIGNED: "bg-orange-100 text-warning",
};

export const contractKeys: Record<string, string> = {
  FULL_TIME: "contractFullTime",
  PART_TIME: "contractPartTime",
  CONTRACT: "contractContract",
  CONTRACTOR: "contractContract",
  TEMPORARY: "contractTemporary",
  INTERNSHIP: "contractInternship",
  INTERN: "contractInternship",
  FREELANCE: "contractFreelance",
};

export const statusKeys: Record<string, string> = {
  ACTIVE: "statusActive",
  ON_LEAVE: "statusOnLeave",
  SUSPENDED: "statusSuspended",
  TERMINATED: "statusTerminated",
  RESIGNED: "statusResigned",
};

export const createDefaultEmployeeForm = (): EmployeeFormData => ({
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  mobile: "",
  password: "",
  role: "AGENT",
  departmentId: "",
  positionId: "",
  hireDate: new Date().toISOString().split("T")[0] ?? "",
  contractType: "FULL_TIME",
  baseSalary: "",
  nationalId: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  country: "Egypt",
  enableAutoDeduction: true,
  monthlyGraceMinutes: 60,
  maxDailyLateMinutes: 10,
  lateDeductionRate: "",
});
