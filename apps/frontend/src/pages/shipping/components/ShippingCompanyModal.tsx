import React from "react";
import {
  KeyIcon,
  XMarkIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import type {
  ShippingCompany,
  ShippingCompanyFormData,
  TestedProfile,
} from "../types";
import {
  QpExpressWizard,
  BostaWizard,
  TurboWizard,
  HashtagWizard,
  ManualFleetWizard,
  MaxpNetworkWizard,
} from "./ShippingCarrierWizards";
import { ShippingAdvancedSettings } from "./ShippingAdvancedSettings";

export interface ShippingCompanyModalProps {
  showModal: boolean;
  setShowModal: (show: boolean) => void;
  editingCompany: ShippingCompany | null;
  formData: ShippingCompanyFormData;
  setFormData: React.Dispatch<React.SetStateAction<ShippingCompanyFormData>>;
  showAdvanced: boolean;
  setShowAdvanced: React.Dispatch<React.SetStateAction<boolean>>;
  testedProfile: TestedProfile | null;
  testingConnection: boolean;
  handleTestConnection: (companyId?: string) => Promise<void>;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  copyWebhookUrl: () => void;
  handleTriggerChange?: (trigger: string) => Promise<void>;
}

export const ShippingCompanyModal: React.FC<ShippingCompanyModalProps> = ({
  showModal,
  setShowModal,
  editingCompany,
  formData,
  setFormData,
  showAdvanced,
  setShowAdvanced,
  testedProfile,
  testingConnection,
  handleTestConnection,
  handleSubmit,
  copyWebhookUrl,
  handleTriggerChange,
}) => {
  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-lg w-full max-h-[92vh] overflow-y-auto space-y-4 p-6">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-border dark:border-border pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 dark:bg-primary/50 text-primary">
              <KeyIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                {editingCompany ? `إعدادات ربط ${editingCompany.name}` : "إضافة شركة شحن جديدة"}
              </h3>
              <p className="text-xs text-muted-foreground">
                تهيئة مفاتيح الاتصال البرمجي وتدفق الشحنات
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-foreground p-1"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-right">
          {!editingCompany && (
            <div>
              <label className="block text-xs font-semibold text-foreground mb-1.5">
                نوع مزوّد الشحن
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-1.5 p-1 bg-muted/40 rounded-xl border border-border/80 text-xs">
                {[
                  { key: "MAXP_NETWORK", label: "شحن على MaxP", badge: "شبكة" },
                  { key: "QP_EXPRESS", label: "كيو بي", badge: "LIVE" },
                  { key: "BOSTA", label: "بوستا", badge: "LIVE" },
                  { key: "TURBO", label: "تربو", badge: "LIVE" },
                  { key: "HASHTAG", label: "هاشتاج", badge: "LIVE" },
                  { key: "MANUAL", label: "أسطول يدوي", badge: "يدوي" },
                ].map((p) => {
                  const active = formData.providerKey === p.key;
                  return (
                    <button
                      type="button"
                      key={p.key}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          providerKey: p.key,
                          integrationMode:
                            p.key === "MAXP_NETWORK"
                              ? "INTERNAL"
                              : p.key === "MANUAL"
                              ? "MANUAL"
                              : "LIVE",
                        }))
                      }
                      className={`py-2 px-1.5 rounded-lg font-medium transition text-center flex flex-col items-center justify-center gap-0.5 active:scale-[0.98] ${
                        active
                          ? "bg-background text-foreground shadow-xs border border-border font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                      }`}
                    >
                      <span className="truncate w-full">{p.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                          p.key === "MAXP_NETWORK"
                            ? "bg-indigo-100 text-primary dark:bg-primary/60 dark:text-primary"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Provider Wizards */}
          {formData.providerKey === "MAXP_NETWORK" && (
            <MaxpNetworkWizard
              formData={formData}
              setFormData={setFormData}
              editingCompany={editingCompany}
              testedProfile={testedProfile}
            />
          )}
          {formData.providerKey === "QP_EXPRESS" && (
            <QpExpressWizard
              formData={formData}
              setFormData={setFormData}
              editingCompany={editingCompany}
              testedProfile={testedProfile}
            />
          )}

          {formData.providerKey === "BOSTA" && (
            <BostaWizard
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {formData.providerKey === "TURBO" && (
            <TurboWizard
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {formData.providerKey === "HASHTAG" && (
            <HashtagWizard
              formData={formData}
              setFormData={setFormData}
              editingCompany={editingCompany}
            />
          )}

          {formData.providerKey === "MANUAL" && (
            <ManualFleetWizard
              formData={formData}
              setFormData={setFormData}
            />
          )}

          {/* Collapsible Advanced Settings (For Developers/Integrators) */}
          <ShippingAdvancedSettings
            showAdvanced={showAdvanced}
            setShowAdvanced={setShowAdvanced}
            formData={formData}
            setFormData={setFormData}
            copyWebhookUrl={copyWebhookUrl}
          />

          {/* Active Status Checkbox */}
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-primary/50 dark:bg-primary/30 border border-primary dark:border-primary/40">
            <input
              type="checkbox"
              id="modalIsActive"
              checked={formData.isActive}
              onChange={(e) => setFormData((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="mt-0.5 h-4 w-4 text-primary rounded border-border focus:ring-primary"
            />
            <label htmlFor="modalIsActive" className="text-xs text-foreground cursor-pointer">
              <span className="font-bold text-foreground">تفعيل شركة الشحن للعمل بالمتجر فوراً</span>
              <span className="block text-[11px] text-muted-foreground">
                عند التفعيل تظهر الشركة مباشرة في شحن الطلبات الفردية والجماعية وتوليد البوالص
              </span>
            </label>
          </div>

          {/* Auto Create Shipments & Trigger Timing */}
          <div className="space-y-3 p-3 rounded-xl border border-border dark:border-border bg-muted dark:bg-muted">
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="modalAutoCreate"
                checked={formData.autoCreateShipments}
                onChange={(e) => setFormData((prev) => ({ ...prev, autoCreateShipments: e.target.checked }))}
                className="mt-0.5 h-4 w-4 text-primary rounded border-border focus:ring-primary"
              />
              <label htmlFor="modalAutoCreate" className="text-xs text-foreground cursor-pointer">
                <span className="font-semibold text-foreground">إنشاء الشحنات تلقائياً</span>
                <span className="block text-[11px] text-muted-foreground">
                  توليد بوليصة الشحن آلياً عند وصول الطلب للمرحلة المحددة أدناه
                </span>
              </label>
            </div>

            {formData.autoCreateShipments && (
              <div className="pt-2 border-t border-border dark:border-border space-y-1.5">
                <label htmlFor="modalShipmentTrigger" className="block text-xs font-semibold text-foreground dark:text-muted-foreground">
                  توقيت إنشاء بوليصة الشحن
                </label>
                <select
                  id="modalShipmentTrigger"
                  value={formData.shipmentCreateTrigger || 'ON_ORDER'}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (handleTriggerChange) {
                      handleTriggerChange(val);
                    } else {
                      setFormData((prev) => ({ ...prev, shipmentCreateTrigger: val }));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs border border-border rounded-lg bg-card text-foreground focus:ring-2 focus:ring-primary"
                >
                  <option value="ON_ORDER">عند إنشاء الطلب — إنشاء البوليصة فور تسجيل الطلب بالمتجر</option>
                  <option value="ON_CONFIRM">عند تأكيد الطلب — إنشاء البوليصة بعد مراجعة وتأكيد الطلب</option>
                  <option value="ON_READY">عند الجاهز للشحن — إنشاء البوليصة بعد اكتمال التجهيز</option>
                </select>
                <p className="text-[11px] text-muted-foreground">
                  {formData.shipmentCreateTrigger === 'ON_CONFIRM'
                    ? '⚡ يتم تأجيل البوليصة حتى يتحول الطلب إلى حالة "مؤكد" (CONFIRMED).'
                    : formData.shipmentCreateTrigger === 'ON_READY'
                    ? '📦 يتم تأجيل البوليصة حتى يدخل الطلب مرحلة "جاهز للشحن" (READY TO SHIP).'
                    : '🚀 يتم إرسال البوليصة فوراً بمجرد إنشاء الطلب لأول مرة بالمتجر.'}
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons & Test Connection */}
          <div className="pt-4 border-t border-border dark:border-border flex flex-wrap items-center justify-between gap-2">
            {editingCompany ? (
              <button
                type="button"
                onClick={() => handleTestConnection(editingCompany.id)}
                disabled={testingConnection}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-muted text-foreground hover:bg-muted transition"
              >
                <ArrowPathIcon className={`h-3.5 w-3.5 ${testingConnection ? "animate-spin" : ""}`} />
                <span>فحص واختبار الاتصال</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium text-foreground hover:bg-muted rounded-lg"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs sm:text-sm font-semibold text-white bg-primary hover:bg-primary/90 rounded-lg shadow-sm"
              >
                حفظ الإعدادات
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
