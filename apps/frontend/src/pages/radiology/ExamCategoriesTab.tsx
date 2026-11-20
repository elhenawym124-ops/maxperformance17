import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Loader2, X as XMarkIcon, Pencil, Trash2, Search, List as ListIcon, FolderTree, ChevronDown, ChevronLeft } from "lucide-react";
import { api, fetchJson, MODAL_CONTENT_CLS, MODAL_INPUT_CLS, RadiologyExamCategory } from "./shared";

interface Form {
  id?: string;
  name: string;
  nameEn: string;
  abbreviation: string;
  modality: string;
  parentId: string;
  sortOrder: string;
  isActive: boolean;
}

const descendents = (cats: RadiologyExamCategory[], id: string, acc = new Set<string>(), seen = new Set<string>()): Set<string> => {
  if (seen.has(id)) return acc;
  seen.add(id);
  for (const c of cats) {
    if (c.parentId === id && !acc.has(c.id)) {
      acc.add(c.id);
      descendents(cats, c.id, acc, seen);
    }
  }
  return acc;
};

export default function ExamCategoriesTab() {
  const { t } = useTranslation();
  const [items, setItems] = useState<RadiologyExamCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "tree">("tree");
  const [modal, setModal] = useState<Form | null>(null);
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const refresh = useCallback(async (opts?: { silent?: boolean }) => {
    try {
      const url = new URL(api("exam-categories"));
      if (showInactive) url.searchParams.set("includeInactive", "true");
      const data = await fetchJson<RadiologyExamCategory[]>(url.toString());
      setItems(data || []);
      setError(null);
    } catch (e) {
      if (!opts?.silent) setError(e instanceof Error ? e.message : t("radiology.examCategories.loadFailed"));
    }
  }, [showInactive, t]);

  useEffect(() => {
    const timer = setTimeout(() => { setLoading(true); refresh().finally(() => setLoading(false)); }, 350);
    return () => clearTimeout(timer);
  }, [refresh]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let rows = items;
    if (term) {
      rows = rows.filter(c =>
        c.name.toLowerCase().includes(term)
        || (c.nameEn || "").toLowerCase().includes(term)
        || (c.abbreviation || "").toLowerCase().includes(term)
        || (c.modality || "").toLowerCase().includes(term)
      );
    }
    return rows;
  }, [items, search]);

  const tree = useMemo(() => {
    const byId = new Map(filtered.map(c => [c.id, { ...c, children: [] as RadiologyExamCategory[] }]));
    const roots: RadiologyExamCategory[] = [];
    for (const node of byId.values()) {
      if (node.parentId && byId.has(node.parentId)) byId.get(node.parentId)!.children.push(node);
      else roots.push(node);
    }
    const sort = (nodes: RadiologyExamCategory[]) => {
      nodes.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "ar"));
      for (const n of nodes) sort(n.children || []);
    };
    sort(roots);
    return roots;
  }, [filtered]);

  const excludedForParent = useMemo(() => {
    if (!modal?.id) return new Set<string>();
    return descendents(items, modal.id);
  }, [items, modal?.id]);

  const save = async () => {
    if (!modal || saving) return;
    if (!modal.name.trim()) { setError(t("radiology.examCategories.nameRequired")); return; }
    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: modal.name.trim(),
        nameEn: modal.nameEn.trim() || undefined,
        abbreviation: modal.abbreviation.trim() || undefined,
        modality: modal.modality.trim() || undefined,
        parentId: modal.parentId || undefined,
        sortOrder: Number(modal.sortOrder) || 0,
        isActive: modal.isActive,
      };
      if (modal.id) await fetchJson(api(`exam-categories/${modal.id}`), { method: "PUT", body: JSON.stringify(payload) });
      else await fetchJson(api("exam-categories"), { method: "POST", body: JSON.stringify(payload) });
      setModal(null);
      await refresh({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("radiology.examCategories.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (c: RadiologyExamCategory) => {
    if (removingId) return;
    if (!window.confirm(t("radiology.examCategories.deleteConfirm", { name: c.name }))) return;
    setRemovingId(c.id);
    try {
      await fetchJson(api(`exam-categories/${c.id}`), { method: "DELETE" });
      await refresh({ silent: true });
    } catch (e) {
      setError(e instanceof Error ? e.message : t("radiology.examCategories.deleteFailed"));
    } finally {
      setRemovingId(null);
    }
  };

  const renderRows = (nodes: RadiologyExamCategory[], depth: number): JSX.Element[] => {
    return nodes.flatMap(c => {
      const count = c._count?.examTypes ?? c.examTypeCount ?? 0;
      const childrenCount = c.children?.length ?? 0;
      return [
        <tr key={c.id} className="border-b dark:border-border hover:bg-muted/50 text-sm">
          <td className="py-3 px-4 font-medium" style={{ paddingRight: `${12 + depth * 20}px` }}>
            <div className="flex items-center gap-2">
              {childrenCount > 0 ? <FolderTree className="w-4 h-4 text-warning shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground dark:text-foreground shrink-0" />}
              <span>{c.name}</span>
              {childrenCount > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning text-warning dark:bg-warning/40 dark:text-warning">{childrenCount}</span>}
            </div>
          </td>
          <td className="py-3 px-4">{c.nameEn || "—"}</td>
          <td className="py-3 px-4">
            {c.modality ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary dark:bg-primary/40 dark:text-primary" dir="ltr">{c.modality}</span> : "—"}
          </td>
          <td className="py-3 px-4">{c.parentName || "—"}</td>
          <td className="py-3 px-4 whitespace-nowrap">{t("radiology.examCategories.examTypeCount", { count })}</td>
          <td className="py-3 px-4">
            {c.isActive ? (
              <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/40 dark:text-success">{t("radiology.examCategories.active")}</span>
            ) : (
              <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">{t("radiology.examCategories.inactive")}</span>
            )}
          </td>
          <td className="py-3 px-4">
            <div className="flex items-center gap-1.5">
              <button onClick={() => setModal({ id: c.id, name: c.name, nameEn: c.nameEn || "", abbreviation: c.abbreviation || "", modality: c.modality || "", parentId: c.parentId || "", sortOrder: String(c.sortOrder ?? 0), isActive: c.isActive })} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title={t("radiology.edit")}><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(c)} disabled={removingId !== null} className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded disabled:opacity-40" title={t("radiology.delete")}><Trash2 className="w-4 h-4" /></button>
            </div>
          </td>
        </tr>,
        ...renderRows(c.children || [], depth + 1),
      ];
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("radiology.examCategories.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("radiology.examCategories.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode(viewMode === "tree" ? "list" : "tree")} className="flex items-center gap-2 px-3 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50">
            {viewMode === "tree" ? <ListIcon className="w-4 h-4" /> : <FolderTree className="w-4 h-4" />}
            {viewMode === "tree" ? t("radiology.examCategories.viewList") : t("radiology.examCategories.viewTree")}
          </button>
          <button onClick={() => refresh()} className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm hover:bg-muted/50">
            <RefreshCw className="w-4 h-4" />{t("radiology.refresh")}
          </button>
          <button onClick={() => setModal({ name: "", nameEn: "", abbreviation: "", modality: "", parentId: "", sortOrder: "0", isActive: true })} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm">
            <Plus className="w-4 h-4" />{t("radiology.examCategories.newCategory")}
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-destructive dark:hover:bg-destructive/50 rounded"><XMarkIcon className="w-4 h-4" /></button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
          <input className={`${MODAL_INPUT_CLS} pe-9`} value={search} onChange={e => setSearch(e.target.value)} placeholder={t("radiology.examCategories.searchPlaceholder")} />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground whitespace-nowrap">
          <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} className="rounded border-border" />
          {t("radiology.examCategories.showInactive")}
        </label>
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground/80">{t("radiology.loadingEllipsis")}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border dark:border-border p-12 text-center text-muted-foreground/80">
          <FolderTree className="w-10 h-10 mx-auto mb-3" />
          {search ? t("radiology.examCategories.noResults") : t("radiology.examCategories.noCategories")}
        </div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border dark:border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px]">
              <thead>
                <tr className="border-b dark:border-border bg-muted dark:bg-muted text-muted-foreground dark:text-muted-foreground text-sm">
                  {[
                    t("radiology.examCategories.name"),
                    t("radiology.examCategories.nameEn"),
                    t("radiology.examCategories.modality"),
                    t("radiology.examCategories.parent"),
                    t("radiology.examCategories.exams"),
                    t("radiology.examCategories.status"),
                    t("radiology.examCategories.actions"),
                  ].map(h => <th key={h} className="text-right py-3 px-4 whitespace-nowrap">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {viewMode === "tree" ? renderRows(tree, 0) : filtered.map(c => (
                  <tr key={c.id} className="border-b dark:border-border hover:bg-muted/50 text-sm">
                    <td className="py-3 px-4 font-medium">{c.name}</td>
                    <td className="py-3 px-4">{c.nameEn || "—"}</td>
                    <td className="py-3 px-4">{c.modality ? <span className="text-xs px-2 py-0.5 rounded-full bg-primary text-primary dark:bg-primary/40 dark:text-primary" dir="ltr">{c.modality}</span> : "—"}</td>
                    <td className="py-3 px-4">{c.parentName || "—"}</td>
                    <td className="py-3 px-4 whitespace-nowrap">{t("radiology.examCategories.examTypeCount", { count: c._count?.examTypes ?? c.examTypeCount ?? 0 })}</td>
                    <td className="py-3 px-4">
                      {c.isActive ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-success text-success dark:bg-success/40 dark:text-success">{t("radiology.examCategories.active")}</span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-foreground dark:bg-muted dark:text-muted-foreground">{t("radiology.examCategories.inactive")}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setModal({ id: c.id, name: c.name, nameEn: c.nameEn || "", abbreviation: c.abbreviation || "", modality: c.modality || "", parentId: c.parentId || "", sortOrder: String(c.sortOrder ?? 0), isActive: c.isActive })} className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded" title={t("radiology.edit")}><Pencil className="w-4 h-4" /></button>
                        <button onClick={() => remove(c)} disabled={removingId !== null} className="p-1.5 text-destructive dark:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded disabled:opacity-40" title={t("radiology.delete")}><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !saving && setModal(null)}>
          <div className={MODAL_CONTENT_CLS} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{modal.id ? t("radiology.examCategories.editCategory") : t("radiology.examCategories.newCategoryModal")}</h3>
              <button onClick={() => !saving && setModal(null)} className="p-1 hover:bg-muted rounded-lg dark:text-muted-foreground"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.name")} *</label>
                <input className={MODAL_INPUT_CLS} value={modal.name} onChange={e => setModal({ ...modal, name: e.target.value })} placeholder={t("radiology.examCategories.namePlaceholder")} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.nameEn")}</label>
                  <input className={MODAL_INPUT_CLS} dir="ltr" value={modal.nameEn} onChange={e => setModal({ ...modal, nameEn: e.target.value })} placeholder={t("radiology.examCategories.nameEnPlaceholder")} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.abbreviation")}</label>
                  <input className={MODAL_INPUT_CLS} dir="ltr" value={modal.abbreviation} onChange={e => setModal({ ...modal, abbreviation: e.target.value })} placeholder={t("radiology.examCategories.abbreviationPlaceholder")} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.modality")}</label>
                  <input className={MODAL_INPUT_CLS} dir="ltr" value={modal.modality} onChange={e => setModal({ ...modal, modality: e.target.value })} placeholder={t("radiology.examCategories.modalityPlaceholder")} />
                  <p className="text-[11px] text-muted-foreground/80 mt-1">{t("radiology.examCategories.modalityHint")}</p>
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.parent")}</label>
                  <select className={MODAL_INPUT_CLS} value={modal.parentId} onChange={e => setModal({ ...modal, parentId: e.target.value })}>
                    <option value="">{t("radiology.examCategories.none")}</option>
                    {items.filter(c => c.id !== modal.id && !excludedForParent.has(c.id)).map(c => <option key={c.id} value={c.id}>{c.parentName ? `${c.parentName} / ${c.name}` : c.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.examCategories.sortOrder")}</label>
                  <input type="number" className={MODAL_INPUT_CLS} dir="ltr" value={modal.sortOrder} onChange={e => setModal({ ...modal, sortOrder: e.target.value })} />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 text-sm font-medium text-foreground">
                    <input type="checkbox" checked={modal.isActive} onChange={e => setModal({ ...modal, isActive: e.target.checked })} className="rounded border-border" />
                    {t("radiology.examCategories.enabled")}
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} disabled={saving} className="px-4 py-2 text-foreground border rounded-lg hover:bg-muted dark:hover:bg-muted disabled:opacity-50">{t("radiology.cancel")}</button>
              <button onClick={save} disabled={saving || !modal.name.trim()} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{t("radiology.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
