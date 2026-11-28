import React from "react";
import {
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Shield,
  KeyRound,
  UserX,
  UserCheck,
  UserMinus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Employee } from "./types";
import { statusColors, contractKeys, statusKeys } from "./helpers";

interface EmployeeMobileCardProps {
  employee: Employee;
  onOpenAssets: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
  onResetPassword?: (employee: Employee) => void;
  onToggleStatus?: (employee: Employee) => void;
  onTerminate?: (employee: Employee) => void;
}

const roleLabel = (role?: string) => {
  switch (role) {
    case "COMPANY_ADMIN":
      return "مدير الشركة";
    case "MANAGER":
      return "مدير";
    case "AGENT":
      return "موظف";
    case "AFFILIATE":
      return "مسوق";
    default:
      return role || "";
  }
};

export const EmployeeMobileCard: React.FC<EmployeeMobileCardProps> = ({
  employee,
  onOpenAssets,
  onDelete,
  onResetPassword,
  onToggleStatus,
  onTerminate,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const contractLabel =
    t(`employees.${contractKeys[employee.contractType]}`) ||
    employee.contractType ||
    t("employees.notSpecified");

  const statusLabel = statusKeys[employee.status]
    ? t(`employees.${statusKeys[employee.status]}`)
    : employee.status || t("employees.notSpecified");

  return (
    <div className="p-3.5 space-y-3" dir="rtl">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-10 w-10 shrink-0 border border-border/60">
            {employee.avatar ? (
              <AvatarImage
                src={
                  employee.avatar.startsWith("http")
                    ? employee.avatar
                    : `https://mokhtarelhenawy.online${employee.avatar}`
                }
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${employee.firstName}+${employee.lastName}&background=random`;
                }}
              />
            ) : (
              <AvatarFallback>
                {employee.firstName?.[0]}
                {employee.lastName?.[0]}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm text-foreground truncate">
              {employee.firstName || t("employees.notSpecified")}{" "}
              {employee.lastName || ""}
            </p>
            <p className="text-[11px] text-muted-foreground font-mono tabular-nums truncate">
              {employee.employeeNumber || t("employees.notSpecified")}
            </p>
          </div>
        </div>
        <Badge
          className={`${statusColors[employee.status] || ""} shrink-0 text-[10px] px-2 py-0.5`}
        >
          {statusLabel}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2 min-w-0">
          <span className="block text-[10px] text-muted-foreground">القسم</span>
          <span className="block truncate font-medium text-foreground">
            {employee.department?.name || "-"}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2 min-w-0">
          <span className="block text-[10px] text-muted-foreground">
            المسمى الوظيفي
          </span>
          <span className="block truncate font-medium text-foreground">
            {employee.position?.title || "-"}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2 min-w-0">
          <span className="block text-[10px] text-muted-foreground">العقد</span>
          <span className="block truncate font-medium text-foreground">
            {contractLabel}
          </span>
        </div>
        <div className="rounded-lg bg-muted/40 border border-border/40 px-2.5 py-2 min-w-0">
          <span className="block text-[10px] text-muted-foreground">
            تاريخ التعيين
          </span>
          <span className="block truncate font-medium text-foreground font-mono tabular-nums">
            {employee.hireDate
              ? new Date(employee.hireDate).toLocaleDateString("ar-EG")
              : "-"}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
        <span className="truncate">
          {employee.user
            ? employee.user.isActive
              ? "حساب الدخول نشط"
              : "حساب الدخول موقوف"
            : "لا يوجد حساب دخول"}
        </span>
        {employee.user && (
          <Badge className="bg-primary/10 text-primary text-[10px] shrink-0">
            {roleLabel(employee.user.role)}
          </Badge>
        )}
      </div>

      <div className="flex items-center gap-1.5 pt-2 border-t border-border/60">
        <Button
          variant="outline"
          className="flex-1 h-9 min-h-[40px] text-xs gap-1.5"
          onClick={() => navigate(`/hr/employees/${employee.id}`)}
        >
          <Eye className="h-4 w-4" />
          عرض الملف
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-9 min-h-[40px] px-3 text-xs gap-1.5 shrink-0"
            >
              <MoreVertical className="h-4 w-4" />
              الإجراءات
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56" dir="rtl">
            <DropdownMenuItem
              onClick={() => navigate(`/hr/employees/${employee.id}`)}
            >
              <Eye className="h-4 w-4 ms-2 text-muted-foreground" />
              عرض الملف
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onOpenAssets(employee)}>
              <Shield className="h-4 w-4 ms-2 text-muted-foreground" />
              العهدة والممتلكات
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => navigate(`/hr/employees/${employee.id}/edit`)}
            >
              <Edit className="h-4 w-4 ms-2 text-muted-foreground" />
              تعديل البيانات
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            {onResetPassword && (
              <DropdownMenuItem
                onClick={() => onResetPassword(employee)}
                className="text-indigo-600 focus:text-primary"
              >
                <KeyRound className="h-4 w-4 ms-2" />
                بيانات الدخول / كلمة السر
              </DropdownMenuItem>
            )}

            {onToggleStatus && (
              <DropdownMenuItem
                onClick={() => onToggleStatus(employee)}
                className={
                  employee.user?.isActive ? "text-amber-600" : "text-emerald-600"
                }
              >
                {employee.user?.isActive ? (
                  <>
                    <UserX className="h-4 w-4 ms-2" />
                    تجميد حساب الدخول
                  </>
                ) : (
                  <>
                    <UserCheck className="h-4 w-4 ms-2" />
                    تفعيل حساب الدخول
                  </>
                )}
              </DropdownMenuItem>
            )}

            {onTerminate && employee.status !== "TERMINATED" && (
              <DropdownMenuItem
                onClick={() => onTerminate(employee)}
                className="text-orange-600"
              >
                <UserMinus className="h-4 w-4 ms-2" />
                إنهاء الخدمة
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              className="text-red-600 focus:text-destructive"
              onClick={() => onDelete(employee)}
            >
              <Trash2 className="h-4 w-4 ms-2" />
              حذف الموظف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default EmployeeMobileCard;
