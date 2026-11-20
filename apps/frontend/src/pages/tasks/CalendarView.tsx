import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import tokenManager from "../../utils/tokenManager";
import { buildApiUrl } from "../../utils/urlHelper";
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  PlusIcon,
  ClockIcon,
  UserCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { TaskUnifiedFilterBar } from "../../components/tasks/TaskUnifiedFilterBar";
import {
  UnifiedTaskFilters,
  parseUnifiedFiltersFromUrl,
  matchesUnifiedFilter,
  filterTasksWithUnifiedEngine,
} from "../../components/tasks/taskFilterEngine";

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string | null;
  assignedToName: string;
  projectName: string;
  progress: number;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks: Task[];
}

const CalendarView: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [unifiedFilters, setUnifiedFilters] = useState<UnifiedTaskFilters>(() =>
    parseUnifiedFiltersFromUrl(typeof window !== "undefined" ? window.location.search : "")
  );
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("month");
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const getAccessToken = (): string | null => tokenManager.getAccessToken();

  const monthNames = [
    "يناير",
    "فبراير",
    "مارس",
    "أبريل",
    "مايو",
    "يونيو",
    "يوليو",
    "أغسطس",
    "سبتمبر",
    "أكتوبر",
    "نوفمبر",
    "ديسمبر",
  ];

  const dayNames = [
    "الأحد",
    "الإثنين",
    "الثلاثاء",
    "الأربعاء",
    "الخميس",
    "الجمعة",
    "السبت",
  ];

  useEffect(() => {
    fetchTasks();
  }, [currentDate, unifiedFilters]);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();

      // Get start and end of current view
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1,
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0,
      );

      const queryParams = new URLSearchParams();
      queryParams.set("dueDateFrom", startDate.toISOString().split("T")[0]);
      queryParams.set("dueDateTo", endDate.toISOString().split("T")[0]);

      if (unifiedFilters.search) queryParams.set("search", unifiedFilters.search);
      if (unifiedFilters.assignedTo && unifiedFilters.assignedTo !== "all") queryParams.set("assignedTo", unifiedFilters.assignedTo);
      if (unifiedFilters.status && unifiedFilters.status !== "all") queryParams.set("status", unifiedFilters.status);
      if (unifiedFilters.priority && unifiedFilters.priority !== "all") queryParams.set("priority", unifiedFilters.priority);
      if (unifiedFilters.tag && unifiedFilters.tag !== "all") queryParams.set("tag", unifiedFilters.tag);

      const response = await fetch(
        buildApiUrl(`tasks?${queryParams.toString()}`),
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      const data = await response.json();
      if (data.success) {
        setTasks(data.data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const getCalendarDays = (): CalendarDay[] => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Previous month days
    const prevMonth = new Date(year, month, 0);
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonth.getDate() - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: getTasksForDate(date),
      });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: date.getTime() === today.getTime(),
        tasks: getTasksForDate(date),
      });
    }

    // Next month days
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        tasks: getTasksForDate(date),
      });
    }

    return days;
  };

  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task) => {
      if (!matchesUnifiedFilter(task, unifiedFilters)) return false;
      if (!task.dueDate) return false;
      const taskDate = new Date(task.dueDate);
      return (
        taskDate.getDate() === date.getDate() &&
        taskDate.getMonth() === date.getMonth() &&
        taskDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const getWeekDays = (): CalendarDay[] => {
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());

    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      days.push({
        date,
        isCurrentMonth: date.getMonth() === currentDate.getMonth(),
        isToday: date.getTime() === today.getTime(),
        tasks: getTasksForDate(date),
      });
    }

    return days;
  };

  const navigatePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1),
      );
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() - 1);
      setCurrentDate(newDate);
    }
  };

  const navigateNext = () => {
    if (viewMode === "month") {
      setCurrentDate(
        new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1),
      );
    } else if (viewMode === "week") {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 7);
      setCurrentDate(newDate);
    } else {
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + 1);
      setCurrentDate(newDate);
    }
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityColor = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case "urgent":
        return "bg-red-500";
      case "high":
        return "bg-orange-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return "border-yellow-400";
      case "in_progress":
        return "border-blue-400";
      case "completed":
        return "border-green-400";
      case "cancelled":
        return "border-red-400";
      default:
        return "border-gray-400";
    }
  };

  const openTaskModal = (task: Task) => {
    setSelectedTask(task);
    setShowTaskModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 space-x-reverse">
            <Link
              to="/tasks"
              className="flex items-center text-foreground dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
            >
              <ArrowLeftIcon className="h-5 w-5 ms-2" />
              العودة
            </Link>
            <h1 className="text-2xl font-bold text-foreground flex items-center">
              <CalendarIcon className="h-7 w-7 text-primary ms-2" />
              عرض التقويم
            </h1>
          </div>

          <div className="flex items-center space-x-4 space-x-reverse">
            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-lg p-1">
              {(["month", "week", "day"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                    viewMode === mode
                      ? "bg-card text-primary shadow"
                      : "text-gray-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                  }`}
                >
                  {mode === "month"
                    ? "شهري"
                    : mode === "week"
                      ? "أسبوعي"
                      : "يومي"}
                </button>
              ))}
            </div>

            <Link
              to="/tasks"
              state={{ openCreateModal: true }}
              className="inline-flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
            >
              <PlusIcon className="h-5 w-5 ms-2" />
              مهمة جديدة
            </Link>
          </div>
        </div>
      </div>

      {/* Unified Filter Bar */}
      <div className="mb-6">
        <TaskUnifiedFilterBar
          filters={unifiedFilters}
          onFiltersChange={setUnifiedFilters}
          onRefresh={fetchTasks}
          isLoading={loading}
          totalCount={tasks.length}
          filteredCount={filterTasksWithUnifiedEngine(tasks, unifiedFilters).length}
        />
      </div>

      {/* Calendar Navigation */}
      <div className="bg-card rounded-lg shadow mb-6">
        <div className="flex items-center justify-between p-4 border-b border-border dark:border-border">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              onClick={navigatePrev}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
            <button
              onClick={navigateNext}
              className="p-2 hover:bg-muted rounded-lg"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm font-medium text-primary hover:bg-primary/10 dark:hover:bg-primary/30 rounded-lg"
            >
              اليوم
            </button>
          </div>

          <h2 className="text-xl font-bold text-foreground">
            {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>

          <div className="flex items-center space-x-2 space-x-reverse text-sm text-muted-foreground">
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-destructive ms-1"></span>
              عاجل
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-warning ms-1"></span>
              عالي
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-warning ms-1"></span>
              متوسط
            </span>
            <span className="flex items-center">
              <span className="w-3 h-3 rounded-full bg-success ms-1"></span>
              منخفض
            </span>
          </div>
        </div>

        {/* Month View */}
        {viewMode === "month" && (
          <div className="p-4">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-muted-foreground py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[120px] p-2 border rounded-lg ${
                    day.isCurrentMonth
                      ? "bg-card"
                      : "bg-gray-50 dark:bg-muted"
                  } ${day.isToday ? "border-indigo-500 dark:border-primary border-2" : "border-gray-200 dark:border-border"}`}
                >
                  <div
                    className={`text-sm font-medium mb-1 ${
                      day.isToday
                        ? "text-primary"
                        : day.isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground/80"
                    }`}
                  >
                    {day.date.getDate()}
                  </div>

                  <div className="space-y-1">
                    {day.tasks.slice(0, 3).map((task) => (
                      <button
                        key={task.id}
                        onClick={() => openTaskModal(task)}
                        className={`w-full text-right text-xs p-1 rounded border-r-2 ${getStatusColor(task.status)} bg-muted dark:bg-muted hover:bg-muted dark:hover:bg-muted truncate text-foreground`}
                      >
                        <span
                          className={`inline-block w-2 h-2 rounded-full ${getPriorityColor(task.priority)} ms-1`}
                        ></span>
                        {task.title}
                      </button>
                    ))}
                    {day.tasks.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{day.tasks.length - 3} مهام أخرى
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Week View */}
        {viewMode === "week" && (
          <div className="p-4">
            <div className="grid grid-cols-7 gap-2">
              {getWeekDays().map((day, index) => (
                <div
                  key={index}
                  className={`min-h-[400px] p-3 border rounded-lg ${
                    day.isToday
                      ? "border-indigo-500 border-2 bg-primary/10"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <div className="text-center mb-3">
                    <div className="text-sm text-muted-foreground">
                      {dayNames[day.date.getDay()]}
                    </div>
                    <div
                      className={`text-2xl font-bold ${day.isToday ? "text-indigo-600" : "text-gray-900"}`}
                    >
                      {day.date.getDate()}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {day.tasks.map((task) => (
                      <button
                        key={task.id}
                        onClick={() => openTaskModal(task)}
                        className={`w-full text-right p-2 rounded-lg border-r-4 ${getStatusColor(task.status)} bg-white shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-center mb-1">
                          <span
                            className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)} ms-2`}
                          ></span>
                          <span className="text-sm font-medium text-foreground truncate">
                            {task.title}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {task.projectName}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Day View */}
        {viewMode === "day" && (
          <div className="p-4">
            <div className="text-center mb-6">
              <div className="text-lg text-muted-foreground">
                {dayNames[currentDate.getDay()]}
              </div>
              <div className="text-4xl font-bold text-foreground">
                {currentDate.getDate()}
              </div>
              <div className="text-gray-500">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </div>
            </div>

            <div className="max-w-2xl mx-auto space-y-3">
              {getTasksForDate(currentDate).length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CalendarIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p>لا توجد مهام في هذا اليوم</p>
                </div>
              ) : (
                getTasksForDate(currentDate).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => openTaskModal(task)}
                    className={`p-4 rounded-lg border-r-4 ${getStatusColor(task.status)} bg-white shadow hover:shadow-md transition-shadow cursor-pointer`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span
                          className={`w-3 h-3 rounded-full ${getPriorityColor(task.priority)} ms-2`}
                        ></span>
                        <h3 className="text-lg font-medium text-foreground">
                          {task.title}
                        </h3>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          task.status === "completed"
                            ? "bg-green-100 text-success"
                            : task.status === "in_progress"
                              ? "bg-blue-100 text-primary"
                              : task.status === "pending"
                                ? "bg-yellow-100 text-warning"
                                : "bg-gray-100 text-foreground"
                        }`}
                      >
                        {task.status === "completed"
                          ? "مكتمل"
                          : task.status === "in_progress"
                            ? "قيد التنفيذ"
                            : task.status === "pending"
                              ? "في الانتظار"
                              : task.status}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {task.description}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <UserCircleIcon className="h-4 w-4 ms-1" />
                        {task.assignedToName}
                      </div>
                      <div className="flex items-center">
                        <span className="ms-2">التقدم: {task.progress}%</span>
                        <div className="w-20 bg-muted rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full"
                            style={{ width: `${task.progress}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مهام هذا الشهر</p>
              <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
            </div>
            <CalendarIcon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">مكتملة</p>
              <p className="text-2xl font-bold text-success">
                {
                  tasks.filter((t) => t.status?.toLowerCase() === "completed")
                    .length
                }
              </p>
            </div>
            <div className="h-10 w-10 bg-success rounded-full flex items-center justify-center">
              <span className="text-green-600 text-lg">✓</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">قيد التنفيذ</p>
              <p className="text-2xl font-bold text-primary">
                {
                  tasks.filter((t) => t.status?.toLowerCase() === "in_progress")
                    .length
                }
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">متأخرة</p>
              <p className="text-2xl font-bold text-destructive">
                {
                  tasks.filter((t) => {
                    if (!t.dueDate || t.status?.toLowerCase() === "completed")
                      return false;
                    return new Date(t.dueDate) < new Date();
                  }).length
                }
              </p>
            </div>
            <ExclamationTriangleIcon className="h-10 w-10 text-destructive" />
          </div>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && selectedTask && (
        <div className="fixed inset-0 bg-muted bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-lg shadow-lg rounded-md bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                تفاصيل المهمة
              </h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xl font-bold text-foreground">
                  {selectedTask.title}
                </h4>
                <p className="text-gray-600 mt-2">{selectedTask.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">المشروع</span>
                  <p className="font-medium">
                    {selectedTask.projectName || "غير محدد"}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">المسؤول</span>
                  <p className="font-medium">{selectedTask.assignedToName}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">الحالة</span>
                  <p className="font-medium">
                    {selectedTask.status === "completed"
                      ? "مكتمل"
                      : selectedTask.status === "in_progress"
                        ? "قيد التنفيذ"
                        : selectedTask.status === "pending"
                          ? "في الانتظار"
                          : selectedTask.status}
                  </p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="text-sm text-muted-foreground">التقدم</span>
                  <p className="font-medium">{selectedTask.progress}%</p>
                </div>
              </div>

              <div className="flex justify-end space-x-2 space-x-reverse">
                <button
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted"
                >
                  إغلاق
                </button>
                <Link
                  to={`/tasks/${selectedTask.id}`}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary"
                >
                  عرض التفاصيل
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
