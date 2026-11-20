export const getApiErrorMessage = (error: unknown, fallback: string): string => {
  if (
    error &&
    typeof error === "object" &&
    "response" in error &&
    error.response &&
    typeof error.response === "object" &&
    "data" in error.response &&
    error.response.data &&
    typeof error.response.data === "object" &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

export const getDocumentStatusLabel = (status?: string | null): string => {
  switch (status) {
    case "APPROVED":
      return "المستند معتمد";
    case "REJECTED":
      return "المستند مرفوض";
    case "PENDING_REVIEW":
      return "المستند قيد المراجعة";
    case "NOT_SUBMITTED":
    default:
      return "لا يوجد مستند";
  }
};

export const getDocumentStatusStyle = (status?: string | null): string => {
  switch (status) {
    case "APPROVED":
      return "bg-emerald-100 text-success border-success dark:bg-success/30 dark:text-success dark:border-success";
    case "REJECTED":
      return "bg-red-100 text-destructive border-destructive dark:bg-destructive/30 dark:text-destructive dark:border-destructive";
    case "PENDING_REVIEW":
      return "bg-amber-100 text-warning border-warning dark:bg-warning/30 dark:text-warning dark:border-warning";
    case "NOT_SUBMITTED":
    default:
      return "bg-gray-100 text-foreground border-border dark:bg-muted dark:text-muted-foreground dark:border-border";
  }
};

export const getDocumentSourceLabel = (source?: string | null): string => {
  switch (source) {
    case "RESUBMISSION":
      return "إعادة رفع";
    case "REGISTRATION":
      default:
      return "التسجيل الأول";
  }
};

export const getStatusStyle = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "bg-green-100 text-success dark:bg-success/30 dark:text-success";
    case "PENDING":
      return "bg-orange-100 text-warning dark:bg-warning/30 dark:text-warning";
    case "SUSPENDED":
      return "bg-red-100 text-destructive dark:bg-destructive/30 dark:text-destructive";
    default:
      return "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground";
  }
};

export const getStatusLabel = (status: string): string => {
  switch (status) {
    case "ACTIVE":
      return "نشط";
    case "PENDING":
      return "قيد المراجعة";
    case "SUSPENDED":
      return "موقوف";
    default:
      return status;
  }
};
