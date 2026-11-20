import React from "react";
import { useTranslation } from "react-i18next";
import { useDateFormat } from "@/hooks/useDateFormat";
import { formatCurrency } from "@/utils/currency";
import {
  ShoppingBagIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import { CustomerDetailsData } from "./types";

interface CustomerActivityTabProps {
  activities: CustomerDetailsData["activities"];
}

export const CustomerActivityTab: React.FC<CustomerActivityTabProps> = ({
  activities,
}) => {
  const { t } = useTranslation();
  const { formatDate } = useDateFormat();

  if (!activities || activities.length === 0) {
    return (
      <p className="text-center text-xs sm:text-sm text-muted-foreground py-8">
        {t("customers.noActivity", "لا يوجد نشاط لهذا العميل")}
      </p>
    );
  }

  return (
    <div>
      <ol className="relative space-y-6 border-r-2 border-border dark:border-border pe-6 me-3">
        {activities.map((act, index) => (
          <li key={act.id || index} className="relative">
            <span
              className={`absolute -right-[31px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-white dark:ring-border ${
                act.type === "order"
                  ? "bg-indigo-500"
                  : act.type === "conversation"
                    ? "bg-teal-500"
                    : "bg-amber-500"
              }`}
            />
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {act.type === "order" ? (
                  <ShoppingBagIcon className="h-4 w-4 text-primary" />
                ) : act.type === "conversation" ? (
                  <ChatBubbleLeftRightIcon className="h-4 w-4 text-success" />
                ) : (
                  <DocumentTextIcon className="h-4 w-4 text-warning" />
                )}
                <span className="font-semibold text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                  {act.title}
                </span>
                {act.status && (
                  <span className="px-2 py-0.5 rounded-full text-xs bg-muted dark:bg-muted text-foreground dark:text-muted-foreground border border-border dark:border-border">
                    {act.status}
                  </span>
                )}
                {typeof act.value === "number" && (
                  <span className="text-xs sm:text-sm font-semibold font-mono tabular-nums text-foreground dark:text-muted-foreground">
                    {formatCurrency(act.value)}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground font-mono tabular-nums">
                {formatDate(act.timestamp)}
              </span>
            </div>
            {act.content && (
              <p className="mt-1 text-xs sm:text-sm text-foreground dark:text-muted-foreground">
                {act.content}
                {act.author ? ` — ${act.author}` : ""}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
};
