import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import tokenManager from "../../utils/tokenManager";
import { buildApiUrl } from "../../utils/urlHelper";
import {
  ViewColumnsIcon,
  PlusIcon,
  ClockIcon,
  ChatBubbleLeftIcon,
  PaperClipIcon,
  UserCircleIcon,
  CalendarIcon,
  ArrowLeftIcon,
  FunnelIcon,
  PlayIcon,
  StopIcon,
} from "@heroicons/react/24/outline";
import { TaskUnifiedFilterBar } from "../../components/tasks/TaskUnifiedFilterBar";
import {
  UnifiedTaskFilters,
  parseUnifiedFiltersFromUrl,
  filterTasksWithUnifiedEngine,
} from "../../components/tasks/taskFilterEngine";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedUser: {
    firstName: string;
    lastName: string;
    avatar?: string;
  };
  dueDate: string | null;
  subtasksCount: number;
  completedSubtasks: number;
  commentsCount: number;
  attachmentsCount: number;
  color?: string;
  projectId?: string;
}

interface KanbanData {
  PENDING: Task[];
  IN_PROGRESS: Task[];
  COMPLETED: Task[];
  CANCELLED: Task[];
}

interface Project {
  id: string;
  name: string;
}

interface RunningTimer {
  id: string;
  taskId: string;
  task?: {
    title?: string;
  };
}

