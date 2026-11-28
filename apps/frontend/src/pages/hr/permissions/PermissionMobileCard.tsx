import React from "react";
import { Clock, Calendar, Check, X, Eye, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PermissionRequest } from "./types";
import { permissionTypeConfig, statusConfig } from "./helpers";

interface PermissionMobileCardProps {
  request: PermissionRequest;
  isMyPermissions: boolean;
  onApprove: (id: string) => void;
  onRejectClick: (request: PermissionRequest) => void;
  onDetailsClick: (request: PermissionRequest) => void;
  onDeleteClick: (request: PermissionRequest) => void;
}

export const PermissionMobileCard: React.FC<PermissionMobileCardProps> = ({
  request,
  isMyPermissions,
  onApprove,
  onRejectClick,
  onDetailsClick,
  onDeleteClick,
}) => {
  const { t } = useTranslation();
  const typeConfig =
    permissionTypeConfig[request.type] || permissionTypeConfig["DEDUCTIBLE"];
  const TypeIcon = typeConfig.icon;
  const status = statusConfig[request.status];

  return (
    <div className="p-3.5 space-y-2.5 hover:bg-muted dark:hover:bg-muted transition-colors">
      {/* Top row: Employee (if admin) or Type badge + Status badge */}
      <div className="flex items-start justify-between gap-2">
        {!isMyPermissions && (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 border border-border dark:border-border shrink-0">
              <AvatarImage src={request.employee?.avatar} />
              <AvatarFallback className="bg-blue-50 text-primary font-bold text-xs">
                {request.employee?.firstName?.[0]}
                {request.employee?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">
                {request.employee?.firstName} {request.employee?.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {request.employee?.department?.name ||
                  t("employee.permissions.noDepartment")}{" "}
                • {request.employee?.employeeNumber}
              </p>
            </div>
          </div>
        )}
        <div className="flex items-center gap-1.5 shrink-0 ms-auto">
          <span
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold ${status.color}`}
          >
            <status.icon className="h-3 w-3" />
            {t(`employee.permissions.${status.labelKey}`)}
          </span>
        </div>
      </div>

      {/* Middle row: Type, Urgency, Date */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${typeConfig.color}`}
        >
          <TypeIcon className="h-3.5 w-3.5" />
          {t(`employee.permissions.${typeConfig.labelKey}`)}
        </span>
        {request.isUrgent && (
          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-destructive text-destructive dark:bg-destructive/30 dark:text-destructive">
            {t("employee.permissions.urgent")}
          </span>
        )}
        <div className="flex items-center gap-1 text-foreground dark:text-muted-foreground ms-auto text-xs font-medium">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-mono tabular-nums">
            {new Date(request.date).toLocaleDateString("ar-EG", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>

      {/* Time & Duration Box */}
      <div className="flex items-center justify-between text-xs bg-muted dark:bg-muted p-2.5 rounded-xl border border-border dark:border-border">
        <div className="flex items-center gap-1.5 text-foreground">
          <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
          <span className="font-bold font-mono tabular-nums">{request.startTime}</span>
          <span className="text-[10px] text-muted-foreground">{t("employee.permissions.timeDelimiter")}</span>
          <span className="font-bold font-mono tabular-nums">{request.endTime}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="px-2 py-0.5 bg-primary/10 dark:bg-primary/30 text-primary dark:text-primary rounded font-bold font-mono tabular-nums">
            {request.totalHours}
          </span>
          <span className="text-[11px] text-muted-foreground">{t("employee.permissions.hour")}</span>
        </div>
      </div>

      {/* Reason snippet */}
      {request.reason && (
        <p className="text-xs text-foreground dark:text-muted-foreground line-clamp-1 bg-white/50 dark:bg-muted px-2 py-1 rounded">
          {request.reason}
        </p>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-border dark:border-border">
        {request.status === "PENDING" && !isMyPermissions && (
          <>
            <Button
              size="sm"
              className="h-9 min-h-[38px] px-3 text-xs bg-success hover:bg-success text-white rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              onClick={() => onApprove(request.id)}
            >
              <Check className="h-4 w-4" />
              <span>{t("employee.permissions.approve")}</span>
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="h-9 min-h-[38px] px-3 text-xs rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
              onClick={() => onRejectClick(request)}
            >
              <X className="h-4 w-4" />
              <span>{t("employee.permissions.reject")}</span>
            </Button>
          </>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-9 min-h-[38px] px-3 text-xs text-primary hover:bg-primary/10 dark:hover:bg-primary/20 rounded-lg flex items-center gap-1.5 cursor-pointer"
          onClick={() => onDetailsClick(request)}
        >
          <Eye className="h-4 w-4" />
          <span>{t("employee.permissions.detailsButton", "تفاصيل")}</span>
        </Button>
        {(!isMyPermissions || request.status === "PENDING") && (
          <Button
            size="sm"
            variant="ghost"
            className="h-10 w-10 min-h-[40px] min-w-[40px] p-0 hover:bg-destructive/10 dark:hover:bg-destructive/20 text-destructive rounded-lg cursor-pointer"
            onClick={() => onDeleteClick(request)}
            title={t("employee.permissions.delete")}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
};
