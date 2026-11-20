import React, { useState, useEffect } from "react";
import { apiClient } from "../../services/apiClient";
import { Loader2, Zap, CheckCircle, Settings2 } from "lucide-react";
import AutoDiscountAnalytics from "./AutoDiscountAnalytics";
import { DateInput } from '../../components/ui/DateInput';

interface AutoDiscountSettingsProps {
  onSaved?: (data?: any) => void;
  activeSystem?: string | null;
  activated?: boolean;
}

/**
 * إعدادات نظام "الخصم التلقائي":
 * كوبون خصم % على الأوردر الجاي، صلاحيته أيام، ويتحول لكاش باك عند الانتهاء.
 * 🆕 التفعيل مستقل عن نظام المستويات (ممكن الاتنين يشتغلوا مع بعض).
 */
const AutoDiscountSettings: React.FC<AutoDiscountSettingsProps> = ({ onSaved }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [comboSaving, setComboSaving] = useState(false);
  const [comboMsg, setComboMsg] = useState("");
  const [comboErr, setComboErr] = useState("");
  const [cfg, setCfg] = useState({
    autoDiscountEnabled: false,
    enabled: true,
    discountPercent: 10,
    validityDays: 3,
    convertExpiredToCashback: true,
    redeemPointsEnabled: true,
    discountCombination: 'ADDITIVE',
    maxTotalDiscountPercent: 20,
    loyaltyActivatedAt: undefined as string | undefined,
  });

  const load = async () => {
    try {
      const res = await apiClient.get("/hr/customer-loyalty/loyalty-config");
      const d = res.data?.data || {};
      const ad = d.autoDiscount || {};
      setCfg((prev) => ({
        ...prev,
        autoDiscountEnabled: ad.enabled === true,
        discountPercent: ad.discountPercent ?? prev.discountPercent,
        validityDays: ad.validityDays ?? prev.validityDays,
        convertExpiredToCashback: ad.convertExpiredToCashback !== false,
        redeemPointsEnabled: ad.redeemPointsEnabled !== false,
        discountCombination: ad.discountCombination || prev.discountCombination,
        maxTotalDiscountPercent:
          ad.maxTotalDiscountPercent !== undefined && ad.maxTotalDiscountPercent !== null
            ? Number(ad.maxTotalDiscountPercent)
            : prev.maxTotalDiscountPercent,
        enabled: true,
      }));
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || "فشل تحميل الإعدادات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const saveActivation = async (enabled: boolean) => {
    if (!enabled && !window.confirm("هل تريد إيقاف تفعيل نظام الخصم التلقائي؟")) return;
    setSaving(true);
    setSavedMsg("");
    setErrorMsg("");
    try {
      const res = await apiClient.put("/hr/customer-loyalty/loyalty-config", {
        autoDiscountEnabled: enabled,
        enabled: true,
        discountPercent: cfg.discountPercent,
        validityDays: cfg.validityDays,
        convertExpiredToCashback: cfg.convertExpiredToCashback,
        redeemPointsEnabled: cfg.redeemPointsEnabled,
        discountCombination: cfg.discountCombination,
        maxTotalDiscountPercent: cfg.maxTotalDiscountPercent,
      });
      const ad = (res.data?.data || {}).autoDiscount || {};
      setCfg((prev) => ({
        ...prev,
        autoDiscountEnabled: ad.enabled === true,
        discountPercent: ad.discountPercent ?? prev.discountPercent,
        validityDays: ad.validityDays ?? prev.validityDays,
        convertExpiredToCashback: ad.convertExpiredToCashback !== false,
        redeemPointsEnabled: ad.redeemPointsEnabled !== false,
        discountCombination: ad.discountCombination || prev.discountCombination,
        maxTotalDiscountPercent:
          ad.maxTotalDiscountPercent !== undefined ? Number(ad.maxTotalDiscountPercent) : prev.maxTotalDiscountPercent,
      }));
      setSavedMsg(enabled ? "تم تفعيل نظام الخصم التلقائي ✓" : "تم إيقاف تفعيل نظام الخصم التلقائي ✓");
      onSaved?.(res.data?.data);
    } catch (e: any) {
      setErrorMsg(e?.response?.data?.error || (enabled ? "فشل التفعيل" : "فشل إيقاف التفعيل"));
    } finally {
      setSaving(false);
    }
  };

  const saveCombo = async () => {
    setComboSaving(true);
    setComboMsg("");
    setComboErr("");
    try {
      const res = await apiClient.put("/hr/customer-loyalty/loyalty-config", {
        autoDiscountEnabled: cfg.autoDiscountEnabled,
        enabled: true,
        discountPercent: cfg.discountPercent,
        validityDays: cfg.validityDays,
        convertExpiredToCashback: cfg.convertExpiredToCashback,
        redeemPointsEnabled: cfg.redeemPointsEnabled,
        discountCombination: cfg.discountCombination,
        maxTotalDiscountPercent: cfg.maxTotalDiscountPercent,
      });
      const ad = (res.data?.data || {}).autoDiscount || {};
      setCfg((prev) => ({
        ...prev,
        discountCombination: ad.discountCombination || prev.discountCombination,
        maxTotalDiscountPercent:
          ad.maxTotalDiscountPercent !== undefined ? Number(ad.maxTotalDiscountPercent) : prev.maxTotalDiscountPercent,
      }));
      setComboMsg("تم حفظ إعدادات الدمج ✓");
      onSaved?.(res.data?.data);
    } catch (e: any) {
      setComboErr(e?.response?.data?.error || "فشل حفظ إعدادات الدمج");
    } finally {
      setComboSaving(false);
    }
  };

  const set = (k: string, v: any) => setCfg((prev) => ({ ...prev, [k]: v }));

  const inputCls =
    "w-full border border-border rounded-lg px-3 py-2 text-sm bg-card text-foreground";

  const isActivated = cfg.autoDiscountEnabled === true;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-warning dark:bg-warning/40 flex items-center justify-center text-warning dark:text-warning">
          <Zap className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-foreground">الخصم التلقائي</h3>
          <p className="text-sm text-muted-foreground">
            بعد كل أوردر مسلّم العميل بياخد خصم % على الأوردر الجاي، ولو خلصت المدة من غير استخدام بيتحول كاش باك في محفظته.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-warning" /></div>
      ) : (
        <>
          {isActivated && <AutoDiscountAnalytics />}

          <div className="bg-card p-4 rounded-lg shadow space-y-4">
            <label className="flex items-center gap-2 text-sm font-medium text-foreground">
              <input type="checkbox" checked={isActivated} onChange={(e) => saveActivation(e.target.checked)} className="h-4 w-4 accent-warning" />
              تفعيل نظام الخصم التلقائي
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">نسبة الخصم %</label>
                <input type="number" min="0" max="100" value={cfg.discountPercent} onChange={(e) => set("discountPercent", Number(e.target.value))} className={inputCls + " mt-1"} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">مدة الصلاحية (أيام)</label>
                <input type="number" min="1" value={cfg.validityDays} onChange={(e) => set("validityDays", Number(e.target.value))} className={inputCls + " mt-1"} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">تاريخ تفعيل نظام الخصم</label>
                <DateInput
                  value={cfg.loyaltyActivatedAt ? cfg.loyaltyActivatedAt.slice(0, 10) : ""}
                  onChange={(e) => set("loyaltyActivatedAt", e.target.value ? new Date(e.target.value + "T00:00:00").toISOString() : null)}
                  className={inputCls + " mt-1"}
                />
                <p className="text-[10px] text-muted-foreground mt-1">الأوردرات اللي اتسلمت قبل التاريخ ده مش بتاخد كوبون خصم وبتتوصف "قبل تفعيل النظام".</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-border dark:border-border pt-4">
              <label className="flex items-start gap-2 text-sm font-medium text-foreground cursor-pointer">
                <input type="checkbox" checked={Boolean(cfg.convertExpiredToCashback)} onChange={(e) => set("convertExpiredToCashback", e.target.checked)} className="h-4 w-4 accent-warning mt-0.5" />
                <span>
                  تحويل الكوبون المنتهي لكاش باك
                  <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">الكوبون اللي خلصت مدته من غير استخدام بيتحوّل لرصيد كاش باك في محفظة العميل.</span>
                </span>
              </label>
              <label className="flex items-start gap-2 text-sm font-medium text-foreground cursor-pointer">
                <input type="checkbox" checked={Boolean(cfg.redeemPointsEnabled)} onChange={(e) => set("redeemPointsEnabled", e.target.checked)} className="h-4 w-4 accent-warning mt-0.5" />
                <span>
                  استبدال النقاط بالخصم
                  <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">العميل يقدر يستبدل النقاط اللي جمعها بخصم على الأوردر الجاي.</span>
                </span>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-border dark:border-border pt-4">
              {savedMsg && <span className="text-sm text-success dark:text-success font-medium">{savedMsg}</span>}
              {errorMsg && <span className="text-sm text-destructive dark:text-destructive font-medium">{errorMsg}</span>}
              <button
                onClick={() => saveActivation(!isActivated)}
                disabled={saving}
                title={isActivated ? "اضغط لإيقاف تفعيل نظام الخصم التلقائي" : "تفعيل نظام الخصم التلقائي"}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold whitespace-nowrap transition-colors ${
                  isActivated
                    ? "bg-amber-500 text-white hover:bg-warning"
                    : "bg-amber-100 dark:bg-warning/40 text-warning dark:text-warning hover:bg-warning dark:hover:bg-warning/60"
                } disabled:opacity-50`}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : isActivated ? <CheckCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                {isActivated ? "تم التفعيل" : "تفعيل النظام"}
              </button>
            </div>
            {isActivated && (
              <p className="text-xs text-success dark:text-success -mt-2">
                نظام الخصم التلقائي مفعّل — الإعدادات بتتحفظ أوتوماتيكياً عند أي تعديل، وبادج "خصم متاح" بيظهر للعملاء.
              </p>
            )}
          </div>

          <div className="bg-amber-50 dark:bg-warning/20 border border-warning dark:border-warning rounded-lg p-4 text-sm text-warning dark:text-warning">
            <p className="font-semibold">ملاحظة:</p>
            <p>نظام الخصم التلقائي مستقل — ممكن يشتغل مع نظام المستويات في نفس الوقت. من قسم "دمج الخصم" تحت يمكنك تحديد إزاي الاتنين يتطبّقوا مع بعض (جمع / أعلى خصم / مركّب) وتحط حد أقصى لإجمالي الخصم.</p>
          </div>

          <div className="bg-card p-4 rounded-lg shadow space-y-4 border-t-2 border-primary dark:border-primary">
            <div className="flex items-center gap-2">
              <Settings2 className="h-5 w-5 text-primary" />
              <h4 className="text-base font-bold text-foreground">دمج الخصم (المستويات + الخصم التلقائي)</h4>
            </div>
            <p className="text-xs text-muted-foreground">
              لو الاتنين مفعّلين مع بعض، اختر إزاي يتطبّقوا على الأوردر، وحط حد أقصى لإجمالي الخصم عشان تحمي هامش الربح.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-muted-foreground">وضع دمج الخصم</label>
                <select
                  value={cfg.discountCombination}
                  onChange={(e) => set("discountCombination", e.target.value)}
                  className={inputCls + " mt-1"}
                >
                  <option value="ADDITIVE">جمع النسب (الاتنين مع بعض)</option>
                  <option value="BEST">أعلى خصم بس</option>
                  <option value="COMPOUND">مركّب (خصم على المتبقي)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">حد أقصى لإجمالي الخصم % (0 = بدون حد)</label>
                <input
                  type="number" min="0" max="100"
                  value={cfg.maxTotalDiscountPercent}
                  onChange={(e) => set("maxTotalDiscountPercent", Number(e.target.value))}
                  className={inputCls + " mt-1"}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              {comboMsg && <span className="text-sm text-success dark:text-success font-medium">{comboMsg}</span>}
              {comboErr && <span className="text-sm text-destructive dark:text-destructive font-medium">{comboErr}</span>}
              <button
                onClick={saveCombo}
                disabled={comboSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-primary text-white hover:bg-primary disabled:opacity-50"
              >
                {comboSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Settings2 className="h-4 w-4" />}
                حفظ إعدادات الدمج
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AutoDiscountSettings;
