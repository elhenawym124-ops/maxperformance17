import React from "react";
import {
  Clock,
  Users,
  Edit,
  Copy,
  Trash2,
  MoreVertical,
} from "lucide-react";
import {
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Switch } from "../../../components/ui/switch";
import { Checkbox } from "../../../components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import { cn } from "../../../lib/utils";
import { calculateWorkHours } from "../../../utils/shiftHelpers";
import type { Shift } from "./types";

interface ShiftsGridViewProps {
  shifts: Shift[];
  selectedShifts: string[];
  onToggleSelect: (id: string) => void;
  onToggleStatus: (shiftId: string, currentStatus: boolean) => void;
  onEdit: (shift: Shift) => void;
  onDuplicate: (shift: Shift) => void;
  onAssign: (shift: Shift) => void;
  onDelete: (id: string) => void;
  onNavigateDetails: (id: string) => void;
}

export const ShiftsGridView: React.FC<ShiftsGridViewProps> = ({
  shifts,
  selectedShifts,
  onToggleSelect,
  onToggleStatus,
  onEdit,
  onDuplicate,
  onAssign,
  onDelete,
  onNavigateDetails,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {shifts.map((shift) => (
        <div
          key={shift.id}
          className={cn(
            "transition-all duration-300 hover:shadow-xl cursor-pointer group relative rounded-xl border-none shadow-md overflow-hidden bg-white/90 dark:bg-muted backdrop-blur-md",
            selectedShifts.includes(shift.id)
              ? "ring-2 ring-primary"
              : "ring-1 ring-border dark:ring-white/5",
          )}
          onClick={(e) => {
            const target = e.target as HTMLElement;
            if (
              !target.closest("button") &&
              !target.closest(".no-click") &&
              !target.closest("input")
            ) {
              onNavigateDetails(shift.id);
            }
          }}
        >
          <div
            className="h-1.5 w-full transition-opacity group-hover:opacity-100 opacity-80"
            style={{ backgroundColor: shift.color }}
          />

          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Checkbox
                  checked={selectedShifts.includes(shift.id)}
                  onCheckedChange={() => onToggleSelect(shift.id)}
                  className="no-click border-border"
                  onClick={(e) => e.stopPropagation()}
                />
                <CardTitle className="text-lg font-black text-foreground dark:text-muted-foreground leading-tight group-hover:text-primary dark:group-hover:text-primary transition-colors">
                  {shift.name}
                </CardTitle>
              </div>
              <div
                className="flex items-center gap-2 no-click"
                onClick={(e) => e.stopPropagation()}
              >
                <Switch
                  checked={shift.isActive}
                  onCheckedChange={() =>
                    onToggleStatus(shift.id, shift.isActive)
                  }
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 pt-1 px-5 pb-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider flex items-center gap-1">
                  <Clock className="h-3 w-3" /> الوقت
                </span>
                <div className="flex items-center gap-2 font-bold text-xs bg-muted dark:bg-muted px-2 py-1 rounded-lg border border-border dark:border-white/5 text-foreground font-mono tabular-nums">
                  {shift.startTime} - {shift.endTime}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  ساعات العمل
                </span>
                <Badge
                  variant="secondary"
                  className="bg-blue-50 dark:bg-primary/30 text-primary dark:text-primary border-none font-black text-xs px-2.5 py-0.5 rounded-lg font-mono tabular-nums"
                >
                  {calculateWorkHours(
                    shift.startTime,
                    shift.endTime,
                    shift.breakDuration,
                  )}{" "}
                  ساعة
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground/80 uppercase tracking-wider">
                  الموظفين
                </span>
                <div className="flex items-center gap-1.5 font-black text-primary dark:text-primary bg-primary/10 dark:bg-primary/30 px-2.5 py-0.5 rounded-lg border-none font-mono tabular-nums">
                  <Users className="h-3.5 w-3.5" />
                  <span className="text-xs">
                    {shift._count?.shiftAssignments || 0}
                  </span>
                </div>
              </div>

              <div
                className="pt-3 border-t border-border dark:border-border flex items-center justify-between no-click"
                onClick={(e) => e.stopPropagation()}
              >
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl h-8 px-3 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 hover:text-primary dark:hover:text-primary font-bold text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigateDetails(shift.id);
                  }}
                >
                  عرض التفاصيل
                </Button>

                <div className="flex items-center gap-1">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 rounded-lg hover:bg-muted"
                      >
                        <MoreVertical className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      dir="rtl"
                      className="rounded-xl shadow-xl border-none p-1 bg-white/95 dark:bg-muted backdrop-blur-md"
                    >
                      <DropdownMenuItem
                        className="rounded-lg gap-2 font-medium py-2 px-3 text-xs"
                        onClick={() => onEdit(shift)}
                      >
                        <Edit className="h-3.5 w-3.5 text-primary" />
                        <span>تعديل</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg gap-2 font-medium py-2 px-3 text-xs"
                        onClick={() => onDuplicate(shift)}
                      >
                        <Copy className="h-3.5 w-3.5 text-primary" />
                        <span>نسخ</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="rounded-lg gap-2 font-medium py-2 px-3 text-xs"
                        onClick={() => onAssign(shift)}
                      >
                        <Users className="h-3.5 w-3.5 text-primary" />
                        <span>تعيين موظفين</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onDelete(shift.id)}
                        className="rounded-lg gap-2 font-medium text-destructive focus:text-destructive focus:bg-destructive/10 py-2 px-3 text-xs"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>حذف</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardContent>
        </div>
      ))}
    </div>
  );
};
