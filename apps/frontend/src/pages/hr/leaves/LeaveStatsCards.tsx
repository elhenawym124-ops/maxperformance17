import React from "react";
import { Clock, Check, X, Calendar } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { LeaveRequest } from "./types";

interface LeaveStatsCardsProps {
  t: (key: string) => string;
  requests: LeaveRequest[];
  pendingCount: number;
}

export const LeaveStatsCards: React.FC<LeaveStatsCardsProps> = ({
  t,
  requests,
  pendingCount,
}) => {
  const approvedCount = requests.filter((r) => r.status === "APPROVED").length;
  const rejectedCount = requests.filter((r) => r.status === "REJECTED").length;
  const totalDays = requests
    .filter((r) => r.status === "APPROVED")
    .reduce((sum, r) => sum + r.totalDays, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
      <Card className="bg-gradient-to-br from-yellow-500 to-yellow-600 text-white rounded-xl sm:rounded-2xl">
        <CardContent className="p-3.5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-yellow-100 text-xs sm:text-sm">{t("employee.leaves.pending")}</p>
              <h3 className="text-xl sm:text-3xl font-bold mt-1 font-mono tabular-nums">{pendingCount}</h3>
            </div>
            <Clock className="h-6 w-6 sm:h-10 sm:w-10 opacity-80" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-3.5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">{t("employee.leaves.approved")}</p>
              <h3 className="text-xl sm:text-3xl font-bold mt-1 text-green-600 font-mono tabular-nums">
                {approvedCount}
              </h3>
            </div>
            <Check className="h-6 w-6 sm:h-10 sm:w-10 text-green-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-3.5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">{t("employee.leaves.rejected")}</p>
              <h3 className="text-xl sm:text-3xl font-bold mt-1 text-red-600 font-mono tabular-nums">
                {rejectedCount}
              </h3>
            </div>
            <X className="h-6 w-6 sm:h-10 sm:w-10 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl sm:rounded-2xl">
        <CardContent className="p-3.5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-xs sm:text-sm">{t("employee.leaves.totalDays")}</p>
              <h3 className="text-xl sm:text-3xl font-bold mt-1 text-blue-600 font-mono tabular-nums">
                {totalDays}
              </h3>
            </div>
            <Calendar className="h-6 w-6 sm:h-10 sm:w-10 text-blue-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
