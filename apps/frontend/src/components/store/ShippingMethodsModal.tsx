import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import {
  ShippingMethod,
  ShippingZone,
  storeSettingsService,
} from "../../services/storeSettingsService";
import {
  DEFAULT_SHIPPING_CLASSES,
  ShippingClassOption,
  buildDefaultClassFees,
  ensureShippingClassesForKeys,
  normalizeFeesMap,
} from "../../constants/shippingClasses";

const METHOD_TYPES = [
  { value: "flat_rate", label: "سعر ثابت" },
  { value: "free_shipping", label: "شحن مجاني" },
  { value: "local_pickup", label: "استلام من الفرع" },
];

type ShippingClassMode = "max" | "per_item";

interface ShippingMethodSettings {
  cost?: number | string | null;
  shippingClassMode?: ShippingClassMode | string | null;
  classMode?: ShippingClassMode | string | null;
  shipping_class_mode?: ShippingClassMode | string | null;
  shippingClassFees?: Record<string, number> | string | null;
  classFees?: Record<string, number> | string | null;
  shipping_class_fees?: Record<string, number> | string | null;
  [key: string]: unknown;
}

interface MethodFormState {
  title: string;
  type: string;
  isEnabled: boolean;
  sortOrder: number;
  cost: number;
  shippingClassMode: ShippingClassMode;
  shippingClassFees: Record<string, number>;
  useCustomClassFees: boolean;
}

