import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { createPortal } from "react-dom";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { companyAwareApi } from "../../../services/companyAwareApi";
import { DateInput } from '../../../components/ui/DateInput';

interface AssetAssignmentModalProps {
  asset: any;
  type: "assign" | "return";
  onClose: () => void;
  onSuccess: () => void;
  usePortal?: boolean;
}

const AssetAssignmentModal: React.FC<AssetAssignmentModalProps> = ({
  asset,
  type,
  onClose,
  onSuccess,
  usePortal = true,
}) => {
  const [formData, setFormData] = useState({
    employeeId: "",
    assignedAt: new Date().toISOString().split("T")[0],
    returnedAt: new Date().toISOString().split("T")[0],
    returnCondition: asset.condition || "GOOD",
    notes: "",
  });

  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState("");

  // قفل سكرول الصفحة أثناء فتح المودال
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    if (type === "assign") {
      fetchEmployees();
    }
  }, [type]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      // Need an endpoint to fetch active employees
      // Using existing /hr/employees endpoint
      const response = await companyAwareApi.get("/hr/employees");
      if (response.data.success) {
        // Backend returns strictly { employees: [], pagination: {} }
        setEmployees(response.data.employees || response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      if (type === "assign") {
        await companyAwareApi.post("/hr/assets/assign", {
          assetId: asset.id,
          employeeId: formData.employeeId,
          assignedAt: formData.assignedAt,
          notes: formData.notes,
        });
      } else {
        await companyAwareApi.post("/hr/assets/return", {
          assetId: asset.id,
          returnedAt: formData.returnedAt,
          returnCondition: formData.returnCondition,
          notes: formData.notes,
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || "حدث خطأ أثناء تنفيذ العملية");
    } finally {
      setLoading(false);
    }
  };

  const modal = (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center px-4 py-8 sm:py-12 bg-black/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-2xl bg-card text-right rounded-[2rem] shadow-2xl border border-border dark:border-border overflow-hidden transform transition-all">
        <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-primary to-primary" />
        <div className="flex items-center justify-between px-8 py-6 border-b border-border dark:border-border bg-muted dark:bg-muted backdrop-blur-xl">
          <div>
            <p className="text-[10px] font-semibold text-primary dark:text-primary mb-1">
              {type === "assign" ? "نموذج تسليم عهدة" : "نموذج استرجاع عهدة"}
            </p>
            <h3 className="text-2xl font-black text-foreground">
              {asset?.name || "الأصل"}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2.5 text-muted-foreground hover:text-foreground dark:hover:text-white hover:bg-muted transition-all shadow-sm"
            aria-label="إغلاق النموذج"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="px-8 py-8 space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive dark:border-destructive/50 bg-destructive/10 dark:bg-destructive/20 text-destructive dark:text-destructive px-5 py-4 text-sm font-bold flex items-center gap-3"
            >
              <span className="text-lg">⚠️</span>
              {error}
            </motion.div>
          )}

          {type === "assign" && (
            <div className="rounded-xl bg-warning/10 dark:bg-warning/20 border border-warning dark:border-warning/50 text-warning dark:text-warning px-5 py-4 text-xs font-medium flex items-start gap-3">
              <span className="text-lg">💡</span>
              <span>
                لم يتم العثور على موظفين؟ تأكد من إضافة الموظفين في نظام الموارد البشرية أولاً.
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-black text-foreground me-1">
                  الموظف {type === "assign" && <span className="text-red-500">*</span>}
                </label>
                {type === "assign" ? (
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) =>
                      setFormData({ ...formData, employeeId: e.target.value })
                    }
                    className="w-full rounded-xl border-2 border-border dark:border-border bg-card text-foreground px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                    disabled={loadingEmployees}
                  >
                    <option value="">
                      {loadingEmployees ? "جاري التحميل..." : "اختر الموظف"}
                    </option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.employeeNumber || "بدون رقم"})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="rounded-xl border-2 border-border dark:border-border bg-muted dark:bg-muted text-foreground px-4 py-3 text-sm font-bold">
                    عهدة لدى: {asset?.currentHolder?.firstName}{" "}
                    {asset?.currentHolder?.lastName}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-black text-foreground me-1">
                  {type === "assign" ? "تاريخ التسليم" : "تاريخ الاسترجاع"}
                </label>
                <DateInput
                  required
                  className="block w-full border-2 border-border dark:border-border rounded-xl shadow-sm py-3 px-4 bg-card text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                  value={type === "assign" ? formData.assignedAt : formData.returnedAt}
                  onChange={(e) =>
                    type === "assign"
                      ? setFormData({ ...formData, assignedAt: e.target.value })
                      : setFormData({ ...formData, returnedAt: e.target.value })
                  }
                />
              </div>
            </div>

            {type === "return" && (
              <div className="space-y-2">
                <label className="block text-sm font-black text-foreground me-1">
                  حالة الأصل عند الاسترجاع
                </label>
                <select
                  className="w-full rounded-xl border-2 border-border dark:border-border bg-card text-foreground px-4 py-3 focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium"
                  value={formData.returnCondition}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      returnCondition: e.target.value,
                    })
                  }
                >
                  <option value="NEW">جديد</option>
                  <option value="GOOD">جيد</option>
                  <option value="FAIR">مقبول</option>
                  <option value="POOR">سيء</option>
                  <option value="DAMAGED">تالف</option>
                </select>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-black text-foreground me-1">
                ملاحظات
              </label>
              <textarea
                className="block w-full border-2 border-border dark:border-border rounded-xl shadow-sm py-3 px-4 bg-card text-foreground focus:outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all font-medium min-h-[110px] resize-none"
                placeholder="أضف ملاحظاتك هنا..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
              />
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-border dark:border-border">
              <button
                type="button"
                onClick={onClose}
                className="w-full sm:w-auto px-8 py-3.5 bg-muted dark:bg-muted text-muted-foreground hover:text-foreground dark:hover:text-white rounded-xl font-black text-sm border-2 border-border dark:border-border hover:bg-muted transition-all shadow-sm"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto inline-flex justify-center items-center px-10 py-3.5 rounded-xl text-white font-black text-sm transition-all shadow-lg active:scale-95 ${
                  type === "assign"
                    ? "bg-gradient-to-r from-primary to-primary shadow-primary/20 hover:shadow-primary/40"
                    : "bg-gradient-to-r from-warning to-warning shadow-warning/20 hover:shadow-warning/40"
                } disabled:opacity-50`}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                    جاري الحفظ...
                  </div>
                ) : type === "assign" ? (
                  "تأكيد التسليم"
                ) : (
                  "تأكيد الاسترجاع"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );

  if (usePortal && typeof document !== "undefined") {
    return createPortal(modal, document.body);
  }

  return modal;
};

export default AssetAssignmentModal;
