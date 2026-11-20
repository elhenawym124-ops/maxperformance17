import React from "react";
import {
  Clock,
  UserCheck,
  AlertCircle,
  MapPin,
  Pencil,
  Trash2,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceRecord } from "./types";
import {
  statusConfig,
  formatAttendanceDate,
  parseLocation,
} from "./helpers";

interface AttendanceMobileCardProps {
  record: AttendanceRecord;
  attendanceTimezone: string;
  handleCheckIn: (empId: string) => void;
  handleCheckOut: (empId: string) => void;
  handleEditClick: (record: AttendanceRecord) => void;
  confirmDelete: (id: string) => void;
  openAutoCloseReview: (record: AttendanceRecord) => void;
  setSelectedNotes: (notes: string) => void;
  setShowNotesDialog: (open: boolean) => void;
  openLocationInMap: (latitude: number, longitude: number, type: string) => void;
}

export const AttendanceMobileCard: React.FC<AttendanceMobileCardProps> = ({
  record,
  attendanceTimezone,
  handleCheckIn,
  handleCheckOut,
  handleEditClick,
  confirmDelete,
  openAutoCloseReview,
  setSelectedNotes,
  setShowNotesDialog,
  openLocationInMap,
}) => {
  const formatAttendanceTime = (dateValue: string | null) => {
    if (!dateValue) return "—";
    return new Date(dateValue).toLocaleTimeString("ar-EG", {
      timeZone: attendanceTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const checkInLoc = parseLocation(record.checkInLocation);
  const checkOutLoc = parseLocation(record.checkOutLocation);
  const status = statusConfig[record.status] || {
    label: record.status,
    color: "bg-gray-100 text-foreground",
  };

  return (
    <div className="p-3.5 space-y-3 bg-card border border-border/70 rounded-xl hover:bg-muted/20 transition-colors">
      {/* Top Row: Employee + Status */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-9 w-9 border border-border/70 shrink-0">
            <AvatarImage src={record.employee?.avatar} />
            <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
              {record.employee?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-sm text-foreground truncate">
              {record.employee?.firstName} {record.employee?.lastName}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">
              {record.employee?.department?.name || "بدون قسم"} •{" "}
              <span className="font-mono tabular-nums">{record.employee?.employeeNumber}</span>
            </p>
          </div>
        </div>
        <Badge className={`shrink-0 text-[10px] font-bold px-2 py-0.5 ${status.color}`}>
          {status.label}
        </Badge>
      </div>

      {/* Mini Grid: In / Out / Work Time */}
      <div className="grid grid-cols-3 gap-2 bg-muted/40 p-2.5 rounded-lg border border-border/40 text-center">
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            حضور
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">
            {formatAttendanceTime(record.checkIn)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            انصراف
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">
            {formatAttendanceTime(record.checkOut)}
          </span>
        </div>
        <div>
          <span className="text-[10px] font-medium text-muted-foreground block">
            العمل
          </span>
          <span className="text-xs font-bold text-foreground font-mono tabular-nums">
            {record.workHours ? `${record.workHours} س` : "—"}
          </span>
        </div>
      </div>

      {/* Date & Quick Details */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1">
        <span className="font-mono tabular-nums">
          {formatAttendanceDate(record.date, { year: "numeric", month: "short", day: "numeric" }, "-", attendanceTimezone)}
        </span>

        {record.lateMinutes > 0 && (
          <span className="text-amber-600 dark:text-warning font-bold font-mono tabular-nums flex items-center gap-1">
            <AlertCircle className="h-3 w-3" />
            تأخير {record.lateMinutes} د
          </span>
        )}

        {(checkInLoc || checkOutLoc) && (
          <button
            type="button"
            onClick={() => {
              const target = checkInLoc || checkOutLoc;
              if (target) openLocationInMap(target.lat, target.lng, checkInLoc ? "حضور" : "انصراف");
            }}
            className="flex items-center gap-1 text-primary hover:underline text-[11px] font-medium"
          >
            <MapPin className="h-3 w-3" />
            الموقع
          </button>
        )}
      </div>

      {/* Actions Row */}
      <div className="flex items-center gap-1.5 pt-2 border-t border-border/50">
        {!record.checkIn ? (
          <Button
            size="sm"
            onClick={() => handleCheckIn(record.employeeId)}
            className="flex-1 h-8 text-xs bg-success hover:bg-success text-white font-semibold"
          >
            <UserCheck className="h-3.5 w-3.5 ms-1" />
            تسجيل حضور
          </Button>
        ) : !record.checkOut ? (
          <Button
            size="sm"
            onClick={() => handleCheckOut(record.employeeId)}
            className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >
            <Clock className="h-3.5 w-3.5 ms-1" />
            تسجيل انصراف
          </Button>
        ) : null}

        {record.notes && (
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-2.5 text-xs"
            onClick={() => {
              setSelectedNotes(record.notes || "");
              setShowNotesDialog(true);
            }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs"
          onClick={() => handleEditClick(record)}
        >
          <Pencil className="h-3.5 w-3.5" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 px-2.5 text-xs text-destructive hover:bg-destructive/10 hover:border-destructive/30"
          onClick={() => confirmDelete(record.id)}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
};
