import React from "react";
import { Activity, Clock, Coffee, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { calculateWorkHours } from "../../../utils/shiftHelpers";
import { Shift } from "./types";

interface ShiftDetailsStatsGridProps {
  shift: Shift;
  totalAssignments: number;
}

export const ShiftDetailsStatsGrid: React.FC<ShiftDetailsStatsGridProps> = ({
  shift,
  totalAssignments,
}) => {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  وقت البدء
                </p>
                <p className="text-2xl font-bold mt-1 font-mono tabular-nums">
                  {shift.startTime}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  وقت الانتهاء
                </p>
                <p className="text-2xl font-bold mt-1 font-mono tabular-nums">
                  {shift.endTime}
                </p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  مدة الراحة
                </p>
                <p className="text-2xl font-bold mt-1">
                  <span className="font-mono tabular-nums">
                    {shift.breakDuration}
                  </span>{" "}
                  د
                </p>
              </div>
              <Coffee className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  ساعات العمل
                </p>
                <p className="text-2xl font-bold mt-1">
                  <span className="font-mono tabular-nums">
                    {calculateWorkHours(
                      shift.startTime,
                      shift.endTime,
                      shift.breakDuration,
                    )}
                  </span>{" "}
                  س
                </p>
              </div>
              <Activity className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shift Info */}
      <Card>
        <CardHeader>
          <CardTitle>معلومات المناوبة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-sm text-muted-foreground">
                الحالة
              </label>
              <div className="mt-2">
                {shift.isActive ? (
                  <Badge className="bg-green-100 text-success">نشط</Badge>
                ) : (
                  <Badge variant="outline">غير نشط</Badge>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                إجمالي الموظفين المعينين
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-lg font-semibold">
                  <span className="font-mono tabular-nums">
                    {totalAssignments}
                  </span>{" "}
                  موظف
                </span>
              </div>
            </div>
            <div>
              <label className="text-sm text-muted-foreground">
                اللون
              </label>
              <div className="mt-2 flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded border-2 border-border"
                  style={{ backgroundColor: shift.color }}
                />
                <span className="text-sm font-mono">{shift.color}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
};
