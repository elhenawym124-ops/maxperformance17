import React from "react";

export interface ActiveFiltersDisplayProps {
  filters: any;
  setFilters: (filters: any) => void;
  projects: any[];
  categories: any[];
  users: any[];
  formatDate: (date: string) => string;
}

export const ActiveFiltersDisplay: React.FC<ActiveFiltersDisplayProps> = ({
  filters,
  setFilters,
  projects,
  categories,
  users,
  formatDate,
}) => {
  if (!Object.values(filters).some((v) => v)) return null;

  return (
    <div className="bg-indigo-50 dark:bg-primary/30 border border-primary dark:border-primary rounded-lg p-3 mb-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-primary dark:text-primary font-medium">
            الفلاتر النشطة:
          </span>
          {filters.projectId && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              المشروع:{" "}
              {projects.find((p) => p.id === filters.projectId)?.name}
              <button
                onClick={() => setFilters({ ...filters, projectId: "" })}
                className="me-1 hover:text-primary dark:hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
          {filters.categoryId && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              القسم:{" "}
              {categories.find((c) => c.id === filters.categoryId)?.name}
              <button
                onClick={() => setFilters({ ...filters, categoryId: "" })}
                className="me-1 hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
          {filters.status && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              الحالة:{" "}
              {filters.status === "pending"
                ? "في الانتظار"
                : filters.status === "in_progress"
                  ? "قيد التنفيذ"
                  : filters.status === "completed"
                    ? "مكتمل"
                    : "ملغي"}
              <button
                onClick={() => setFilters({ ...filters, status: "" })}
                className="me-1 hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
          {filters.priority && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              الأولوية:{" "}
              {filters.priority === "urgent"
                ? "عاجل"
                : filters.priority === "high"
                  ? "عالي"
                  : filters.priority === "medium"
                    ? "متوسط"
                    : "منخفض"}
              <button
                onClick={() => setFilters({ ...filters, priority: "" })}
                className="me-1 hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
          {filters.assignedTo && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              المسؤول:{" "}
              {users.find((u) => u.id === filters.assignedTo)?.firstName}
              <button
                onClick={() => setFilters({ ...filters, assignedTo: "" })}
                className="me-1 hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
          {(filters.dueDateFrom || filters.dueDateTo) && (
            <span className="inline-flex items-center px-2 py-1 bg-card border border-primary dark:border-primary rounded-full text-xs text-primary dark:text-primary">
              التاريخ: {filters.dueDateFrom || "..."} -{" "}
              {filters.dueDateTo || "..."}
              <button
                onClick={() =>
                  setFilters({
                    ...filters,
                    dueDateFrom: "",
                    dueDateTo: "",
                  })
                }
                className="me-1 hover:text-primary"
              >
                ×
              </button>
            </span>
          )}
        </div>
        <button
          onClick={() => {
            setFilters({
              projectId: "",
              categoryId: "",
              status: "",
              priority: "",
              assignedTo: "",
              dueDateFrom: "",
              dueDateTo: "",
            });
          }}
          className="text-xs text-primary hover:text-primary dark:hover:text-primary font-medium"
        >
          مسح الكل
        </button>
      </div>
    </div>
  );
};
