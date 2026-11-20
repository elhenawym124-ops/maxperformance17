import { useCallback, useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X as XMarkIcon, Search, FlaskConical, Settings } from "lucide-react";
import { api, getAuthHeaders, MODAL_CONTENT_CLS, MODAL_INPUT_CLS, LabSampleType } from "./shared";

interface SampleTypeForm {
  id?: string;
  name: string;
  instructions: string;
  isActive: boolean;
}

export default function SettingsTab() {
  const [sampleTypes, setSampleTypes] = useState<LabSampleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [includeInactive, setIncludeInactive] = useState(false);

  const [modal, setModal] = useState<SampleTypeForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const requestRef = useRef(0);

  const loadSampleTypes = useCallback(async (quiet = false) => {
    const reqId = ++requestRef.current;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (includeInactive) params.set("includeInactive", "true");
      const qs = params.toString();
      const res = await fetch(`${api("sample-types")}${qs ? `&${qs}` : ""}`, { headers: getAuthHeaders() });
      const json = (await res.json()) as { success?: boolean; error?: string; message?: string; data?: LabSampleType[] };
      if (!json.success) throw new Error(json.error || json.message || "فشل العملية");
      if (requestRef.current !== reqId) return;
      setSampleTypes(json.data || []);
    } catch (e: unknown) {
      if (requestRef.current !== reqId) return;
      if (!quiet) setError(e instanceof Error ? e.message : "حدث خطأ في جلب أنواع العينات");
    } finally {
      if (requestRef.current === reqId) setLoading(false);
    }
  }, [search, includeInactive]);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    loadSampleTypes();
  }, [loadSampleTypes]);

  const mutate = async (path: string, method: string, body?: Record<string, unknown>) => {
    const res = await fetch(api(path), {
      method,
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.error || data.message || "فشلت العملية");
    return data.data;
  };

  const openCreate = () => {
    setError(null);
    setModal({ name: "", instructions: "", isActive: true });
  };

  const openEdit = (sampleType: LabSampleType) => {
    setError(null);
    setModal({
      id: sampleType.id,
      name: sampleType.name,
      instructions: sampleType.instructions || "",
      isActive: sampleType.isActive,
    });
  };

  const save = async () => {
    if (!modal) return;
    if (saving) return;
    setError(null);
    if (!modal.name.trim()) { setError("اسم نوع العينة مطلوب"); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: modal.name.trim(),
        instructions: modal.instructions.trim() || undefined,
      };
      if (modal.id) {
        await mutate(`sample-types/${modal.id}`, "PUT", { ...payload, isActive: modal.isActive });
      } else {
        await mutate("sample-types", "POST", payload);
      }
      setModal(null);
      await loadSampleTypes(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ في الحفظ");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (sampleType: LabSampleType) => {
    if (removingId) return;
    if (!window.confirm(`تأكيد حذف نوع العينة "${sampleType.name}"؟`)) return;
    setRemovingId(sampleType.id);
    try {
      await mutate(`sample-types/${sampleType.id}`, "DELETE");
      await loadSampleTypes(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "حدث خطأ في حذف نوع العينة");
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">الإعدادات</h2>
          <p className="text-sm text-muted-foreground">أنواع العينات وتعليمات تجميعها</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary">
          <Plus className="w-4 h-4" />إضافة نوع عينة
        </button>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-destructive dark:hover:bg-destructive/50 rounded"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      <div className="bg-card rounded-xl border dark:border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b dark:border-border">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">أنواع العينات</h3>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
              <input
                className={`${MODAL_INPUT_CLS} pe-9`}
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="بحث بالاسم..."
              />
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={e => setIncludeInactive(e.target.checked)}
                className="rounded border-border"
              />
              عرض المعطلين
            </label>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16 text-muted-foreground/80">جارٍ التحميل...</div>
        ) : sampleTypes.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground/80">
            <FlaskConical className="w-10 h-10 mx-auto mb-3" />
            {search ? "لا توجد نتائج مطابقة" : "لا توجد أنواع عينات بعد — أضف أول نوع عينة"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground">
                  <th className="text-right py-3 px-4">الاسم</th>
                  <th className="text-right py-3 px-4">التعليمات</th>
                  <th className="text-right py-3 px-4">الحالة</th>
                  <th className="text-right py-3 px-4">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {sampleTypes.map(s => (
                  <tr key={s.id} className="border-b dark:border-border last:border-b-0">
                    <td className="py-3 px-4 font-medium">{s.name}</td>
                    <td className="py-3 px-4">{s.instructions || "—"}</td>
                    <td className="py-3 px-4">
                      {s.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/40 dark:text-success">نشط</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">معطل</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex gap-1">
                        <button onClick={() => openEdit(s)} className="p-1.5 text-primary dark:text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg" title="تعديل">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => remove(s)} disabled={removingId !== null} className="p-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg disabled:opacity-40" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 dark:bg-primary/20 border border-primary dark:border-primary rounded-xl px-4 py-3 text-sm text-primary dark:text-primary">
        سيتم إضافة المزيد من الإعدادات في المراحل القادمة: المزارع، الزيارات المنزلية، الفروع، وقوائم الأسعار.
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !saving && setModal(null)}>
          <div className={MODAL_CONTENT_CLS} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">{modal.id ? "تعديل نوع عينة" : "نوع عينة جديد"}</h3>
              <button onClick={() => !saving && setModal(null)} className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground">
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">اسم نوع العينة *</label>
                <input className={MODAL_INPUT_CLS} value={modal.name} onChange={e => setModal({ ...modal, name: e.target.value })} placeholder="مثال: دم وريدي" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">تعليمات التجميع</label>
                <textarea
                  className={`${MODAL_INPUT_CLS} min-h-[100px] resize-y`}
                  value={modal.instructions}
                  onChange={e => setModal({ ...modal, instructions: e.target.value })}
                  placeholder="مثال: يؤخذ على معدة فارغة، بتركيز من 8 إلى 12 ساعة"
                />
              </div>
              {modal.id && (
                <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <input type="checkbox" checked={modal.isActive} onChange={e => setModal({ ...modal, isActive: e.target.checked })} className="rounded border-border" />
                  مفعّل
                </label>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} disabled={saving} className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50">إلغاء</button>
              <button onClick={save} disabled={saving || !modal.name.trim()} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary disabled:opacity-50">
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
