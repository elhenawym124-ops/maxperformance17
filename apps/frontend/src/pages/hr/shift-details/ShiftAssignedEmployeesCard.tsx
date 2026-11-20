import React from "react";
import { Trash2, UserPlus, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { ShiftAssignment } from "./types";
import { formatShiftAssignmentDate } from "./helpers";

interface ShiftAssignedEmployeesCardProps {
  assignments: ShiftAssignment[];
  totalAssignments: number;
  onAssignOpen: () => void;
  onRemoveAssignment: (assignmentId: string) => void;
}

export const ShiftAssignedEmployeesCard: React.FC<
  ShiftAssignedEmployeesCardProps
> = ({
  assignments,
  totalAssignments,
  onAssignOpen,
  onRemoveAssignment,
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            الموظفين المعينين (
            <span className="font-mono tabular-nums">{totalAssignments}</span>)
          </CardTitle>
          <Button size="sm" onClick={onAssignOpen}>
            <UserPlus className="h-4 w-4 ms-2" />
            إضافة موظف
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {assignments.length === 0 ? (
          <div className="text-center py-12">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground mb-4">
              لا يوجد موظفين معينين لهذه المناوبة
            </p>
            <Button onClick={onAssignOpen}>
              <UserPlus className="h-4 w-4 ms-2" />
              تعيين موظف
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="flex items-center justify-between p-4 border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    {assignment.user ? (
                      <>
                        <p className="font-semibold">
                          {assignment.user.firstName} {assignment.user.lastName}
                        </p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {assignment.user.employeeNumber && (
                            <span className="font-mono tabular-nums">
                              #{assignment.user.employeeNumber}
                            </span>
                          )}
                          {assignment.user.email && (
                            <span>• {assignment.user.email}</span>
                          )}
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="font-semibold text-destructive">
                          موظف محذوف
                        </p>
                        <p className="text-xs text-destructive">
                          تعيين قديم - يرجى الحذف
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-left">
                    <p className="text-sm text-muted-foreground">
                      تاريخ التعيين
                    </p>
                    <p className="text-sm font-medium">
                      {formatShiftAssignmentDate(assignment.date)}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onRemoveAssignment(assignment.id)}
                    className="text-red-500 hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
