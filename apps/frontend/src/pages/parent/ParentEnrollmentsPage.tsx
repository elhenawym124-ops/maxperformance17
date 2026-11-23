import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Clock,
  User,
  RefreshCw,
  ShoppingCart,
  CheckCircle2,
  Users,
  CreditCard,
  AlertCircle
} from "lucide-react";

interface Enrollment {
  id: string;
  enrollmentType?: "PACKAGE" | "GROUP";
  remainingHours?: number;
  totalHours?: number;
  package: { id: string; name: string; hoursCount?: number; price?: number };
  teacher: { name: string } | null;
  subject: { name: string } | null;
  student?: { firstName: string; lastName: string };
  groupName?: string;
  groupCode?: string;
  feeType?: string;
  feeAmount?: number;
  status?: string;
  paymentStatus?: string;
  amountPaid?: number;
  finalAmount?: number;
  installments?: Array<{
    installmentNumber: number;
    amount: number;
    dueDate?: string;
    status?: string;
    paidAt?: string;
  }>;
}

interface Child {
  id: string;
  firstName: string;
  lastName: string;
}

const ParentEnrollmentsPage: React.FC = () => {
  const [children, setChildren] = useState<Child[]>([]);
  const [enrollmentsMap, setEnrollmentsMap] = useState<Record<string, Enrollment[]>>({});
  const [selectedChildId, setSelectedChildId] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payingKey, setPayingKey] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchData = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem("parentToken");
      const res = await fetch("/api/v1/education/parent-portal/children", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const d = await res.json();
      if (d.success && Array.isArray(d.data) && d.data.length > 0) {
        setChildren(d.data);
        const results = await Promise.all(
          d.data.map(async (child: Child) => {
            try {
              const eRes = await fetch(
                `/api/v1/education/parent-portal/children/${child.id}/enrollments`,
                { headers: { Authorization: `Bearer ${token}` } }
              );
              const eJson = await eRes.json();
              return { childId: child.id, enrollments: (eJson.success && Array.isArray(eJson.data)) ? eJson.data : [] };
            } catch {
              return { childId: child.id, enrollments: [] };
            }
          })
        );
        const map: Record<string, Enrollment[]> = {};
        results.forEach(({ childId, enrollments }) => {
          map[childId] = enrollments;
        });
        setEnrollmentsMap(map);
      } else {
        setChildren([]);
        setEnrollmentsMap({});
      }
    } catch {
      setChildren([]);
      setEnrollmentsMap({});
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Returning from the Kashier installment checkout: verify server-side, then clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderId = params.get("installmentOrder");
    if (!orderId) return;

    let alive = true;
    const token = localStorage.getItem("parentToken");
    fetch("/api/v1/education/parent-portal/enrollments/installments/kashier-verify", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderId }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (!alive) return;
        if (json.success && json.data?.paid) {
          setMessage({
            type: "success",
            text: `تم سداد القسط${json.data.installmentNumber ? ` رقم ${json.data.installmentNumber}` : ""} بنجاح`,
          });
        } else if (json.success) {
          setMessage({ type: "error", text: "لم يتم تأكيد الدفع بعد. لو تم الخصم، حدّث الصفحة بعد دقيقة." });
        } else {
          setMessage({ type: "error", text: json.error || "تعذر التحقق من دفع القسط" });
        }
        const url = new URL(window.location.href);
        url.searchParams.delete("installmentOrder");
        window.history.replaceState({}, "", url.toString());
        fetchData();
      })
      .catch(() => {
        if (alive) setMessage({ type: "error", text: "تعذر الاتصال بالخادم للتحقق من الدفع" });
      });

    return () => {
      alive = false;
    };
  }, []);

  const payInstallment = async (enrollmentId: string, installmentNumber: number) => {
    const key = `${enrollmentId}-${installmentNumber}`;
    try {
      setPayingKey(key);
      setMessage(null);
      const token = localStorage.getItem("parentToken");
      const res = await fetch(
        `/api/v1/education/parent-portal/enrollments/${enrollmentId}/installments/${installmentNumber}/kashier-session`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const json = await res.json();
      if (json.success && json.data?.sessionUrl) {
        window.location.href = json.data.sessionUrl;
        return;
      }
      setMessage({ type: "error", text: json.error || "تعذر بدء دفع القسط" });
    } catch {
      setMessage({ type: "error", text: "تعذر الاتصال بالخادم لبدء دفع القسط" });
    } finally {
      setPayingKey(null);
    }
  };

  const allEnrollments = useMemo(() => {
    if (selectedChildId === "ALL") {
      return Object.entries(enrollmentsMap).flatMap(([cId, eList]) => {
        const child = children.find((c) => c.id === cId);
        return eList.map((e) => ({
          ...e,
          student: e.student || (child ? { firstName: child.firstName, lastName: child.lastName } : undefined)
        }));
      });
    }
    const child = children.find((c) => c.id === selectedChildId);
    return (enrollmentsMap[selectedChildId] || []).map((e) => ({
      ...e,
      student: e.student || (child ? { firstName: child.firstName, lastName: child.lastName } : undefined)
    }));
  }, [enrollmentsMap, selectedChildId, children]);

  const totalRemainingHours = useMemo(() => {
    return allEnrollments.reduce((sum, e) => sum + (e.remainingHours || 0), 0);
  }, [allEnrollments]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] space-y-3">
        <RefreshCw className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs font-mono text-muted-foreground uppercase">جاري تحميل الباقات والتسجيلات...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10" dir="rtl">
      {/* Telemetry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-primary/10 text-primary border border-primary/20">
              ACADEMIC ENROLLMENTS
            </span>
            <span className="text-xs text-muted-foreground font-mono">
              إجمالي {allEnrollments.length} باقات نشطة
            </span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">سجل الباقات والاشتراكات</h1>
          <p className="text-xs text-muted-foreground">
            متابعة رصيد الساعات المتبقية للأبناء، المعلمين المسندين، وتفاصيل الباقات الدراسية
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchData}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border/80 bg-background hover:bg-muted text-foreground transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
            <span>تحديث</span>
          </button>
          <Link
            to="/parent/buy-package"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm transition-all focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>شراء باقة جديدة</span>
          </Link>
        </div>
      </div>

      {message ? (
        <div
          className={`p-3.5 rounded-lg border text-xs flex items-center gap-2.5 ${
            message.type === "success"
              ? "bg-emerald-500/10 text-emerald-700 border-emerald-500/20"
              : "bg-destructive/10 text-destructive border-destructive/20"
          }`}
        >
          {message.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      ) : null}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">إجمالي الساعات المتبقية</span>
            <Clock className="w-4 h-4 text-primary" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {totalRemainingHours} ساعة
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الباقات الفعالة</span>
            <GraduationCap className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {allEnrollments.length} باقة
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">الأبناء المشتركون</span>
            <User className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-foreground mt-2">
            {children.length} طلاب
          </div>
        </div>
      </div>

      {/* Children Filter Tabs */}
      <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-lg border border-border/50 text-xs w-fit">
        <button
          onClick={() => setSelectedChildId("ALL")}
          className={`px-3 py-1.5 rounded-md font-medium transition-all ${
            selectedChildId === "ALL"
              ? "bg-background text-foreground shadow-xs border border-border/60"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          كافة الأبناء ({children.length})
        </button>
        {children.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedChildId(c.id)}
            className={`px-3 py-1.5 rounded-md font-medium transition-all ${
              selectedChildId === c.id
                ? "bg-background text-foreground shadow-xs border border-border/60"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.firstName} {c.lastName}
          </button>
        ))}
      </div>

      {/* Enrollments Single-Surface Container */}
      <div className="rounded-xl border border-border/70 bg-card text-card-foreground shadow-sm overflow-hidden">
        {allEnrollments.length === 0 ? (
          <div className="text-center py-12 px-4 space-y-2">
            <GraduationCap className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-medium text-foreground">لا توجد باقات مفعلة حالياً</p>
            <p className="text-xs text-muted-foreground">يمكنك شراء باقة تعليمية جديدة لأبنائك</p>
          </div>
        ) : (
          <div className="divide-y divide-border/60">
            {allEnrollments.map((e) => {
              const isGroup = e.enrollmentType === "GROUP";
              const total = e.package?.hoursCount ?? 0;
              const remaining = e.remainingHours || 0;
              const pct = total > 0 ? Math.min(100, Math.round((remaining / total) * 100)) : 0;
              const price = isGroup ? (e.feeAmount || e.package?.price || 0) : (e.package?.price || 0);

              return (
                <div
                  key={e.id}
                  className="p-5 hover:bg-muted/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      isGroup
                        ? "bg-blue-500/10 border border-blue-500/20 text-blue-600"
                        : "bg-primary/10 border border-primary/20 text-primary"
                    }`}>
                      {isGroup ? <Users className="w-5 h-5" /> : <GraduationCap className="w-5 h-5" />}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-sm font-semibold text-foreground">
                          {e.groupName || e.package?.name || "اشتراك تعليمي"}
                        </h3>
                        {isGroup ? (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            مجموعة دراسية
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            باقة ساعات خاصة
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                          {e.status === "ACTIVE" ? "نشط" : "مفعل"}
                        </span>
                        {e.paymentStatus === "PAID" && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-green-500/10 text-green-700 border border-green-500/20">
                            مسدد بالكامل
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span>المادة: {e.subject?.name || "—"}</span>
                        <span>•</span>
                        <span>المعلم: {e.teacher?.name || "لم يحدد"}</span>
                        {e.student && (
                          <>
                            <span>•</span>
                            <span className="font-medium text-foreground">
                              الطالب: {e.student.firstName} {e.student.lastName}
                            </span>
                          </>
                        )}
                        {isGroup && e.groupCode && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-muted-foreground">كود: {e.groupCode}</span>
                          </>
                        )}
                      </div>

                      {/* Progress bar for packages / info for groups */}
                      {!isGroup && total > 0 ? (
                        <div className="w-full max-w-xs pt-1 space-y-1">
                          <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
                            <span>المتبقي: {remaining} ساعة</span>
                            <span>الإجمالي: {total} ساعة</span>
                          </div>
                        </div>
                      ) : isGroup ? (
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span>نظام الرسوم: {e.feeType === "PER_SESSION" ? "رسوم لكل حصة" : "اشتراك دوري منتظم"}</span>
                        </div>
                      ) : null}

                      {!isGroup && Array.isArray(e.installments) && e.installments.length > 0 ? (
                        <div className="w-full max-w-md pt-2 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-semibold text-foreground">جدول الأقساط</span>
                            <span className="text-muted-foreground font-mono">
                              {e.installments.filter((inst) => inst.status === "PAID").length}/{e.installments.length}
                            </span>
                          </div>
                          {e.installments.map((inst) => {
                            const isPaid = inst.status === "PAID";
                            const key = `${e.id}-${inst.installmentNumber}`;
                            return (
                              <div
                                key={key}
                                className="flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background px-2.5 py-1.5 text-[11px]"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                      isPaid ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
                                    }`}
                                  >
                                    {inst.installmentNumber}
                                  </span>
                                  <span className="text-muted-foreground">
                                    استحقاق: <span dir="ltr">{inst.dueDate || "—"}</span>
                                  </span>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="font-mono font-semibold text-foreground">
                                    {Number(inst.amount || 0).toLocaleString("ar-EG")} ج.م
                                  </span>
                                  {isPaid ? (
                                    <span className="text-success font-semibold">مسدد</span>
                                  ) : (
                                    <button
                                      type="button"
                                      disabled={payingKey === key}
                                      onClick={() => payInstallment(e.id, inst.installmentNumber)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 disabled:opacity-50"
                                    >
                                      <CreditCard className="w-3 h-3" />
                                      {payingKey === key ? "جارٍ التحويل..." : "ادفع الآن"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end md:self-center">
                    <div className="text-left font-mono">
                      <div className="text-base font-bold text-foreground">
                        {price > 0 ? `${price.toLocaleString("ar-EG")} ج.م` : "مجاني"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {isGroup ? "رسوم المجموعة" : "قيمة الباقة"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParentEnrollmentsPage;
