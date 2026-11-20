import type { ShipmentRowItem } from "./ShipmentStatementTable";

export interface ShipmentStatusBadgeResult {
  label: string;
  className: string;
}

/**
 * Maps shipment status strings to human-readable Arabic labels and chassis badge styling
 */
export function getShipmentStatusBadge(status: string, shipment?: ShipmentRowItem): ShipmentStatusBadgeResult {
  const s = String(shipment?.order?.turboShipmentStatus || status || "").toLowerCase().trim();

  if (["incomplete", "status_18", "status_99", "18", "99"].includes(s) || s.includes("غير مكتمل")) {
    return {
      label: "غير مكتملة",
      className: "bg-warning/10 text-warning dark:text-warning border border-warning/20",
    };
  }
  if (
    ["turbo_sent", "sent", "waiting", "pending", "status_1", "status_2", "1", "2", "booked"].includes(s) ||
    s.includes("انتظار") || s.includes("بانتظار")
  ) {
    return {
      label: "قيد الإنتظار",
      className: "bg-primary/10 text-primary dark:text-primary border border-primary/20",
    };
  }
  if (["turbo_saved", "created", "draft"].includes(s)) {
    return {
      label: "مسودة محلية",
      className: "/10/10bg-muted text-foreground dark:dark:text-muted-foreground border /20/20border-border",
    };
  }
  if (["processing", "underway", "accepted", "status_3", "3"].includes(s) || s.includes("تنفيذ")) {
    return {
      label: "قيد التنفيذ",
      className: "bg-primary/10 text-primary dark:text-primary border border-primary/20",
    };
  }
  if (["out_for_delivery", "under delivery", "with captain", "in transit", "shipped", "status_4", "4"].includes(s) || s.includes("مسلمة للمندوب")) {
    return {
      label: "مسلمة للمندوب",
      className: "bg-primary/10 text-primary dark:text-primary border border-primary/20",
    };
  }
  if (["delayed", "on hold", "status_13", "13"].includes(s) || s.includes("مؤجل")) {
    return {
      label: "مؤجلة مع المندوب",
      className: "bg-warning/15 text-warning dark:text-warning border border-warning/30 font-medium",
    };
  }
  if (["delivered", "completed", "status_7", "7"].includes(s) || s.includes("تسليم")) {
    return {
      label: "تم التسليم",
      className: "bg-success/10 text-success dark:text-success border border-success/20 font-semibold",
    };
  }
  if (["returned_to_company", "returned with company", "returned", "status_5", "status_14", "5", "14"].includes(s)) {
    return {
      label: "مرتجعات في الشركة",
      className: "bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20 font-semibold",
    };
  }
  if (["returned_destroyed", "status_12", "status_17", "12", "17"].includes(s) || s.includes("معدوم")) {
    return {
      label: "مرتجعات معدومة",
      className: "bg-destructive/10 text-destructive dark:text-destructive border border-destructive/20",
    };
  }
  if (["returned_missing", "lost", "status_11", "status_16", "11", "16"].includes(s) || s.includes("مفقود")) {
    return {
      label: "مرتجعات مفقودة",
      className: "bg-warning/10 text-warning dark:text-warning border border-warning/20",
    };
  }
  if (["returned_resent", "status_10", "status_15", "10", "15"].includes(s) || s.includes("ارسال")) {
    return {
      label: "معاد ارسالها",
      className: "bg-info/10 text-info dark:text-info border border-info/20",
    };
  }
  if (["remitted", "supplied", "status_8", "status_19", "8", "19"].includes(s) || s.includes("توريد")) {
    return {
      label: "تم التوريد",
      className: "bg-success/15 text-success dark:text-success border border-success/30 font-bold",
    };
  }
  if (["returned_received", "status_20", "20"].includes(s) || s.includes("وصلتني")) {
    return {
      label: "مرتجعات وصلتني",
      className: "bg-primary/10 text-primary dark:text-primary border border-primary/20 font-semibold",
    };
  }
  if (["cancelled", "status_6", "6"].includes(s) || s.includes("ملغي")) {
    return {
      label: "ملغي",
      className: "bg-muted text-muted-foreground border border-border/70",
    };
  }

  return {
    label: status || "غير محدد",
    className: "bg-muted text-muted-foreground border border-border/70",
  };
}
