import React from "react";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  ArrowPathIcon,
  TicketIcon,
  ClockIcon,
  ChatBubbleLeftEllipsisIcon,
  BellIcon,
} from "@heroicons/react/24/outline";
import { BellAlertIcon } from "@heroicons/react/24/solid";
import { TurboTicketItem, TurboAccountItem } from "./types";
import { parseSafeDate, formatSafeDate } from "./ticketDateUtils";

export type TurboCategoryTab = "all" | "shipments" | "finance" | "support" | "unread";

interface TurboTicketListPanelProps {
  tickets: TurboTicketItem[];
  selectedTicketId: number | null;
  onSelectTicket: (ticket: TurboTicketItem) => void;
  onOpenNewTicket: () => void;
  unreadCount: number;
  loading: boolean;
  onRefresh: () => void;
  page: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  statusFilter: string;
  onChangeStatusFilter: (status: string) => void;
  searchQuery: string;
  onChangeSearchQuery: (q: string) => void;
  categoryFilter?: TurboCategoryTab;
  onChangeCategoryFilter?: (cat: TurboCategoryTab) => void;
  accounts?: TurboAccountItem[];
  selectedAccount?: string;
  onChangeAccount?: (account: string) => void;
  desktopNotificationPermission?: NotificationPermission | "unsupported";
  onRequestNotificationPermission?: () => void;
}

