import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Search, Trash2, MessageCircle, ClipboardList } from "lucide-react";
import { api, fetchJson, MODAL_INPUT_CLS } from "./shared";

interface QuoteExamType {
  id: string;
  name: string;
  category?: string;
  abbreviation?: string;
  price: number;
}

interface QuoteItem {
  examTypeId: string;
  name: string;
  category?: string;
  price: number;
}

const formatPrice = (value: number, currency = "") => `${value} ${currency}`;

export default function PriceQuoteTab() {
  const { t } = useTranslation();
  const [examTypes, setExamTypes] = useState<QuoteExamType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<QuoteItem[]>([]);

  const loadExamTypes = async (quiet = false) => {
    setLoading(true);
    try {
      const data = await fetchJson<QuoteExamType[]>(`${api("exam-types")}&limit=500`);
      setExamTypes(data || []);
    } catch (e: unknown) {
      if (!quiet) setError(e instanceof Error ? e.message : t("radiology.priceQuote.loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExamTypes();
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim();
    if (!term) return examTypes;
    return examTypes.filter(
      (t) =>
        t.name.includes(term) ||
        (t.category || "").includes(term) ||
        (t.abbreviation || "").includes(term)
    );
  }, [examTypes, search]);

  const addItem = (et: QuoteExamType) => {
    setError(null);
    setItems((prev) =>
      prev.some((it) => it.examTypeId === et.id)
        ? prev
        : [...prev, { examTypeId: et.id, name: et.name, category: et.category, price: et.price }]
    );
    setSearch("");
  };

  const removeItem = (examTypeId: string) => {
    setItems((prev) => prev.filter((it) => it.examTypeId !== examTypeId));
  };

  const total = useMemo(() => items.reduce((sum, it) => sum + Number(it.price || 0), 0), [items]);

  const buildWhatsAppText = () => {
    const lines = items.map((it) => `• ${it.name}: ${formatPrice(it.price, t("radiology.currency"))}`);
    return [`${t("radiology.priceQuote.whatsappHeader")}`, ...lines, `${t("radiology.priceQuote.total")} ${formatPrice(total, t("radiology.currency"))}`].join("\n");
  };

  const shareWhatsApp = () => {
    if (items.length === 0) return;
    window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">{t("radiology.priceQuote.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("radiology.priceQuote.subtitle")}</p>
      </div>

      {error && (
        <div className="flex items-center justify-between bg-destructive/10 dark:bg-destructive/30 text-destructive dark:text-destructive border border-destructive dark:border-destructive rounded-lg px-4 py-2 text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-destructive dark:hover:bg-destructive/50 rounded">×</button>
        </div>
      )}

      <div className="relative">
        <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3 text-muted-foreground" />
        <input
          className={`${MODAL_INPUT_CLS} pe-9`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("radiology.priceQuote.searchPlaceholder")}
        />
        {search.trim() && filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-h-64 overflow-y-auto bg-card border dark:border-border rounded-lg shadow-xl">
            {filtered.map((et) => {
              const added = items.some((it) => it.examTypeId === et.id);
              return (
                <button
                  key={et.id}
                  onClick={() => addItem(et)}
                  disabled={added}
                  className="flex items-center justify-between w-full text-right px-4 py-2.5 text-sm hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span className="font-medium">{et.name}</span>
                  <span className="flex items-center gap-3 text-muted-foreground">
                    <span className="whitespace-nowrap">{formatPrice(et.price, t("radiology.currency"))}</span>
                    {added ? <span className="text-xs text-success dark:text-success">{t("radiology.priceQuote.added")}</span> : <Plus className="w-4 h-4" />}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground/80">{t("radiology.loadingEllipsis")}</div>
      ) : items.length === 0 ? (
        <div className="bg-card rounded-xl border dark:border-border p-12 text-center text-muted-foreground/80">
          <ClipboardList className="w-10 h-10 mx-auto mb-3" />
          {t("radiology.priceQuote.noSelection")}
        </div>
      ) : (
        <div className="bg-card rounded-xl border dark:border-border overflow-hidden">
          <div className="px-4 py-3 border-b dark:border-border text-sm font-medium text-muted-foreground">
            {t("radiology.priceQuote.selectedExams", { count: items.length })}
          </div>
          <ul className="divide-y dark:divide-border">
            {items.map((it) => (
              <li key={it.examTypeId} className="flex items-center justify-between gap-3 px-4 py-3">
                <div>
                  <div className="font-medium">{it.name}</div>
                  {it.category && <div className="text-xs text-muted-foreground">{it.category}</div>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="whitespace-nowrap text-sm">{formatPrice(it.price, t("radiology.currency"))}</span>
                  <button
                    onClick={() => removeItem(it.examTypeId)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-lg"
                    title={t("radiology.priceQuote.remove")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-t dark:border-border">
            <div className="text-lg font-bold">
              {t("radiology.priceQuote.total")} <span className="text-blue-600 dark:text-primary">{formatPrice(total, t("radiology.currency"))}</span>
            </div>
            <button
              onClick={shareWhatsApp}
              className="flex items-center gap-2 px-4 py-2 bg-success text-white rounded-lg hover:bg-success"
            >
              <MessageCircle className="w-4 h-4" />{t("radiology.priceQuote.shareWhatsApp")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
