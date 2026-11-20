import React from "react";
import { Users, Search, Filter, Star, Eye, Edit } from "lucide-react";
import type { CustomerLoyaltyRecord } from "./types";
import {
  getProgramIcon,
  getTierIcon,
  getStatusColor,
  getStatusLabel,
} from "./helpers";

interface LoyaltyCustomersTabProps {
  customers: CustomerLoyaltyRecord[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  rawCustomersCount: number;
}

export const LoyaltyCustomersTab: React.FC<LoyaltyCustomersTabProps> = ({
  customers,
  searchQuery,
  onSearchChange,
  rawCustomersCount,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-4">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="البحث عن عميل..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pe-10 ps-4 py-2 border border-border rounded-lg bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button
          type="button"
          className="flex items-center justify-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted/50 transition-colors shadow-sm"
        >
          <Filter className="w-4 h-4" />
          <span>فلترة</span>
        </button>
      </div>

      {rawCustomersCount === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            لا يوجد عملاء مشتركون
          </h3>
          <p className="text-muted-foreground text-sm">
            سيظهر هنا العملاء المشتركون في برامج الولاء
          </p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">
            لا توجد نتائج مطابقة
          </h3>
          <p className="text-muted-foreground text-sm">
            جرب البحث باستخدام اسم أو بريد أو هاتف مختلف
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border dark:border-border">
          <table className="min-w-full divide-y divide-border dark:divide-border text-right">
            <thead className="bg-gray-50 dark:bg-muted">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  العميل
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  البرنامج
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  النقاط الحالية
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  المستوى
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  الحالة
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  آخر نشاط
                </th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  إجراءات
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border dark:divide-border text-sm">
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-muted/50/50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-semibold text-foreground">
                        {customer.customer.firstName}{" "}
                        {customer.customer.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {customer.customer.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      {getProgramIcon(customer.program.type)}
                      <span className="text-sm font-medium text-foreground">
                        {customer.program.nameAr || customer.program.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-warning fill-warning" />
                      <span className="font-bold text-foreground font-mono tabular-nums">
                        {customer.currentPoints.toLocaleString()}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {customer.tier ? (
                      <div className="flex items-center gap-2">
                        {getTierIcon(customer.tier.icon)}
                        <span className="text-sm font-medium text-foreground">
                          {customer.tier.nameAr || customer.tier.name}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`text-xs px-2.5 py-1 rounded-full font-medium ${getStatusColor(
                        customer.status,
                      )}`}
                    >
                      {getStatusLabel(customer.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground font-mono tabular-nums">
                    {new Date(customer.lastActivity).toLocaleDateString(
                      "ar-EG",
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        aria-label="عرض تفاصيل العميل"
                        className="p-1 text-primary hover:text-primary dark:text-primary dark:hover:text-primary transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        aria-label="تعديل العميل"
                        className="p-1 text-primary hover:text-primary dark:text-primary dark:hover:text-primary transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