const safeJsonParse = <T,>(value: unknown, fallback: T): T => {
  if (value === null || value === undefined) return fallback;
  if (typeof value !== "string") return value as T;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

const normalizeMethodFees = (
  value: ShippingMethodSettings["shippingClassFees"],
): Record<string, number> =>
  normalizeFeesMap(safeJsonParse<Record<string, unknown>>(value ?? {}, {}));

interface ShippingMethodsModalProps {
  zone: ShippingZone;
  shippingClasses?: ShippingClassOption[];
  onClose: () => void;
}

export const ShippingMethodsModal: React.FC<ShippingMethodsModalProps> = ({
  zone,
  shippingClasses,
  onClose,
}) => {
  const { t } = useTranslation();
  const baseShippingClasses = useMemo(
    () =>
      shippingClasses && shippingClasses.length > 0
        ? shippingClasses
        : DEFAULT_SHIPPING_CLASSES,
    [shippingClasses],
  );
  const baseFeesTemplate = useMemo(
    () => buildDefaultClassFees(baseShippingClasses),
    [baseShippingClasses],
  );

  const buildEmptyForm = useCallback(
    (): MethodFormState => ({
      title: "",
      type: "flat_rate",
      isEnabled: true,
      sortOrder: 0,
      cost: 0,
      shippingClassMode: "max",
      shippingClassFees: { ...baseFeesTemplate },
      useCustomClassFees: false,
    }),
    [baseFeesTemplate],
  );

  const buildFormFromMethod = useCallback(
    (method: ShippingMethod): MethodFormState => {
      const settings = safeJsonParse<ShippingMethodSettings>(method.settings, {});
      const fees = normalizeMethodFees(
        settings.shippingClassFees ||
          settings.classFees ||
          settings.shipping_class_fees ||
          {},
      );
      const mode =
        settings.shippingClassMode ||
        settings.classMode ||
        settings.shipping_class_mode ||
        "max";

      return {
        title: method.title || "",
        type: method.type || "flat_rate",
        isEnabled: method.isEnabled !== false,
        sortOrder: Number(method.sortOrder) || 0,
        cost: Number(settings.cost) || 0,
        shippingClassMode: mode === "per_item" ? "per_item" : "max",
        shippingClassFees: { ...baseFeesTemplate, ...fees },
        useCustomClassFees:
          Object.keys(fees).length > 0 ||
          Boolean(settings.shippingClassMode || settings.classMode),
      };
    },
    [baseFeesTemplate],
  );

  const [methods, setMethods] = useState<ShippingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<ShippingMethod | null>(
    null,
  );
  const [formState, setFormState] = useState<MethodFormState>(buildEmptyForm);

  useEffect(() => {
    setFormState((prev) => ({
      ...prev,
      shippingClassFees: {
        ...baseFeesTemplate,
        ...normalizeFeesMap(prev.shippingClassFees),
      },
    }));
  }, [baseFeesTemplate]);

  const methodTypeLabel = useMemo(() => {
    const map: Record<string, string> = {
      flat_rate: t("storeShipping.flatShippingPrice"),
      free_shipping: t("storeShipping.freeShippingMethod"),
      local_pickup: t("storeShipping.pickupFromBranch"),
    };
    return (type: string) => map[type] || type;
  }, [t]);

  const loadMethods = useCallback(async () => {
    try {
      setLoading(true);
      const response = await storeSettingsService.getShippingMethods(zone.id);
      setMethods(response.data.data || []);
    } catch (error) {
      console.error("Error fetching shipping methods:", error);
      toast.error(t("storeShipping.methodSaveFailed"));
    } finally {
      setLoading(false);
    }
  }, [zone.id, t]);

  useEffect(() => {
    loadMethods();
  }, [loadMethods]);

  const openNewForm = () => {
    setEditingMethod(null);
    setFormState(buildEmptyForm());
    setShowForm(true);
  };

  const openEditForm = (method: ShippingMethod) => {
    setEditingMethod(method);
    setFormState(buildFormFromMethod(method));
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setEditingMethod(null);
    setFormState(buildEmptyForm());
    setShowForm(false);
  };

  const handleSave = async () => {
    if (!formState.title.trim()) {
      toast.error(t("storeShipping.nameRequired"));
      return;
    }

    try {
      setSaving(true);
      const settings: ShippingMethodSettings = {
        cost:
          formState.type === "free_shipping"
            ? 0
            : Number(formState.cost) || 0,
      };

      if (formState.useCustomClassFees) {
        settings.shippingClassMode = formState.shippingClassMode;
        settings.shippingClassFees = formState.shippingClassFees;
      }

      const payload = {
        title: formState.title.trim(),
        type: formState.type,
        isEnabled: formState.isEnabled,
        sortOrder: Number(formState.sortOrder) || 0,
        settings,
      };

      if (editingMethod) {
        await storeSettingsService.updateShippingMethod(
          editingMethod.id,
          payload,
        );
        toast.success(t("storeShipping.methodUpdated"));
      } else {
        await storeSettingsService.createShippingMethod(zone.id, payload);
        toast.success(t("storeShipping.methodAdded"));
      }

      await loadMethods();
      handleCloseForm();
    } catch (error) {
      console.error("Error saving shipping method:", error);
      toast.error(t("storeShipping.methodSaveFailed"));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (methodId: string) => {
    if (!confirm(t("storeShipping.methodDeleteConfirm"))) return;

    try {
      await storeSettingsService.deleteShippingMethod(methodId);
      toast.success(t("storeShipping.methodDeleted"));
      await loadMethods();
    } catch (error) {
      console.error("Error deleting shipping method:", error);
      toast.error(t("storeShipping.methodDeleteFailed"));
    }
  };

  const shippingClassOptions = useMemo(
    () =>
      ensureShippingClassesForKeys(
        baseShippingClasses,
        Object.keys(formState.shippingClassFees || {}),
      ),
    [baseShippingClasses, formState.shippingClassFees],
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden border border-transparent dark:border-border shadow-2xl flex flex-col">
        <div className="p-6 border-b border-border dark:border-border flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {t("storeShipping.shippingMethodsTitle")} - {zone.name}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {t("storeShipping.noMethodsDesc")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-foreground">
              {t("storeShipping.shippingMethodsTitle")}
            </h3>
            <button
              onClick={openNewForm}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary flex items-center gap-2"
            >
              <PlusIcon className="h-5 w-5" />
              {t("storeShipping.addMethod")}
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
            </div>
          ) : methods.length === 0 ? (
            <div className="p-6 bg-muted dark:bg-muted rounded-lg text-center text-muted-foreground">
              {t("storeShipping.noMethods")}
            </div>
          ) : (
            <div className="space-y-3">
              {methods.map((method) => {
                const settings = safeJsonParse<ShippingMethodSettings>(
                  method.settings,
                  {},
                );
                const cost = Number(settings.cost) || 0;
                return (
                  <div
                    key={method.id}
                    className="p-4 border border-border dark:border-border rounded-lg bg-white dark:bg-muted flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold text-foreground">
                          {method.title}
                        </span>
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${method.isEnabled
                            ? "bg-green-100 text-success dark:bg-success/30 dark:text-success"
                            : "bg-gray-200 text-foreground dark:bg-muted dark:text-muted-foreground"
                            }`}
                        >
                          {method.isEnabled ? t("storeShipping.enabled") : t("storeShipping.disabled")}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {methodTypeLabel(method.type)} • ترتيب{" "}
                        {method.sortOrder || 0}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">
                          {t("storeShipping.methodCost")}
                        </div>
                        <div className="text-lg font-semibold text-primary">
                          {cost} ج.م
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditForm(method)}
                          className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted flex items-center gap-1"
                        >
                          <PencilIcon className="h-4 w-4" />
                          {t("storeShipping.edit")}
                        </button>
                        <button
                          onClick={() => handleDelete(method.id)}
                          className="px-3 py-2 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive rounded-md hover:bg-destructive dark:hover:bg-destructive/30 flex items-center gap-1"
                        >
                          <TrashIcon className="h-4 w-4" />
                          {t("storeShipping.delete")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {showForm && (
            <div className="p-6 border border-primary dark:border-primary rounded-lg bg-primary/60 dark:bg-primary/10 space-y-5">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-semibold text-foreground">
                  {editingMethod ? t("storeShipping.methodUpdated") : t("storeShipping.methodAdded")}
                </h4>
                <button
                  onClick={handleCloseForm}
                  className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("storeShipping.methodName")}
                  </label>
                  <input
                    type="text"
                    value={formState.title}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder="مثال: شحن سريع"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("storeShipping.methodType")}
                  </label>
                  <select
                    value={formState.type}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        type: e.target.value,
                        cost:
                          e.target.value === "free_shipping" ? 0 : prev.cost,
                      }))
                    }
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    {METHOD_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t("storeShipping." + (type.value === "flat_rate" ? "flatShippingPrice" : type.value === "free_shipping" ? "freeShippingMethod" : "pickupFromBranch"))}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    {t("storeShipping.methodCost")}
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formState.cost}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        cost: Number(e.target.value) || 0,
                      }))
                    }
                    disabled={formState.type === "free_shipping"}
                    className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary disabled:bg-muted dark:disabled:bg-muted"
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-foreground mb-1">
                      الترتيب
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formState.sortOrder}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          sortOrder: Number(e.target.value) || 0,
                        }))
                      }
                      className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2 mt-6">
                    <input
                      type="checkbox"
                      checked={formState.isEnabled}
                      onChange={(e) =>
                        setFormState((prev) => ({
                          ...prev,
                          isEnabled: e.target.checked,
                        }))
                      }
                      className="h-5 w-5 text-primary focus:ring-primary border-border rounded bg-card"
                    />
                    <span className="text-sm text-foreground">
                      {t("storeShipping.enabled")}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-card rounded-lg border border-border dark:border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-foreground">
                      تخصيص رسوم فئات الشحن لهذه الطريقة
                    </h5>
                    <p className="text-xs text-muted-foreground mt-1">
                      عند التعطيل سيتم استخدام رسوم الشركة الافتراضية.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={formState.useCustomClassFees}
                    onChange={(e) =>
                      setFormState((prev) => ({
                        ...prev,
                        useCustomClassFees: e.target.checked,
                      }))
                    }
                    className="h-5 w-5 text-primary focus:ring-primary border-border rounded bg-card"
                  />
                </div>

                {formState.useCustomClassFees && (
                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1">
                        طريقة الحساب
                      </label>
                      <select
                        value={formState.shippingClassMode}
                        onChange={(e) =>
                          setFormState((prev) => ({
                            ...prev,
                            shippingClassMode:
                              e.target.value === "per_item"
                                ? "per_item"
                                : "max",
                          }))
                        }
                        className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                      >
                        <option value="max">أعلى قيمة داخل الطلب</option>
                        <option value="per_item">لكل قطعة</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {shippingClassOptions.map((option) => (
                        <div key={option.key}>
                          <label className="block text-sm font-medium text-foreground mb-1">
                            {option.label}
                          </label>
                          <input
                            type="number"
                            min={0}
                            value={formState.shippingClassFees[option.key] ?? 0}
                            onChange={(e) =>
                              setFormState((prev) => ({
                                ...prev,
                                shippingClassFees: {
                                  ...prev.shippingClassFees,
                                  [option.key]: Number(e.target.value) || 0,
                                },
                              }))
                            }
                            className="w-full px-3 py-2 bg-card border border-border text-foreground rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3">
                <button
                  onClick={handleCloseForm}
                  className="px-4 py-2 rounded-md bg-muted text-foreground hover:bg-muted dark:hover:bg-muted"
                >
                  {t("storeShipping.cancel")}
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={`px-4 py-2 rounded-md text-white ${saving
                    ? "bg-gray-400 dark:bg-muted"
                    : "bg-primary hover:bg-primary/90"
                    }`}
                >
                  {saving ? t("storeShipping.save") : t("storeShipping.save")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
