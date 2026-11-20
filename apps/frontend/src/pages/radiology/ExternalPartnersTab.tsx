import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { Plus, RefreshCw, Loader2, X as XMarkIcon, Network } from "lucide-react";
import { api, fetchJson, MODAL_CONTENT_CLS, MODAL_INPUT_CLS } from "./shared";

interface ExternalPartner {
  id: string;
  name: string;
  phone?: string | null;
  contactName?: string | null;
  isActive?: boolean;
}

export default function ExternalPartnersTab() {
  const { t } = useTranslation();
  const [items, setItems] = useState<ExternalPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<ExternalPartner | null>(null);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const partners = await fetchJson<ExternalPartner[]>(api("external-partners"));
      setItems(Array.isArray(partners) ? partners : []);
    } catch (e) {
      if (!silent) toast.error(e instanceof Error ? e.message : t("radiology.externalPartners.loadFailed"));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { load(); }, [load]);

  const openNew = () => { setModal({ id: "", name: "" }); setName(""); setPhone(""); setContactName(""); };

  const save = async () => {
    if (saving) return;
    if (!name.trim()) { toast.error(t("radiology.externalPartners.nameRequired")); return; }
    setSaving(true);
    try {
      const payload = { name: name.trim(), phone: phone.trim() || undefined, contactName: contactName.trim() || undefined };
      if (modal?.id) {
        await fetchJson(api(`external-partners/${modal.id}`), { method: "PUT", body: JSON.stringify(payload) });
      } else {
        await fetchJson(api("external-partners"), { method: "POST", body: JSON.stringify(payload) });
      }
      toast.success(modal?.id ? t("radiology.externalPartners.updated") : t("radiology.externalPartners.added"));
      setModal(null);
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("radiology.externalPartners.saveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c: ExternalPartner) => {
    try {
      await fetchJson(api(`external-partners/${c.id}`), { method: "PUT", body: JSON.stringify({ isActive: c.isActive === false }) });
      toast.success(c.isActive === false ? t("radiology.externalPartners.activated") : t("radiology.externalPartners.deactivated"));
      await load(true);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("radiology.externalPartners.updateFailed"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">{t("radiology.externalPartners.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("radiology.externalPartners.subtitle")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => load()} className="flex items-center gap-2 px-4 py-2 border dark:border-border rounded-lg text-sm"><RefreshCw className="w-4 h-4" />{t("radiology.refresh")}</button>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary text-sm"><Plus className="w-4 h-4" />{t("radiology.externalPartners.newPartner")}</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">{t("radiology.externalPartners.noPartners")}</div>
      ) : (
        <div className="bg-card rounded-xl shadow-sm border dark:border-border overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b dark:border-border text-muted-foreground">
                <th className="py-3 px-4 text-right font-medium">{t("radiology.externalPartners.partner")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.externalPartners.phone")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.externalPartners.contactName")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.externalPartners.status")}</th>
                <th className="py-3 px-4 text-right font-medium">{t("radiology.externalPartners.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map(c => (
                <tr key={c.id} className="border-b dark:border-border last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-4 font-medium"><span className="flex items-center gap-2"><Network className="w-4 h-4 text-muted-foreground" />{c.name}</span></td>
                  <td className="py-3 px-4" dir="ltr">{c.phone || "—"}</td>
                  <td className="py-3 px-4">{c.contactName || "—"}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${c.isActive === false ? "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive" : "bg-green-100 text-success dark:bg-success/40 dark:text-success"}`}>
                      {c.isActive === false ? t("radiology.externalPartners.inactive") : t("radiology.externalPartners.active")}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setModal(c); setName(c.name); setPhone(c.phone || ""); setContactName(c.contactName || ""); }} className="px-2 py-1 text-xs bg-primary/10 text-primary dark:bg-primary/40 dark:text-primary rounded-lg">{t("radiology.externalPartners.edit")}</button>
                      <button onClick={() => toggle(c)} className="px-2 py-1 text-xs bg-muted text-foreground dark:bg-muted dark:text-muted-foreground rounded-lg">{c.isActive === false ? t("radiology.externalPartners.activate") : t("radiology.externalPartners.deactivate")}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center" onClick={() => !saving && setModal(null)}>
          <div className={MODAL_CONTENT_CLS} onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">{modal.id ? t("radiology.externalPartners.editPartner") : t("radiology.externalPartners.newPartnerModal")}</h3>
              <button onClick={() => !saving && setModal(null)} className="p-1 hover:bg-muted rounded-lg"><XMarkIcon className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.externalPartners.nameRequired")}</label>
                <input className={MODAL_INPUT_CLS} value={name} onChange={e => setName(e.target.value)} placeholder={t("radiology.externalPartners.namePlaceholder")} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.externalPartners.phone")}</label>
                  <input className={MODAL_INPUT_CLS} value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">{t("radiology.externalPartners.contactName")}</label>
                  <input className={MODAL_INPUT_CLS} value={contactName} onChange={e => setContactName(e.target.value)} />
                </div>
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
