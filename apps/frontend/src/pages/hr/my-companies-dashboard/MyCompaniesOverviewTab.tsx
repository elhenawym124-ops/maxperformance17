import React from "react";
import {
  BuildingOffice2Icon,
  UsersIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftRightIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { CompanyStats, DashboardOverview } from "./types";
import { getImageUrl } from "./helpers";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subValue?: string;
  color: string;
  textColor?: string;
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  subValue,
  color,
  textColor = "text-gray-800 dark:text-white",
  alert = false,
}) => (
  <div
    className={`${color} p-3 sm:p-4 rounded-xl shadow-sm border border-border dark:border-border transition-transform hover:-translate-y-1 ${
      alert ? "ring-2 ring-destructive" : ""
    }`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p
          className={`text-xs font-medium ${
            textColor === "text-white"
              ? "text-white/70"
              : "text-muted-foreground"
          }`}
        >
          {title}
        </p>
        <h3 className={`text-xl font-bold mt-1 font-mono tabular-nums ${textColor}`}>
          {value}
        </h3>
        {subValue && (
          <p
            className={`text-xs mt-1 ${
              textColor === "text-white" ? "text-white/70" : "text-gray-500"
            }`}
          >
            {subValue}
          </p>
        )}
      </div>
      <div
        className={`p-2 rounded-lg ${
          color === "bg-card"
            ? "bg-gray-50 dark:bg-muted"
            : "bg-white/20"
        } ${
          alert
            ? "text-red-600"
            : textColor === "text-white"
              ? "text-white"
              : "text-blue-600"
        }`}
      >
        {icon}
      </div>
    </div>
  </div>
);

interface MyCompaniesOverviewTabProps {
  overview: DashboardOverview;
  companies: CompanyStats[];
  onOpenCreateModal: () => void;
  onSwitchCompany: (companyId: string) => void;
  onSetDefaultCompany: (companyId: string, companyName: string) => void;
}

export const MyCompaniesOverviewTab: React.FC<MyCompaniesOverviewTabProps> = ({
  overview,
  companies,
  onOpenCreateModal,
  onSwitchCompany,
  onSetDefaultCompany,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <StatCard
          title="الشركات"
          value={overview.totalCompanies}
          icon={<BuildingOffice2Icon className="w-6 h-6" />}
          color="bg-gradient-to-r from-primary to-primary"
          textColor="text-white"
        />
        <StatCard
          title="الموظفين"
          value={overview.totalUsers}
          icon={<UsersIcon className="w-6 h-6" />}
          color="bg-card"
        />
        <StatCard
          title="طلبات اليوم"
          value={overview.totalTodayOrders}
          icon={<ShoppingCartIcon className="w-6 h-6" />}
          color="bg-card"
        />
        <StatCard
          title="إيرادات اليوم"
          value={`${overview.totalTodayRevenue.toLocaleString()} ج.م`}
          icon={<CurrencyDollarIcon className="w-6 h-6" />}
          color="bg-gradient-to-r from-success to-success"
          textColor="text-white"
        />
        <StatCard
          title="رسائل جديدة"
          value={overview.totalUnreadConversations}
          icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
          color="bg-card"
          alert={overview.totalUnreadConversations > 10}
        />
        <StatCard
          title="منتجات نفذت"
          value={overview.totalLowStockProducts}
          icon={<ExclamationTriangleIcon className="w-6 h-6" />}
          color="bg-card"
          alert={overview.totalLowStockProducts > 0}
        />
      </div>

      {/* Companies Grid */}
      <h2 className="text-lg font-bold text-foreground dark:text-white">
        الشركات
      </h2>
      {companies.length === 0 ? (
        <div className="bg-card p-12 rounded-xl shadow-sm border border-border dark:border-border text-center">
          <BuildingOffice2Icon className="w-16 h-16 mx-auto text-muted-foreground dark:text-foreground mb-4" />
          <h3 className="text-lg font-bold text-foreground dark:text-white mb-2">
            لا توجد شركات بعد
          </h3>
          <p className="text-muted-foreground mb-4">
            ابدأ بإنشاء أول شركة لإدارة أعمالك
          </p>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary transition-colors inline-flex items-center gap-2"
          >
            <PlusIcon className="w-5 h-5" /> إنشاء أول شركة
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {companies.map((item) => (
            <div
              key={item.company.id}
              className="bg-card p-5 rounded-xl shadow-sm border border-border dark:border-border hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                    {item.company.logo ? (
                      <img
                        src={getImageUrl(item.company.logo) || ""}
                        alt={item.company.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <BuildingOffice2Icon className="w-6 h-6 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground dark:text-white flex items-center gap-2">
                      {item.company.name}
                      {item.company.isDefault && (
                        <span className="px-1.5 py-0.5 bg-success dark:bg-success/30 text-success dark:text-success text-[10px] font-medium rounded-full border border-success dark:border-success">
                          الافتراضية
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground font-mono tabular-nums">
                      {item.stats.totalUsers} موظف
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => onSwitchCompany(item.company.id)}
                    className="flex items-center gap-1 text-primary hover:text-primary text-sm font-medium"
                  >
                    إدارة <ArrowRightIcon className="w-4 h-4" />
                  </button>
                  {!item.company.isDefault && (
                    <button
                      onClick={() =>
                        onSetDefaultCompany(item.company.id, item.company.name)
                      }
                      className="text-[10px] text-muted-foreground hover:text-primary transition-colors"
                    >
                      تعيين كافتراضية
                    </button>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="p-3 bg-primary/10 dark:bg-primary/20 rounded-lg text-center">
                  <ShoppingCartIcon className="w-5 h-5 mx-auto text-primary mb-1" />
                  <p className="text-lg font-bold text-foreground dark:text-white font-mono tabular-nums">
                    {item.stats.todayOrders}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    طلب
                  </p>
                </div>
                <div className="p-3 bg-success/10 dark:bg-success/20 rounded-lg text-center">
                  <CurrencyDollarIcon className="w-5 h-5 mx-auto text-success mb-1" />
                  <p className="text-lg font-bold text-foreground dark:text-white font-mono tabular-nums">
                    {item.stats.todayRevenue.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ج.م
                  </p>
                </div>
                <div
                  className={`p-3 rounded-lg text-center ${
                    item.stats.unreadConversations > 0
                      ? "bg-orange-50 dark:bg-warning/20"
                      : "bg-gray-50 dark:bg-muted"
                  }`}
                >
                  <ChatBubbleLeftRightIcon
                    className={`w-5 h-5 mx-auto mb-1 ${
                      item.stats.unreadConversations > 0
                        ? "text-orange-600"
                        : "text-gray-400"
                    }`}
                  />
                  <p className="text-lg font-bold text-foreground dark:text-white font-mono tabular-nums">
                    {item.stats.unreadConversations}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    رسالة
                  </p>
                </div>
              </div>

              {/* Alerts */}
              {item.stats.lowStockProducts > 0 && (
                <div className="mt-4 p-3 bg-destructive/10 dark:bg-destructive/20 rounded-lg flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-destructive" />
                  <span className="text-sm text-destructive dark:text-destructive">
                    <span className="font-mono tabular-nums">
                      {item.stats.lowStockProducts}
                    </span>{" "}
                    منتج على وشك النفاد
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
