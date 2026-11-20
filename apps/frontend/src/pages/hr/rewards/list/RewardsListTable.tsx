import React from "react";
import { useTranslation } from "react-i18next";
import {
  Award,
  Check,
  CheckCircle,
  Clock,
  Edit,
  Eye,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import {
  canUserApproveReward,
  canUserDeleteReward,
  canUserEditReward,
  normalizeRewardStatus,
  RewardUiStatus,
} from "../rewardRecordUtils";
import { RewardRecord, RewardListPagination } from "./types";
import {
  REWARD_STATUS_BADGE_CONFIG,
  getRewardCategoryBadgeConfig,
} from "./helpers";

interface RewardsListTableProps {
  records: RewardRecord[];
  userRole?: string;
  deleting: boolean;
  pagination: RewardListPagination;
  onPageChange: (nextPage: number) => void;
  onNavigate: (path: string) => void;
  onDeleteClick: (record: RewardRecord) => void;
  onStatusUpdate: (id: string, action: "approve" | "reject") => void;
}

const renderStatusBadge = (status: RewardUiStatus) => {
  const config = REWARD_STATUS_BADGE_CONFIG[status];
  const Icon =
    status === "PENDING"
      ? Clock
      : status === "APPROVED" || status === "APPLIED"
        ? CheckCircle
        : XCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.className}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
};

export const RewardsListTable: React.FC<RewardsListTableProps> = ({
  records,
  userRole,
  deleting,
  pagination,
  onPageChange,
  onNavigate,
  onDeleteClick,
  onStatusUpdate,
}) => {
  const { t } = useTranslation();

  if (records.length === 0) {
    return (
      <div className="bg-card rounded-lg shadow p-12 text-center">
        <Award className="w-16 h-16 text-muted-foreground dark:text-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">
          لا توجد مكافآت
        </h3>
        <p className="text-gray-600 dark:text-muted-foreground mb-4">
          لم يتم العثور على أي مكافآت بالفلاتر المحددة
        </p>
        <button
          onClick={() => onNavigate("/hr/rewards/create")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {t("rewards.form.addReward")}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-border dark:divide-border">
          <thead className="bg-gray-50 dark:bg-muted">
            <tr>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                الموظف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                المكافأة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                التصنيف
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                القيمة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                الفترة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                الحالة
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase">
                إجراءات
              </th>
            </tr>
          </thead>
          <tbody className="bg-card divide-y divide-border dark:divide-border">
            {records.map((record) => {
              const normalizedStatus = normalizeRewardStatus(record);
              const canApproveThisReward =
                normalizedStatus === "PENDING" &&
                canUserApproveReward(userRole);
              const canEditThisReward =
                normalizedStatus === "PENDING" && canUserEditReward(userRole);
              const canDeleteThisReward = canUserDeleteReward(userRole);
              const catConfig = getRewardCategoryBadgeConfig(
                record.rewardCategory,
              );

              return (
                <tr
                  key={record.id}
                  className="hover:bg-muted/50"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-foreground">
                        {record.user.firstName} {record.user.lastName}
                      </div>
                      <div className="text-sm text-muted-foreground font-mono tabular-nums">
                        {record.user.employeeNumber}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-foreground">
                      {record.rewardType?.nameAr || record.rewardName}
                    </div>
                    {record.reason && (
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {record.reason}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${catConfig.className}`}
                    >
                      {catConfig.label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-success">
                      <span className="font-mono tabular-nums">
                        {record.calculatedValue.toLocaleString()}
                      </span>{" "}
                      ج.م
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-foreground font-mono tabular-nums">
                      {record.appliedMonth}/{record.appliedYear}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {renderStatusBadge(normalizedStatus)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onNavigate(`/hr/rewards/${record.id}`)}
                        className="text-blue-600 hover:text-blue-700"
                        title="عرض التفاصيل"
                        aria-label="عرض التفاصيل"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {canDeleteThisReward && (
                        <button
                          onClick={() => onDeleteClick(record)}
                          disabled={deleting}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-destructive bg-destructive/10 text-destructive transition-colors hover:border-destructive hover:bg-destructive hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground"
                          title={t("rewards.delete.tooltip")}
                          aria-label={`${t("rewards.delete.tooltip")} ${record.rewardType?.nameAr || record.rewardName}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      {canApproveThisReward && (
                        <>
                          <button
                            onClick={() => onStatusUpdate(record.id, "approve")}
                            className="text-green-600 hover:text-success"
                            title="اعتماد"
                            aria-label="اعتماد"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => onStatusUpdate(record.id, "reject")}
                            className="text-orange-600 hover:text-warning"
                            title="رفض"
                            aria-label="رفض"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {canEditThisReward && (
                        <button
                          onClick={() =>
                            onNavigate(`/hr/rewards/edit/${record.id}`)
                          }
                          className="text-blue-600 hover:text-blue-700"
                          title="تعديل"
                          aria-label="تعديل"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="px-6 py-4 border-t border-border dark:border-border flex items-center justify-between">
          <div className="text-sm text-foreground">
            عرض{" "}
            <span className="font-mono tabular-nums">
              {(pagination.page - 1) * pagination.limit + 1}
            </span>{" "}
            إلى{" "}
            <span className="font-mono tabular-nums">
              {Math.min(pagination.page * pagination.limit, pagination.total)}
            </span>{" "}
            من{" "}
            <span className="font-mono tabular-nums">{pagination.total}</span>{" "}
            نتيجة
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={pagination.page === 1}
              className="px-3 py-1 border border-border rounded hover:bg-muted/50 dark:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              السابق
            </button>
            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={pagination.page === pagination.totalPages}
              className="px-3 py-1 border border-border rounded hover:bg-muted/50 dark:text-muted-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
