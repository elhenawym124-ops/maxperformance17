import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiClient } from "../../services/api";
import { toast } from "sonner";
import { tToast } from "../../utils/i18n-toast";
import { Clock, Save, Loader2, MessageCircle, ExternalLink } from "lucide-react";

interface OrderSettingsApiResponse {
  success: boolean;
  data?: {
    incompleteOrderLostAfterHours?: string | number;
    showIncompleteCartsInOrders?: boolean;
    autoConvertIncompleteToPending?: boolean;
    [key: string]: any;
  };
}

interface WhatsAppSettingsState {
  isEnabled: boolean;
  abandonedCartEnabled: boolean;
  incompleteCartImmediateMessage: boolean;
  abandonedCartFirstReminder: number;
  abandonedCartSecondReminder: number;
  abandonedCartThirdReminder: number;
  abandonedCartDiscountEnabled: boolean;
  abandonedCartDiscountPercent: number;
}

const MIN_HOURS = 1;
const MAX_HOURS = 720;
const HOUR_PRESETS = [6, 12, 24, 48, 72];

const DEFAULT_WA_SETTINGS: WhatsAppSettingsState = {
  isEnabled: true,
  abandonedCartEnabled: true,
  incompleteCartImmediateMessage: false,
  abandonedCartFirstReminder: 1,
  abandonedCartSecondReminder: 24,
  abandonedCartThirdReminder: 72,
  abandonedCartDiscountEnabled: false,
  abandonedCartDiscountPercent: 10,
};

