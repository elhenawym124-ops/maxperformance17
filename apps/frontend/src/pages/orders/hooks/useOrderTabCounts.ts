import { useEffect, useState } from "react";
import { apiClient } from "../../../services/apiClient";

export interface OrderTabCounts {
  all?: number;
  unpaid?: number;
  unfulfilled?: number;
  completed?: number;
  cancelled?: number;
}

/**
 * Global per-tab order counts (Shopify-caliber): fetched once per mount,
 * unaffected by the active table filters. Any failure degrades silently —
 * tabs simply render without counts.
 */
export const useOrderTabCounts = (): OrderTabCounts => {
  const [counts, setCounts] = useState<OrderTabCounts>({});

  useEffect(() => {
    let cancelled = false;

    const summaryPromise = apiClient
      .get("/analytics/status-summary", {
        params: { statuses: "CONFIRMED,PROCESSING,DELIVERED,CANCELLED" },
      })
      .then((res: any) => {
        const rows: Array<{ status: string; ordersCount: number }> =
          res.data?.data?.rows || [];
        const by = (codes: string[]) =>
          rows
            .filter((r) => codes.includes(r.status))
            .reduce((s, r) => s + (r.ordersCount || 0), 0);
        return {
          unfulfilled: by(["CONFIRMED", "PROCESSING"]),
          completed: by(["DELIVERED"]),
          cancelled: by(["CANCELLED"]),
        } as Partial<OrderTabCounts>;
      })
      .catch(() => ({}));

    const unpaidPromise = apiClient
      .get("/orders-enhanced", { params: { paymentStatus: "PENDING", page: 1, limit: 1 } })
      .then((res: any) => ({
        unpaid: Number(res.data?.pagination?.total) || undefined,
      }))
      .catch(() => ({}));

    const allPromise = apiClient
      .get("/orders-enhanced", { params: { page: 1, limit: 1 } })
      .then((res: any) => ({
        all: Number(res.data?.pagination?.total) || undefined,
      }))
      .catch(() => ({}));

    Promise.all([summaryPromise, unpaidPromise, allPromise])
      .then(([summary, unpaid, all]) => {
        if (!cancelled) setCounts({ ...summary, ...unpaid, ...all });
      })
      .catch(() => {
        /* silent — tabs render without counts */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return counts;
};

export default useOrderTabCounts;
