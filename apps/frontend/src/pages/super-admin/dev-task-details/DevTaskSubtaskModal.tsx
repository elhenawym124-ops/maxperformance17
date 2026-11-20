import React from "react";
import {
  ClipboardDocumentListIcon,
  XMarkIcon,
  BriefcaseIcon,
  UserGroupIcon,
  CheckIcon,
  DocumentDuplicateIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import type { SubtaskFormData } from "./types";

export interface DevTaskSubtaskModalProps {
  showSubtaskModal: boolean;
  setShowSubtaskModal: (show: boolean) => void;
  subtaskForm: SubtaskFormData;
  setSubtaskForm: React.Dispatch<React.SetStateAction<SubtaskFormData>>;
  handleCreateSubtask: (e: React.FormEvent) => void;
  handleDepartmentChange: (dept: string) => void;
  teamMembers: any[];
}

export const DevTaskSubtaskModal: React.FC<DevTaskSubtaskModalProps> = ({
  showSubtaskModal,
  setShowSubtaskModal,
  subtaskForm,
  setSubtaskForm,
  handleCreateSubtask,
  handleDepartmentChange,
  teamMembers,
}) => {
  if (!showSubtaskModal) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center overflow-y-auto p-4">
      <div className="bg-card rounded-xl w-full max-w-lg shadow-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-border dark:border-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 dark:bg-primary/30 rounded-lg">
              <ClipboardDocumentListIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">
                إنشاء مهمة فرعية جديدة
              </h3>
              <p className="text-sm text-muted-foreground">
                أضف تفاصيل المهمة والمسؤول عنها
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowSubtaskModal(false)}
            className="p-2 hover:bg-muted rounded-full"
          >
            <XMarkIcon className="h-6 w-6 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleCreateSubtask} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <SparklesIcon className="h-4 w-4" /> عنوان المهمة
            </label>
            <input
              type="text"
              required
              value={subtaskForm.title}
              onChange={(e) =>
                setSubtaskForm({ ...subtaskForm, title: e.target.value })
              }
              placeholder="مثال: إصلاح خطأ في واجهة المستخدم"
              className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:text-white transition-all text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
              <DocumentDuplicateIcon className="h-4 w-4" /> الوصف
            </label>
            <textarea
              value={subtaskForm.description}
              onChange={(e) =>
                setSubtaskForm({
                  ...subtaskForm,
                  description: e.target.value,
                })
              }
              placeholder="اشرح تفاصيل المهمة هنا..."
              rows={3}
              className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary dark:text-white transition-all text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                <BriefcaseIcon className="h-4 w-4" /> القسم المعني
              </label>
              <select
                value={subtaskForm.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary dark:border-primary dark:text-white transition-all text-sm"
              >
                <option value="">-- اختر القسم --</option>
                {Array.from(
                  new Set(
                    teamMembers
                      .filter((m) => m.department)
                      .map((m) => m.department)
                  )
                ).map((dept: any) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5 flex items-center gap-2">
                <UserGroupIcon className="h-4 w-4" /> المسؤول
              </label>
              <select
                value={subtaskForm.assigneeId}
                onChange={(e) =>
                  setSubtaskForm({
                    ...subtaskForm,
                    assigneeId: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary dark:border-primary dark:text-white transition-all text-sm"
              >
                <option value="">-- اختر المسؤول --</option>
                {teamMembers
                  .filter(
                    (m) =>
                      !subtaskForm.department ||
                      m.department === subtaskForm.department
                  )
                  .map((member) => (
                    <option
                      key={member.userId || member.id}
                      value={member.userId || member.id}
                    >
                      {member.name}{" "}
                      {member.availability !== "available" ? "(مشغول)" : ""}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                النوع
              </label>
              <select
                value={subtaskForm.type}
                onChange={(e) =>
                  setSubtaskForm({ ...subtaskForm, type: e.target.value })
                }
                className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary dark:border-primary dark:text-white transition-all text-sm"
              >
                <option value="FEATURE">ميزة</option>
                <option value="BUG">خطأ برمجى</option>
                <option value="ENHANCEMENT">تحسين</option>
                <option value="REFACTOR">إعادة هيكلة</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-1.5">
                الأولوية
              </label>
              <select
                value={subtaskForm.priority}
                onChange={(e) =>
                  setSubtaskForm({
                    ...subtaskForm,
                    priority: e.target.value,
                  })
                }
                className="w-full px-4 py-2.5 bg-muted dark:bg-muted border border-border dark:border-border rounded-xl focus:ring-2 focus:ring-primary dark:border-primary dark:text-white transition-all text-sm"
              >
                <option value="LOW">منخفضة</option>
                <option value="MEDIUM">متوسطة</option>
                <option value="HIGH">عالية</option>
                <option value="CRITICAL">حرجة</option>
              </select>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6 pt-4 border-t border-border dark:border-border">
            <button
              type="button"
              onClick={() => setShowSubtaskModal(false)}
              className="px-5 py-2.5 border border-border rounded-xl text-foreground hover:bg-muted/50 font-medium transition-all"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-white rounded-xl font-bold shadow-lg shadow-primary dark:shadow-none transition-all flex items-center gap-2"
            >
              إنشاء المهمة <CheckIcon className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
