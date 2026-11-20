import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { TaskTemplate } from "./types";

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingTemplate: TaskTemplate | null;
  setEditingTemplate: React.Dispatch<React.SetStateAction<TaskTemplate | null>>;
  onUpdate: () => Promise<void>;
}

export const EditTemplateModal: React.FC<EditTemplateModalProps> = ({
  isOpen,
  onClose,
  editingTemplate,
  setEditingTemplate,
  onUpdate,
}) => {
  if (!isOpen || !editingTemplate) return null;

  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-border dark:border-border w-full max-w-2xl shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">
            تعديل القالب
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground/80 hover:text-foreground dark:hover:text-muted-foreground cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pe-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                اسم القالب *
              </label>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    name: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                وصف القالب
              </label>
              <input
                type="text"
                value={editingTemplate.description || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    description: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                عنوان المهمة *
              </label>
              <input
                type="text"
                value={editingTemplate.taskTitle}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    taskTitle: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                وصف المهمة
              </label>
              <textarea
                value={editingTemplate.taskDescription || ""}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    taskDescription: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                الأولوية
              </label>
              <select
                value={editingTemplate.priority}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    priority: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary"
                style={{ colorScheme: "dark" }}
              >
                <option
                  value="low"
                  className="bg-card text-foreground"
                >
                  منخفض
                </option>
                <option
                  value="medium"
                  className="bg-card text-foreground"
                >
                  متوسط
                </option>
                <option
                  value="high"
                  className="bg-card text-foreground"
                >
                  عالي
                </option>
                <option
                  value="urgent"
                  className="bg-card text-foreground"
                >
                  عاجل
                </option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                الساعات المقدرة
              </label>
              <input
                type="number"
                min="0"
                value={editingTemplate.estimatedHours || 0}
                onChange={(e) =>
                  setEditingTemplate({
                    ...editingTemplate,
                    estimatedHours: parseInt(e.target.value) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary tabular-nums"
              />
            </div>
          </div>
        </div>

        <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted transition-colors cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={onUpdate}
            className="px-4 py-2 bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary transition-colors cursor-pointer"
          >
            حفظ التغييرات
          </button>
        </div>
      </div>
    </div>
  );
};
