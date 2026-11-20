/* eslint-disable @typescript-eslint/no-explicit-any */
export interface TicketCategory {
  id: number | string;
  name: string;
  nameEn?: string;
  type?: number | string;
}

export interface TicketMessage {
  id?: number | string;
  content?: string;
  message?: string;
  is_client_message?: boolean | number;
  created_at?: string;
  attachment?: string | null;
  user?: { name?: string };
}

export interface OrderTicketItem {
  id: number;
  code?: string;
  status?: any;
  priority?: string;
  subject?: string;
  created_at?: string;
  updated_at?: string;
  last_message?: any;
  messages?: TicketMessage[];
  replies?: TicketMessage[];
  type?: string;
  category?: { name?: string };
}

export const fallbackCategories: TicketCategory[] = [
  { id: 26, name: "شكوى › تسليم الطرد › مشكلة مع الكابتن", type: "shipments" },
  { id: 19, name: "شكوى › تسليم الطرد › تأخير التسليم", type: "shipments" },
  { id: 65, name: "شكوى › تسليم الطرد › إفادة وهمية", type: "shipments" },
  { id: 23, name: "شكوى › تسليم الطرد › تلف الطرد", type: "shipments" },
  { id: 22, name: "شكوى › تسليم الطرد › تبديل فى التسليم", type: "shipments" },
  { id: 63, name: "شكوى › تسليم الطرد › طرد مفقود", type: "shipments" },
  { id: 64, name: "شكوى › تسليم الطرد › جزء من الطرد مفقود", type: "shipments" },
  { id: 67, name: "شكوى › تسليم الطرد › مرتجع على الراسل غير مستحق", type: "shipments" },
  { id: 2, name: "شكوى عامة", type: "others" },
  { id: 1, name: "استفسار عام", type: "others" },
];

export const getStatusBadge = (status: any) => {
  let val = "";
  let label = "";

  if (status && typeof status === "object") {
    val = String(status.value || "").toLowerCase().trim();
    label = status.label || "";
  } else if (status !== undefined && status !== null) {
    val = String(status).toLowerCase().trim();
  }

  if (val === "0" || val === "open" || val === "new") {
    return {
      label: label || "جديدة",
      className: "bg-warning/10 text-warning dark:text-warning border-warning/20",
    };
  }
  if (val === "3" || val === "on_hold" || val === "hold" || val === "pending") {
    return {
      label: label || "معلقة",
      className: "bg-primary/10 text-primary dark:text-primary border-primary/20",
    };
  }
  if (val === "1" || val === "in_progress" || val === "processing") {
    return {
      label: label || "قيد المعالجة",
      className: "bg-info/10 text-info dark:text-info border-info/20",
    };
  }
  if (val === "2" || val === "closed" || val === "resolved" || val === "solved") {
    return {
      label: label || "مغلقة",
      className: "bg-success/10 text-success dark:text-success border-success/20",
    };
  }

  return {
    label: label || "نشطة",
    className: "bg-muted text-foreground border-border/70",
  };
};
