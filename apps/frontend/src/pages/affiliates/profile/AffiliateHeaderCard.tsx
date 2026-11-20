import React from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeftIcon,
  ShoppingBagIcon,
  UserCircleIcon,
  CheckCircleIcon,
  XCircleIcon,
  AdjustmentsHorizontalIcon,
} from "@heroicons/react/24/outline";
import { AffiliateRecord } from "./types";
import { formatDate, statusLabels, statusTone } from "./helpers";

interface AffiliateHeaderCardProps {
  affiliate: AffiliateRecord;
  displayName: string;
  saving: boolean;
  onUpdateStatus?: (status: "ACTIVE" | "PENDING" | "SUSPENDED") => void;
  updateStatus?: (status: "ACTIVE" | "PENDING" | "SUSPENDED") => void;
}

export const AffiliateHeaderCard: React.FC<AffiliateHeaderCardProps> = ({
  affiliate,
  displayName,
  saving,
  onUpdateStatus,
  updateStatus,
}) => {
  const navigate = useNavigate();
  const handleUpdate = onUpdateStatus || updateStatus;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => navigate("/affiliates/management")}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl border border-border bg-white px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted dark:border-border dark:bg-muted dark:text-muted-foreground cursor-pointer"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          إدارة المسوقين
        </button>
        <Link
          to={`/orders?page=1&limit=20&affiliateId=${affiliate.id}`}
          className="inline-flex min-h-10 w-fit items-center gap-2 rounded-xl bg-muted px-4 py-2 text-sm font-semibold text-white transition hover:bg-muted dark:bg-white dark:text-foreground"
        >
          <ShoppingBagIcon className="h-4 w-4" />
          طلبات هذا المسوق
        </Link>
      </div>

      <section className="rounded-xl border border-border bg-white p-5 shadow-sm dark:border-border dark:bg-muted">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-start gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary bg-primary/10 text-primary dark:border-primary/20 dark:bg-primary/10 dark:text-primary">
              <UserCircleIcon className="h-9 w-9" />
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-bold sm:text-3xl">
                  {displayName}
                </h1>
                <span
                  className={`rounded-full border px-3 py-1 text-xs font-bold ${statusTone(
                    affiliate.status,
                  )}`}
                >
                  {statusLabels[affiliate.status] || affiliate.status}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground dark:text-muted-foreground">
                <span>{affiliate.user.email || "بدون بريد"}</span>
                <span>{affiliate.user.phone || "بدون هاتف"}</span>
                <span>كود: {affiliate.affiliateCode}</span>
                <span>منذ {formatDate(affiliate.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[420px]">
            <button
              onClick={() => handleUpdate?.("ACTIVE")}
              disabled={saving || affiliate.status === "ACTIVE"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-success bg-success/10 px-3 text-sm font-semibold text-success transition hover:bg-success disabled:opacity-50 dark:border-success/20 dark:bg-success/10 dark:text-success cursor-pointer"
            >
              <CheckCircleIcon className="h-4 w-4" />
              تفعيل
            </button>
            <button
              onClick={() => handleUpdate?.("SUSPENDED")}
              disabled={saving || affiliate.status === "SUSPENDED"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-destructive bg-destructive/10 px-3 text-sm font-semibold text-destructive transition hover:bg-destructive disabled:opacity-50 dark:border-destructive/20 dark:bg-destructive/10 dark:text-destructive cursor-pointer"
            >
              <XCircleIcon className="h-4 w-4" />
              إيقاف
            </button>
            <button
              onClick={() => handleUpdate?.("PENDING")}
              disabled={saving || affiliate.status === "PENDING"}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-warning bg-warning/10 px-3 text-sm font-semibold text-warning transition hover:bg-warning disabled:opacity-50 dark:border-warning/20 dark:bg-warning/10 dark:text-warning cursor-pointer"
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4" />
              مراجعة
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
