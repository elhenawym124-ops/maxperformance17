import React, { useState, useEffect } from "react";
import { useDateFormat } from "../../hooks/useDateFormat";
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  EyeIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { broadcastService } from "../../services/broadcastService";

interface CampaignMetrics {
  campaignId: string;
  campaignName: string;
  sentAt: string;
  recipientCount: number;
  deliveredCount: number;
  openedCount: number;
  clickedCount: number;
  repliedCount: number;
  unsubscribedCount: number;
  deliveryRate: number;
  openRate: number;
  clickRate: number;
  replyRate: number;
  unsubscribeRate: number;
  revenue?: number;
  conversions?: number;
}

interface AnalyticsData {
  totalCampaigns: number;
  totalRecipients: number;
  averageOpenRate: number;
  averageClickRate: number;
  totalRevenue: number;
  bestPerformingTime: string;
  campaignMetrics: CampaignMetrics[];
  timeSeriesData: {
    date: string;
    campaigns: number;
    opens: number;
    clicks: number;
    revenue: number;
  }[];
}

const CampaignAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(
    null,
  );
  const [selectedPeriod, setSelectedPeriod] = useState<"7d" | "30d" | "90d">(
    "30d",
  );
  const [loading, setLoading] = useState(true);
  const { formatDate } = useDateFormat();

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);

      console.log("📊 Loading analytics data for period:", selectedPeriod);
      const response = await broadcastService.getAnalytics(selectedPeriod);
      console.log("📊 Analytics response:", response);

      // Handle different response formats
      let analyticsData = null;
      if (response && typeof response === "object") {
        if ("data" in response) {
          analyticsData = (response as any).data;
        } else if ("success" in response && "data" in response) {
          analyticsData = (response as any).data;
        } else {
          analyticsData = response;
        }
      }

      if (analyticsData) {
        setAnalyticsData(analyticsData);
      } else {
        // Fallback to mock data if no data available
        const mockData: AnalyticsData = {
          totalCampaigns: 0,
          totalRecipients: 0,
          averageOpenRate: 0,
          averageClickRate: 0,
          totalRevenue: 0,
          bestPerformingTime: "10:00 صباحاً",
          campaignMetrics: [],
          timeSeriesData: [],
        };
        setAnalyticsData(mockData);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
      // Fallback to empty data on error
      const emptyData: AnalyticsData = {
        totalCampaigns: 0,
        totalRecipients: 0,
        averageOpenRate: 0,
        averageClickRate: 0,
        totalRevenue: 0,
        bestPerformingTime: "10:00 صباحاً",
        campaignMetrics: [],
        timeSeriesData: [],
      };
      setAnalyticsData(emptyData);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (
    rate: number,
    type: "open" | "click" | "reply",
  ) => {
    const thresholds = {
      open: { good: 50, excellent: 70 },
      click: { good: 8, excellent: 15 },
      reply: { good: 1, excellent: 3 },
    };

    const threshold = thresholds[type];
    if (rate >= threshold.excellent) return "text-green-600 bg-success";
    if (rate >= threshold.good) return "text-yellow-600 bg-warning";
    return "text-red-600 bg-destructive";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-2 text-sm font-medium text-foreground">
          لا توجد بيانات
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          لم يتم العثور على بيانات إحصائية
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-foreground">
          إحصائيات الحملات
        </h3>
        <div className="flex items-center space-x-2 space-x-reverse">
          <label className="text-sm text-muted-foreground">الفترة:</label>
          <select
            value={selectedPeriod}
            onChange={(e) =>
              setSelectedPeriod(e.target.value as "7d" | "30d" | "90d")
            }
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary focus:border-primary text-sm"
          >
            <option value="7d">آخر 7 أيام</option>
            <option value="30d">آخر 30 يوم</option>
            <option value="90d">آخر 90 يوم</option>
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="me-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    إجمالي الحملات
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analyticsData.totalCampaigns}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserGroupIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="me-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    إجمالي المستلمين
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analyticsData.totalRecipients.toLocaleString()}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <EyeIcon className="h-6 w-6 text-success" />
              </div>
              <div className="me-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    متوسط معدل الفتح
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {analyticsData.averageOpenRate}%
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-card overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="me-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-muted-foreground truncate">
                    إجمالي الإيرادات
                  </dt>
                  <dd className="text-lg font-medium text-foreground">
                    {formatCurrency(analyticsData.totalRevenue)}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Insights */}
      <div className="bg-card shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
            رؤى الأداء
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsData.bestPerformingTime}
              </div>
              <div className="text-sm text-muted-foreground">أفضل وقت للإرسال</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {analyticsData.averageClickRate}%
              </div>
              <div className="text-sm text-muted-foreground">متوسط معدل النقر</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {analyticsData.campaignMetrics.reduce(
                  (sum, c) => sum + (c.conversions || 0),
                  0,
                )}
              </div>
              <div className="text-sm text-muted-foreground">إجمالي التحويلات</div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaign Performance Table */}
      <div className="bg-card shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-foreground">
            أداء الحملات
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            تفاصيل أداء كل حملة على حدة
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border dark:divide-border">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  الحملة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  المستلمون
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  معدل التسليم
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  معدل الفتح
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  معدل النقر
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  الإيرادات
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground dark:text-muted-foreground uppercase tracking-wider">
                  التحويلات
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:divide-border">
              {analyticsData.campaignMetrics.map((campaign) => (
                <tr
                  key={campaign.campaignId}
                  className="hover:bg-muted/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {campaign.campaignName}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(campaign.sentAt)}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {campaign.recipientCount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        campaign.deliveryRate >= 98
                          ? "text-green-800 bg-success"
                          : campaign.deliveryRate >= 95
                            ? "text-yellow-800 bg-warning"
                            : "text-red-800 bg-destructive"
                      }`}
                    >
                      {campaign.deliveryRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(campaign.openRate, "open")}`}
                    >
                      {campaign.openRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPerformanceColor(campaign.clickRate, "click")}`}
                    >
                      {campaign.clickRate}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {campaign.revenue ? formatCurrency(campaign.revenue) : "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {campaign.conversions || "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Time Series Chart Placeholder */}
      <div className="bg-card shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-foreground mb-4">
            اتجاهات الأداء
          </h3>
          <div className="text-center py-12">
            <ChartBarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-medium text-foreground">
              الرسوم البيانية قيد التطوير
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              ستتوفر الرسوم البيانية التفاعلية قريباً
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignAnalytics;
