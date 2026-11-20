import { cn } from "../../../lib/utils"
import { Badge } from "../../../components/ui/badge"

export function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full px-2.5 py-1 text-[11px] font-bold",
        isActive
          ? "border-emerald-200 bg-success/10 text-success dark:border-success/70 dark:bg-success/40 dark:text-success"
          : "border-rose-200 bg-destructive/10 text-destructive dark:border-destructive/70 dark:bg-destructive/40 dark:text-destructive",
      )}
    >
      {isActive ? "نشطة" : "متوقفة"}
    </Badge>
  )
}
