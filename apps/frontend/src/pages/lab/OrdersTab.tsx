import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ClipboardList, Download, FileText, Loader2, RefreshCw, Search, Tag, X } from "lucide-react";
import {
  api, fetchJson, getAuthHeaders, LabOrder, LabOrderTest, LabTest, LabTestParameter,
  LAB_STATUS_MAP, LAB_REPORT_STATUS_MAP, FLAG_OPTIONS, MODAL_CONTENT_CLS, MODAL_INPUT_CLS,
} from "./shared";
import { DateInput } from '../../components/ui/DateInput';

type ActionKind = "review" | "sign" | "deliver";

const ACTION_META: Record<ActionKind, { label: string; cls: string; message: string; toast: string }> = {
  review: {
    label: "مراجعة",
    cls: "border-yellow-300 text-warning bg-warning/10 hover:bg-warning dark:border-warning dark:text-warning dark:bg-warning/30 dark:hover:bg-warning/50",
    message: "هل تريد تأكيد مراجعة نتائج هذا الطلب؟",
    toast: "تمت مراجعة النتائج بنجاح",
  },
  sign: {
    label: "توقيع",
    cls: "border-green-300 text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 dark:hover:bg-success/50",
    message: "هل تريد تأكيد توقيع النتائج؟",
    toast: "تم توقيع النتائج بنجاح",
  },
  deliver: {
    label: "تسليم",
    cls: "border-teal-300 text-success bg-success/10 hover:bg-success dark:border-success dark:text-success dark:bg-success/30 dark:hover:bg-success/50",
    message: "هل تريد تأكيد تسليم التقرير؟",
    toast: "تم تسليم التقرير بنجاح",
  },
};

const FALLBACK_BADGE = { label: "", color: "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground" };

