import React from 'react';
import {
  ChartBarIcon,
  ClipboardDocumentListIcon,
  FolderIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { buildApiUrl } from '../../utils/urlHelper';
import { createStorageKey, getWithExpiry, setWithExpiry } from '../../utils/storage';
import { TaskUnifiedFilterBar } from '../../components/tasks/TaskUnifiedFilterBar';
import {
  UnifiedTaskFilters,
  parseUnifiedFiltersFromUrl,
  filterTasksWithUnifiedEngine,
} from '../../components/tasks/taskFilterEngine';

interface DashboardStats {
  tasks: {
    totalTasks: number;
    myTasks: number;
    tasksByStatus: {
      pending: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
    myTasksByStatus: {
      pending: number;
      inProgress: number;
      completed: number;
      cancelled: number;
    };
    tasksByPriority: {
      urgent: number;
      high: number;
      medium: number;
      low: number;
    };
    overdueTasks: number;
    myOverdueTasks: number;
    completionRate: number;
    myCompletionRate: number;
  };
  projects: {
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    planningProjects: number;
    onHoldProjects: number;
    averageProgress: number;
    totalBudget: number;
    totalSpent: number;
  };
  recentTasks: Array<{
    id: string;
    title: string;
    status: string;
    priority: string;
    projectName: string;
    assignedToName: string;
    createdAt: string;
  }>;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP'
  }).format(price);
};

const getStatusColor = (status: string) => {
  switch (status.toUpperCase()) {
    case 'PENDING': return 'bg-yellow-100 dark:bg-warning/30 text-warning dark:text-warning';
    case 'IN_PROGRESS': return 'bg-blue-100 dark:bg-primary/30 text-primary dark:text-primary';
    case 'COMPLETED': return 'bg-green-100 dark:bg-success/30 text-success dark:text-success';
    case 'CANCELLED': return 'bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive';
    default: return 'bg-muted text-foreground dark:text-muted-foreground';
  }
};

const getPriorityColor = (priority: string) => {
  switch (priority.toUpperCase()) {
    case 'URGENT': return 'bg-red-100 dark:bg-destructive/30 text-destructive dark:text-destructive';
    case 'HIGH': return 'bg-orange-100 dark:bg-warning/30 text-warning dark:text-warning';
    case 'MEDIUM': return 'bg-yellow-100 dark:bg-warning/30 text-warning dark:text-warning';
    case 'LOW': return 'bg-green-100 dark:bg-success/30 text-success dark:text-success';
    default: return 'bg-muted text-foreground dark:text-muted-foreground';
  }
};

