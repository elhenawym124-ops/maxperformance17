import React from "react";
import { ExternalLink, Info, CheckCircle2, RotateCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LookupResponse } from "./types";

interface EmployeeSmartDetectionCardProps {
  lookupResult: LookupResponse;
  onViewProfile: (userId: string) => void;
  onReactivate?: (userId: string) => void;
}

export const EmployeeSmartDetectionCard: React.FC<
  EmployeeSmartDetectionCardProps
> = ({ lookupResult, onViewProfile, onReactivate }) => {
  const { t } = useTranslation();
  const user = lookupResult.user;

  if (!lookupResult.exists || !user) return null;

  return (
    <div className="col-span-2 p-3.5 rounded-xl border transition-all duration-200 bg-muted/20 border-border/70">
      {lookupResult.status === "ALREADY_ACTIVE_EMPLOYEE" && (
        <div className="space-y-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-warning dark:border-warning">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-amber-100 text-warning text-xs font-semibold">
                  {user.firstName?.[0] || "EMP"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm text-foreground flex items-center gap-2">
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning text-[11px] py-0 px-1.5"
                  >
                    {t("employees.accountAlreadyEmployee")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("employees.accountAlreadyEmployeeDesc", {
                    employeeNumber: user.employeeNumber,
                  })}
                  {user.department ? ` • ${user.department}` : ""}
                  {user.position ? ` • ${user.position}` : ""}
                </p>
              </div>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="text-xs h-8 shrink-0 gap-1.5"
              onClick={() => {
                if (user.id) {
                  onViewProfile(user.id);
                }
              }}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              {t("employees.viewEmployeeProfile")}
            </Button>
          </div>
        </div>
      )}

      {lookupResult.status === "COMPANY_USER_NOT_EMPLOYEE" && (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10 border border-primary dark:border-primary">
            <AvatarImage src={user.avatar} />
            <AvatarFallback className="bg-blue-100 text-primary text-xs font-semibold">
              {user.firstName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm text-foreground flex items-center gap-2">
              <span className="truncate">
                {user.firstName} {user.lastName}
              </span>
              <Badge
                variant="outline"
                className="bg-blue-50 text-primary border-primary dark:bg-primary/40 dark:text-primary dark:border-primary text-[11px] py-0 px-1.5 shrink-0"
              >
                {t("employees.accountCompanyMember")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {user.email} {user.phone ? `• ${user.phone}` : ""}
            </p>
          </div>
        </div>
      )}

      {lookupResult.status === "EXISTING_PLATFORM_USER" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10 border border-success dark:border-success">
              <AvatarImage src={user.avatar} />
              <AvatarFallback className="bg-emerald-100 text-success text-xs font-semibold">
                {user.firstName?.[0] || "M"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground flex items-center gap-2">
                <span className="truncate">
                  {user.firstName} {user.lastName}
                </span>
                <Badge
                  variant="outline"
                  className="bg-emerald-50 text-success border-success dark:bg-success/40 dark:text-success dark:border-success text-[11px] py-0 px-1.5 shrink-0"
                >
                  {t("employees.accountVerifiedPlatform")}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 truncate">
                {user.email} {user.phone ? `• ${user.phone}` : ""}
              </p>
            </div>
          </div>
          {/* What will happen explanation */}
          <div className="bg-emerald-50/60 dark:bg-success/20 rounded-lg p-2.5 border border-success dark:border-success/40">
            <div className="flex items-start gap-2">
              <Info className="h-3.5 w-3.5 text-success dark:text-success mt-0.5 shrink-0" />
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-success dark:text-success">
                  {t("employees.linkExplanationTitle")}
                </p>
                <ul className="text-[11px] text-success dark:text-success space-y-0.5 list-none">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {t("employees.linkExplanation1")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {t("employees.linkExplanation2")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {t("employees.linkExplanation3")}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 shrink-0" />
                    {t("employees.linkExplanation4")}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {lookupResult.status === "INACTIVE_FORMER_EMPLOYEE" && (
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 border border-warning dark:border-warning">
                <AvatarImage src={user.avatar} />
                <AvatarFallback className="bg-orange-100 text-warning text-xs font-semibold">
                  {user.firstName?.[0] || "X"}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium text-sm text-foreground flex items-center gap-2">
                  <span>
                    {user.firstName} {user.lastName}
                  </span>
                  <Badge
                    variant="outline"
                    className="bg-orange-50 text-warning border-warning dark:bg-warning/40 dark:text-warning dark:border-warning text-[11px] py-0 px-1.5"
                  >
                    {t("employees.accountFormerEmployee")}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {user.employeeNumber ? `${user.employeeNumber} • ` : ""}
                  {user.email}
                  {user.department ? ` • ${user.department}` : ""}
                </p>
              </div>
            </div>
          </div>
          {/* Reactivation info */}
          <div className="bg-orange-50/60 dark:bg-warning/20 rounded-lg p-2.5 border border-warning dark:border-warning/40">
            <div className="flex items-start gap-2">
              <RotateCcw className="h-3.5 w-3.5 text-warning dark:text-warning mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-warning dark:text-warning">
                  {t("employees.formerEmployeeTitle")}
                </p>
                <p className="text-[11px] text-warning dark:text-warning">
                  {t("employees.formerEmployeeDesc")}
                </p>
              </div>
            </div>
          </div>
          {onReactivate && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="w-full text-xs h-8 gap-1.5 border-warning text-warning hover:bg-warning/10 dark:border-warning dark:text-warning dark:hover:bg-warning/40"
              onClick={() => {
                if (user.id) {
                  onReactivate(user.id);
                }
              }}
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t("employees.reactivateEmployee")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
