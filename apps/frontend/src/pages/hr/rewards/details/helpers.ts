import { RewardUiStatus } from "../rewardRecordUtils";
import { RewardDetailsRecord } from "./types";

export const REWARD_DETAILS_STATUS_CONFIG: Record<
  RewardUiStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "قيد الانتظار",
    className: "bg-yellow-100 text-warning border-warning",
  },
  APPROVED: {
    label: "معتمد",
    className: "bg-green-100 text-success border-success",
  },
  APPLIED: {
    label: "مطبق",
    className: "bg-blue-100 text-blue-800 border-blue-300",
  },
  REJECTED: {
    label: "مرفوض",
    className: "bg-red-100 text-destructive border-destructive",
  },
  VOIDED: {
    label: "ملغي",
    className: "bg-gray-100 text-foreground border-border",
  },
};

export const formatCalculationDetails = (
  calculationDetails?: string,
): string | null => {
  if (!calculationDetails) return null;
  try {
    return JSON.stringify(JSON.parse(calculationDetails), null, 2);
  } catch {
    return calculationDetails;
  }
};

export const deriveRewardTypeMeta = (reward: RewardDetailsRecord) => ({
  rewardTypeName:
    reward.rewardType?.name || reward.rewardName || "مكافأة مخصصة",
  rewardTypeNameAr: reward.rewardType?.nameAr || null,
  rewardTypeCalculationMethod:
    reward.rewardType?.calculationMethod || "مخصص",
  rewardTypeFrequency: reward.rewardType?.frequency || "حسب السجل",
  rewardTypeDescription:
    reward.rewardType?.description ||
    (!reward.rewardType
      ? "هذه المكافأة لا ترتبط بنوع مكافأة محفوظ، وتم تسجيلها كسجل مخصص."
      : null),
});
