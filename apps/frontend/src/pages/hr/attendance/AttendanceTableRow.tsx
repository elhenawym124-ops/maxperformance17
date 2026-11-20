import React from "react";
import {
  Clock,
  UserCheck,
  AlertCircle,
  MapPin,
  Pencil,
  Trash2,
  Home,
  Building2,
  Eye,
} from "lucide-react";
import { TableRow, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AttendanceRecord } from "./types";
import {
  statusConfig,
  autoCloseReviewConfig,
  formatAttendanceDate,
  getAutoCloseReasonLabel,
  parseLocation,
} from "./helpers";

interface AttendanceTableRowProps {
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

export const AttendanceTableRow: React.FC<AttendanceTableRowProps> = ({
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
    if (!dateValue) return "-";

    return new Date(dateValue).toLocaleTimeString("ar-EG", {
      timeZone: attendanceTimezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const checkInLoc = parseLocation(record.checkInLocation);
  const checkOutLoc = parseLocation(record.checkOutLocation);
  const isHome = record.workMode === "HOME";

  return (
    <TableRow className="hover:bg-gray-50/50 dark:hover:bg-muted">
      <TableCell>
        <div className="flex items-center gap-3 font-arabic">
          <Avatar className="h-9 w-9 border border-border">
            <AvatarImage src={record.employee?.avatar} />
            <AvatarFallback className="bg-blue-50 text-blue-700">
              {record.employee?.firstName?.[0]}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <p className="font-bold text-foreground text-sm">
              {record.employee?.firstName} {record.employee?.lastName}
            </p>
            <p className="text-[10px] text-muted-foreground font-mono tracking-wider">
              {record.employee?.employeeNumber}
            </p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-0.5">
          <span className="font-bold text-foreground dark:text-muted-foreground text-xs">
            {formatAttendanceDate(
              record.date,
              { weekday: "long" },
              "-",
              attendanceTimezone,
            )}
          </span>
          <span className="text-[10px] text-muted-foreground font-mono tabular-nums">
            {formatAttendanceDate(
              record.date,
              {
                year: "numeric",
                month: "2-digit",
                day: "2-digit",
              },
              "-",
              attendanceTimezone,
            )}
          </span>
        </div>
      </TableCell>
      <TableCell>
        <Badge
          variant="outline"
          className="font-medium bg-muted text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border"
        >
          {record.employee?.department?.name || "بدون قسم"}
        </Badge>
      </TableCell>
      <TableCell>
        {record.checkIn ? (
          <div className="flex flex-col">
            <span className="text-green-600 font-bold text-sm font-mono tabular-nums">
              {formatAttendanceTime(record.checkIn)}
            </span>
          </div>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell>
        {record.checkOut ? (
          <div className="flex flex-col">
            <span className="text-blue-600 font-bold text-sm font-mono tabular-nums">
              {formatAttendanceTime(record.checkOut)}
            </span>
          </div>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="space-y-1.5 min-w-[120px]">
          <div className="flex items-center gap-1.5 mb-1">
            {isHome ? (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary dark:bg-primary/20 dark:text-primary dark:border-primary/30 text-[10px] font-bold">
                <Home className="h-3 w-3" />
                <span>من المنزل</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800/30 text-[10px] font-bold">
                <Building2 className="h-3 w-3" />
                <span>من المكتب</span>
              </div>
            )}
          </div>
          <div className="space-y-1 text-[10px]">
            {checkInLoc && (
              <div
                className={`flex items-center gap-1 ${
                  isHome ? "text-purple-500" : "text-green-600"
                } cursor-pointer hover:underline`}
                onClick={() =>
                  openLocationInMap(
                    Number(checkInLoc.latitude),
                    Number(checkInLoc.longitude),
                    "حضور",
                  )
                }
              >
                <MapPin className="h-3 w-3" />
                <span className="font-mono tabular-nums">
                  حضور: {Number(checkInLoc.latitude).toFixed(4)},{" "}
                  {Number(checkInLoc.longitude).toFixed(4)}
                </span>
              </div>
            )}
            {checkOutLoc && (
              <div
                className={`flex items-center gap-1 ${
                  isHome ? "text-purple-500" : "text-blue-600"
                } cursor-pointer hover:underline`}
                onClick={() =>
                  openLocationInMap(
                    Number(checkOutLoc.latitude),
                    Number(checkOutLoc.longitude),
                    "انصراف",
                  )
                }
              >
                <MapPin className="h-3 w-3" />
                <span className="font-mono tabular-nums">
                  انصراف: {Number(checkOutLoc.latitude).toFixed(4)},{" "}
                  {Number(checkOutLoc.longitude).toFixed(4)}
                </span>
              </div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        {record.workHours !== null &&
        record.workHours !== undefined &&
        Number(record.workHours) > 0 ? (
          <span className="font-bold text-foreground font-mono tabular-nums">
            {Number(record.workHours).toFixed(1)} س
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell>
        {record.overtimeHours && Number(record.overtimeHours) > 0 ? (
          <span className="text-indigo-600 font-black font-mono tabular-nums">
            {Number(record.overtimeHours).toFixed(1)} س
          </span>
        ) : (
          <span className="text-gray-300">-</span>
        )}
      </TableCell>
      <TableCell>
        {record.lateMinutes && record.lateMinutes > 0 ? (
          <div className="flex flex-col leading-none">
            <span className="text-red-600 font-black text-sm font-mono tabular-nums">
              {Math.floor(record.lateMinutes / 60) > 0 &&
                `${Math.floor(record.lateMinutes / 60)}س `}
              {record.lateMinutes % 60}د
            </span>
          </div>
        ) : (
          <span className="text-green-500 font-bold opacity-30">-</span>
        )}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-2">
          <Badge
            className={`${statusConfig[record.status]?.color} font-bold px-3 w-fit`}
          >
            {statusConfig[record.status]?.label}
          </Badge>
          {record.isAutoClosed &&
            record.autoCloseAudit &&
            record.autoCloseAudit.isAutoClosed && (
              <>
                <Badge className="bg-amber-100 text-warning font-bold px-3 w-fit">
                  مغلق تلقائيًا
                </Badge>
                <Badge
                  className={`${
                    autoCloseReviewConfig[
                      record.autoCloseAudit.reviewStatus
                    ]?.color
                  } font-bold px-3 w-fit`}
                >
                  {
                    autoCloseReviewConfig[
                      record.autoCloseAudit.reviewStatus
                    ]?.label
                  }
                </Badge>
                <div className="text-[10px] leading-4 text-muted-foreground">
                  <div>
                    السبب:{" "}
                    {getAutoCloseReasonLabel(
                      record.autoCloseAudit.autoCloseReason,
                    )}
                  </div>
                  <div>
                    وقت الإغلاق:{" "}
                    {formatAttendanceTime(
                      record.autoCloseAudit.scheduledCheckOut,
                    )}
                  </div>
                </div>
              </>
            )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {record.checkIn &&
            !record.checkOut &&
            !record.id.startsWith("temp-") && (
              <Button
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 bg-warning/10 text-warning border-warning hover:bg-warning hover:text-white"
                onClick={() => handleCheckOut(record.employee.id)}
              >
                <Clock className="h-3.5 w-3.5" />
                <span>انصراف</span>
              </Button>
            )}
          {!record.checkIn && record.id.startsWith("temp-") && (
            <button
              type="button"
              className="p-2 rounded-lg bg-success/10 text-success hover:bg-success hover:text-white transition-all border border-success"
              onClick={() => handleCheckIn(record.employee.id)}
              title="تسجيل حضور الآن"
            >
              <UserCheck className="h-4 w-4" />
            </button>
          )}
          {record.notes && (
            <button
              type="button"
              className="p-2 rounded-lg bg-muted text-foreground hover:bg-muted hover:text-white transition-all border border-border"
              onClick={() => {
                setSelectedNotes(record.notes || "");
                setShowNotesDialog(true);
              }}
              title="عرض الملاحظات"
            >
              <Eye className="h-4 w-4" />
            </button>
          )}
          {record.isAutoClosed &&
            record.autoCloseAudit &&
            record.autoCloseAudit.isAutoClosed && (
              <button
                type="button"
                className="p-2 rounded-lg bg-warning/10 text-warning hover:bg-warning hover:text-white transition-all border border-warning"
                onClick={() => openAutoCloseReview(record)}
                title="مراجعة الإغلاق التلقائي"
              >
                <AlertCircle className="h-4 w-4" />
              </button>
            )}
          <button
            type="button"
            className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all border border-blue-100"
            onClick={() => handleEditClick(record)}
            title="تعديل"
          >
            <Pencil className="h-4 w-4" />
          </button>
          {!record.id.startsWith("temp-") && (
            <button
              type="button"
              className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all border border-destructive"
              onClick={() => confirmDelete(record.id)}
              title="حذف"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
};