export const TurboTicketListPanel: React.FC<TurboTicketListPanelProps> = ({
  tickets,
  selectedTicketId,
  onSelectTicket,
  onOpenNewTicket,
  unreadCount,
  loading,
  onRefresh,
  page,
  total,
  perPage,
  onPageChange,
  statusFilter,
  onChangeStatusFilter,
  searchQuery,
  onChangeSearchQuery,
  categoryFilter,
  onChangeCategoryFilter,
  accounts,
  selectedAccount = "all",
  onChangeAccount,
  desktopNotificationPermission,
  onRequestNotificationPermission,
}) => {
  const [internalCat, setInternalCat] = React.useState<TurboCategoryTab>("all");
  const activeCategory = categoryFilter ?? internalCat;
  const setCategory = (cat: TurboCategoryTab) => {
    if (onChangeCategoryFilter) {
      onChangeCategoryFilter(cat);
    } else {
      setInternalCat(cat);
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / perPage));


  const getStatusBadge = (status: any) => {
    let val = "";
    let label = "";

    if (status && typeof status === "object") {
      val = String(status.value || "").toLowerCase().trim();
      label = status.label || "";
    } else if (status !== undefined && status !== null) {
      val = String(status).toLowerCase().trim();
    }

    if (val === "0" || val === "open" || val === "new") {
      return {
        label: label || "جديدة",
        className:
          "bg-amber-500/10 text-warning dark:text-warning border border-warning/20",
      };
    }
    if (val === "3" || val === "on_hold" || val === "hold" || val === "pending") {
      return {
        label: label || "معلقة",
        className:
          "bg-purple-500/10 text-primary dark:text-primary border border-primary/20",
      };
    }
    if (val === "1" || val === "in_progress" || val === "processing") {
      return {
        label: label || "قيد المعالجة",
        className:
          "bg-sky-500/10 text-info dark:text-info border border-info/20",
      };
    }
    if (val === "2" || val === "closed" || val === "resolved" || val === "solved") {
      return {
        label: label || "مغلقة",
        className:
          "bg-emerald-500/10 text-success dark:text-success border border-success/20",
      };
    }

    if (label) {
      return {
        label,
        className:
          "bg-zinc-500/10 text-foreground dark:text-muted-foreground border border-border",
      };
    }

    return {
      label: "غير محدد",
      className:
        "bg-zinc-500/10 text-foreground dark:text-muted-foreground border border-border",
    };
  };

  const categoryTabs: { key: TurboCategoryTab; label: string; count?: number }[] = [
    { key: "all", label: "الكل" },
    { key: "shipments", label: "شكاوى الشحنات" },
    { key: "finance", label: "المعاملات المالية" },
    { key: "support", label: "استفسارات عامة" },
    { key: "unread", label: "غير مقروءة", count: unreadCount },
  ];

  const statusTabs = [
    { key: "all", label: "كافة الحالات" },
    { key: "open", label: "الجديدة" },
    { key: "on_hold", label: "المعلقة" },
    { key: "in_progress", label: "قيد المعالجة" },
    { key: "closed", label: "مغلقة" },
  ];

  // Process and sort tickets: Filter by category & strict descending order (newest first)
  const processedTickets = React.useMemo(() => {
    let list = [...tickets];

    if (activeCategory === "unread") {
      list = list.filter((t) => {
        const u = Number(
          t.un_read_messages_count ||
          t.unread_messages_count ||
          (t.unread ? 1 : 0) ||
          (t.is_seen === false ? 1 : 0) ||
          0
        );
        return u > 0;
      });
    } else if (activeCategory === "shipments") {
      list = list.filter((t) => {
        const catId = Number(t.category_id || t.category?.id || 0);
        const catName = (t.category_name || t.category?.name || "").toLowerCase();
        const rel = (t.category?.related_to || t.related_to || "").toLowerCase();
        // IDs: 2 (شكوى), 9 (تسليم الطرد), 19 (تأخير التسليم), 22 (تبديل فى التسليم), 23 (تلف الطرد), 26 (مشكلة مع الكابتن), 63 (طرد مفقود), 64 (جزء مفقود), 65 (إفادة وهمية), 67 (مرتجع على الراسل غير مستحق), 68 (خارج التغطية), 14 (استلام Pickup), 40, 41, 42, 44
        const shipmentCatIds = [2, 9, 19, 22, 23, 26, 63, 64, 65, 67, 68, 14, 40, 41, 42, 44];
        return (
          shipmentCatIds.includes(catId) ||
          rel === "shipments" ||
          rel === "branches" ||
          Boolean(t.code) ||
          catName.includes("تسليم") ||
          catName.includes("كابتن") ||
          catName.includes("طرد") ||
          catName.includes("مرتجع") ||
          catName.includes("تأخير") ||
          catName.includes("شكوى")
        );
      });
    } else if (activeCategory === "finance") {
      list = list.filter((t) => {
        const catId = Number(t.category_id || t.category?.id || 0);
        const catName = (t.category_name || t.category?.name || "").toLowerCase();
        // IDs: 49 (معاملات مالية), 59 (تأخير تحويل التوريد), 60 (خطأ في الحسابات المالية)
        return (
          [49, 59, 60].includes(catId) ||
          catName.includes("مالي") ||
          catName.includes("توريد") ||
          catName.includes("حسابات")
        );
      });
    } else if (activeCategory === "support") {
      list = list.filter((t) => {
        const catId = Number(t.category_id || t.category?.id || 0);
        const catName = (t.category_name || t.category?.name || "").toLowerCase();
        // IDs: 1 (استفسار), 3 (شكر), 4 (مقترح), 5, 6, 7, 8, 10, 16, 28, 29, 61, 62, 69
        return (
          [1, 3, 4, 5, 6, 7, 8, 10, 16, 28, 29, 61, 62, 69].includes(catId) ||
          catName.includes("استفسار") ||
          catName.includes("مقترح") ||
          catName.includes("شكر") ||
          catName.includes("سيستم") ||
          catName.includes("أخرى") ||
          catName.includes("دعم")
        );
      });
    }

    // Strict Smart Sorting: Unread first -> Open/In Progress -> Highest ID (Newest created)
    list.sort((a, b) => {
      const unreadA = Number(
        a.un_read_messages_count ||
        a.unread_messages_count ||
        (a.unread ? 1 : 0) ||
        (a.is_seen === false ? 1 : 0) ||
        0
      );
      const unreadB = Number(
        b.un_read_messages_count ||
        b.unread_messages_count ||
        (b.unread ? 1 : 0) ||
        (b.is_seen === false ? 1 : 0) ||
        0
      );
      if (unreadB !== unreadA) return unreadB - unreadA;

      const isClosedA = a.is_closed === true || a.status?.value === "closed" || a.status === "closed";
      const isClosedB = b.is_closed === true || b.status?.value === "closed" || b.status === "closed";
      if (isClosedA !== isClosedB) return isClosedA ? 1 : -1;

      const idA = Number(a.id) || 0;
      const idB = Number(b.id) || 0;
      if (idB !== idA) return idB - idA;

      const timeA = parseSafeDate(a.created_at)?.getTime() || parseSafeDate(a.updated_at)?.getTime() || 0;
      const timeB = parseSafeDate(b.created_at)?.getTime() || parseSafeDate(b.updated_at)?.getTime() || 0;
      return timeB - timeA;
    });

    return list;
  }, [tickets, activeCategory]);

  return (
    <aside className="w-full h-full min-h-0 flex flex-col overflow-hidden bg-white dark:bg-muted border-l border-border dark:border-border shrink-0">
      {/* Top Header Bar */}
      <div className="p-3 border-b border-border dark:border-border space-y-2 shrink-0 bg-white dark:bg-muted z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-foreground flex items-center justify-center">
              <TicketIcon className="size-4 text-foreground dark:text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground dark:text-muted-foreground flex items-center gap-1.5">
                <span>تذاكر وشات تربو</span>
                {unreadCount > 0 ? (
                  <span className="font-mono tabular-nums px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-destructive text-white">
                    {unreadCount}
                  </span>
                ) : (
                  <span className="size-1.5 rounded-full bg-success" />
                )}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onRequestNotificationPermission && (
              <button
                type="button"
                onClick={onRequestNotificationPermission}
                title={
                  desktopNotificationPermission === "granted"
                    ? "الإشعارات الصوتية مفعلة"
                    : "تفعيل إشعارات سطح المكتب والصوت للتذاكر"
                }
                className={`p-1.5 rounded-lg transition relative ${
                  desktopNotificationPermission === "granted"
                    ? "text-emerald-600 dark:text-success hover:bg-success/10 dark:hover:bg-success/30"
                    : "text-zinc-400 hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground hover:bg-muted dark:hover:bg-muted"
                }`}
              >
                {desktopNotificationPermission === "granted" ? (
                  <BellAlertIcon className="size-4" />
                ) : (
                  <BellIcon className="size-4" />
                )}
                {unreadCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-destructive ring-2 ring-white dark:ring-border" />
                )}
              </button>
            )}
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              title="تحديث التذاكر"
              className="p-1.5 text-muted-foreground hover:text-foreground dark:text-muted-foreground dark:hover:text-muted-foreground rounded-lg hover:bg-muted dark:hover:bg-muted transition active:scale-[0.98] disabled:opacity-50"
            >
              <ArrowPathIcon
                className={`size-3.5 ${loading ? "animate-spin" : ""}`}
              />
            </button>
            <button
              type="button"
              onClick={onOpenNewTicket}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-white text-white dark:text-foreground transition active:scale-[0.98] shadow-2xs"
            >
              <PlusIcon className="size-3.5 stroke-[2.5]" />
              <span>تذكرة جديدة</span>
            </button>
          </div>
        </div>

        {/* Multi-Store Account Filter Chips */}
        {accounts && accounts.length > 1 && (
          <div className="flex items-center gap-1 p-0.5 bg-muted dark:bg-muted rounded-lg text-[11px] font-medium overflow-x-auto scrollbar-none border border-border dark:border-border">
            <button
              type="button"
              onClick={() => onChangeAccount && onChangeAccount("all")}
              className={`flex-1 min-w-max py-1 px-2.5 rounded-md transition text-center whitespace-nowrap text-xs ${
                selectedAccount === "all" || !selectedAccount
                  ? "bg-white dark:bg-muted text-foreground dark:text-muted-foreground shadow-2xs font-bold"
                  : "text-zinc-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
              }`}
            >
              كل الحسابات ({accounts.length})
            </button>
            {accounts.map((acc) => {
              const isSelected =
                selectedAccount === acc.id ||
                selectedAccount === String(acc.clientCode);
              return (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => onChangeAccount && onChangeAccount(acc.id)}
                  className={`flex-1 min-w-max py-1 px-2.5 rounded-md transition text-center whitespace-nowrap text-xs flex items-center justify-center gap-1 ${
                    isSelected
                      ? "bg-white dark:bg-muted text-foreground dark:text-muted-foreground shadow-2xs font-bold"
                      : "text-zinc-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                  }`}
                >
                  <span>{acc.name}</span>
                  {acc.clientCode && (
                    <span className="text-[10px] opacity-60 tabular-nums">
                      #{acc.clientCode}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Category Classification Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-muted dark:bg-muted rounded-lg text-[11px] font-medium overflow-x-auto scrollbar-none">
          {categoryTabs.map((tab) => {
            const isActive = activeCategory === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCategory(tab.key)}
                className={`flex-1 min-w-max py-1 px-2 rounded-md transition text-center whitespace-nowrap flex items-center justify-center gap-1 shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-muted text-foreground dark:text-muted-foreground shadow-2xs font-bold"
                    : "text-zinc-600 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                <span>{tab.label}</span>
                {tab.key === "unread" && (tab.count ?? 0) > 0 && (
                  <span className="tabular-nums px-1 py-0.2 rounded-full text-[9px] font-bold bg-destructive text-white">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute right-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onChangeSearchQuery(e.target.value)}
            placeholder="بحث برقم التذكرة، الشحنة، أو الأوردر..."
            className="w-full pe-8 ps-3 py-1.5 text-xs rounded-lg border border-border dark:border-border bg-muted dark:bg-muted text-foreground dark:text-muted-foreground placeholder-muted focus:outline-hidden focus:border-border dark:focus:border-border transition"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-muted dark:bg-muted rounded-lg text-[10.5px] font-medium overflow-x-auto scrollbar-none">
          {statusTabs.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeStatusFilter(tab.key)}
                className={`flex-1 min-w-max py-0.5 px-1.5 rounded transition text-center whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-white dark:bg-muted text-foreground dark:text-muted-foreground shadow-2xs font-semibold"
                    : "text-zinc-500 dark:text-muted-foreground hover:text-foreground dark:hover:text-muted-foreground"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tickets Scrollable List */}
      <div className="flex-1 overflow-y-auto overscroll-contain divide-y divide-border dark:divide-border min-h-0 touch-pan-y" style={{ WebkitOverflowScrolling: "touch" }}>
        {loading && tickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground dark:text-muted-foreground space-y-2">
            <div className="h-5 w-5 border-2 border-border dark:border-border border-t-transparent animate-spin rounded-full mx-auto" />
            <p>جاري تحميل التذاكر من تربو...</p>
          </div>
        ) : processedTickets.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground dark:text-muted-foreground space-y-2">
            <ChatBubbleLeftEllipsisIcon className="h-8 w-8 mx-auto text-muted-foreground dark:text-foreground" />
            <p className="font-semibold text-foreground dark:text-muted-foreground">
              {activeCategory === "unread"
                ? "لا توجد رسائل غير مقروءة حالياً"
                : activeCategory === "shipments"
                ? "لا توجد تذاكر في شكاوى الشحنات"
                : activeCategory === "finance"
                ? "لا توجد تذاكر في المعاملات المالية"
                : activeCategory === "support"
                ? "لا توجد استفسارات عامة حالياً"
                : statusFilter === "open"
                ? "لا توجد تذاكر مفتوحة حالياً"
                : "لا توجد تذاكر مطابقة"}
            </p>
            <p className="text-[11px] text-muted-foreground max-w-xs mx-auto leading-relaxed">
              {activeCategory === "unread"
                ? "جميع التذاكر والمحادثات مقروءة ومحدثة."
                : statusFilter === "open"
                ? "تقوم خدمة عملاء الشحن بمعالجة وإغلاق التذاكر فور الرد عليها. يمكنك مراجعة تبويب «كافة الحالات» لرؤية كافة التذاكر والردود."
                : "يمكنك فتح تذكرة جديدة لأي استفسار أو شكوى شحن."}
            </p>
            {statusFilter === "open" && (
              <button
                type="button"
                onClick={() => onChangeStatusFilter("all")}
                className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-muted hover:bg-muted dark:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground transition cursor-pointer"
              >
                <span>عرض كافة الحالات</span>
              </button>
            )}
          </div>
        ) : (
          processedTickets.map((t) => {
            const isSelected = selectedTicketId === t.id;
            const badge = getStatusBadge(t.status);
            const unreadMsgCount = Number(
              t.un_read_messages_count ||
              t.unread_messages_count ||
              (t.unread ? 1 : 0) ||
              (t.is_seen === false ? 1 : 0) ||
              0
            );
            const title =
              t.subject ||
              t.description ||
              t.content ||
              `تذكرة #${t.id}`;
            const timeStr = t.created_at ? formatSafeDate(t.created_at) : "";
            const creator =
              t.creator_name ||
              t.client_name ||
              t.user_name ||
              t.sender_name ||
              (t.user?.name ? t.user.name : null);

            const linkedOrderNumber =
              t.matchedOrderSummary?.orderNumber ||
              t.matchedOrder?.orderNumber;

            return (
              <div
                key={t.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTicket(t)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelectTicket(t);
                  }
                }}
                className={`p-3 text-right cursor-pointer transition relative group focus:outline-hidden ${
                  isSelected
                    ? "bg-zinc-100 dark:bg-muted"
                    : unreadMsgCount > 0
                    ? "bg-rose-500/[0.04] dark:bg-destructive/[0.08] hover:bg-destructive/[0.08] dark:hover:bg-destructive/[0.12]"
                    : "hover:bg-zinc-50 dark:hover:bg-muted"
                }`}
              >
                {/* Active / Unread Indicator Strip */}
                {isSelected ? (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-muted dark:bg-muted rounded-l" />
                ) : unreadMsgCount > 0 ? (
                  <div className="absolute right-0 top-0 bottom-0 w-1 bg-destructive rounded-l" />
                ) : null}

                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
                    <span className="font-mono text-xs font-bold text-foreground dark:text-muted-foreground tabular-nums">
                      #{t.id}
                    </span>
                    {t.storeName && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold bg-primary/10 text-primary dark:text-primary border border-primary/20 truncate max-w-[110px]"
                        title={`المتجر: ${t.storeName}${t.clientCode ? ` (#${t.clientCode})` : ""}`}
                      >
                        {t.storeName}
                      </span>
                    )}
                    {t.code && String(t.code).trim() !== String(t.id).trim() && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground truncate max-w-[120px]">
                        شحنة: {t.code}
                      </span>
                    )}
                    {linkedOrderNumber && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-success/10 text-success dark:text-success border border-success/20 font-semibold truncate max-w-[130px]"
                        title={`طلب مرتبط: #${linkedOrderNumber}`}
                      >
                        <span>طلب #{linkedOrderNumber}</span>
                      </span>
                    )}
                    {unreadMsgCount > 0 && (
                      <span
                        className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-destructive text-white shadow-2xs tabular-nums"
                        title={`${unreadMsgCount} رسائل غير مقروءة`}
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping" />
                        {unreadMsgCount}
                      </span>
                    )}
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium shrink-0 ${badge.className}`}
                  >
                    {badge.label}
                  </span>
                </div>

                <div className="mb-2 space-y-0.5">
                  <p
                    className={`text-xs line-clamp-2 leading-relaxed ${
                      unreadMsgCount > 0
                        ? "font-bold text-foreground dark:text-muted-foreground"
                        : "text-zinc-600 dark:text-muted-foreground"
                    }`}
                  >
                    {title}
                  </p>
                  {creator && (
                    <p className="text-[10px] text-muted-foreground dark:text-muted-foreground truncate">
                      تذكرة بواسطة: <span className="text-zinc-600 dark:text-muted-foreground font-medium">{creator}</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-muted-foreground dark:text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ClockIcon className="h-3 w-3" />
                    <span className="tabular-nums">{timeStr}</span>
                  </span>
                  {unreadMsgCount > 0 ? (
                    <span className="inline-flex items-center gap-1 text-destructive dark:text-destructive font-bold tabular-nums">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive" />
                      <span>{unreadMsgCount} غير مقروء</span>
                    </span>
                  ) : t.rate ? (
                    <span className="text-amber-500 font-semibold tabular-nums">
                      ★ {t.rate}/5
                    </span>
                  ) : t.messages && t.messages.length > 0 ? (
                    <span className="text-zinc-400 tabular-nums">
                      {t.messages.length} رسالة
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Footer */}
      {total > perPage && (
        <div className="p-2 border-t border-border dark:border-border flex items-center justify-between text-xs text-muted-foreground dark:text-muted-foreground bg-muted dark:bg-muted shrink-0">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => onPageChange(page - 1)}
            className="px-2 py-1 rounded border border-border dark:border-border hover:bg-white dark:hover:bg-muted disabled:opacity-40 transition"
          >
            السابق
          </button>
          <span className="tabular-nums text-[11px]">
            {page} / {totalPages} ({total} تذكرة)
          </span>
          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => onPageChange(page + 1)}
            className="px-2 py-1 rounded border border-border dark:border-border hover:bg-white dark:hover:bg-muted disabled:opacity-40 transition"
          >
            التالي
          </button>
        </div>
      )}
    </aside>
  );
};
