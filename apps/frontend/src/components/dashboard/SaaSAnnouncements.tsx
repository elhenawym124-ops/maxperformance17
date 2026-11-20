import React from "react";
import {
  Sparkles,
  AlertTriangle,
  Rocket,
  Bell,
  ArrowLeft,
  X,
} from "lucide-react";

export type AnnouncementType = "feature" | "alert" | "promotion" | "update";

export interface Announcement {
  id: string;
  type: AnnouncementType;
  title: string;
  message: string;
  actionLabel?: string;
  actionUrl?: string;
  isDismissible?: boolean;
}

interface SaaSAnnouncementsProps {
  announcements?: Announcement[];
  onDismiss?: (id: string) => void;
}

const SaaSAnnouncements: React.FC<SaaSAnnouncementsProps> = ({
  announcements = [],
  onDismiss,
}) => {
  if (announcements.length === 0) return null;

  const getBadgeConfig = (type: AnnouncementType) => {
    switch (type) {
      case "feature":
        return {
          icon: Sparkles,
          label: "جديد",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          iconColor: "text-primary",
          cardBorder: "border-primary/20 hover:border-primary/40",
        };
      case "alert":
        return {
          icon: AlertTriangle,
          label: "تنبيه",
          badgeClass: "bg-warning/10 text-warning border-warning/20",
          iconColor: "text-warning",
          cardBorder: "border-warning/20 hover:border-warning/40",
        };
      case "promotion":
        return {
          icon: Rocket,
          label: "عرض خاص",
          badgeClass: "bg-success/10 text-success border-success/20",
          iconColor: "text-success",
          cardBorder: "border-success/20 hover:border-success/40",
        };
      case "update":
      default:
        return {
          icon: Bell,
          label: "تحديث",
          badgeClass: "bg-primary/10 text-primary border-primary/20",
          iconColor: "text-primary",
          cardBorder: "border-border/70 hover:border-primary/40",
        };
    }
  };

  return (
    <div className="space-y-3 mb-6">
      {announcements.map((item) => {
        const config = getBadgeConfig(item.type);
        const Icon = config.icon;

        return (
          <div
            key={item.id}
            className={`relative rounded-xl border bg-card p-3.5 shadow-2xs transition-all duration-150 ${config.cardBorder}`}
          >
            <div className="flex items-start gap-3">
              <div className="shrink-0 p-2 rounded-lg bg-muted/60 border border-border/60">
                <Icon className={`w-4 h-4 ${config.iconColor}`} />
              </div>

              <div className="flex-1 min-w-0 pe-6 sm:pe-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 text-[11px] font-semibold rounded-full border ${config.badgeClass}`}
                  >
                    {config.label}
                  </span>
                  <h3 className="text-xs font-semibold text-foreground truncate">
                    {item.title}
                  </h3>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.message}
                </p>

                {item.actionLabel && (
                  <div className="mt-2.5">
                    <button
                      type="button"
                      onClick={() => {
                        if (item.actionUrl) {
                          window.location.href = item.actionUrl;
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80 transition-colors duration-150 active:scale-95 cursor-pointer"
                    >
                      <span>{item.actionLabel}</span>
                      <ArrowLeft className="w-3 h-3 rtl:rotate-0 ltr:rotate-180" />
                    </button>
                  </div>
                )}
              </div>

              {item.isDismissible && onDismiss && (
                <button
                  type="button"
                  onClick={() => onDismiss(item.id)}
                  className="shrink-0 p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60 rounded-md transition-colors active:scale-95 cursor-pointer"
                  aria-label="إغلاق التنبيه"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SaaSAnnouncements;
