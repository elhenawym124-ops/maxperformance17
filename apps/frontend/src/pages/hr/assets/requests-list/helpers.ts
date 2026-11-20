export const getAssetRequestBadgeClassName = (status: string): string => {
  const badges: Record<string, string> = {
    PENDING: "bg-yellow-100 text-warning",
    APPROVED: "bg-blue-100 text-blue-800",
    REJECTED: "bg-red-100 text-destructive",
    FULFILLED: "bg-green-100 text-success",
    CANCELLED: "bg-gray-100 text-foreground",
  };
  return badges[status] || badges.PENDING;
};

export const getAssetRequestStatusText = (status: string): string => {
  const texts: Record<string, string> = {
    PENDING: "قيد الانتظار",
    APPROVED: "موافق عليه",
    REJECTED: "مرفوض",
    FULFILLED: "تم التنفيذ",
    CANCELLED: "ملغي",
  };
  return texts[status] || status;
};

export const getAssetRequestPriorityBadge = (priority: string): string => {
  const badges: Record<string, string> = {
    LOW: "bg-gray-100 text-foreground",
    NORMAL: "bg-blue-100 text-blue-800",
    HIGH: "bg-orange-100 text-warning",
    URGENT: "bg-red-100 text-destructive",
  };
  return badges[priority] || badges.NORMAL;
};
