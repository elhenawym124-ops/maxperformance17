import React from "react";
import { MessageSquare, Search } from "lucide-react";
import type { Ticket } from "./types";

interface AdminTicketsSidebarProps {
  allTickets: Ticket[];
  filteredTickets: Ticket[];
  ticketsSearchQuery: string;
  setTicketsSearchQuery: (val: string) => void;
  activeTicketId: string | undefined;
  onSelectTicket: (ticketId: string) => void;
}

export const AdminTicketsSidebar: React.FC<AdminTicketsSidebarProps> = ({
  allTickets,
  filteredTickets,
  ticketsSearchQuery,
  setTicketsSearchQuery,
  activeTicketId,
  onSelectTicket,
}) => {
  return (
    <div className="w-80 bg-white dark:bg-muted border-l border-border dark:border-border flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="p-4 border-b border-border dark:border-border flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-foreground dark:text-muted-foreground flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            التذاكر
          </h2>
          <span className="bg-indigo-100 dark:bg-primary/40 text-primary dark:text-primary px-2 py-1 rounded-full text-sm font-medium">
            {allTickets.length}
          </span>
        </div>
        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="بحث في التذاكر..."
            value={ticketsSearchQuery}
            onChange={(e) => setTicketsSearchQuery(e.target.value)}
            className="w-full pe-10 ps-4 py-2.5 border border-border dark:border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary bg-muted dark:bg-muted text-foreground dark:text-muted-foreground"
          />
        </div>
      </div>

      {/* Tickets List - Scrollable */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {filteredTickets.map((t, idx) => (
          <div
            key={t._id || t.ticketId || idx}
            onClick={() => onSelectTicket(t.ticketId)}
            className={`p-4 border-b border-border dark:border-border cursor-pointer hover:bg-muted dark:hover:bg-muted transition-all ${
              t.ticketId === activeTicketId
                ? "bg-indigo-50 dark:bg-primary/30 border-r-4 border-r-indigo-500"
                : ""
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                  t.status === "open"
                    ? "bg-emerald-500"
                    : t.status === "in_progress"
                      ? "bg-indigo-500"
                      : "bg-slate-300 dark:bg-muted"
                }`}
              />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground dark:text-muted-foreground text-base truncate mb-1">
                  {t.subject}
                </div>
                <div className="text-sm text-muted-foreground dark:text-muted-foreground mb-2">
                  {t.userId?.name || "مستخدم"}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{t.ticketId}</span>
                  <span>•</span>
                  <span>
                    {new Date(t.createdAt).toLocaleDateString("ar-EG")}
                  </span>
                </div>
              </div>
              <div
                className={`text-xs px-2 py-1 rounded-lg font-medium ${
                  t.priority === "critical"
                    ? "bg-red-100 text-destructive dark:bg-destructive/40 dark:text-destructive"
                    : t.priority === "high"
                      ? "bg-orange-100 text-warning dark:bg-warning/40 dark:text-warning"
                      : t.priority === "low"
                        ? "bg-emerald-100 text-success dark:bg-success/40 dark:text-success"
                        : "bg-slate-100 text-foreground dark:bg-muted dark:text-muted-foreground"
                }`}
              >
                {t.priority === "critical"
                  ? "حرجة"
                  : t.priority === "high"
                    ? "عالية"
                    : t.priority === "low"
                      ? "منخفضة"
                      : "متوسطة"}
              </div>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">
            لا توجد تذاكر
          </div>
        )}
      </div>
    </div>
  );
};
