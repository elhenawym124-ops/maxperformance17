import React from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  Wifi,
  WifiOff,
  Building2,
  Briefcase,
} from "lucide-react";

export interface OnlineEmployee {
  id: string;
  userId: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  isActive: boolean;
  status: string;
  department: { id: string; name: string; color?: string } | null;
  position: { id: string; title: string; level?: number } | null;
  role: string | null;
  lastLoginAt: string | null;
  isOnline: boolean;
  onlineSince: string | null;
}

const AVATAR_BASE = "https://mokhtarelhenawy.online";

const defaultGetAvatarSrc = (emp: OnlineEmployee): string => {
  if (emp.avatar) {
    return emp.avatar.startsWith("http") || emp.avatar.startsWith("data:")
      ? emp.avatar
      : `${AVATAR_BASE}${emp.avatar}`;
  }
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    `${emp.firstName || ""} ${emp.lastName || ""}`,
  )}&background=random`;
};

const defaultFormatSince = (iso: string | null): string => {
  if (!iso) return "";
  const then = new Date(iso);
  const diffMs = Date.now() - then.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "الآن";
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  return `منذ ${days} يوم`;
};

interface OnlineEmployeeCardProps {
  emp: OnlineEmployee;
  isCurrentUser: boolean;
  getAvatarSrc?: (emp: OnlineEmployee) => string;
  formatSince?: (iso: string | null) => string;
}

export const OnlineEmployeeCard: React.FC<OnlineEmployeeCardProps> = ({
  emp,
  isCurrentUser,
  getAvatarSrc = defaultGetAvatarSrc,
  formatSince = defaultFormatSince,
}) => {
  const { t } = useTranslation();
  const isOnline = emp.isOnline;

  return (
    <div
      className={`p-3.5 sm:p-4 rounded-md border transition-all ${
        isOnline
          ? "border-emerald-500/30 bg-card shadow-xs"
          : "border-border/60 bg-muted/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2.5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="relative shrink-0">
            <img
              src={getAvatarSrc(emp)}
              alt={`${emp.firstName} ${emp.lastName}`}
              className="h-10 w-10 sm:h-11 sm:w-11 rounded-full object-cover border border-border/70"
            />
            <span
              className={`absolute -bottom-0.5 -start-0.5 h-3 w-3 rounded-full border-2 border-card ${
                isOnline ? "bg-emerald-500 animate-pulse" : "bg-muted-foreground/40"
              }`}
            />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-xs sm:text-sm text-foreground truncate flex items-center gap-1.5">
              <span>{emp.firstName} {emp.lastName}</span>
              {isCurrentUser && (
                <span className="text-[10px] font-normal text-primary">
                  (أنت)
                </span>
              )}
            </h3>
            <p className="text-[11px] font-mono text-muted-foreground truncate" dir="ltr">
              {emp.email}
            </p>
          </div>
        </div>

        <span
          className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
            isOnline
              ? "border-emerald-500/20 bg-success/10 text-success dark:text-success"
              : "border-border/60 bg-muted/60 text-muted-foreground"
          }`}
        >
          {isOnline ? (
            <>
              <Wifi className="h-3 w-3" />
              <span>{t("onlineTeam.online")}</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3" />
              <span>{t("onlineTeam.offline")}</span>
            </>
          )}
        </span>
      </div>

      <div className="mt-3 pt-2.5 border-t border-border/50 text-[11px] text-muted-foreground space-y-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          {emp.department && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 text-muted-foreground/70" />
              <span>{emp.department.name}</span>
            </span>
          )}
          {emp.position && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 text-muted-foreground/70" />
              <span>{emp.position.title}</span>
            </span>
          )}
        </div>

        <div>
          {isOnline && emp.onlineSince ? (
            <span className="flex items-center gap-1 text-success dark:text-success font-medium">
              <Clock className="h-3 w-3" />
              <span>{t("onlineTeam.onlineSince", { time: formatSince(emp.onlineSince) })}</span>
            </span>
          ) : emp.lastLoginAt ? (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground/70" />
              <span className="font-mono tabular-nums">
                {t("onlineTeam.lastSeen", {
                  date: new Date(emp.lastLoginAt).toLocaleString("ar-EG"),
                })}
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};
