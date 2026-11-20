import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { Category, NewTemplatePayload, Project } from "./types";

interface CreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  newTemplate: NewTemplatePayload;
  setNewTemplate: React.Dispatch<React.SetStateAction<NewTemplatePayload>>;
  projects: Project[];
  categories: Category[];
  tagInput: string;
  setTagInput: (val: string) => void;
  addTag: (tags: string[], setTags: (tags: string[]) => void) => void;
  removeTag: (tag: string, tags: string[], setTags: (tags: string[]) => void) => void;
  onCreate: () => Promise<void>;
}

export const CreateTemplateModal: React.FC<CreateTemplateModalProps> = ({
  isOpen,
  onClose,
  newTemplate,
  setNewTemplate,
  projects,
  categories,
  tagInput,
  setTagInput,
  addTag,
  removeTag,
  onCreate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-muted bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border border-border dark:border-border w-full max-w-2xl shadow-lg rounded-md bg-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-foreground">
            إنشاء قالب جديد
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground/80 hover:text-foreground dark:hover:text-muted-foreground cursor-pointer"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                اسم القالب *
              </label>
              <input
                type="text"
                value={newTemplate.name}
                onChange={(e) =>
                  setNewTemplate({ ...newTemplate, name: e.target.value })
                }
                placeholder="مثال: مهمة مراجعة أسبوعية"
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                وصف القالب
              </label>
              <input
                type="text"
                value={newTemplate.description}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    description: e.target.value,
                  })
                }
                placeholder="وصف مختصر للقالب"
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2 border-t border-border dark:border-border pt-4">
              <h4 className="font-medium text-foreground mb-3">
                تفاصيل المهمة
              </h4>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                عنوان المهمة *
              </label>
              <input
                type="text"
                value={newTemplate.taskTitle}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    taskTitle: e.target.value,
                  })
                }
                placeholder="عنوان المهمة التي ستُنشأ"
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                وصف المهمة
              </label>
              <textarea
                value={newTemplate.taskDescription}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    taskDescription: e.target.value,
                  })
                }
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                الأولوية
              </label>
              <select
                value={newTemplate.priority}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    priority: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="low" className="bg-card text-foreground">
                  منخفض
                </option>
                <option value="medium" className="bg-card text-foreground">
                  متوسط
                </option>
                <option value="high" className="bg-card text-foreground">
                  عالي
                </option>
                <option value="urgent" className="bg-card text-foreground">
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
                value={newTemplate.estimatedHours}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    estimatedHours: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary tabular-nums"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                المشروع
              </label>
              <select
                value={newTemplate.projectId}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    projectId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="bg-card text-foreground">
                  بدون مشروع
                </option>
                {projects.map((project) => (
                  <option
                    key={project.id}
                    value={project.id}
                    className="bg-card text-foreground"
                  >
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                القسم
              </label>
              <select
                value={newTemplate.categoryId}
                onChange={(e) =>
                  setNewTemplate({
                    ...newTemplate,
                    categoryId: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary cursor-pointer"
                style={{ colorScheme: "dark" }}
              >
                <option value="" className="bg-card text-foreground">
                  بدون قسم
                </option>
                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                    className="bg-card text-foreground"
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-foreground mb-1">
                الوسوم
              </label>
              <div className="flex items-center space-x-2 space-x-reverse">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" &&
                    (e.preventDefault(),
                    addTag(newTemplate.tags, (tags) =>
                      setNewTemplate({ ...newTemplate, tags }),
                    ))
                  }
                  placeholder="أضف وسم واضغط Enter"
                  className="flex-1 px-3 py-2 border border-border rounded-md bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary dark:focus:ring-primary placeholder-muted dark:placeholder-muted"
                />
                <button
                  type="button"
                  onClick={() =>
                    addTag(newTemplate.tags, (tags) =>
                      setNewTemplate({ ...newTemplate, tags }),
                    )
                  }
                  className="px-3 py-2 bg-muted text-foreground rounded-md hover:bg-muted dark:hover:bg-muted transition-colors cursor-pointer"
                >
                  إضافة
                </button>
              </div>
              {newTemplate.tags && Array.isArray(newTemplate.tags) && newTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {newTemplate.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 bg-primary dark:bg-primary/50 text-primary dark:text-primary rounded text-sm"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          removeTag(tag, newTemplate.tags, (tags) =>
                            setNewTemplate({ ...newTemplate, tags }),
                          )
                        }
                        className="me-1 text-primary dark:text-primary hover:text-primary dark:hover:text-primary cursor-pointer"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
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
            onClick={() => void onCreate()}
            className="px-4 py-2 bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary transition-colors cursor-pointer"
          >
            إنشاء القالب
          </button>
        </div>
      </div>
    </div>
  );
};
