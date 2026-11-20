import { useState, useEffect, type FormEvent } from "react";
import { Plus, X } from "lucide-react";
import { MODAL_CONTENT_CLS, MODAL_INPUT_CLS } from "../../shared";
import type { StockInModalProps } from "../types/materialsTypes";
import { DateInput } from '../../../../components/ui/DateInput';

export function StockInModal({
  isOpen,
  material,
  onClose,
  onSubmit,
  suppliers,
  onOpenAddSupplier,
  isSubmitting,
}: StockInModalProps) {
  const [lotNumber, setLotNumber] = useState("");
  const [shade, setShade] = useState("");
  const [thickness, setThickness] = useState("14");
  const [units, setUnits] = useState("20");
  const [totalCost, setTotalCost] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [expiryDate, setExpiryDate] = useState("");

  useEffect(() => {
    if (material) {
      setShade(material.defaultShade || "");
      setUnits(String(material.standardCapacity || 20));
      setTotalCost(material.costPerItem ? String(material.costPerItem) : "");
      setSupplierId(material.supplierId || "");
    }
  }, [material]);

  if (!isOpen || !material) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!lotNumber.trim()) return;
    const supp = suppliers.find((s) => s.id === supplierId);
    await onSubmit({
      materialId: material.id,
      lotNumber: lotNumber.trim(),
      shade: shade.trim() || undefined,
      thicknessMm: Number(thickness) || undefined,
      initialUnits: Number(units) || undefined,
      totalCost: Number(totalCost) || undefined,
      supplierId: supplierId || undefined,
      supplierName: supp ? supp.name : undefined,
      expiryDate: expiryDate || undefined,
    });
    setLotNumber("");
    setShade("");
    setTotalCost("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
      <div className={MODAL_CONTENT_CLS}>
        <div className="flex items-center justify-between pb-3 border-b border-border dark:border-border mb-4">
          <div>
            <h3 className="text-base font-bold text-foreground">
              توريد قرص / باتش جديد
            </h3>
            <p className="text-xs text-info font-semibold mt-0.5">
              الخامة: {material.name}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-foreground dark:hover:text-muted-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-semibold mb-1 text-foreground">
              رقم التشغيلة (Lot Number) *{" "}
              <span className="text-[11px] text-muted-foreground font-normal">
                (مطلوب لشهادة الضمان)
              </span>
            </label>
            <input
              type="text"
              required
              value={lotNumber}
              onChange={(e) => setLotNumber(e.target.value)}
              placeholder="e.g. LOT-2026-X198"
              className={`${MODAL_INPUT_CLS} font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                درجة اللون (Shade)
              </label>
              <input
                type="text"
                value={shade}
                onChange={(e) => setShade(e.target.value)}
                placeholder="A1, A2, A3, Bleach..."
                className={MODAL_INPUT_CLS}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                السماكة (mm)
              </label>
              <select
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
                className={`${MODAL_INPUT_CLS} font-mono tabular-nums`}
              >
                <option value="10">10 mm</option>
                <option value="12">12 mm</option>
                <option value="14">14 mm</option>
                <option value="16">16 mm</option>
                <option value="18">18 mm</option>
                <option value="20">20 mm</option>
                <option value="25">25 mm</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                عدد الوحدات القابلة للتفريز
              </label>
              <input
                type="number"
                min="1"
                required
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                className={`${MODAL_INPUT_CLS} font-mono tabular-nums`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                إجمالي تكلفة الشراء (ج.م)
              </label>
              <input
                type="number"
                step="0.1"
                value={totalCost}
                onChange={(e) => setTotalCost(e.target.value)}
                placeholder="مثال: 3400"
                className={`${MODAL_INPUT_CLS} font-mono tabular-nums`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-foreground">
                  شركة التوريد (المورد)
                </label>
                <button
                  type="button"
                  onClick={onOpenAddSupplier}
                  className="text-xs text-info dark:text-info font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>مورد جديد</span>
                </button>
              </div>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={MODAL_INPUT_CLS}
              >
                <option value="">-- اختر المورد --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.phone ? `(${s.phone})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold mb-1 text-foreground">
                تاريخ انتهاء الصلاحية
              </label>
              <DateInput
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className={`${MODAL_INPUT_CLS} font-mono`}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border dark:border-border mt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border text-foreground font-semibold cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-info hover:bg-info text-white font-bold disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? "جاري التوريد..." : "تسجيل وارد المخزن"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StockInModal;
