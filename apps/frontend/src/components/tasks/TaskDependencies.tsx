import React, { useState, useEffect } from "react";
import i18n from "../../i18n";
import { Link } from "react-router-dom";
import { buildApiUrl } from "../../utils/urlHelper";
import tokenManager from "../../utils/tokenManager";
import {
  LinkIcon,
  PlusIcon,
  XMarkIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";

interface Task {
  id: string;
  title: string;
  status: string;
  priority: string;
}

interface Dependency {
  id: string;
  dependsOnTaskId: string;
  dependsOnTask: Task;
  type: "blocks" | "blocked_by" | "related";
}

interface TaskDependenciesProps {
  taskId: string;
  dependencies?: string[];
  onUpdate?: () => void;
}

const getAuthHeaders = (additionalHeaders: Record<string, string> = {}) =>
  tokenManager.createAuthHeaders(additionalHeaders);

const TaskDependencies: React.FC<TaskDependenciesProps> = ({
  taskId,
  onUpdate,
}) => {
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [taskDependencies, setTaskDependencies] = useState<Dependency[]>([]);
  const [blockedByTasks, setBlockedByTasks] = useState<Dependency[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState("");
  const [dependencyType, setDependencyType] = useState<
    "blocks" | "blocked_by" | "related"
  >("blocked_by");
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchAllTasks();
    fetchDependencies();
  }, [taskId]);

  const fetchAllTasks = async () => {
    try {
      const response = await fetch(buildApiUrl("tasks"), {
        headers: getAuthHeaders(),
      });
      const data = await response.json();
      if (data.success) {
        // Exclude current task from the list
        setAllTasks(data.data.filter((t: Task) => t.id !== taskId));
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    }
  };

  const fetchDependencies = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`tasks/${taskId}/dependencies`),
        {
          headers: getAuthHeaders(),
        },
      );
      const data = await response.json();
      if (data.success) {
        setTaskDependencies(data.data?.blocks || []);
        setBlockedByTasks(data.data?.blockedBy || []);
      }
    } catch (error) {
      console.error("Error fetching dependencies:", error);
    }
  };

  const addDependency = async () => {
    if (!selectedTaskId) return;

    try {
      setLoading(true);
      const response = await fetch(
        buildApiUrl(`tasks/${taskId}/dependencies`),
        {
          method: "POST",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify({
            dependsOnId: selectedTaskId,
            type: dependencyType,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchDependencies();
        setShowAddModal(false);
        setSelectedTaskId("");
        onUpdate?.();
      } else {
        alert(data.error || i18n.t("TaskDependencies.failed_add_c36d"));
      }
    } catch (error) {
      console.error("Error adding dependency:", error);
      alert(i18n.t("TaskDependencies.failed_add_c36d"));
    } finally {
      setLoading(false);
    }
  };

  const removeDependency = async (dependencyId: string) => {
    if (!confirm("هل أنت متأكد من إزالة هذه التبعية؟")) return;

    try {
      const response = await fetch(
        buildApiUrl(`tasks/dependencies/${dependencyId}`),
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        },
      );

      const data = await response.json();
      if (data.success) {
        fetchDependencies();
        onUpdate?.();
      }
    } catch (error) {
      console.error("Error removing dependency:", error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return <CheckCircleIcon className="h-4 w-4 text-success" />;
      case "in_progress":
        return <ClockIcon className="h-4 w-4 text-primary" />;
      case "pending":
        return <ClockIcon className="h-4 w-4 text-warning" />;
      default:
        return <ExclamationTriangleIcon className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "مكتمل";
      case "in_progress":
        return "قيد التنفيذ";
      case "pending":
        return "في الانتظار";
      case "cancelled":
        return "ملغي";
      default:
        return status;
    }
  };

  const filteredTasks = allTasks.filter(
    (task) =>
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !taskDependencies.some((d) => d.dependsOnTaskId === task.id) &&
      !blockedByTasks.some((d) => d.dependsOnTaskId === task.id),
  );

  const hasBlockingIssues = blockedByTasks.some(
    (d) => d.dependsOnTask?.status?.toLowerCase() !== "completed",
  );

  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-foreground flex items-center">
          <LinkIcon className="h-5 w-5 text-primary ms-2" />
          تبعيات المهمة
        </h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-3 py-1.5 text-sm bg-primary text-white rounded-md hover:bg-primary"
        >
          <PlusIcon className="h-4 w-4 ms-1" />
          إضافة تبعية
        </button>
      </div>

      {hasBlockingIssues && (
        <div className="bg-yellow-50 border border-warning rounded-lg p-3 mb-4">
          <div className="flex items-center text-warning">
            <ExclamationTriangleIcon className="h-5 w-5 ms-2" />
            <span className="text-sm font-medium">
              هذه المهمة محظورة بمهام أخرى غير مكتملة
            </span>
          </div>
        </div>
      )}

      {/* Blocked By Section */}
      {blockedByTasks.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
            <ArrowLeftIcon className="h-4 w-4 ms-1 text-destructive" />
            محظورة بـ (يجب إكمالها أولاً)
          </h4>
          <div className="space-y-2">
            {blockedByTasks.map((dep) => (
              <div
                key={dep.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  dep.dependsOnTask?.status?.toLowerCase() === "completed"
                    ? "bg-green-50 border-success"
                    : "bg-red-50 border-destructive"
                }`}
              >
                <div className="flex items-center">
                  {getStatusIcon(dep.dependsOnTask?.status)}
                  <Link
                    to={`/tasks/${dep.dependsOnTaskId}`}
                    className="me-2 text-sm font-medium text-foreground hover:text-primary"
                  >
                    {dep.dependsOnTask?.title}
                  </Link>
                  <span className="text-xs text-muted-foreground me-2">
                    ({getStatusText(dep.dependsOnTask?.status)})
                  </span>
                </div>
                <button
                  onClick={() => removeDependency(dep.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocks Section */}
      {taskDependencies.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-foreground mb-2 flex items-center">
            <ArrowRightIcon className="h-4 w-4 ms-1 text-primary" />
            تحظر (تنتظر إكمال هذه المهمة)
          </h4>
          <div className="space-y-2">
            {taskDependencies.map((dep) => (
              <div
                key={dep.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-primary/10 border-primary"
              >
                <div className="flex items-center">
                  {getStatusIcon(dep.dependsOnTask?.status)}
                  <Link
                    to={`/tasks/${dep.dependsOnTaskId}`}
                    className="me-2 text-sm font-medium text-foreground hover:text-primary"
                  >
                    {dep.dependsOnTask?.title}
                  </Link>
                  <span className="text-xs text-muted-foreground me-2">
                    ({getStatusText(dep.dependsOnTask?.status)})
                  </span>
                </div>
                <button
                  onClick={() => removeDependency(dep.id)}
                  className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive rounded"
                >
                  <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {taskDependencies.length === 0 && blockedByTasks.length === 0 && (
        <div className="text-center py-6 text-muted-foreground">
          <LinkIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm">لا توجد تبعيات لهذه المهمة</p>
        </div>
      )}

      {/* Add Dependency Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-muted bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">إضافة تبعية</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-foreground"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  نوع التبعية
                </label>
                <select
                  value={dependencyType}
                  onChange={(e) => setDependencyType(e.target.value as any)}
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="blocked_by">
                    محظورة بـ (يجب إكمال المهمة المحددة أولاً)
                  </option>
                  <option value="blocks">
                    تحظر (المهمة المحددة تنتظر إكمال هذه المهمة)
                  </option>
                  <option value="related">مرتبطة بـ</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  البحث عن مهمة
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="ابحث بعنوان المهمة..."
                  className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  اختر المهمة
                </label>
                <div className="max-h-60 overflow-y-auto border border-border rounded-md">
                  {filteredTasks.length === 0 ? (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      لا توجد مهام متاحة
                    </div>
                  ) : (
                    filteredTasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => setSelectedTaskId(task.id)}
                        className={`w-full text-right p-3 border-b last:border-b-0 hover:bg-muted ${
                          selectedTaskId === task.id
                            ? "bg-indigo-50 border-primary"
                            : ""
                        }`}
                      >
                        <div className="flex items-center">
                          {getStatusIcon(task.status)}
                          <span className="me-2 text-sm font-medium text-foreground">
                            {task.title}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {getStatusText(task.status)}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-2 space-x-reverse">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted"
              >
                إلغاء
              </button>
              <button
                onClick={addDependency}
                disabled={!selectedTaskId || loading}
                className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "جاري الإضافة..." : "إضافة"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskDependencies;