const Dashboard: React.FC = () => {
  const [unifiedFilters, setUnifiedFilters] = React.useState<UnifiedTaskFilters>(() =>
    parseUnifiedFiltersFromUrl(typeof window !== "undefined" ? window.location.search : "")
  );
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const CACHE_TTL_MS = 60_000;

  const cacheKey = React.useMemo(() => {
    try {
      const rawUser = localStorage.getItem('user');
      const parsedUser = rawUser ? JSON.parse(rawUser) : null;
      const userId = parsedUser?.id || parsedUser?.userId || 'unknown';
      const companyId = parsedUser?.companyId || parsedUser?.company?.id || 'unknown';
      return createStorageKey('tasks-dashboard', `${companyId}:${userId}:${unifiedFilters.assignedTo}:${unifiedFilters.status}:${unifiedFilters.priority}`);
    } catch {
      return createStorageKey('tasks-dashboard', 'unknown');
    }
  }, [unifiedFilters.assignedTo, unifiedFilters.status, unifiedFilters.priority]);

  const fetchDashboardStats = React.useCallback(async ({
    signal,
    background = false,
  }: {
    signal?: AbortSignal;
    background?: boolean;
  } = {}) => {
    try {
      if (!background) {
        setLoading(true);
        setError(null);
      }

      const token = localStorage.getItem('accessToken');
      const queryParams = new URLSearchParams();
      if (unifiedFilters.assignedTo && unifiedFilters.assignedTo !== 'all') {
        queryParams.set('assignedTo', unifiedFilters.assignedTo);
      }
      if (unifiedFilters.status && unifiedFilters.status !== 'all') {
        queryParams.set('status', unifiedFilters.status);
      }
      if (unifiedFilters.priority && unifiedFilters.priority !== 'all') {
        queryParams.set('priority', unifiedFilters.priority);
      }
      const qs = queryParams.toString();
      const endpoint = qs ? `tasks/dashboard-stats?${qs}` : 'tasks/dashboard-stats';

      const response = await fetch(buildApiUrl(endpoint), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal
      });

      if (!response.ok) {
        throw new Error('فشل في تحميل الإحصائيات');
      }

      const data = await response.json();
      if (data.success) {
        setStats(data.data);
        setWithExpiry(cacheKey, data.data, CACHE_TTL_MS);
      } else if (!background) {
        setError(data.message || 'فشل في تحميل الإحصائيات');
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      if (!background) {
        setError('فشل في تحميل الإحصائيات');
      }
    } finally {
      if (!background) {
        setLoading(false);
      }
    }
  }, [cacheKey, unifiedFilters]);

  React.useEffect(() => {
    const controller = new AbortController();
    fetchDashboardStats({ signal: controller.signal });
    return () => controller.abort();
  }, [fetchDashboardStats]);

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary dark:border-primary"></div>
      </div>
    );
  }

  if (error && !stats) {
    return <div className="text-center py-12">{error}</div>;
  }

  if (!stats) {
    return <div className="text-center py-12">فشل في تحميل الإحصائيات</div>;
  }

  const filteredRecentTasks = React.useMemo(() => {
    return filterTasksWithUnifiedEngine(stats?.recentTasks || [], unifiedFilters);
  }, [stats?.recentTasks, unifiedFilters]);

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <ChartBarIcon className="h-8 w-8 text-primary me-3" />
          لوحة التحكم
        </h1>
        <p className="mt-2 text-foreground dark:text-muted-foreground">نظرة عامة على المهام والمشاريع</p>
      </div>

      {/* Unified Filter Bar */}
      <div className="mb-6">
        <TaskUnifiedFilterBar
          filters={unifiedFilters}
          onFiltersChange={setUnifiedFilters}
          onRefresh={() => fetchDashboardStats()}
          isLoading={loading}
          totalCount={stats.recentTasks?.length}
          filteredCount={filteredRecentTasks.length}
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tasks */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground dark:text-muted-foreground">إجمالي المهام</p>
              <p className="text-3xl font-bold text-foreground">{stats.tasks.totalTasks}</p>
            </div>
            <div className="bg-indigo-100 rounded-full p-3">
              <ClipboardDocumentListIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-foreground dark:text-muted-foreground">مهامي: </span>
            <span className="text-sm font-semibold text-primary">{stats.tasks.myTasks}</span>
          </div>
        </div>

        {/* Overdue Tasks */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">المهام المتأخرة</p>
              <p className="text-3xl font-bold text-destructive">{stats.tasks.overdueTasks}</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <ExclamationTriangleIcon className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-foreground">مهامي المتأخرة: </span>
            <span className="text-sm font-semibold text-destructive">{stats.tasks.myOverdueTasks}</span>
          </div>
        </div>

        {/* Completion Rate */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">معدل الإنجاز</p>
              <p className="text-3xl font-bold text-success">{stats.tasks.completionRate}%</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <CheckCircleIcon className="h-8 w-8 text-success" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-foreground">معدلي: </span>
            <span className="text-sm font-semibold text-success">{stats.tasks.myCompletionRate}%</span>
          </div>
        </div>

        {/* Total Projects */}
        <div className="bg-card rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">إجمالي المشاريع</p>
              <p className="text-3xl font-bold text-foreground">{stats.projects.totalProjects}</p>
            </div>
            <div className="bg-purple-100 rounded-full p-3">
              <FolderIcon className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div className="mt-4">
            <span className="text-sm text-foreground">نشط: </span>
            <span className="text-sm font-semibold text-primary">{stats.projects.activeProjects}</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tasks by Status */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <ClockIcon className="h-5 w-5 text-foreground dark:text-muted-foreground me-2" />
            المهام حسب الحالة
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600 dark:text-muted-foreground">في الانتظار</span>
                <span className="font-semibold">{stats.tasks.tasksByStatus.pending}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByStatus.pending / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">قيد التنفيذ</span>
                <span className="font-semibold">{stats.tasks.tasksByStatus.inProgress}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByStatus.inProgress / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">مكتمل</span>
                <span className="font-semibold">{stats.tasks.tasksByStatus.completed}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByStatus.completed / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">ملغي</span>
                <span className="font-semibold">{stats.tasks.tasksByStatus.cancelled}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByStatus.cancelled / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks by Priority */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-foreground me-2" />
            المهام حسب الأولوية
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">عاجل</span>
                <span className="font-semibold">{stats.tasks.tasksByPriority.urgent}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-red-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByPriority.urgent / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">عالي</span>
                <span className="font-semibold">{stats.tasks.tasksByPriority.high}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-orange-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByPriority.high / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">متوسط</span>
                <span className="font-semibold">{stats.tasks.tasksByPriority.medium}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByPriority.medium / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-600">منخفض</span>
                <span className="font-semibold">{stats.tasks.tasksByPriority.low}</span>
              </div>
              <div className="w-full bg-muted dark:bg-muted rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: `${(stats.tasks.tasksByPriority.low / stats.tasks.totalTasks) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Project Status */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <FolderIcon className="h-5 w-5 text-foreground me-2" />
            حالة المشاريع
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-success/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">نشط</p>
              <p className="text-2xl font-bold text-success dark:text-success">{stats.projects.activeProjects}</p>
            </div>
            <div className="bg-blue-50 dark:bg-primary/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">مكتمل</p>
              <p className="text-2xl font-bold text-primary dark:text-primary">{stats.projects.completedProjects}</p>
            </div>
            <div className="bg-yellow-50 dark:bg-warning/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">تخطيط</p>
              <p className="text-2xl font-bold text-warning dark:text-warning">{stats.projects.planningProjects}</p>
            </div>
            <div className="bg-gray-50 dark:bg-muted p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">متوقف</p>
              <p className="text-2xl font-bold text-foreground dark:text-muted-foreground">{stats.projects.onHoldProjects}</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-border dark:border-border">
            <div className="flex justify-between items-center">
              <span className="text-sm text-foreground dark:text-muted-foreground">متوسط التقدم</span>
              <span className="text-lg font-bold text-primary">{stats.projects.averageProgress}%</span>
            </div>
          </div>
        </div>

        {/* Budget Overview */}
        <div className="bg-card rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
            <CurrencyDollarIcon className="h-5 w-5 text-foreground dark:text-muted-foreground me-2" />
            نظرة عامة على الميزانية
          </h3>
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-primary/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">إجمالي الميزانية</p>
              <p className="text-2xl font-bold text-primary dark:text-primary">{formatPrice(stats.projects.totalBudget)}</p>
            </div>
            <div className="bg-orange-50 dark:bg-warning/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">المنفق</p>
              <p className="text-2xl font-bold text-warning dark:text-warning">{formatPrice(stats.projects.totalSpent)}</p>
            </div>
            <div className="bg-green-50 dark:bg-success/20 p-4 rounded-lg">
              <p className="text-sm text-foreground dark:text-muted-foreground">المتبقي</p>
              <p className="text-2xl font-bold text-success dark:text-success">
                {formatPrice(stats.projects.totalBudget - stats.projects.totalSpent)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-card rounded-lg shadow">
        <div className="p-6 border-b border-border dark:border-border">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <ArrowTrendingUpIcon className="h-5 w-5 text-foreground dark:text-muted-foreground me-2" />
            آخر المهام
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">المهمة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">المشروع</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">المسؤول</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">الحالة</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">الأولوية</th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:divide-border">
              {filteredRecentTasks.map((task) => (
                <tr key={task.id} className="hover:bg-muted/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {task.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground">
                    {task.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground dark:text-muted-foreground">
                    {task.assignedToName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(task.status)}`}>
                      {task.status === 'PENDING' ? 'في الانتظار' :
                        task.status === 'IN_PROGRESS' ? 'قيد التنفيذ' :
                          task.status === 'COMPLETED' ? 'مكتمل' : 'ملغي'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(task.priority)}`}>
                      {task.priority === 'URGENT' ? 'عاجل' :
                        task.priority === 'HIGH' ? 'عالي' :
                          task.priority === 'MEDIUM' ? 'متوسط' : 'منخفض'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default React.memo(Dashboard);

