import React from "react";
import {
  Calendar,
  Check,
  X,
  Eye,
  RotateCcw,
  ArrowRight,
  Trash2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LeaveRequest, leaveTypeConfig, statusConfig } from "./types";

interface LeaveMobileCardProps {
  request: LeaveRequest;
  t: (key: string, options?: any) => string;
  isMyLeaves: boolean;
  onApprove: (id: string) => void;
  onOpenReject: (req: LeaveRequest) => void;
  onCancel: (id: string) => void;
  onOpenChangeDecision: (req: LeaveRequest) => void;
  onOpenEdit: (req: LeaveRequest) => void;
  onDelete: (req: LeaveRequest) => void;
  onOpenDetails: (req: LeaveRequest) => void;
}

export const LeaveMobileCard: React.FC<LeaveMobileCardProps> = ({
  request,
  t,
  isMyLeaves,
  onApprove,
  onOpenReject,
  onCancel,
  onOpenChangeDecision,
  onOpenEdit,
  onDelete,
  onOpenDetails,
}) => {
  const typeConfig = leaveTypeConfig[request.type] || leaveTypeConfig["OTHER"];
  const TypeIcon = typeConfig?.icon || Calendar;
  const status = statusConfig[request.status];

  return (
    <div className="p-3.5 space-y-3 bg-card border border-border/70 rounded-xl hover:bg-muted/20 transition-colors">
      {/* Top row: Employee (if admin) + Status badge */}
      <div className="flex items-start justify-between gap-2">
        {!isMyLeaves ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <Avatar className="h-9 w-9 border border-border/70 shrink-0">
              <AvatarImage src={request.employee?.avatar} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                {request.employee?.firstName?.[0]}
                {request.employee?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="font-bold text-sm text-foreground truncate">
                {request.employee?.firstName} {request.employee?.lastName}
              </p>
              <p className="text-[11px] text-muted-foreground truncate">
                {request.employee?.department?.name || "بدون قسم"}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <TypeIcon className="h-4 w-4 text-primary" />
            <span className="font-bold text-sm text-foreground">
              {t(typeConfig?.labelKey) || request.type}
            </span>
          </div>
        )}

        <Badge className={`shrink-0 text-[10px] font-bold px-2 py-0.5 ${status?.color || ""}`}>
          {t(status?.labelKey) || request.status}
        </Badge>
      </div>

      {/* Leave Type & Paid Indicator (for Admin view) */}
      {!isMyLeaves && (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={`text-[10px] font-semibold ${typeConfig?.color || "bg-muted text-foreground"}`}>
            <TypeIcon className="h-3 w-3 ml-1" />
            {t(typeConfig?.labelKey) || request.type}
          </Badge>
          <Badge
            variant="outline"
            className={`text-[10px] ${
              request.type !== "UNPAID"
                ? "border-emerald-500/40 text-emerald-600 bg-emerald-500/5"
                : "border-rose-500/40 text-rose-600 bg-rose-500/5"
            }`}
          >
            {request.type !== "UNPAID"
              ? t("employee.leaves.paid")
              : t("employee.leaves.unpaid")}
          </Badge>
        </div>
      )}

      {/* Mini Grid: Dates and Duration */}
      <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-center">
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            {t("employee.leaves.from")}
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">
            {new Date(request.startDate).toLocaleDateString("ar-EG")}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            {t("employee.leaves.to")}
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">
            {new Date(request.endDate).toLocaleDateString("ar-EG")}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            {t("employee.leaves.duration")}
          </span>
          <span className="text-xs font-bold text-primary font-mono tabular-nums">
            {request.totalDays} {t("employee.leaves.day")}
          </span>
        </div>
      </div>

      {/* Reason Preview if exists */}
      {request.reason && (
        <p className="text-xs text-muted-foreground line-clamp-2 px-1">
          {request.reason}
        </p>
      )}

      {/* Action Buttons Row */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        {!isMyLeaves && request.status === "PENDING" && (
          <>
            <Button
              size="sm"
              onClick={() => onApprove(request.id)}
              className="flex-1 h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              <Check className="h-3.5 w-3.5 ml-1" />
              {t("employee.leaves.approve")}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenReject(request)}
              className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30 font-semibold"
            >
              <X className="h-3.5 w-3.5 ml-1" />
              {t("employee.leaves.reject")}
            </Button>
          </>
        )}

        {isMyLeaves && request.status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onCancel(request.id)}
            className="flex-1 h-8 text-xs text-destructive hover:bg-destructive/10"
          >
            {t("employee.leaves.cancel")}
          </Button>
        )}

        {!isMyLeaves && request.status !== "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onOpenChangeDecision(request)}
            className="flex-1 h-8 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5 ml-1" />
            {t("employee.leaves.changeDecision")}
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs"
          onClick={() => onOpenDetails(request)}
        >
          <Eye className="h-3.5 w-3.5" />
        </Button>

        {request.status === "PENDING" && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(request)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};