const KanbanBoard: React.FC = () => {
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    PENDING: [],
    IN_PROGRESS: [],
    COMPLETED: [],
    CANCELLED: [],
  });
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [runningTimer, setRunningTimer] = useState<RunningTimer | null>(null);
  const [unifiedFilters, setUnifiedFilters] = useState<UnifiedTaskFilters>(() =>
    parseUnifiedFiltersFromUrl(typeof window !== "undefined" ? window.location.search : "")
  );

  const columns = [
    {
      id: "PENDING",
      title: "في الانتظار",
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50 dark:bg-warning/20",
    },
    {
      id: "IN_PROGRESS",
      title: "قيد التنفيذ",
      color: "bg-blue-500",
      bgColor: "bg-blue-50 dark:bg-primary/20",
    },
    {
      id: "COMPLETED",
      title: "مكتمل",
      color: "bg-green-500",
      bgColor: "bg-green-50 dark:bg-success/20",
    },
    {
      id: "CANCELLED",
      title: "ملغي",
      color: "bg-red-500",
      bgColor: "bg-red-50 dark:bg-destructive/20",
    },
  ];

  const fetchKanbanTasks = useCallback(async () => {
    try {
      setLoading(true);
      const token = tokenManager.getAccessToken();
      const queryParams = new URLSearchParams();
      if (selectedProject) queryParams.set("projectId", selectedProject);
      if (unifiedFilters.search) queryParams.set("search", unifiedFilters.search);
      if (unifiedFilters.assignedTo && unifiedFilters.assignedTo !== "all") queryParams.set("assignedTo", unifiedFilters.assignedTo);
      if (unifiedFilters.status && unifiedFilters.status !== "all") queryParams.set("status", unifiedFilters.status);
      if (unifiedFilters.priority && unifiedFilters.priority !== "all") queryParams.set("priority", unifiedFilters.priority);
      if (unifiedFilters.dueDateFrom) queryParams.set("dueDateFrom", unifiedFilters.dueDateFrom);
      if (unifiedFilters.dueDateTo) queryParams.set("dueDateTo", unifiedFilters.dueDateTo);
      if (unifiedFilters.tag && unifiedFilters.tag !== "all") queryParams.set("tag", unifiedFilters.tag);

      const qs = queryParams.toString();
      const url = qs ? `tasks/kanban?${qs}` : "tasks/kanban";

      const response = await fetch(buildApiUrl(url), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setKanbanData(data.data);
      }
    } catch (error) {
      console.error("Error fetching kanban tasks:", error);
    } finally {
      setLoading(false);
    }
  }, [selectedProject, unifiedFilters]);

  const fetchProjects = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(buildApiUrl("projects"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success) {
        setProjects(data.data);
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  }, []);

  const fetchRunningTimer = useCallback(async () => {
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(buildApiUrl("tasks/running-timer"), {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (data.success && data.data) {
        setRunningTimer(data.data);
      }
    } catch (error) {
      console.error("Error fetching running timer:", error);
    }
  }, []);

  useEffect(() => {
    void fetchKanbanTasks();
    void fetchProjects();
    void fetchRunningTimer();
  }, [fetchKanbanTasks, fetchProjects, fetchRunningTimer]);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    if (!draggedTask || draggedTask.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(
        buildApiUrl(`tasks/${draggedTask.id}/order`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            newStatus,
            newOrder: kanbanData[newStatus as keyof KanbanData].length,
          }),
        },
      );

      const data = await response.json();
      if (data.success) {
        // Update local state
        setKanbanData((prev) => {
          const oldStatus = draggedTask.status as keyof KanbanData;
          const newKanban = { ...prev };

          // Remove from old column
          newKanban[oldStatus] = prev[oldStatus].filter(
            (t) => t.id !== draggedTask.id,
          );

          // Add to new column
          const updatedTask = { ...draggedTask, status: newStatus };
          newKanban[newStatus as keyof KanbanData] = [
            ...prev[newStatus as keyof KanbanData],
            updatedTask,
          ];

          return newKanban;
        });
      }
    } catch (error) {
      console.error("Error updating task status:", error);
    }

    setDraggedTask(null);
  };

  const startTimer = async (taskId: string) => {
    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(
        buildApiUrl(`tasks/${taskId}/time-tracking/start`),
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({}),
        },
      );

      const data = await response.json();
      if (data.success) {
        setRunningTimer(data.data);
      } else {
        alert(data.error || "فشل في بدء المؤقت");
      }
    } catch (error) {
      console.error("Error starting timer:", error);
    }
  };

  const stopTimer = async () => {
    if (!runningTimer) return;

    try {
      const token = tokenManager.getAccessToken();
      const response = await fetch(
        buildApiUrl(`tasks/time-tracking/${runningTimer.id}/stop`),
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const data = await response.json();
      if (data.success) {
        setRunningTimer(null);
        alert(data.message);
      }
    } catch (error) {
      console.error("Error stopping timer:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "URGENT":
        return "border-l-red-500";
      case "HIGH":
        return "border-l-orange-500";
      case "MEDIUM":
        return "border-l-yellow-500";
      case "LOW":
        return "border-l-green-500";
      default:
        return "border-l-gray-500";
    }
  };

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      URGENT: "bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive",
      HIGH: "bg-orange-100 dark:bg-warning/30 text-warning dark:text-warning",
      MEDIUM:
        "bg-yellow-100 dark:bg-warning/30 text-warning dark:text-warning",
      LOW: "bg-green-100 dark:bg-success/30 text-success dark:text-success",
    };
    const labels: Record<string, string> = {
      URGENT: "عاجل",
      HIGH: "عالي",
      MEDIUM: "متوسط",
      LOW: "منخفض",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full ${colors[priority] || "bg-muted text-foreground dark:text-muted-foreground"}`}
      >
        {labels[priority] || priority}
      </span>
    );
  };

  // A closed task can never be overdue — keep this in sync with Tasks.tsx isOverdue().
  const isOverdue = (dueDate: string | null, status?: string | null) => {
    if (!dueDate) return false;
    const normalized = String(status || "").toLowerCase();
    if (normalized === "completed" || normalized === "cancelled") return false;
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div className="polaris-track h-full flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border dark:border-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link
              to="/tasks"
              className="flex items-center text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
            >
              <ArrowLeftIcon className="h-5 w-5 ms-2" />
              العودة للقائمة
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <ViewColumnsIcon className="h-7 w-7 text-primary ms-2" />
              لوحة Kanban
            </h1>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            {/* Running Timer */}
            {runningTimer && (
              <div className="flex items-center bg-success dark:bg-success/30 text-success dark:text-success px-4 py-2 rounded-lg">
                <ClockIcon className="h-5 w-5 ms-2 animate-pulse" />
                <span className="text-sm font-medium ms-2">
                  {runningTimer.task?.title}
                </span>
                <button
                  onClick={stopTimer}
                  className="me-2 p-1 hover:bg-success dark:hover:bg-success/50 rounded"
                >
                  <StopIcon className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Project Filter */}
            <div className="flex items-center">
              <FunnelIcon className="h-5 w-5 text-muted-foreground/80 ms-2" />
              <select
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
                className="border border-border dark:border-border rounded-md px-3 py-2 text-sm bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="">جميع المشاريع</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <Link
              to="/tasks"
              className="inline-flex items-center px-4 py-2 bg-primary dark:bg-primary text-white rounded-md hover:bg-primary dark:hover:bg-primary"
            >
              <PlusIcon className="h-5 w-5 ms-2" />
              مهمة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="px-6 pt-4">
        <TaskUnifiedFilterBar
          filters={unifiedFilters}
          onFiltersChange={setUnifiedFilters}
          onRefresh={fetchKanbanTasks}
          isLoading={loading}
          totalCount={Object.values(kanbanData).reduce((sum, list) => sum + list.length, 0)}
          filteredCount={columns.reduce(
            (sum, col) =>
              sum +
              filterTasksWithUnifiedEngine(
                kanbanData[col.id as keyof KanbanData] || [],
                unifiedFilters
              ).length,
            0
          )}
        />
      </div>

      {/* Kanban Board */}
      <div className="flex-1 overflow-x-auto p-6 bg-muted dark:bg-muted">
        <div className="flex space-x-4 space-x-reverse h-full min-w-max">
          {columns.map((column) => {
            const columnTasks = filterTasksWithUnifiedEngine(
              kanbanData[column.id as keyof KanbanData] || [],
              unifiedFilters
            );
            return (
              <div
                key={column.id}
                className="w-80 flex flex-col bg-muted dark:bg-muted rounded-lg"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className={`p-4 rounded-t-lg ${column.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={`w-3 h-3 rounded-full ${column.color} ms-2`}
                      ></div>
                      <h3 className="font-semibold text-foreground dark:text-muted-foreground">
                        {column.title}
                      </h3>
                    </div>
                    <span className="bg-card px-2 py-1 rounded-full text-sm font-medium text-muted-foreground">
                      {columnTasks.length}
                    </span>
                  </div>
                </div>

                {/* Tasks */}
                <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-280px)]">
                  {columnTasks.map((task) => (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`bg-card rounded-lg shadow-sm border-l-4 ${getPriorityColor(task.priority)} p-4 cursor-move hover:shadow-md transition-shadow ${
                      draggedTask?.id === task.id ? "opacity-50" : ""
                    }`}
                  >
                    {/* Task Title */}
                    <Link
                      to={`/tasks/${task.id}`}
                      className="font-medium text-foreground hover:text-primary block mb-2"
                    >
                      {task.title}
                    </Link>

                    {/* Task Description */}
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    {/* Priority & Due Date */}
                    <div className="flex items-center justify-between mb-3">
                      {getPriorityBadge(task.priority)}
                      {task.dueDate && (
                        <span
                          className={`text-xs flex items-center ${isOverdue(task.dueDate, task.status) ? "text-red-600 dark:text-destructive" : "text-muted-foreground"}`}
                        >
                          <CalendarIcon className="h-3 w-3 ms-1" />
                          {new Date(task.dueDate).toLocaleDateString("ar-EG")}
                        </span>
                      )}
                    </div>

                    {/* Subtasks Progress */}
                    {task.subtasksCount > 0 && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                          <span>المهام الفرعية</span>
                          <span>
                            {task.completedSubtasks}/{task.subtasksCount}
                          </span>
                        </div>
                        <div className="w-full bg-muted dark:bg-muted rounded-full h-1.5">
                          <div
                            className="bg-indigo-600 dark:bg-primary h-1.5 rounded-full"
                            style={{
                              width: `${(task.completedSubtasks / task.subtasksCount) * 100}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-border dark:border-border">
                      {/* Assigned User */}
                      <div className="flex items-center">
                        {task.assignedUser?.avatar ? (
                          <img
                            src={task.assignedUser.avatar}
                            alt=""
                            className="h-6 w-6 rounded-full"
                          />
                        ) : (
                          <UserCircleIcon className="h-6 w-6 text-muted-foreground/80" />
                        )}
                        <span className="text-xs text-muted-foreground me-1">
                          {task.assignedUser?.firstName}
                        </span>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center space-x-2 space-x-reverse">
                        {task.commentsCount > 0 && (
                          <span className="flex items-center text-xs text-muted-foreground/80">
                            <ChatBubbleLeftIcon className="h-4 w-4 ms-1" />
                            {task.commentsCount}
                          </span>
                        )}
                        {task.attachmentsCount > 0 && (
                          <span className="flex items-center text-xs text-muted-foreground/80">
                            <PaperClipIcon className="h-4 w-4 ms-1" />
                            {task.attachmentsCount}
                          </span>
                        )}
                        {/* Timer Button */}
                        {column.id !== "COMPLETED" &&
                          column.id !== "CANCELLED" && (
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                if (runningTimer?.taskId === task.id) {
                                  stopTimer();
                                } else if (!runningTimer) {
                                  startTimer(task.id);
                                }
                              }}
                              className={`p-1 rounded ${
                                runningTimer?.taskId === task.id
                                  ? "bg-green-100 dark:bg-success/30 text-success dark:text-success"
                                  : "hover:bg-muted text-muted-foreground/80"
                              }`}
                              title={
                                runningTimer?.taskId === task.id
                                  ? "إيقاف المؤقت"
                                  : "بدء المؤقت"
                              }
                            >
                              {runningTimer?.taskId === task.id ? (
                                <StopIcon className="h-4 w-4" />
                              ) : (
                                <PlayIcon className="h-4 w-4" />
                              )}
                            </button>
                          )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty State */}
                {kanbanData[column.id as keyof KanbanData].length === 0 && (
                  <div className="text-center py-8 text-muted-foreground/80">
                    <p className="text-sm">لا توجد مهام</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);
};

export default KanbanBoard;