export default function IncompleteOrdersSettings() {
  const [hours, setHours] = useState<number>(24);
  const [showIncompleteInOrders, setShowIncompleteInOrders] = useState(false);
  const [autoConvertIncomplete, setAutoConvertIncomplete] = useState(false);

  const [waAvailable, setWaAvailable] = useState(false);
  const [waConnected, setWaConnected] = useState(false);
  const [waSettings, setWaSettings] = useState<WhatsAppSettingsState>(DEFAULT_WA_SETTINGS);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [orderRes, waRes] = await Promise.allSettled([
        apiClient.get<OrderSettingsApiResponse>("/order-settings"),
        apiClient.get<{ success: boolean; settings?: Partial<WhatsAppSettingsState>; sessions?: Array<{ status?: string }> }>(
          "/whatsapp-notifications/settings"
        ),
      ]);

      if (orderRes.status === "fulfilled" && orderRes.value.data?.success && orderRes.value.data?.data) {
        const d = orderRes.value.data.data;
        const value = parseInt(String(d.incompleteOrderLostAfterHours), 10);
        setHours(!Number.isNaN(value) && value >= MIN_HOURS && value <= MAX_HOURS ? value : 24);
        setShowIncompleteInOrders(Boolean(d.showIncompleteCartsInOrders));
        setAutoConvertIncomplete(Boolean(d.autoConvertIncompleteToPending));
      }

      if (waRes.status === "fulfilled" && waRes.value.data?.settings) {
        const s = waRes.value.data.settings;
        const sessions = waRes.value.data.sessions || [];
        setWaAvailable(true);
        setWaConnected(sessions.some((sess) => sess.status === "CONNECTED"));
        setWaSettings({
          isEnabled: s.isEnabled !== false,
          abandonedCartEnabled: Boolean(s.abandonedCartEnabled),
          incompleteCartImmediateMessage: Boolean(s.incompleteCartImmediateMessage),
          abandonedCartFirstReminder: Number(s.abandonedCartFirstReminder || 1),
          abandonedCartSecondReminder: Number(s.abandonedCartSecondReminder || 24),
          abandonedCartThirdReminder: Number(s.abandonedCartThirdReminder || 72),
          abandonedCartDiscountEnabled: Boolean(s.abandonedCartDiscountEnabled),
          abandonedCartDiscountPercent: Number(s.abandonedCartDiscountPercent || 10),
        });
      }
    } catch (error) {
      console.error("Error fetching incomplete order settings:", error);
      tToast.error("IncompleteOrdersSettings.error_fetch_53e5");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (hours < MIN_HOURS || hours > MAX_HOURS) {
      toast.error(`المدة يجب أن تكون بين ${MIN_HOURS} و ${MAX_HOURS} ساعة`);
      return;
    }

    try {
      setSaving(true);
      const requests: Array<Promise<any>> = [
        apiClient.put<OrderSettingsApiResponse>("/order-settings", {
          incompleteOrderLostAfterHours: hours,
          showIncompleteCartsInOrders: showIncompleteInOrders,
          autoConvertIncompleteToPending: autoConvertIncomplete,
        }),
      ];

      if (waAvailable) {
        requests.push(
          apiClient.put("/whatsapp-notifications/settings", {
            abandonedCartEnabled: waSettings.abandonedCartEnabled,
            incompleteCartImmediateMessage: waSettings.incompleteCartImmediateMessage,
            abandonedCartFirstReminder: Math.max(1, waSettings.abandonedCartFirstReminder),
            abandonedCartSecondReminder: Math.max(2, waSettings.abandonedCartSecondReminder),
            abandonedCartThirdReminder: Math.max(3, waSettings.abandonedCartThirdReminder),
            abandonedCartDiscountEnabled: waSettings.abandonedCartDiscountEnabled,
            abandonedCartDiscountPercent: Math.min(90, Math.max(1, waSettings.abandonedCartDiscountPercent)),
          })
        );
      }

      await Promise.all(requests);
      toast.success("تم حفظ الإعدادات بنجاح");
      fetchSettings();
    } catch (error) {
      console.error("Error saving incomplete order settings:", error);
      tToast.error("IncompleteOrdersSettings.error_save_bccf");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-muted-foreground font-mono text-xs gap-2 select-none" dir="rtl">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        <span>جاري تحميل إعدادات الطلبات غير المكتملة...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-foreground select-none" dir="rtl">
      {/* شريط الحالة العلوي */}
      <div className="border border-border/70 bg-muted/20 px-4 py-2.5 rounded-lg flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-muted-foreground font-medium">
            <span className="inline-block w-2 h-2 rounded-full bg-success animate-pulse" />
            نظام استعادة السلال المتروكة
          </span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground font-mono tabular-nums text-[11px]">
            TIMEOUT: {hours}H
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-3 font-mono tabular-nums text-muted-foreground text-xs">
          <span>
            واتساب الاستعادة:{" "}
            <strong className={waSettings.abandonedCartEnabled ? "text-success" : "text-muted-foreground"}>
              {waSettings.abandonedCartEnabled ? "مفعل" : "معطل"}
            </strong>
          </span>
          <span className="text-border">|</span>
          <span>
            التحويل التلقائي:{" "}
            <strong className={autoConvertIncomplete ? "text-success" : "text-muted-foreground"}>
              {autoConvertIncomplete ? "مفعل" : "معطل"}
            </strong>
          </span>
        </div>
      </div>

      {/* لوحة الإعدادات الرئيسية */}
      <div className="rounded-xl border border-border/70 bg-card divide-y divide-border/60 shadow-2xs">
        {/* قسم السلال غير المكتملة */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 text-primary">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                إعدادات الطلبات غير المكتملة والسلال المتروكة
              </h2>
              <p className="text-xs text-muted-foreground">
                مهلة اعتبار السلة مفقودة وقواعد التحويل والعرض
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-foreground">
                مهلة اعتبار الطلب مفقوداً (بالساعات)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 w-36">
                  <input
                    type="number"
                    min={MIN_HOURS}
                    max={MAX_HOURS}
                    value={hours}
                    onChange={(e) => {
                      const value = parseInt(e.target.value, 10);
                      setHours(Number.isNaN(value) ? MIN_HOURS : value);
                    }}
                    className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs text-foreground font-mono tabular-nums focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary"
                  />
                  <span className="text-xs text-muted-foreground font-mono shrink-0">ساعة</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {HOUR_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setHours(preset)}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-mono tabular-nums border transition-colors ${
                        hours === preset
                          ? "border-primary bg-primary/10 text-primary font-semibold"
                          : "border-border/70 bg-muted/20 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {preset}h
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 p-3.5">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  دمج السلال غير المكتملة في جدول الطلبات الرئيسي
                </p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  تظهر السلال المتروكة جنباً إلى جنب مع الطلبات لمتابعتها من شاشة الطلبات
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={showIncompleteInOrders}
                  onChange={() => setShowIncompleteInOrders((prev) => !prev)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-muted border border-border/80 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-primary-foreground" />
              </label>
            </div>

            <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 p-3.5">
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-xs font-semibold text-foreground">
                    تحويل السلال المتروكة تلقائياً إلى «قيد الانتظار»
                  </p>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold font-mono ${
                      autoConvertIncomplete
                        ? "bg-success/15 text-success border border-success/30"
                        : "bg-muted text-muted-foreground border border-border/70"
                    }`}
                  >
                    {autoConvertIncomplete ? "مفعل" : "معطل"}
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  يتم التحويل فقط بعد توقف نشاط العميل 30 دقيقة وبعد التحقق من صحة رقم الهاتف وعدم وجود طلب مكرر
                </p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center shrink-0">
                <input
                  type="checkbox"
                  checked={autoConvertIncomplete}
                  onChange={() => setAutoConvertIncomplete((prev) => !prev)}
                  className="peer sr-only"
                />
                <div className="h-5 w-9 rounded-full bg-muted border border-border/80 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-success peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-white" />
              </label>
            </div>
          </div>
        </div>

        {/* قسم إشعارات الواتساب لاستعادة السلال */}
        {waAvailable && (
          <div className="p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-success/10 border border-success/20 text-success">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-foreground">
                      إشعارات الواتساب التلقائية للسلة المتروكة
                    </h2>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                        waConnected
                          ? "border-success/30 bg-success/10 text-success"
                          : "border-warning/30 bg-warning/10 text-warning"
                      }`}
                    >
                      {waConnected ? "جلسة متصلة" : "لا توجد جلسة متصلة"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    إرسال رابط استرجاع مباشر للسلة مع إيقاف الإرسال تلقائياً فور إتمام الطلب
                  </p>
                </div>
              </div>

              <Link
                to="/orders/status-templates?tab=incomplete"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-muted/20 px-2.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted/50 transition-colors"
              >
                <span>تعديل القوالب</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </Link>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    تفعيل رسالة المتابعة الأولى (بعد 15 دقيقة من التوقف)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    تُرسل مع رابط الشيك آوت فقط إذا لم يُكمل العميل الطلب خلال فترة السماح
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={waSettings.incompleteCartImmediateMessage}
                    onChange={() =>
                      setWaSettings((prev) => ({
                        ...prev,
                        incompleteCartImmediateMessage: !prev.incompleteCartImmediateMessage,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-muted border border-border/80 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-primary-foreground" />
                </label>
              </div>

              <div className="flex items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    تفعيل التذكيرات المجدولة للسلة المتروكة
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    تذكير دوري بالسلات غير المكتملة مع استبعاد الطلبات المؤكدة والمستبعدة تلقائياً
                  </p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center shrink-0">
                  <input
                    type="checkbox"
                    checked={waSettings.abandonedCartEnabled}
                    onChange={() =>
                      setWaSettings((prev) => ({
                        ...prev,
                        abandonedCartEnabled: !prev.abandonedCartEnabled,
                      }))
                    }
                    className="peer sr-only"
                  />
                  <div className="h-5 w-9 rounded-full bg-muted border border-border/80 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-primary-foreground" />
                </label>
              </div>

              {waSettings.abandonedCartEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      التذكير الأول (ساعة)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={168}
                      value={waSettings.abandonedCartFirstReminder}
                      onChange={(e) =>
                        setWaSettings((prev) => ({
                          ...prev,
                          abandonedCartFirstReminder: Number(e.target.value) || 1,
                        }))
                      }
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      التذكير الثاني (ساعة)
                    </label>
                    <input
                      type="number"
                      min={2}
                      max={336}
                      value={waSettings.abandonedCartSecondReminder}
                      onChange={(e) =>
                        setWaSettings((prev) => ({
                          ...prev,
                          abandonedCartSecondReminder: Number(e.target.value) || 24,
                        }))
                      }
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                      التذكير الثالث (ساعة)
                    </label>
                    <input
                      type="number"
                      min={3}
                      max={720}
                      value={waSettings.abandonedCartThirdReminder}
                      onChange={(e) =>
                        setWaSettings((prev) => ({
                          ...prev,
                          abandonedCartThirdReminder: Number(e.target.value) || 72,
                        }))
                      }
                      className="w-full rounded-lg border border-border/80 bg-background px-3 py-1.5 text-xs font-mono tabular-nums"
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/70 bg-muted/15 p-3.5">
                <div>
                  <p className="text-xs font-semibold text-foreground">
                    عرض خصم تحفيزي في التذكير الأخير
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    يرسل كود خصم تلقائياً مع رابط السلة لتحفيز إتمام الشراء
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {waSettings.abandonedCartDiscountEnabled && (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min={1}
                        max={90}
                        value={waSettings.abandonedCartDiscountPercent}
                        onChange={(e) =>
                          setWaSettings((prev) => ({
                            ...prev,
                            abandonedCartDiscountPercent: Number(e.target.value) || 10,
                          }))
                        }
                        className="w-16 rounded-lg border border-border/80 bg-background px-2 py-1 text-xs font-mono tabular-nums text-center"
                      />
                      <span className="text-xs font-mono text-muted-foreground">%</span>
                    </div>
                  )}
                  <label className="relative inline-flex cursor-pointer items-center shrink-0">
                    <input
                      type="checkbox"
                      checked={waSettings.abandonedCartDiscountEnabled}
                      onChange={() =>
                        setWaSettings((prev) => ({
                          ...prev,
                          abandonedCartDiscountEnabled: !prev.abandonedCartDiscountEnabled,
                        }))
                      }
                      className="peer sr-only"
                    />
                    <div className="h-5 w-9 rounded-full bg-muted border border-border/80 after:absolute after:start-[2px] after:top-[2px] after:h-4 after:w-4 after:rounded-full after:bg-muted-foreground after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:bg-primary-foreground" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* زر حفظ الإعدادات */}
        <div className="px-5 py-3.5 flex justify-end bg-muted/10">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shadow-2xs active:scale-[0.98] cursor-pointer"
          >
            {saving ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>جاري الحفظ...</span>
              </>
            ) : (
              <>
                <Save className="h-3.5 w-3.5" />
                <span>حفظ جميع الإعدادات</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
