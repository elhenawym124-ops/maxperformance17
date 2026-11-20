import React from "react";
import {
  ComputerDesktopIcon,
  PlusCircleIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

interface GenerateReceiptModalProps {
  open: boolean;
  loadingData: boolean;
  employees: any[];
  assets: any[];
  selectedEmployee: string;
  selectedAsset: string;
  onSelectEmployee: (empId: string) => void;
  onSelectAsset: (assetId: string) => void;
  onClose: () => void;
  onGenerate: () => void;
}

export const GenerateReceiptModal: React.FC<GenerateReceiptModalProps> = ({
  open,
  loadingData,
  employees,
  assets,
  selectedEmployee,
  selectedAsset,
  onSelectEmployee,
  onSelectAsset,
  onClose,
  onGenerate,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border dark:border-border p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary dark:bg-primary/30 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                توليد نموذج استلام عهدة
              </h3>
              <p className="text-sm text-muted-foreground">
                اختر الموظف والأصل لإنشاء نموذج رسمي
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="إغلاق"
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <XMarkIcon className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Employee Selection */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">
              <UserGroupIcon className="h-5 w-5 inline-block ms-2 text-primary" />
              اختر الموظف
            </label>
            <select
              value={selectedEmployee}
              onChange={(e) => onSelectEmployee(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={loadingData}
            >
              <option value="">
                {loadingData ? "جاري التحميل..." : "-- اختر موظف --"}
              </option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName || ""} {emp.lastName || ""} -{" "}
                  {typeof emp.position === "object"
                    ? emp.position?.title
                    : emp.position || emp.jobTitle || ""}{" "}
                  ({emp.employeeId || emp.id})
                </option>
              ))}
            </select>
          </div>

          {/* Asset Selection */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-3">
              <ComputerDesktopIcon className="h-5 w-5 inline-block ms-2 text-primary" />
              اختر الأصل (العهدة)
            </label>
            <select
              value={selectedAsset}
              onChange={(e) => onSelectAsset(e.target.value)}
              className="w-full px-4 py-3 bg-card border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              disabled={loadingData}
            >
              <option value="">
                {loadingData ? "جاري التحميل..." : "-- اختر أصل --"}
              </option>
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name} - {asset.category?.name || "غير مصنف"} (
                  {asset.code})
                </option>
              ))}
            </select>
          </div>

          {/* Preview Info */}
          {selectedEmployee && selectedAsset && (
            <div className="p-4 bg-primary/10 dark:bg-primary/20 border border-primary dark:border-primary rounded-xl">
              <h4 className="font-bold text-primary dark:text-primary mb-2">
                معاينة النموذج
              </h4>
              <div className="text-sm text-primary dark:text-primary space-y-1">
                <p>
                  <strong>الموظف:</strong>{" "}
                  {(() => {
                    const emp = employees.find(
                      (e) => e.id === selectedEmployee,
                    );
                    return emp
                      ? `${emp.firstName || ""} ${emp.lastName || ""}`.trim()
                      : "غير محدد";
                  })()}
                </p>
                <p>
                  <strong>الأصل:</strong>{" "}
                  {assets.find((a) => a.id === selectedAsset)?.name ||
                    "غير محدد"}
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-muted dark:bg-muted border-t border-border dark:border-border p-6 flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-6 py-3 bg-card border border-border rounded-xl text-foreground hover:bg-muted dark:hover:bg-muted transition-all font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={onGenerate}
            disabled={!selectedEmployee || !selectedAsset}
            className="px-5 py-2.5 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors font-semibold shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <PlusCircleIcon className="h-5 w-5 inline-block ms-2" />
            توليد النموذج
          </button>
        </div>
      </div>
    </div>
  );
};
