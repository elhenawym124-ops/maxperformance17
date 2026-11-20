import React from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Badge } from "../../../components/ui/badge";
import { Avatar, AvatarFallback } from "../../../components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  MoreVertical,
  FileText,
  Edit,
  CheckCircle2,
  Trash2,
  Eye,
  Gavel,
  Calendar,
  Clock,
} from "lucide-react";
import { Warning } from "./types";
import { getTypeColor, getTypeLabel, getSeverityBadge } from "./helpers";
import { WarningsEmptyState } from "./WarningsEmptyState";

interface WarningsCardGridProps {
  warnings: Warning[];
  loading: boolean;
  totalWarningsCount: number;
  onSelectWarning: (warning: Warning) => void;
  onViewDetails: (id: string) => void;
  onEdit: (id: string) => void;
  onAdminAcknowledge: (id: string) => void;
  onDelete: (id: string) => void;
  onNewWarning: () => void;
}

export const WarningsCardGrid: React.FC<WarningsCardGridProps> = ({
  warnings,
  loading,
  totalWarningsCount,
  onSelectWarning,
  onViewDetails,
  onEdit,
  onAdminAcknowledge,
  onDelete,
  onNewWarning,
}) => {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
        <p>جاري تحديث البيانات...</p>
      </div>
    );
  }

  if (warnings.length === 0) {
    return (
      <WarningsEmptyState
        onNewWarning={onNewWarning}
        showAddButton={totalWarningsCount === 0}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {warnings.map((warning) => (
        <Card
          key={warning.id}
          className="group relative overflow-hidden border-muted hover:border-primary/50 transition-all duration-300 hover:shadow-lg bg-card"
        >
          <div
            className={`absolute top-0 right-0 w-1 h-full ${
              warning.severity === "severe"
                ? "bg-red-500"
                : warning.severity === "moderate"
                  ? "bg-orange-500"
                  : "bg-blue-400"
            }`}
          />

          <CardHeader className="pb-3 pt-5 pe-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border-2 border-white dark:border-border shadow-sm flex-shrink-0">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold">
                    {warning.employee?.firstName?.[0] || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-foreground truncate">
                    {warning.employee?.firstName} {warning.employee?.lastName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {warning.employee?.position?.title || "موظف"}
                  </p>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 -mt-1 -ms-2 text-muted-foreground"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-white dark:bg-muted border-border dark:border-border shadow-xl rounded-xl p-2 min-w-[180px] z-50"
                >
                  <DropdownMenuItem
                    className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={() => onViewDetails(warning.id)}
                  >
                    <div className="p-1.5 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      <FileText className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">عرض التفاصيل</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer"
                    onClick={() => onEdit(warning.id)}
                  >
                    <div className="p-1.5 bg-warning/10 dark:bg-warning/20 rounded-lg text-warning dark:text-warning">
                      <Edit className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">تعديل</span>
                  </DropdownMenuItem>
                  {!warning.acknowledgedAt && (
                    <DropdownMenuItem
                      className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer text-success focus:text-success focus:bg-success/10 dark:focus:bg-success/20"
                      onClick={() => onAdminAcknowledge(warning.id)}
                    >
                      <div className="p-1.5 bg-success/10 dark:bg-success/20 rounded-lg">
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-sm">
                        إقرار إداري (يدوي)
                      </span>
                    </DropdownMenuItem>
                  )}
                  <div className="my-1 border-t border-border dark:border-border" />
                  <DropdownMenuItem
                    className="rounded-xl flex items-center gap-3 py-2.5 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10 dark:focus:bg-destructive/20"
                    onClick={() => onDelete(warning.id)}
                  >
                    <div className="p-1.5 bg-destructive/10 dark:bg-destructive/20 rounded-lg">
                      <Trash2 className="h-4 w-4" />
                    </div>
                    <span className="font-medium text-sm">حذف</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <div className="mt-2">
              <div className="flex items-center justify-between mb-1">
                <CardTitle
                  className="text-base break-all flex-1 pe-2 leading-tight font-bold text-foreground"
                  title={warning.title}
                >
                  {warning.title}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-primary"
                  onClick={() => onSelectWarning(warning)}
                  title="عرض سريع"
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Badge
                  variant="secondary"
                  className={`${getTypeColor(warning.type)} border-0`}
                >
                  {getTypeLabel(warning.type)}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6 pt-2 space-y-4">
            <div className="space-y-3">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                  <FileText className="h-3.5 w-3.5" />
                  <span>وصف المخالفة:</span>
                </div>
                <p
                  className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted dark:bg-white/5 p-4 rounded-xl border border-border dark:border-white/5"
                  style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                >
                  {warning.description}
                </p>
              </div>

              {warning.actionTaken && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-[10px] font-black text-warning uppercase tracking-widest">
                    <Gavel className="h-3.5 w-3.5" />
                    <span>الإجراء المتخذ:</span>
                  </div>
                  <p
                    className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-warning/50 dark:bg-warning/10 p-4 rounded-xl border border-warning dark:border-warning/20"
                    style={{ wordBreak: "break-all", overflowWrap: "anywhere" }}
                  >
                    {warning.actionTaken}
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between pt-2">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-muted-foreground/80 uppercase tracking-widest">
                    تاريخ الواقعة:
                  </span>
                  <div className="flex items-center gap-2 text-xs font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-xl w-fit border border-blue-100 dark:border-blue-900/30">
                    <Calendar className="h-3.5 w-3.5" />
                    {new Date(warning.incidentDate).toLocaleDateString("ar-EG")}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="pt-0 pe-6 pb-4 flex items-center justify-between border-t bg-muted/10 h-14">
            <div className="flex items-center gap-2">
              {getSeverityBadge(warning.severity)}
            </div>

            {warning.acknowledgedAt ? (
              <div className="flex items-center gap-1.5 text-xs font-medium text-success dark:text-success bg-success/10 dark:bg-success/20 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="h-3.5 w-3.5" />
                تم الإقرار
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-medium text-warning dark:text-warning bg-warning/10 dark:bg-warning/20 px-2.5 py-1 rounded-full">
                <Clock className="h-3.5 w-3.5" />
                بانتظار الإقرار
              </div>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};
