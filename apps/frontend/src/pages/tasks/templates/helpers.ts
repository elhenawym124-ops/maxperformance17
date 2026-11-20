export const getPriorityColor = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "bg-red-100 dark:bg-destructive/50 text-destructive dark:text-destructive";
    case "high":
      return "bg-orange-100 dark:bg-warning/50 text-warning dark:text-warning";
    case "medium":
      return "bg-yellow-100 dark:bg-warning/50 text-warning dark:text-warning";
    case "low":
      return "bg-green-100 dark:bg-success/50 text-success dark:text-success";
    default:
      return "bg-muted text-foreground dark:text-muted-foreground";
  }
};

export const getPriorityText = (priority: string) => {
  switch (priority?.toLowerCase()) {
    case "urgent":
      return "عاجل";
    case "high":
      return "عالي";
    case "medium":
      return "متوسط";
    case "low":
      return "منخفض";
    default:
      return priority;
  }
};