const statusBadge = (map: Record<string, { label: string; color: string }>, value: string) => {
  const meta = map[value] ?? { ...FALLBACK_BADGE, label: value };
  return <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${meta.color}`}>{meta.label}</span>;
};

const fmtMoney = (n?: number) => (typeof n === "number" && Number.isFinite(n) ? n.toFixed(2) : "0.00");

const fmtDate = (iso?: string) => (iso ? new Date(iso).toLocaleDateString("ar-EG") : "—");

const normalizeOptions = (v?: string[] | string): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v;
  try {
    const parsed = JSON.parse(v);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

interface DraftParameter {
  parameterId: string;
  parameterName: string;
  unit?: string;
  referenceRange?: string;
  resultOptions: string[];
  showFlag: boolean;
  result: string;
  flag: string;
}

interface TestDraft {
  testId: string;
  testName: string;
  parameters: DraftParameter[];
}

interface OrderDetailTest extends LabOrderTest {
  parameters?: LabTestParameter[];
  test?: LabTest;
}

function ResultsEntryModal({ orderId, onClose, onSaved }: { orderId: string; onClose: () => void; onSaved: () => void }) {
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<LabOrder | null>(null);
  const [drafts, setDrafts] = useState<TestDraft[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const detail = await fetchJson<LabOrder & { tests?: OrderDetailTest[] }>(api(`orders/${orderId}`));
        setOrder(detail);
        const draftsResult: TestDraft[] = [];
        for (const ot of detail.tests ?? []) {
          let params = ot.test?.parameters ?? ot.parameters ?? [];
          if (params.length === 0) {
            try {
              const test = await fetchJson<LabTest>(api(`tests/${ot.testId}`));
              params = test.parameters ?? [];
            } catch {
              params = [];
            }
          }
          params = [...params]
            .filter(p => p.isActive !== false)
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          const existing = ot.results ?? [];
          draftsResult.push({
            testId: ot.testId,
            testName: ot.test?.name ?? ot.testId,
            parameters: params.map(p => ({
              parameterId: p.id,
              parameterName: p.name,
              unit: p.unit,
              referenceRange: p.referenceRange,
              resultOptions: normalizeOptions(p.resultOptions),
              showFlag: p.showFlag,
              result: existing.find(r => r.parameterId === p.id)?.result ?? "",
              flag: existing.find(r => r.parameterId === p.id)?.flag ?? (p.showFlag ? "normal" : ""),
            })),
          });
        }
        setDrafts(draftsResult);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "فشل تحميل بيانات الطلب");
        onClose();
      } finally {
        setLoading(false);
      }
    })();
  }, [orderId]);

  const updateItem = (testId: string, parameterId: string, patch: Partial<DraftParameter>) => {
    setDrafts(prev => prev.map(d => d.testId === testId
      ? { ...d, parameters: d.parameters.map(p => p.parameterId === parameterId ? { ...p, ...patch } : p) }
      : d));
  };

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await fetchJson(api(`orders/${orderId}/results`), {
        method: "PUT",
        body: JSON.stringify({
          tests: drafts.map(d => ({
            testId: d.testId,
            status: "RESULTS_ENTERED",
            results: d.parameters.map(p => ({
              parameterId: p.parameterId,
              result: p.result.trim(),
              flag: p.flag,
            })),
          })),
        }),
      });
      toast.success("تم حفظ النتائج بنجاح");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل حفظ النتائج");
    } finally {
      setSaving(false);
    }
  };

  const incompleteCount = drafts.reduce(
    (n, d) => n + d.parameters.filter(p => p.resultOptions.length > 0 && !p.result.trim()).length,
    0,
  );

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={onClose}>
      <div className={`${MODAL_CONTENT_CLS} !max-w-3xl max-h-[90vh] overflow-y-auto`} onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">إدخال النتائج — {order.patientName}</h3>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground"><X className="w-5 h-5" /></button>
        </div>
        {order.orderNumber ? <p className="text-sm text-muted-foreground mb-4">رقم الطلب: <span dir="ltr">{order.orderNumber}</span></p> : null}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
        ) : drafts.length === 0 ? (
          <p className="text-center py-8 text-muted-foreground/80">لا توجد اختبارات لعرضها</p>
        ) : (
          <div className="space-y-5">
            {drafts.map(d => (
              <div key={d.testId} className="border dark:border-border rounded-lg p-4">
                <h4 className="font-bold text-sm mb-3">{d.testName}</h4>
                {d.parameters.length === 0 ? (
                  <p className="text-sm text-muted-foreground/80">لا توجد معايير لهذا الاختبار</p>
                ) : (
                  <div className="space-y-3">
                    {d.parameters.map(p => (
                      <div key={p.parameterId} className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
                        <div>
                          <label className="block text-xs font-medium text-foreground dark:text-muted-foreground mb-1">{p.parameterName}</label>
                          {p.referenceRange || p.unit ? (
                            <p className="text-[11px] text-muted-foreground/80">{p.referenceRange || ""}{p.unit ? ` (${p.unit})` : ""}</p>
                          ) : null}
                        </div>
                        <div>
                          {p.resultOptions.length > 0 ? (
                            <select className={MODAL_INPUT_CLS} value={p.result} onChange={e => updateItem(d.testId, p.parameterId, { result: e.target.value })}>
                              <option value="">اختر النتيجة...</option>
                              {p.resultOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                          ) : (
                            <input className={MODAL_INPUT_CLS} value={p.result} onChange={e => updateItem(d.testId, p.parameterId, { result: e.target.value })} placeholder="النتيجة" />
                          )}
                        </div>
                        <div>
                          {p.showFlag ? (
                            <select className={MODAL_INPUT_CLS} value={p.flag} onChange={e => updateItem(d.testId, p.parameterId, { flag: e.target.value })}>
                              {FLAG_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                            </select>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        {!loading && drafts.length > 0 && (
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-border">
            <button onClick={onClose} className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted">إلغاء</button>
            <div className="flex items-center gap-3">
              {incompleteCount > 0 && (
                <p className="text-sm text-warning dark:text-warning">حدد النتائج لكل الباراميترات ذات الخيارات قبل الحفظ</p>
              )}
              <button onClick={handleSave} disabled={saving || incompleteCount > 0} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}حفظ النتائج
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OrdersTab() {
  const [orders, setOrders] = useState<LabOrder[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [reportStatus, setReportStatus] = useState("");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [detailOrderId, setDetailOrderId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; kind: ActionKind } | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const url = new URL(api("orders"));
      if (status) url.searchParams.set("status", status);
      if (reportStatus) url.searchParams.set("reportStatus", reportStatus);
      if (search.trim()) url.searchParams.set("search", search.trim());
      if (dateFrom) url.searchParams.set("dateFrom", dateFrom);
      if (dateTo) url.searchParams.set("dateTo", dateTo);
      const res = await fetchJson<{ items?: LabOrder[]; total?: number }>(url.toString());
      setOrders(res.items || []);
    } catch (e) {
      if (!opts?.silent) toast.error(e instanceof Error ? e.message : "فشل تحميل الطلبات");
    }
  }, [status, reportStatus, search, dateFrom, dateTo]);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      refresh().finally(() => setLoading(false));
    }, 400);
    return () => clearTimeout(t);
  }, [refresh]);

  const nextAction = (o: LabOrder): { kind: ActionKind; cls: string } | null => {
    switch (o.reportStatus) {
      case "RESULTS_ENTERED": return { kind: "review", cls: ACTION_META.review.cls };
      case "REVIEWED": return { kind: "sign", cls: ACTION_META.sign.cls };
      case "SIGNED": return { kind: "deliver", cls: ACTION_META.deliver.cls };
      default: return null;
    }
  };

  const runAction = async (orderId: string, kind: ActionKind) => {
    if (busyId === orderId) return;
    setBusyId(orderId);
    try {
      await fetchJson(api(`orders/${orderId}/${kind}`), { method: "PUT" });
      toast.success(ACTION_META[kind].toast);
      setConfirmAction(null);
      await refresh({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تنفيذ العملية");
    } finally {
      setBusyId(null);
    }
  };

  const viewReport = async (orderId: string) => {
    try {
      const res = await fetch(api(`orders/${orderId}/pdf`), { headers: getAuthHeaders() });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "فشل تحميل التقرير");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل التقرير");
    }
  };

  const viewLabel = async (orderId: string) => {
    try {
      const res = await fetch(api(`orders/${orderId}/label`), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("فشل تحميل اللاصقة");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحميل اللاصقة");
    }
  };

  const exportCsv = async () => {
    try {
      const url = new URL(api("orders/export"));
      if (status) url.searchParams.set("status", status);
      if (reportStatus) url.searchParams.set("reportStatus", reportStatus);
      const res = await fetch(url.toString(), { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("فشل التصدير");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "lab-orders.csv";
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل التصدير");
    }
  };

  const runSampleAction = async (orderId: string, action: "reject-sample" | "accept-sample") => {
    if (busyId === orderId) return;
    const reason = action === "reject-sample" ? window.prompt("سبب رفض العينة:") : null;
    if (action === "reject-sample" && !reason) return;
    setBusyId(orderId);
    try {
      await fetchJson(api(`orders/${orderId}/${action}`), {
        method: "PUT",
        body: JSON.stringify(action === "reject-sample" ? { reason } : {}),
      });
      toast.success(action === "reject-sample" ? "تم رفض العينة" : "تم قبول العينة");
      await refresh({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل تحديث العينة");
    } finally {
      setBusyId(null);
    }
  };

  const handleSaved = () => {
    setDetailOrderId(null);
    refresh({ silent: true });
  };

  const filterCls = "border dark:border-border rounded-lg px-3 py-2 text-sm dark:bg-muted dark:text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold">طلبات التحاليل</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50">
            <Download className="w-4 h-4" />تصدير CSV
          </button>
          <button onClick={() => refresh()} className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50">
            <RefreshCw className="w-4 h-4" />تحديث
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select className={filterCls} value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">كل الحالات</option>
          {Object.entries(LAB_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <select className={filterCls} value={reportStatus} onChange={e => setReportStatus(e.target.value)}>
          <option value="">كل حالات التقرير</option>
          {Object.entries(LAB_REPORT_STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-muted-foreground/80" />
          <input className={`${filterCls} pe-9 w-48`} placeholder="بحث بالاسم أو رقم الطلب..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <DateInput className={filterCls} value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
        <DateInput className={filterCls} value={dateTo} onChange={e => setDateTo(e.target.value)} />
      </div>

      {loading && !orders ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : orders === null || orders.length === 0 ? (
        <p className="text-center py-16 text-muted-foreground/80">لا توجد طلبات مطابقة</p>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px]">
              <thead>
                <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground text-sm">
                  {["رقم الطلب", "المريض", "الهاتف", "الاختبارات", "الحالة", "حالة التقرير", "العينة", "الإجمالي / المدفوع / المتبقي", "التاريخ", "إجراءات"].map(h => (
                    <th key={h} className="text-right py-3 px-4 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(o => {
                  const action = nextAction(o);
                  return (
                    <tr key={o.id} className="border-b dark:border-border hover:bg-muted/50 text-sm">
                      <td className="py-3 px-4 font-medium" dir="ltr">{o.orderNumber || o.id.slice(0, 8)}</td>
                      <td className="py-3 px-4 font-medium">{o.patientName}</td>
                      <td className="py-3 px-4 text-muted-foreground" dir="ltr">{o.patientPhone || "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">{o.tests?.length ?? 0}</td>
                      <td className="py-3 px-4">{statusBadge(LAB_STATUS_MAP, o.status)}</td>
                      <td className="py-3 px-4">{statusBadge(LAB_REPORT_STATUS_MAP, o.reportStatus)}</td>
                      <td className="py-3 px-4">
                        {o.sampleStatus === "REJECTED" ? (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-destructive text-destructive" title={o.rejectionReason || ""}>مرفوضة</span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-xs bg-success text-success">مقبولة</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">
                        <span dir="ltr">{fmtMoney(o.total)} / {fmtMoney(o.paid)} / {fmtMoney(o.remaining)}</span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground/80 whitespace-nowrap">{fmtDate(o.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button onClick={() => setDetailOrderId(o.id)} className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded" title="إدخال النتائج"><ClipboardList className="w-4 h-4" /></button>
                          <button onClick={() => viewReport(o.id)} className="p-1.5 text-success dark:text-success hover:bg-success/10 dark:hover:bg-success/30 rounded" title="عرض التقرير PDF"><FileText className="w-4 h-4" /></button>
                          <button onClick={() => viewLabel(o.id)} className="p-1.5 text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded" title="طباعة لاصقة العينة"><Tag className="w-4 h-4" /></button>
                          {o.sampleStatus === "REJECTED" ? (
                            <button
                              onClick={() => runSampleAction(o.id, "accept-sample")}
                              disabled={busyId === o.id}
                              className="px-2 py-1 text-xs rounded-lg border font-medium bg-success/10 text-success"
                            >
                              قبول العينة
                            </button>
                          ) : (
                            <button
                              onClick={() => runSampleAction(o.id, "reject-sample")}
                              disabled={busyId === o.id}
                              className="px-2 py-1 text-xs rounded-lg border font-medium bg-destructive/10 text-destructive"
                            >
                              رفض عينة
                            </button>
                          )}
                          {action && (
                            <button
                              onClick={() => setConfirmAction({ id: o.id, kind: action.kind })}
                              disabled={busyId === o.id}
                              className={`px-2.5 py-1.5 text-xs rounded-lg border font-medium ${action.cls}`}
                            >
                              {busyId === o.id ? <Loader2 className="w-3 h-3 inline animate-spin ms-1" /> : null}
                              {ACTION_META[action.kind].label}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {detailOrderId && (
        <ResultsEntryModal orderId={detailOrderId} onClose={() => setDetailOrderId(null)} onSaved={handleSaved} />
      )}

      {confirmAction && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => setConfirmAction(null)}>
          <div className={MODAL_CONTENT_CLS} onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">تأكيد العملية</h3>
            <p className="text-sm text-muted-foreground mb-6">{ACTION_META[confirmAction.kind].message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmAction(null)} className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted">إلغاء</button>
              <button
                onClick={() => runAction(confirmAction.id, confirmAction.kind)}
                disabled={busyId === confirmAction.id}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50 flex items-center gap-2"
              >
                {busyId === confirmAction.id && <Loader2 className="w-4 h-4 animate-spin" />}تأكيد
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
