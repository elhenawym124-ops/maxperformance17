import React from "react";
import { CreateDeductionForm, DEDUCTION_TYPES } from "./types";
import { DateInput } from '../../../components/ui/DateInput';

interface DeductionCreateModalProps {
  open: boolean;
  isEditing: boolean;
  createForm: CreateDeductionForm;
  setCreateForm: React.Dispatch<React.SetStateAction<CreateDeductionForm>>;
  employees: any[];
  onClose: () => void;
  onSubmit: () => void;
}

export const DeductionCreateModal: React.FC<DeductionCreateModalProps> = ({
  open,
  isEditing,
  createForm,
  setCreateForm,
  employees,
  onClose,
  onSubmit,
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 dark:bg-muted dark:bg-opacity-75 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border border-border dark:border-border w-full max-w-2xl shadow-lg rounded-md bg-card">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-foreground mb-4">
            {isEditing ? "تعديل الخصم" : "إضافة خصم جديد"}
          </h3>

          <div className="space-y-4 max-h-[75vh] overflow-y-auto pe-2 custom-scrollbar">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  الموظف *
                </label>
                <select
                  value={createForm.employeeId}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      employeeId: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  required
                >
                  <option value="">اختر موظف</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.employeeNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  النوع *
                </label>
                <select
                  value={createForm.type}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, type: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                >
                  {Object.entries(DEDUCTION_TYPES).map(([key, value]) => (
                    <option key={key} value={key}>
                      {value}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  المبلغ *
                </label>
                <input
                  type="number"
                  value={createForm.amount}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, amount: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  التصنيف الفرعي
                </label>
                <input
                  type="text"
                  value={createForm.category}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      category: e.target.value,
                    })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  placeholder="مثال: مخالفة مرورية"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  التاريخ
                </label>
                <DateInput
                  value={createForm.date}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, date: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  الشهر الفعلي *
                </label>
                <select
                  value={createForm.effectiveMonth}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      effectiveMonth: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  السنة الفعلية *
                </label>
                <select
                  value={createForm.effectiveYear}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      effectiveYear: parseInt(e.target.value),
                    })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                >
                  {Array.from(
                    { length: 3 },
                    (_, i) => new Date().getFullYear() + i,
                  ).map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  السبب *
                </label>
                <input
                  type="text"
                  value={createForm.reason}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, reason: e.target.value })
                  }
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  placeholder="سبب الخصم"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  الوصف
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      description: e.target.value,
                    })
                  }
                  rows={3}
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  placeholder="تفاصيل إضافية..."
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  ملاحظات
                </label>
                <textarea
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  rows={2}
                  className="w-full border border-border rounded-md px-3 py-2 bg-card text-foreground"
                  placeholder="ملاحظات داخلية..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2 space-x-reverse mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-muted dark:bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted"
            >
              إلغاء
            </button>
            <button
              onClick={onSubmit}
              disabled={
                !createForm.employeeId ||
                !createForm.amount ||
                !createForm.reason
              }
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50"
            >
              {isEditing ? "تحديث" : "إنشاء"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
