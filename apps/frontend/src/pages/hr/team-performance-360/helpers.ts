export const getTierColorClass = (tier: string): string => {
  switch (tier) {
    case "TIER_S":
      return "bg-purple-500/10 text-primary dark:text-primary border-primary/20";
    case "TIER_A":
      return "bg-emerald-500/10 text-success dark:text-success border-success/20";
    case "TIER_B":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
    case "TIER_C":
      return "bg-amber-500/10 text-warning dark:text-warning border-warning/20";
    case "TIER_D":
      return "bg-rose-500/10 text-destructive dark:text-destructive border-destructive/20";
    default:
      return "bg-slate-500/10 text-muted-foreground dark:text-muted-foreground border-border";
  }
};

export const getScoreColor = (score: number, isEvaluated = true): string => {
  if (!isEvaluated) return "text-muted-foreground";
  if (score >= 90) return "text-purple-600 dark:text-primary";
  if (score >= 80) return "text-emerald-600 dark:text-success";
  if (score >= 70) return "text-blue-600 dark:text-blue-400";
  if (score >= 60) return "text-amber-600 dark:text-warning";
  return "text-rose-600 dark:text-destructive";
};
