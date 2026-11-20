export const ASSET_STATUS_STYLES: Record<string, string> = {
  AVAILABLE:
    "bg-green-100 text-success dark:bg-success/40 dark:text-success border border-success dark:border-success/50",
  IN_USE:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50",
  MAINTENANCE:
    "bg-yellow-100 text-warning dark:bg-warning/40 dark:text-warning border border-warning dark:border-warning/50",
  RETIRED:
    "bg-gray-100 text-foreground dark:bg-muted dark:text-muted-foreground border border-border",
  LOST: "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive border border-destructive dark:border-destructive/50",
  RESERVED:
    "bg-purple-100 text-primary dark:bg-primary/40 dark:text-primary border border-primary dark:border-primary/50",
};

export const ASSET_STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "متاح",
  IN_USE: "في الاستخدام",
  MAINTENANCE: "في الصيانة",
  RETIRED: "تالف/مكهن",
  LOST: "مفقود",
  RESERVED: "محجوز",
};

export const BULK_STATUS_OPTIONS = [
  { key: "AVAILABLE", label: "متاح", dot: "bg-green-400" },
  { key: "MAINTENANCE", label: "صيانة", dot: "bg-yellow-400" },
  { key: "RETIRED", label: "تكهين", dot: "bg-gray-400" },
  { key: "LOST", label: "مفقود", dot: "bg-red-400" },
] as const;

export const getAssetStatusClassName = (status: string): string =>
  ASSET_STATUS_STYLES[status] || "bg-gray-100";

export const getAssetStatusLabel = (status: string): string =>
  ASSET_STATUS_LABELS[status] || status;
