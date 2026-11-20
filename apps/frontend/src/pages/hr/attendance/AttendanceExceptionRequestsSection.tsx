import React, { useState, useEffect, useCallback } from "react";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RefreshCw,
  MapPin,
  Radio,
  Network,
  Clock,
  MessageSquare,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export interface AttendanceExceptionRequestItem {
  id: string;
  companyId: string;
  userId: string;
  employeeName?: string;
  employee?: {
    employeeNumber?: string;
    department?: { id: string; name: string };
    position?: { id: string; title: string };
  };
  attendanceDate: string;
  requestedAt: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
  reason: string;
  distanceMeters?: number | null;
  accuracyMeters?: number | null;
  clientIp?: string | null;
  decidedById?: string | null;
  decidedAt?: string | null;
  decisionNote?: string | null;
  attendanceId?: string | null;
}

interface AttendanceExceptionRequestsSectionProps {
  onDecisionSuccess?: () => void;
}

export const AttendanceExceptionRequestsSection: React.FC<AttendanceExceptionRequestsSectionProps> = ({
  onDecisionSuccess,
}) => {
  const [requests, setRequests] = useState<AttendanceExceptionRequestItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeRequest, setActiveRequest] = useState<AttendanceExceptionRequestItem | null>(null);
  const [decisionAction, setDecisionAction] = useState<"APPROVED" | "REJECTED" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get("/hr/attendance/exception-requests", {
        params: { status: "PENDING" },
      });
      setRequests(Array.isArray(res.data) ? res.data : []);
    } catch (err: unknown) {
      console.error("Error fetching attendance exception requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingRequests();
  }, [fetchPendingRequests]);

  const handleOpenDecisionDialog = (
    req: AttendanceExceptionRequestItem,
    action: "APPROVED" | "REJECTED"
  ) => {
    setActiveRequest(req);
    setDecisionAction(action);
    setDecisionNote("");
  };

  const handleCloseDecisionDialog = () => {
    if (submitting) return;
    setActiveRequest(null);
    setDecisionAction(null);
    setDecisionNote("");
  };

  const handleSubmitDecision = async () => {
    if (!activeRequest || !decisionAction) return;

    try {
      setSubmitting(true);
      await api.post(`/hr/attendance/exception-requests/${activeRequest.id}/decide`, {
        decision: decisionAction,
        note: decisionNote.trim() || undefined,
      });

      toast.success(
        decisionAction === "APPROVED"
          ? "تمت الموافقة على طلب استثناء البصمة واعتماد الحضور بنجاح"
          : "تم رفض طلب استثناء البصمة"
      );

      handleCloseDecisionDialog();
      await fetchPendingRequests();
      if (onDecisionSuccess) {
        onDecisionSuccess();
      }
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { error?: string } } };
      toast.error(
        errorObj?.response?.data?.error || "فشل اتخاذ القرار بشأن طلب الاستثناء"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Card className="border-indigo-100 bg-gradient-to-l from-primary/70 via-white to-white dark:from-primary/20 dark:via-gray-800 dark:to-gray-800 dark:border-primary/40 shadow-sm">
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-primary" />
              <span>طلبات استثناء البصمة</span>
              {requests.length > 0 && (
                <Badge variant="secondary" className="bg-amber-100 text-warning dark:bg-warning/40 dark:text-warning font-mono">
                  {requests.length} معلق
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-xs">
              مراجعة واعتماد أو رفض طلبات الاستثناء المقدمة من الموظفين عند تعذر البصمة الجغرافية
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchPendingRequests}
            disabled={loading}
            className="h-8 px-2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
            title="تحديث القائمة"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin text-primary" : ""}`} />
          </Button>
        </CardHeader>

        <CardContent>
          {loading && requests.length === 0 ? (
            <div className="py-6 flex items-center justify-center text-sm text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin ms-2 text-primary" />
              جاري تحميل طلبات الاستثناء...
            </div>
          ) : requests.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">
              لا توجد طلبات استثناء معلقة حالياً.
            </div>
          ) : (
            <div className="overflow-x-auto border rounded-xl bg-card/80">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="border-b bg-muted dark:bg-muted text-muted-foreground font-medium">
                    <th className="p-3">الموظف</th>
                    <th className="p-3">تاريخ البصمة</th>
                    <th className="p-3">المسافة</th>
                    <th className="p-3">دقة الجهاز</th>
                    <th className="p-3">عنوان IP</th>
                    <th className="p-3">سبب الاستثناء</th>
                    <th className="p-3 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {requests.map((req) => {
                    const dateFormatted = req.attendanceDate
                      ? new Date(req.attendanceDate).toLocaleDateString("ar-EG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "-";

                    return (
                      <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-muted">
                        <td className="p-3 font-semibold text-foreground">
                          <div>{req.employeeName || "موظف"}</div>
                          {req.employee?.department?.name && (
                            <span className="text-[10px] text-muted-foreground block font-normal">
                              {req.employee.department.name}
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-muted-foreground font-mono">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {dateFormatted}
                          </span>
                        </td>
                        <td className="p-3 font-mono">
                          {req.distanceMeters != null ? (
                            <span className="inline-flex items-center gap-1 text-destructive dark:text-destructive">
                              <MapPin className="h-3 w-3" />
                              {req.distanceMeters} م
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 font-mono">
                          {req.accuracyMeters != null ? (
                            <span className="inline-flex items-center gap-1 text-warning dark:text-warning">
                              <Radio className="h-3 w-3" />
                              ±{req.accuracyMeters} م
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 font-mono text-[11px] text-muted-foreground">
                          {req.clientIp ? (
                            <span className="inline-flex items-center gap-1">
                              <Network className="h-3 w-3 text-muted-foreground" />
                              {req.clientIp}
                            </span>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="p-3 max-w-xs text-foreground">
                          <div className="flex items-start gap-1">
                            <MessageSquare className="h-3 w-3 mt-0.5 text-muted-foreground flex-shrink-0" />
                            <span className="line-clamp-2" title={req.reason}>
                              {req.reason}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDecisionDialog(req, "APPROVED")}
                              className="h-7 px-2.5 bg-success/10 text-success hover:bg-success hover:text-success border-success dark:bg-success/30 dark:text-success dark:border-success text-xs"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5 ms-1" />
                              قبول
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenDecisionDialog(req, "REJECTED")}
                              className="h-7 px-2.5 bg-destructive/10 text-destructive hover:bg-destructive hover:text-destructive border-destructive dark:bg-destructive/30 dark:text-destructive dark:border-destructive text-xs"
                            >
                              <XCircle className="h-3.5 w-3.5 ms-1" />
                              رفض
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Decision Dialog with Note */}
      <Dialog open={Boolean(activeRequest)} onOpenChange={handleCloseDecisionDialog}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {decisionAction === "APPROVED" ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-success" />
                  <span>اعتماد طلب استثناء البصمة</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  <span>رفض طلب استثناء البصمة</span>
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {activeRequest && (
            <div className="space-y-3 py-2 text-sm">
              <div className="p-3 rounded-lg bg-muted/40 space-y-1">
                <p>
                  <strong className="text-foreground">الموظف:</strong>{" "}
                  {activeRequest.employeeName}
                </p>
                <p>
                  <strong className="text-foreground">سبب الاستثناء المقدم:</strong>{" "}
                  {activeRequest.reason}
                </p>
              </div>

              {decisionAction === "APPROVED" ? (
                <div className="flex items-start gap-2 p-3 text-xs text-success bg-success/10 dark:bg-success/20 dark:text-success rounded-lg border border-success">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    عند الاعتماد، سيتم تسجيل حضور الموظف آلياً لطريقة البصمة (استثناء معتمد) وتوثيق تفاصيل الموقع وسبب الاستثناء في سجل التدقيق.
                  </span>
                </div>
              ) : (
                <div className="flex items-start gap-2 p-3 text-xs text-destructive bg-destructive/10 dark:bg-destructive/20 dark:text-destructive rounded-lg border border-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span>
                    عند الرفض، سيتم حفظ قرار الرفض دون إنشاء سجل حضور.
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  ملاحظة القرار (اختياري)
                </label>
                <Textarea
                  rows={2}
                  value={decisionNote}
                  onChange={(e) => setDecisionNote(e.target.value)}
                  placeholder="اكتب ملاحظة توضيحية حول سبب القبول أو الرفض..."
                  disabled={submitting}
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              onClick={handleSubmitDecision}
              disabled={submitting}
              className={
                decisionAction === "APPROVED"
                  ? "bg-emerald-600 hover:bg-success text-white"
                  : "bg-red-600 hover:bg-destructive text-white"
              }
            >
              {submitting ? (
                "جاري المعالجة..."
              ) : decisionAction === "APPROVED" ? (
                "تأكيد الاعتماد"
              ) : (
                "تأكيد الرفض"
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleCloseDecisionDialog}
              disabled={submitting}
            >
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
