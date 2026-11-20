import React, { useState, useEffect } from "react";
import {
  CalendarIcon,
  ClockIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  PlayIcon,
  PauseIcon,
} from "@heroicons/react/24/outline";
import { broadcastService } from "../../services/broadcastService";

interface ScheduledCampaign {
  id: string;
  name: string;
  message: string;
  targetAudience: string;
  scheduledAt: string;
  status: "scheduled" | "paused" | "cancelled";
  recipientCount: number;
  priority: "low" | "medium" | "high";
  tags: string[];
  createdAt: string;
  estimatedDeliveryTime: string;
  canEdit: boolean;
  canCancel: boolean;
}

const ScheduledCampaigns: React.FC = () => {
  const [campaigns, setCampaigns] = useState<ScheduledCampaign[]>([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState<
    ScheduledCampaign[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "scheduled" | "paused"
  >("all");
  const [priorityFilter, setPriorityFilter] = useState<
    "all" | "low" | "medium" | "high"
  >("all");
  const [selectedCampaign, setSelectedCampaign] =
    useState<ScheduledCampaign | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);

  const loadScheduledCampaigns = async () => {
    try {
      setLoading(true);

      // Load scheduled campaigns from API
      const campaignsData = await broadcastService.getCampaigns();

      const allCampaigns = Array.isArray(campaignsData)
        ? campaignsData
        : Array.isArray(campaignsData?.campaigns)
          ? campaignsData.campaigns
          : [];
      const scheduledCampaigns = allCampaigns.filter(
        (campaign: any) => campaign.scheduledAt !== null,
      );

      setCampaigns(scheduledCampaigns);
    } catch (error) {
      console.error("Error loading scheduled campaigns:", error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    loadScheduledCampaigns();
  }, []);

  useEffect(() => {
    filterCampaigns();
  }, [campaigns, searchTerm, statusFilter, priorityFilter]);

  const filterCampaigns = () => {
    let filtered = campaigns;

    if (searchTerm) {
      filtered = filtered.filter(
        (campaign) =>
          campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
          campaign.targetAudience
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (campaign) => campaign.status === statusFilter,
      );
    }

    if (priorityFilter !== "all") {
      filtered = filtered.filter(
        (campaign) => campaign.priority === priorityFilter,
      );
    }

    setFilteredCampaigns(filtered);
  };

  const handleEdit = (campaign: ScheduledCampaign) => {
    setSelectedCampaign(campaign);
    // TODO: Implement edit functionality
    console.log("Edit campaign:", campaign);
  };

  const handleCancel = (campaign: ScheduledCampaign) => {
    setSelectedCampaign(campaign);
    setShowCancelModal(true);
  };

  const handlePreview = (campaign: ScheduledCampaign) => {
    setSelectedCampaign(campaign);
    setShowPreview(true);
  };

  const confirmCancel = async () => {
    if (!selectedCampaign) return;

    try {
      // Mock API call - replace with actual implementation
      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === selectedCampaign.id
            ? { ...c, status: "cancelled" as const }
            : c,
        ),
      );

      setShowCancelModal(false);
      setSelectedCampaign(null);
    } catch (error) {
      console.error("Error cancelling campaign:", error);
    }
  };

  const togglePause = async (campaign: ScheduledCampaign) => {
    try {
      const newStatus =
        campaign.status === "scheduled" ? "paused" : "scheduled";

      setCampaigns((prev) =>
        prev.map((c) =>
          c.id === campaign.id
            ? { ...c, status: newStatus as "scheduled" | "paused" }
            : c,
        ),
      );
    } catch (error) {
      console.error("Error toggling campaign status:", error);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-destructive";
      case "medium":
        return "text-yellow-600 bg-warning";
      case "low":
        return "text-green-600 bg-success";
      default:
        return "text-gray-600 bg-muted";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "scheduled":
        return "text-blue-600 bg-primary";
      case "paused":
        return "text-yellow-600 bg-warning";
      case "cancelled":
        return "text-red-600 bg-destructive";
      default:
        return "text-gray-600 bg-muted";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "scheduled":
        return "مجدولة";
      case "paused":
        return "متوقفة";
      case "cancelled":
        return "ملغية";
      default:
        return status;
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "high":
        return "عالية";
      case "medium":
        return "متوسطة";
      case "low":
        return "منخفضة";
      default:
        return priority;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg leading-6 font-medium text-foreground">
          الحملات المجدولة ({filteredCampaigns.length})
        </h3>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg shadow-sm border border-border dark:border-border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute right-3 top-3 text-muted-foreground" />
            <input
              type="text"
              placeholder="البحث في الحملات..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pe-10 ps-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-muted dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-muted dark:text-white"
          >
            <option value="all">جميع الحالات</option>
            <option value="scheduled">مجدولة</option>
            <option value="paused">متوقفة</option>
          </select>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary dark:bg-muted dark:text-white"
          >
            <option value="all">جميع الأولويات</option>
            <option value="high">عالية</option>
            <option value="medium">متوسطة</option>
            <option value="low">منخفضة</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={loadScheduledCampaigns}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary flex items-center justify-center"
          >
            <FunnelIcon className="h-4 w-4 ms-2" />
            تحديث
          </button>
        </div>
      </div>

      {/* Campaigns List */}
      {filteredCampaigns.length === 0 ? (
        <div className="text-center py-12">
          <CalendarIcon className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-2 text-sm font-medium text-foreground">
            لا توجد حملات مجدولة
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">ابدأ بإنشاء حملة جديدة</p>
        </div>
      ) : (
        <div className="bg-card shadow-sm rounded-lg border border-border dark:border-border">
          <ul className="divide-y divide-border dark:divide-border">
            {filteredCampaigns.map((campaign) => (
              <li key={campaign.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <h4 className="text-lg font-medium text-foreground">
                        {campaign.name}
                      </h4>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(campaign.status)}`}
                      >
                        {getStatusText(campaign.status)}
                      </span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(campaign.priority)}`}
                      >
                        {getPriorityText(campaign.priority)}
                      </span>
                    </div>

                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                      {campaign.message}
                    </p>

                    <div className="mt-3 flex items-center space-x-6 space-x-reverse text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 ms-1" />
                        {new Date(campaign.scheduledAt).toLocaleString(
                          "ar-EG",
                          {
                            calendar: "gregory",
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          },
                        )}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 ms-1" />
                        {campaign.estimatedDeliveryTime}
                      </div>
                      <div>
                        {campaign.recipientCount.toLocaleString()} مستلم
                      </div>
                      <div>{campaign.targetAudience}</div>
                    </div>

                    {campaign.tags &&
                      Array.isArray(campaign.tags) &&
                      campaign.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {campaign.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-muted text-foreground rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="flex items-center space-x-2 space-x-reverse">
                    <button
                      onClick={() => handlePreview(campaign)}
                      className="p-2 text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                      title="معاينة"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </button>

                    {campaign.canEdit && (
                      <button
                        onClick={() => handleEdit(campaign)}
                        className="p-2 text-primary hover:text-primary"
                        title="تعديل"
                      >
                        <PencilIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => togglePause(campaign)}
                      className="p-2 text-warning hover:text-warning"
                      title={
                        campaign.status === "scheduled"
                          ? "إيقاف مؤقت"
                          : "استئناف"
                      }
                    >
                      {campaign.status === "scheduled" ? (
                        <PauseIcon className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                    </button>

                    {campaign.canCancel && (
                      <button
                        onClick={() => handleCancel(campaign)}
                        className="p-2 text-destructive hover:text-destructive"
                        title="إلغاء"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedCampaign && (
        <div className="fixed inset-0 bg-muted bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-foreground">
                معاينة الحملة: {selectedCampaign.name}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-foreground"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground">
                  الرسالة:
                </label>
                <div className="mt-1 p-3 border border-border rounded-md bg-muted dark:bg-muted">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {selectedCampaign.message}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    الجمهور المستهدف:
                  </label>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedCampaign.targetAudience}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">
                    عدد المستلمين:
                  </label>
                  <p className="mt-1 text-sm text-foreground">
                    {selectedCampaign.recipientCount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && selectedCampaign && (
        <div className="fixed inset-0 bg-muted bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-card">
            <div className="mt-3 text-center">
              <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="text-lg font-medium text-foreground mt-2">
                تأكيد إلغاء الحملة
              </h3>
              <p className="text-sm text-muted-foreground mt-2">
                هل أنت متأكد من إلغاء حملة "{selectedCampaign.name}"؟ لا يمكن
                التراجع عن هذا الإجراء.
              </p>
              <div className="flex justify-center space-x-4 space-x-reverse mt-4">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="px-4 py-2 bg-muted text-foreground rounded-md hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  onClick={confirmCancel}
                  className="px-4 py-2 bg-destructive text-white rounded-md hover:bg-destructive"
                >
                  تأكيد الإلغاء
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledCampaigns;
