import React from "react";
import { ProductAttribute } from "../../types";
import { XMarkIcon, PlusIcon, SwatchIcon } from "@heroicons/react/24/outline";

interface AttributesTabProps {
  attributeMode: "templates" | "custom";
  setAttributeMode: React.Dispatch<React.SetStateAction<"templates" | "custom">>;
  attributes: ProductAttribute[];
  setAttributes: React.Dispatch<React.SetStateAction<ProductAttribute[]>>;
  newAttributeName: string;
  setNewAttributeName: React.Dispatch<React.SetStateAction<string>>;
  newAttributeValuesList: string[];
  updateValueField: (index: number, value: string) => void;
  removeValueField: (index: number) => void;
  addValueField: () => void;
  addAttribute: () => void;
  removeAttribute: (id: string) => void;
  generateVariations: () => void;
  setActiveTab: (tab: string) => void;
  t: any;
}

export const AttributesTab: React.FC<AttributesTabProps> = ({
  attributeMode,
  setAttributeMode,
  attributes,
  setAttributes,
  newAttributeName,
  setNewAttributeName,
  newAttributeValuesList,
  updateValueField,
  removeValueField,
  addValueField,
  addAttribute,
  removeAttribute,
  generateVariations,
  setActiveTab,
  t,
}) => {
  const [editingAttrId, setEditingAttrId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editValues, setEditValues] = React.useState<string[]>([]);

  const handleValueKeyPress = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addValueField();
      // Use setTimeout to focus the next input after it renders
      setTimeout(() => {
        const inputs = document.querySelectorAll(".attribute-value-input");
        const nextInput = inputs[index + 1] as HTMLInputElement;
        if (nextInput) nextInput.focus();
      }, 0);
    }
  };

  const beginEdit = (attr: ProductAttribute) => {
    setEditingAttrId(attr.id);
    setEditName(attr.name);
    setEditValues(attr.values);
  };

  const cancelEdit = () => {
    setEditingAttrId(null);
    setEditName("");
    setEditValues([]);
  };

  const saveEdit = () => {
    const cleanedValues = editValues.map((v) => v.trim()).filter(Boolean);
    if (!editName.trim() || cleanedValues.length === 0) {
      return;
    }
    setAttributes((prev) =>
      prev.map((a) =>
        a.id === editingAttrId ? { ...a, name: editName.trim(), values: cleanedValues } : a
      )
    );
    cancelEdit();
  };

  const updateEditValue = (idx: number, value: string) => {
    setEditValues((prev) => prev.map((v, i) => (i === idx ? value : v)));
  };

  const addEditValue = () => setEditValues((prev) => [...prev, ""]);

  const removeEditValue = (idx: number) =>
    setEditValues((prev) => prev.filter((_, i) => i !== idx));

  return (
    <div className="bg-card shadow rounded-xl p-3.5 sm:p-6 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-medium text-foreground">
            {t("products.attributes.title")}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t("products.attributes.description")}
          </p>
        </div>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-4 mb-6">
        <button
          type="button"
          onClick={() => setAttributeMode("templates")}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            attributeMode === "templates"
              ? "border-indigo-500 bg-primary/10 dark:bg-primary/30 dark:border-primary"
              : "border-gray-200 dark:border-border hover:border-border"
          }`}
        >
          <div className="text-2xl mb-2">📦</div>
          <h4 className="font-medium text-foreground">
            {t("products.attributes.templates")}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t("products.attributes.templatesDesc")}
          </p>
        </button>
        <button
          type="button"
          onClick={() => setAttributeMode("custom")}
          className={`flex-1 p-4 rounded-lg border-2 transition-all ${
            attributeMode === "custom"
              ? "border-indigo-500 bg-primary/10 dark:bg-primary/30 dark:border-primary"
              : "border-gray-200 dark:border-border hover:border-border"
          }`}
        >
          <div className="text-2xl mb-2">✏️</div>
          <h4 className="font-medium text-foreground">
            {t("products.attributes.custom")}
          </h4>
          <p className="text-xs text-muted-foreground mt-1">
            {t("products.attributes.customDesc")}
          </p>
        </button>
      </div>

      {/* Templates Mode */}
      {attributeMode === "templates" && (
        <div className="space-y-4">
          <h4 className="font-medium text-foreground">
            {t("products.attributes.selectFromTemplates")}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              {
                icon: "🎨",
                name: t("products.attributes.templateColor"),
                slug: "color",
                values: ["أسود", "أبيض", "أحمر", "أزرق", "أخضر"],
              },
              {
                icon: "📏",
                name: t("products.attributes.templateSize"),
                slug: "size",
                values: ["S", "M", "L", "XL", "XXL"],
              },
              {
                icon: "👟",
                name: t("products.attributes.templateShoeSize"),
                slug: "shoe_size",
                values: ["38", "39", "40", "41", "42", "43", "44"],
              },
              {
                icon: "🧵",
                name: t("products.attributes.templateMaterial"),
                slug: "material",
                values: ["قطن", "بوليستر", "جلد", "كتان"],
              },
              {
                icon: "💍",
                name: t("products.attributes.templateMetalColor"),
                slug: "metal_color",
                values: ["ذهبي", "فضي", "روز جولد", "أسود"],
              },
              {
                icon: "💾",
                name: t("products.attributes.templateCapacity"),
                slug: "capacity",
                values: ["64GB", "128GB", "256GB", "512GB"],
              },
              {
                icon: "🧴",
                name: "حجم العبوة",
                slug: "volume",
                values: ["30ml", "50ml", "100ml", "150ml"],
              },
              {
                icon: "🌸",
                name: "الرائحة",
                slug: "scent",
                values: ["شرقي", "خشبي", "زهري", "فريش"],
              },
              {
                icon: "✨",
                name: "التركيز",
                slug: "concentration",
                values: ["EDT", "EDP", "Parfum"],
              },
              {
                icon: "📱",
                name: "الموديل",
                slug: "model",
                values: ["Standard", "Pro", "Max", "Ultra"],
              },
              {
                icon: "⚖️",
                name: t("products.attributes.templateWeight"),
                slug: "weight",
                values: ["250g", "500g", "1kg", "2kg"],
              },
              {
                icon: "📦",
                name: t("products.attributes.templatePack"),
                slug: "pack",
                values: ["قطعة", "3 قطع", "6 قطع", "12 قطعة"],
              },
            ].map((template) => {
              const isAdded = attributes.some((a) => a.slug === template.slug);
              return (
                <button
                  key={template.slug}
                  type="button"
                  onClick={() => {
                    if (!isAdded) {
                      const newAttr: ProductAttribute = {
                        id: `attr_${template.slug}_${Date.now()}`,
                        name: template.name,
                        slug: template.slug,
                        values: template.values,
                        visible: true,
                        forVariations: true,
                        requiredForOrder: true,
                      };
                      setAttributes((prev) => [...prev, newAttr]);
                    }
                  }}
                  disabled={isAdded}
                  className={`p-3 rounded-lg border-2 transition-all text-center ${
                    isAdded
                      ? "border-green-300 bg-success/10 dark:bg-success/30 dark:border-success cursor-default"
                      : "border-dashed border-border hover:border-primary dark:hover:border-primary hover:bg-primary/10 dark:hover:bg-primary/20"
                  }`}
                >
                  <span className="text-2xl">{template.icon}</span>
                  <p className="text-sm font-medium text-foreground mt-1">
                    {template.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {template.values.slice(0, 3).join("، ")}...
                  </p>
                  {isAdded && (
                    <span className="text-xs text-success dark:text-success mt-1 block">
                      ✓ مضاف
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Custom Mode */}
      {attributeMode === "custom" && (
        <div className="bg-gray-50 dark:bg-muted rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("products.attributes.attributeName")}
              </label>
              <input
                type="text"
                value={newAttributeName}
                onChange={(e) => setNewAttributeName(e.target.value)}
                placeholder="مثل: اللون، الحجم، النكهة"
                className="block w-full border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                {t("products.attributes.values")}{" "}
                <span className="text-muted-foreground/80 font-normal">
                  {t("products.attributes.valuesHint")}
                </span>
              </label>
              <div className="space-y-2">
                {newAttributeValuesList.map((value, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => updateValueField(index, e.target.value)}
                      onKeyDown={(e) => handleValueKeyPress(e, index)}
                      placeholder={index === 0 ? "القيمة الأولى" : "قيمة أخرى..."}
                      className="attribute-value-input flex-1 border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                    />
                    {newAttributeValuesList.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeValueField(index)}
                        className="px-2 text-destructive dark:text-destructive hover:text-destructive dark:hover:text-destructive"
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addValueField}
                  className="text-sm text-primary hover:text-primary dark:hover:text-primary flex items-center gap-1"
                >
                  <PlusIcon className="h-4 w-4" /> {t("products.attributes.addValue")}
                </button>
              </div>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={addAttribute}
              disabled={
                !newAttributeName.trim() ||
                !newAttributeValuesList.some((v) => v.trim())
              }
              className="px-4 py-2 bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary text-sm disabled:opacity-50 disabled:dark:opacity-50"
            >
              <PlusIcon className="h-4 w-4 inline ms-1" />{" "}
              {t("products.attributes.addAttribute")}
            </button>
          </div>
        </div>
      )}

      {/* Added Attributes List */}
      {attributes.length > 0 && (
        <div className="mt-6">
          <h4 className="font-medium text-foreground mb-3">
            {t("products.attributes.addedAttributes")} ({attributes.length}):
          </h4>
          <div className="space-y-2">
            {attributes.map((attr) => (
              <div
                key={attr.id}
                className="flex items-center justify-between bg-card border border-border rounded-lg p-3"
              >
                {editingAttrId === attr.id ? (
                  <div className="w-full space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                        placeholder={t("products.attributes.attributeName")}
                      />
                      <div className="md:col-span-2 space-y-2">
                        {editValues.map((val, i) => (
                          <div key={i} className="flex gap-2">
                            <input
                              value={val}
                              onChange={(e) => updateEditValue(i, e.target.value)}
                              className="flex-1 border-border dark:bg-muted dark:text-white rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
                              placeholder={t("products.attributes.values")}
                            />
                            {editValues.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeEditValue(i)}
                                className="text-red-500 dark:text-destructive hover:text-destructive dark:hover:text-destructive px-2"
                              >
                                <XMarkIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={addEditValue}
                          className="text-xs text-primary hover:text-primary dark:hover:text-primary"
                        >
                          + {t("products.attributes.addValue")}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={attr.forVariations}
                          onChange={(e) =>
                            setAttributes((prev) =>
                              prev.map((a) =>
                                a.id === attr.id
                                  ? {
                                      ...a,
                                      forVariations: e.target.checked,
                                      requiredForOrder: e.target.checked
                                        ? a.requiredForOrder !== false
                                        : false,
                                    }
                                  : a
                              )
                            )
                          }
                          className="h-4 w-4 text-primary dark:text-primary rounded"
                        />
                        {t("products.attributes.forVariations")}
                      </label>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={attr.forVariations && attr.requiredForOrder !== false}
                          disabled={!attr.forVariations}
                          onChange={(e) =>
                            setAttributes((prev) =>
                              prev.map((a) =>
                                a.id === attr.id
                                  ? { ...a, requiredForOrder: e.target.checked }
                                  : a
                              )
                            )
                          }
                          className="h-4 w-4 text-primary dark:text-primary rounded disabled:opacity-50"
                        />
                        يسأل عنه النظام عند إنشاء الأوردر
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={saveEdit}
                          disabled={!editName.trim() || !editValues.some((v) => v.trim())}
                          className="px-3 py-1 bg-primary text-white rounded-md text-sm disabled:opacity-50"
                        >
                          {t("common.save") ?? "حفظ"}
                        </button>
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="px-3 py-1 bg-muted dark:bg-muted text-foreground dark:text-muted-foreground rounded-md text-sm"
                        >
                          {t("common.cancel") ?? "إلغاء"}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      <span className="font-medium text-foreground dark:text-muted-foreground">
                        {attr.name}
                      </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {attr.values.map((val, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-primary dark:bg-primary/40 text-primary dark:text-primary rounded text-xs"
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={attr.forVariations}
                          onChange={(e) =>
                            setAttributes((prev) =>
                              prev.map((a) =>
                                a.id === attr.id
                                  ? {
                                      ...a,
                                      forVariations: e.target.checked,
                                      requiredForOrder: e.target.checked
                                        ? a.requiredForOrder !== false
                                        : false,
                                    }
                                  : a
                              )
                            )
                          }
                          className="h-4 w-4 text-primary dark:text-primary rounded"
                        />
                        {t("products.attributes.forVariations")}
                      </label>
                      <label className="flex items-center gap-1 text-xs text-muted-foreground">
                        <input
                          type="checkbox"
                          checked={attr.forVariations && attr.requiredForOrder !== false}
                          disabled={!attr.forVariations}
                          onChange={(e) =>
                            setAttributes((prev) =>
                              prev.map((a) =>
                                a.id === attr.id
                                  ? { ...a, requiredForOrder: e.target.checked }
                                  : a
                              )
                            )
                          }
                          className="h-4 w-4 text-primary dark:text-primary rounded disabled:opacity-50"
                        />
                        مطلوب للأوردر
                      </label>
                      <button
                        type="button"
                        onClick={() => beginEdit(attr)}
                        className="text-indigo-600 dark:text-primary hover:text-primary dark:hover:text-primary text-sm"
                      >
                        {t("common.edit") ?? "تعديل"}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeAttribute(attr.id)}
                        className="text-red-500 dark:text-destructive hover:text-destructive dark:hover:text-destructive p-1"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Variations Button */}
      {attributes.filter((a) => a.forVariations).length > 0 && (
        <div className="mt-6 flex items-center justify-between bg-success/10 dark:bg-success/20 border border-success dark:border-success rounded-lg p-4">
          <div>
            <p className="text-green-800 dark:text-success font-medium">
              🔄 {t("products.attributes.generateVariants")}{" "}
              {attributes
                .filter((a) => a.forVariations)
                .reduce((acc, attr) => acc * attr.values.length, 1)}
            </p>
            <p className="text-green-600 dark:text-success text-sm">
              من{" "}
              {attributes
                .filter((a) => a.forVariations)
                .map((a) => a.name)
                .join(" × ")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              generateVariations();
              setActiveTab("variants");
            }}
            className="px-4 py-2 bg-success text-white rounded-md hover:bg-success flex items-center gap-2"
          >
            {t("products.attributes.generateVariants")}
            <span className="transform rotate-180">→</span>
          </button>
        </div>
      )}

      {attributes.length === 0 && (
        <div className="mt-6 text-center py-8 text-muted-foreground bg-muted dark:bg-muted rounded-lg">
          <SwatchIcon className="h-12 w-12 mx-auto text-muted-foreground/80 mb-2" />
          <p>لم تضف أي صفات بعد</p>
          <p className="text-sm">اختر من القوالب الجاهزة أو أنشئ صفات مخصصة</p>
        </div>
      )}
    </div>
  );
};
