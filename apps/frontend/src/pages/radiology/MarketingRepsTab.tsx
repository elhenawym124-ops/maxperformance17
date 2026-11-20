import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Loader2, X as XMarkIcon, UserRound, TrendingUp } from "lucide-react";
import { api, fetchJson, MODAL_CONTENT_CLS, MODAL_INPUT_CLS } from "./shared";

interface MarketingRep {
  id: string;
  name: string;
  phone?: string | null;
  userId?: string | null;
  isActive?: boolean;
}

interface PortfolioRow {
  repId: string;
  name: string;
  count: number;
  deliveredCount: number;
  revenue: number;
  deliveredRevenue: number;
  cashRevenue: number;
  insuranceRevenue: number;
  sourceCount: number;
  physicianCount: number;
}

export default function MarketingRepsTab() {
  const { t } = useTranslation();
  const [items, setItems] = useState<MarketingRep[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<MarketingRep | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [reps, port] = await Promise.all([
        fetchJson<MarketingRep[]>(api("marketing-reps")),
        fetchJson<{ rows: PortfolioRow[] }>(api("marketing-reps/portfolio")).catch(() => ({ rows: [] })),
      ]);
      setItems(Array.isArray(reps) ? reps : []);
      setPortfolio(port?.rows || []);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : t("radiology.marketingReps.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setModal({ id: "", name: "" }); setName(""); setPhone(""); };

  const save = async () => {
    if (saving) return;
    if (!name.trim()) { toast.error(t("radiology.marketingReps.nameRequired")); return; }
    setSaving(true);
    try {
      if (modal?.id) {
        await fetchJson(api(`marketing-reps/${modal.id}`), { method: "PUT", body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }) });
      } else {
        await fetchJson(api("marketing-reps"), { method: "POST", body: JSON.stringify({ name: name.trim(), phone: phone.trim() || undefined }) });
      }
      toast.success(modal?.id ? t("radiology.marketingReps.updated") : t("radiology.marketingReps.added"));
      setModal(null);
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("radiology.marketingReps.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: MarketingRep) => {
    try {
      await fetchJson(api(`marketing-reps/${c.id}`), { method: "PUT", body: JSON.stringify({ isActive: c.isActive === false }) });
      toast.success(c.isActive === false ? t("radiology.marketingReps.activated") : t("radiology.marketingReps.deactivated"));
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("radiology.marketingReps.updateFailed"));
    }
  };

  const portfolioMap = new Map(portfolio.map(p => [p.repId, p]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("radiology.marketingReps.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("radiology.marketingReps.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm"><RefreshCw className="w-4 h-4" />{t("radiology.refresh")}</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary text-sm"><Plus className="w-4 h-4" />{t("radiology.marketingReps.newRep")}</button>
        </div>
      </div>

      {/* Portfolio summary */}
      {portfolio.length > 0 && (
        <div className="bg-card rounded-xl shadow-sm border dark:border-border p-4">
          <h3 className="font-semibold mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4" />{t("radiology.marketingReps.portfolioTitle")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-border text-muted-foreground">
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.rep")}</th>
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.studies")}</th>
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.delivered")}</th>
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.revenue")}</th>
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.sources")}</th>
                  <th className="py-2 px-3 text-right font-medium">{t("radiology.marketingReps.physicians")}</th>
                </tr>
              </thead>
              <tbody>
                {portfolio.map(p => (
                  <tr key={p.repId} className="border-b dark:border-border last:border-0">
                    <td className="py-2 px-3 font-medium">{p.name}</td>
                    <td className="py-2 px-3">{p.count}</td>
                    <td className="py-2 px-3">{p.deliveredCount}</td>
                    <td className="py-2 px-3">{Number(p.revenue).toFixed(0)} {t("radiology.currency")}</td>
                    <td className="py-2 px-3">{p.sourceCount}</td>
                    <td className="py-2 px-3">{p.physicianCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t("radiology.marketingReps.noReps")}</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border dark:border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-border text-muted-foreground">
                <th className="py-3 px-4 text-right font-medium">{t("radiology.marketingReps.name")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.marketingReps.phone")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.marketingReps.status")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.marketingReps.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => {
                const port = portfolioMap.get(c.id);
                return (
                  <tr key={c.id} className="border-b dark:border-border last:border-0 hover:bg-muted/50">
                    <td className="py-3 px-4 font-medium"><span className="flex items-center gap-2"><UserRound className="w-4 h-4 text-muted-foreground" />{c.name}</span></td>
                    <td className="py-3 px-4" dir="ltr">{c.phone || "—"}</td>
                    <td className="py-3 px-4">
                      {port ? <span className="px-2 py-0.5 rounded-full text-xs bg-primary text-primary dark:bg-primary/40 dark:text-primary">{t("radiology.marketingReps.withPortfolio", { count: port.count })}</span> : null}
                      <span className={`px-2 py-0.5 rounded-full text-xs me-1 ${c.isActive === false ? "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive" : "bg-green-100 text-success dark:bg-success/40 dark:text-success"}`}>
                        {c.isActive === false ? t("radiology.marketingReps.inactive") : t("radiology.marketingReps.active")}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setModal(c); setName(c.name); setPhone(c.phone || ""); }} className="px-2 py-1 text-xs bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary rounded-lg">{t("radiology.marketingReps.edit")}</button>
                        <button onClick={() => toggle(c)} className="px-2 py-1 text-xs bg-muted text-foreground dark:bg-muted dark:text-muted-foreground rounded-lg">{c.isActive === false ? t("radiology.marketingReps.activate") : t("radiology.marketingReps.deactivate")}</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !saving && setModal(null)}>
          <div className={MODAL_CONTENT_CLS} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{modal.id ? t("radiology.marketingReps.editRep") : t("radiology.marketingReps.newRepModal")}</h3>
              <button onClick={() => !saving && setModal(null)} className="p-1 hover:bg-muted rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.marketingReps.nameRequired")}</label>
                <input className={MODAL_INPUT_CLS} value={name} onChange={e => setName(e.target.value)} placeholder={t("radiology.marketingReps.namePlaceholder")} />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.marketingReps.phone")}</label>
                <input className={MODAL_INPUT_CLS} value={phone} onChange={e => setPhone(e.target.value)} placeholder={t("radiology.marketingReps.phonePlaceholder")} />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setModal(null)} disabled={saving} className="px-4 py-2 text-foreground border rounded-lg disabled:opacity-50">{t("radiology.cancel")}</button>
              <button onClick={save} disabled={saving} className="px-4 py-2 bg-primary text-white rounded-lg disabled:opacity-50 flex items-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}{t("radiology.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
