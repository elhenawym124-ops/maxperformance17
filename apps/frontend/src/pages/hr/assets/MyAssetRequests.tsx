import React, { useState, useEffect } from "react";
import i18n from "../../../i18n";
import {
  PlusIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { apiClient } from "../../../services/apiClient";

interface AssetRequest {
  id: string;
  assetType: string;
  category?: string;
  reason: string;
  priority: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "FULFILLED" | "CANCELLED";
  approvedAt?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  fulfilledAt?: string;
  notes?: string;
  createdAt: string;
  asset?: {
    id: string;
    name: string;
    code: string;
  };
}

const MyAssetRequests: React.FC = () => {
  const [requests, setRequests] = useState<AssetRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    assetType: "",
    category: "",
    reason: "",
    priority: "NORMAL",
  });

  useEffect(() => {
    loadMyRequests();
  }, []);

  const loadMyRequests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get("/hr/assets/requests/my");
      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error loading my requests:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.assetType.trim() || !formData.reason.trim()) {
      alert(i18n.t("MyAssetRequests.msg_bf3c"));
      return;
    }

    try {
      const response = await apiClient.post("/hr/assets/requests", formData);
      if (response.data.success) {
        loadMyRequests();
        setShowCreateModal(false);
        setFormData({
          assetType: "",
          category: "",
          reason: "",
          priority: "NORMAL",
        });
        alert(i18n.t("MyAssetRequests.success_send_7573"));
      }
    } catch (error) {
      console.error("Error creating request:", error);
      alert(i18n.t("MyAssetRequests.failed_send_d330"));
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      PENDING: "bg-yellow-100 text-warning",
      APPROVED: "bg-blue-100 text-blue-800",
      REJECTED: "bg-red-100 text-destructive",
      FULFILLED: "bg-green-100 text-success",
      CANCELLED: "bg-gray-100 text-foreground",
    };
    return badges[status as keyof typeof badges] || badges.PENDING;
  };

  const getStatusText = (status: string) => {
    const texts = {
      PENDING: "قيد الانتظار",
      APPROVED: "موافق عليه",
      REJECTED: "مرفوض",
      FULFILLED: "تم التنفيذ",
      CANCELLED: "ملغي",
    };
    return texts[status as keyof typeof texts] || status;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">
          طلباتي
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <PlusIcon className="h-5 w-5 me-2" />
          طلب جديد
        </button>
      </div>

      {/* Requests List */}
      <div className="bg-card shadow-sm rounded-lg overflow-hidden">
        <div className="divide-y divide-border dark:divide-border">
          {requests.map((request) => (
            <div
              key={request.id}
              className="p-6 hover:bg-muted/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-medium text-foreground">
                      {request.assetType}
                    </h3>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(request.status)}`}
                    >
                      {getStatusText(request.status)}
                    </span>
                  </div>
                  {request.category && (
                    <p className="text-sm text-muted-foreground mb-2">
                      التصنيف: {request.category}
                    </p>
                  )}
                  <p className="text-sm text-foreground mb-3">
                    {request.reason}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      تاريخ الطلب:{" "}
                      {new Date(request.createdAt).toLocaleDateString("ar-EG")}
                    </span>
                    <span>الأولوية: {request.priority}</span>
                  </div>

                  {request.status === "REJECTED" && request.rejectionReason && (
                    <div className="mt-3 p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg">
                      <p className="text-sm text-destructive dark:text-destructive">
                        <strong>سبب الرفض:</strong> {request.rejectionReason}
                      </p>
                    </div>
                  )}

                  {request.status === "FULFILLED" && request.asset && (
                    <div className="mt-3 p-3 bg-success/10 dark:bg-success/20 rounded-lg">
                      <p className="text-sm text-success dark:text-success">
                        <strong>تم التخصيص:</strong> {request.asset.name} (
                        {request.asset.code})
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {requests.length === 0 && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              لا توجد طلبات
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <PlusIcon className="h-5 w-5 me-2" />
              إنشاء طلب جديد
            </button>
          </div>
        )}
      </div>

      {/* Create Request Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              طلب عهدة جديد
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  نوع الأصل *
                </label>
                <input
                  type="text"
                  value={formData.assetType}
                  onChange={(e) =>
                    setFormData({ ...formData, assetType: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder="مثال: لابتوب، موبايل، سيارة..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  التصنيف (اختياري)
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder="مثال: أجهزة إلكترونية، مركبات..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  سبب الطلب *
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  rows={4}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                  placeholder="اشرح سبب احتياجك لهذا الأصل..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  الأولوية
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="LOW">منخفضة</option>
                  <option value="NORMAL">عادية</option>
                  <option value="HIGH">عالية</option>
                  <option value="URGENT">عاجلة</option>
                </select>
              </div>

              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      assetType: "",
                      category: "",
                      reason: "",
                      priority: "NORMAL",
                    });
                  }}
                  className="px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted dark:hover:bg-muted"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-primary text-primary-foreground rounded-lg hover:bg-primary"
                >
                  إرسال الطلب
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAssetRequests;
