import React from "react";
import {
  Mail,
  Building,
  MoreVertical,
  Flag,
  User,
} from "lucide-react";
import { Ticket, getCategoryText } from "./types";

interface AdminMetaPanelProps {
  ticket: Ticket;
  userHistory: any[];
  staffList: any[];
  currentUserId?: string;
  onUpdatePriority: (newPriority: string) => void;
  onAssignToMe: () => void;
  onAssignUser: (staffId: string) => void;
  onSelectHistoryTicket: (ticketId: string) => void;
}

export const AdminMetaPanel: React.FC<AdminMetaPanelProps> = ({
  ticket,
  userHistory,
  staffList,
  currentUserId,
  onUpdatePriority,
  onAssignToMe,
  onAssignUser,
  onSelectHistoryTicket,
}) => {
  return (
    <div className="w-80 bg-white dark:bg-muted border-r border-border dark:border-border flex flex-col flex-shrink-0">
      <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">
        {/* Customer Card */}
        <div className="bg-gradient-to-br from-slate-50 to-primary/30 dark:from-slate-800/50 dark:to-primary/20 rounded-xl p-5 border border-border dark:border-border">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 tracking-wider">
            بيانات العميل
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-gradient-to-br from-primary to-primary text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-lg">
              {ticket.userId?.name ? ticket.userId.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <div className="font-bold text-foreground dark:text-muted-foreground text-lg">
                {ticket.userId?.name}
              </div>
              <div className="text-sm text-muted-foreground dark:text-muted-foreground flex items-center gap-1">
                <Mail className="w-4 h-4" /> {ticket.userId?.email}
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-base text-foreground dark:text-muted-foreground p-3 bg-white dark:bg-muted rounded-xl border border-border dark:border-border">
              <Building className="w-5 h-5 text-muted-foreground" />
              <div>
                <span className="block text-xs text-muted-foreground uppercase">
                  الشركة
                </span>
                <span className="font-medium text-foreground dark:text-muted-foreground">
                  شركة تجريبية
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Ticket Meta */}
        <div className="bg-white dark:bg-muted rounded-xl p-5 border border-border dark:border-border shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 tracking-wider">
            معلومات التذكرة
          </h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground dark:text-muted-foreground block mb-2 font-medium">
                المعرف (ID)
              </label>
              <div className="font-mono bg-muted dark:bg-muted p-3 rounded-xl border border-border dark:border-border text-base select-all text-foreground dark:text-muted-foreground tracking-wider text-center">
                {ticket.ticketId}
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground dark:text-muted-foreground block mb-2 font-medium">
                القسم
              </label>
              <button
                type="button"
                className="w-full text-right flex items-center justify-between px-4 py-3 border border-border dark:border-border rounded-xl hover:border-primary transition-all bg-white dark:bg-muted text-foreground dark:text-muted-foreground text-base"
              >
                {getCategoryText(ticket.category)}
                <MoreVertical className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div>
              <label className="text-sm text-muted-foreground dark:text-muted-foreground block mb-2 font-medium">
                الأولوية
              </label>
              <div className="relative group">
                <button
                  type="button"
                  className="w-full text-right flex items-center justify-between px-4 py-3 border border-border dark:border-border rounded-xl hover:border-primary transition-all bg-white dark:bg-muted text-base"
                >
                  <span className="flex items-center gap-2 font-medium text-foreground dark:text-muted-foreground">
                    <Flag
                      className={`w-4 h-4 ${
                        ticket.priority === "critical"
                          ? "text-red-500 fill-destructive"
                          : ticket.priority === "high"
                            ? "text-orange-500"
                            : ticket.priority === "low"
                              ? "text-emerald-500"
                              : "text-blue-500"
                      }`}
                    />
                    {ticket.priority === "critical" ? (
                      <span className="text-red-600 dark:text-destructive">حرجة</span>
                    ) : ticket.priority === "high" ? (
                      <span className="text-orange-600 dark:text-warning">عالية</span>
                    ) : ticket.priority === "low" ? (
                      <span className="text-emerald-600 dark:text-success">منخفضة</span>
                    ) : (
                      <span className="text-blue-600 dark:text-blue-400">متوسطة</span>
                    )}
                  </span>
                </button>
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => onUpdatePriority("low")}
                    className="w-full text-right px-4 py-3 hover:bg-success/10 dark:hover:bg-success/30 text-success dark:text-success text-base flex items-center gap-2 border-b border-border dark:border-border font-medium"
                  >
                    منخفضة
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePriority("medium")}
                    className="w-full text-right px-4 py-3 hover:bg-blue-50 dark:hover:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-base flex items-center gap-2 border-b border-border dark:border-border font-medium"
                  >
                    متوسطة
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePriority("high")}
                    className="w-full text-right px-4 py-3 hover:bg-warning/10 dark:hover:bg-warning/30 text-warning dark:text-warning text-base flex items-center gap-2 border-b border-border dark:border-border font-medium"
                  >
                    عالية
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdatePriority("critical")}
                    className="w-full text-right px-4 py-3 hover:bg-destructive/10 dark:hover:bg-destructive/30 text-destructive dark:text-destructive text-base flex items-center gap-2 font-bold"
                  >
                    حرجة
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm text-muted-foreground dark:text-muted-foreground block mb-2 font-medium">
                المكلف
              </label>
              <div className="relative group">
                {ticket.assignedTo ? (
                  <div className="flex items-center gap-3 p-3 bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-sm cursor-pointer hover:border-primary transition-colors">
                    <div className="w-10 h-10 bg-primary dark:bg-primary/40 rounded-xl flex items-center justify-center text-base font-bold text-primary dark:text-primary">
                      {ticket.assignedTo.name.charAt(0)}
                    </div>
                    <span className="text-base font-medium text-foreground dark:text-muted-foreground">
                      {ticket.assignedTo.name}
                    </span>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="w-full py-3 border-2 border-dashed border-border dark:border-border text-muted-foreground dark:text-muted-foreground rounded-xl hover:border-primary hover:text-primary hover:bg-primary/50 text-base transition-all font-medium flex items-center justify-center gap-2"
                  >
                    <User className="w-5 h-5" /> تعيين موظف
                  </button>
                )}
                <div className="absolute left-0 mt-1 w-full bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-48 overflow-y-auto">
                  <button
                    type="button"
                    onClick={onAssignToMe}
                    className="w-full text-right px-4 py-3 hover:bg-primary/10 dark:hover:bg-primary/30 text-primary dark:text-primary text-base flex items-center gap-2 border-b border-border dark:border-border font-bold"
                  >
                    تعيين لي
                  </button>
                  {staffList
                    .filter((s) => s.id !== currentUserId)
                    .map((staff) => (
                      <button
                        type="button"
                        key={staff.id}
                        onClick={() => onAssignUser(staff.id)}
                        className="w-full text-right px-4 py-3 hover:bg-muted dark:hover:bg-muted text-foreground dark:text-muted-foreground text-base flex items-center gap-2 border-b border-border dark:border-border"
                      >
                        <div className="w-8 h-8 bg-muted dark:bg-muted rounded-lg flex items-center justify-center text-sm font-bold text-muted-foreground dark:text-muted-foreground">
                          {staff.name.charAt(0)}
                        </div>
                        {staff.name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Previous Tickets */}
        <div className="bg-white dark:bg-muted rounded-xl p-5 border border-border dark:border-border shadow-sm">
          <h3 className="text-sm font-bold text-muted-foreground uppercase mb-4 tracking-wider">
            تذاكر سابقة للعميل
          </h3>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {userHistory.length > 0 ? (
              userHistory.map((hTicket) => (
                <div
                  key={hTicket.id}
                  onClick={() => onSelectHistoryTicket(hTicket.ticketId)}
                  className="cursor-pointer group flex items-start gap-3 p-3 rounded-xl hover:bg-muted dark:hover:bg-muted transition-colors border border-transparent hover:border-border dark:hover:border-border"
                >
                  <div
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      hTicket.status === "open"
                        ? "bg-emerald-500"
                        : hTicket.status === "closed"
                          ? "bg-slate-300 dark:bg-muted"
                          : "bg-indigo-500"
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-base font-medium text-foreground dark:text-muted-foreground truncate group-hover:text-primary dark:group-hover:text-primary transition-colors mb-1">
                      {hTicket.subject}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="font-mono">
                        {hTicket.ticketId}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(hTicket.createdAt).toLocaleDateString(
                          "ar-EG",
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-base text-muted-foreground italic text-center py-4 bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border">
                لا توجد تذاكر سابقة
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
