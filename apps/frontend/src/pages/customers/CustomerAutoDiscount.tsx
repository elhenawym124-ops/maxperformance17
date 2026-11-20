import React from "react";
import AutoDiscountSettings from "./AutoDiscountSettings";
import { BadgePercent } from "lucide-react";

/**
 * صفحة "الخصم بعد البيع":
 * إدارة نظام كوبون الخصم التلقائي بعد تسليم الطلب (منفصلة عن إعدادات المستويات).
 */
const CustomerAutoDiscount: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-warning dark:bg-warning/40 flex items-center justify-center text-warning dark:text-warning">
          <BadgePercent className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">الخصم بعد البيع</h1>
          <p className="text-sm text-muted-foreground">
            إدارة كوبون الخصم التلقائي بعد تسليم الطلب ونسبة الخصم ومدة الصلاحية.
          </p>
        </div>
      </div>

      <AutoDiscountSettings />
    </div>
  );
};

export default CustomerAutoDiscount;
