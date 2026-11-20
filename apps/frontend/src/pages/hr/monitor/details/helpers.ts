export const formatMonitorSeconds = (sec: number = 0): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h} س ${m} د`;
};

export const getCheckInMethodLabel = (method?: string | null): string => {
  switch (method) {
    case "FINGERPRINT":
      return "بصمة جهاز";
    case "MANUAL":
      return "تسجيل يدوي";
    case "GPS":
      return "موقع جغرافي";
    case "MOBILE_APP":
      return "تطبيق هاتف";
    case "SYSTEM":
      return "نظامي";
    default:
      return "حضور رسمي";
  }
};

export const getOperationalSignalClassName = (signalType?: string): string => {
  switch (signalType) {
    case "TASK_OVERLOAD":
      return "bg-indigo-500/15 text-primary dark:text-primary ring-1 ring-inset ring-primary/30";
    case "DISTRACTION":
      return "bg-amber-500/15 text-warning dark:text-warning ring-1 ring-inset ring-warning/30";
    case "NEGLECT":
      return "bg-rose-500/15 text-destructive dark:text-destructive ring-1 ring-inset ring-destructive/30";
    case "STEADY_PERFORMANCE":
      return "bg-emerald-500/15 text-success dark:text-success ring-1 ring-inset ring-success/30";
    default:
      return "bg-sky-500/15 text-info dark:text-info ring-1 ring-inset ring-info/30";
  }
};

export const formatMonitorTimeAr = (isoTime?: string | null): string | null => {
  if (!isoTime) return null;
  return new Date(isoTime).toLocaleTimeString("ar-EG", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const calculateActivityLagMinutes = (
  clockInTime?: string | null,
  firstActivityTime?: string | null,
): number | null => {
  if (!clockInTime || !firstActivityTime) return null;
  const diffMs =
    new Date(firstActivityTime).getTime() - new Date(clockInTime).getTime();
  return Math.round(diffMs / 60000);
};
