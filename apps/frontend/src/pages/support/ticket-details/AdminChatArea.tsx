import React from "react";
import {
  ArrowRight,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Trash2,
  MessageSquare,
  Shield,
  User,
  Lock,
  Paperclip,
  Send,
  X,
} from "lucide-react";
import LinkifiedText from "../../../components/common/LinkifiedText";
import { Ticket, AttachmentFile, getStatusText, getCategoryText } from "./types";

interface AdminChatAreaProps {
  ticket: Ticket;
  onBack: () => void;
  onUpdateStatus: (newStatus: string) => void;
  adminTab: "reply" | "note";
  setAdminTab: (tab: "reply" | "note") => void;
  messageContent: string;
  setMessageContent: (val: string) => void;
  attachments: AttachmentFile[];
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
  handleSendMessage: (e: React.FormEvent) => void;
  sendingMessage: boolean;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const AdminChatArea: React.FC<AdminChatAreaProps> = ({
  ticket,
  onBack,
  onUpdateStatus,
  adminTab,
  setAdminTab,
  messageContent,
  setMessageContent,
  attachments,
  handleFileUpload,
  removeAttachment,
  handleSendMessage,
  sendingMessage,
  messagesEndRef,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-5 h-5 text-warning" />;
      case "in_progress":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "closed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-muted dark:bg-muted">
      {/* Navbar breadcrumb / Header */}
      <div
        className="bg-white/80 dark:bg-muted backdrop-blur-md border-b border-border dark:border-border px-8 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm transition-all"
        dir="rtl"
      >
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-muted dark:hover:bg-muted rounded-full transition-colors text-muted-foreground"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground dark:text-muted-foreground flex items-center gap-2 tracking-tight">
              {ticket.subject}
              <span className="text-sm font-normal text-muted-foreground bg-muted dark:bg-muted px-2 py-0.5 rounded-full">
                #{ticket.ticketId}
              </span>
            </h1>
            <div className="flex items-center gap-2 text-sm text-muted-foreground dark:text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />{" "}
                {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span className="bg-slate-100 dark:bg-muted px-2 py-0.5 rounded text-xs text-foreground dark:text-muted-foreground font-medium">
                {getCategoryText(ticket.category)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="relative group">
            <button
              className={`flex items-center gap-2 px-4 py-2 rounded-xl border shadow-sm font-medium transition-all duration-200 hover:shadow-md ${
                ticket.status === "open"
                  ? "bg-emerald-50 dark:bg-success/40 text-success dark:text-success border-success dark:border-success"
                  : ticket.status === "in_progress"
                    ? "bg-indigo-50 dark:bg-primary/40 text-primary dark:text-primary border-primary dark:border-primary"
                    : "bg-slate-50 dark:bg-muted text-foreground dark:text-muted-foreground border-border dark:border-border"
              }`}
            >
              {getStatusIcon(ticket.status)}
              {getStatusText(ticket.status)}
            </button>
            {/* Popup Menu */}
            <div className="absolute left-0 mt-2 w-48 bg-white dark:bg-muted border border-border dark:border-border rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 transform origin-top-left p-1 max-h-48 overflow-y-auto">
              <button
                onClick={() => onUpdateStatus("open")}
                className="w-full text-right px-4 py-2 hover:bg-success/10 dark:hover:bg-success/30 text-sm flex items-center gap-3 rounded-lg text-foreground dark:text-muted-foreground transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-success ring-2 ring-success"></div>{" "}
                مفتوح
              </button>
              <button
                onClick={() => onUpdateStatus("in_progress")}
                className="w-full text-right px-4 py-2 hover:bg-primary/10 dark:hover:bg-primary/30 text-sm flex items-center gap-3 rounded-lg text-foreground dark:text-muted-foreground transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary ring-2 ring-primary"></div>{" "}
                قيد المعالجة
              </button>
              <button
                onClick={() => onUpdateStatus("closed")}
                className="w-full text-right px-4 py-2 hover:bg-muted dark:hover:bg-muted text-sm flex items-center gap-3 rounded-lg text-foreground dark:text-muted-foreground transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-muted ring-2 ring-border"></div>{" "}
                مغلق
              </button>
            </div>
          </div>
          <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 dark:hover:bg-destructive/30 rounded-xl transition-colors border border-transparent hover:border-destructive">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Chat Content Wrapper */}
      <div className="flex-1 p-4 min-h-0 flex flex-col">
        <div className="bg-white dark:bg-muted rounded-xl shadow-sm border border-border dark:border-border overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-300">
          <div className="p-4 border-b border-border dark:border-border bg-white dark:bg-muted flex items-center justify-between flex-shrink-0">
            <h2 className="font-bold text-foreground dark:text-muted-foreground flex items-center gap-3">
              <div className="p-2 bg-primary/10 dark:bg-primary/50 rounded-lg text-primary">
                <MessageSquare className="w-5 h-5" />
              </div>
              سجل المحادثة
            </h2>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-muted dark:bg-muted min-h-0 custom-scrollbar">
            {ticket.messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.senderType === "user" ? "justify-start" : "justify-end"}`}
              >
                {/* Avatar */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${message.senderType === "admin" ? "bg-blue-100 ms-3 order-last" : "bg-gray-300 me-3"}`}
                >
                  {message.senderType === "admin" ? (
                    <Shield className="w-4 h-4 text-blue-600" />
                  ) : (
                    <User className="w-4 h-4 text-foreground" />
                  )}
                </div>

                <div
                  className={`max-w-[75%] space-y-1 ${message.senderType === "admin" ? "text-left" : "text-right"}`}
                >
                  {/* Sender Name & Time */}
                  <div
                    className={`flex items-center gap-2 text-xs text-muted-foreground ${message.senderType === "admin" ? "flex-row-reverse" : ""}`}
                  >
                    <span className="font-medium text-foreground">
                      {message.senderType === "admin"
                        ? "الدعم الفني"
                        : message.sender.name}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(message.createdAt).toLocaleTimeString("en-US", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Bubble */}
                  <div
                    className={`px-5 py-4 rounded-xl text-sm leading-relaxed shadow-sm transition-all hover:shadow-md max-w-full ${
                      message.isInternal
                        ? "bg-amber-50 dark:bg-warning/40 border border-warning dark:border-warning text-warning dark:text-warning rounded-bl-none"
                        : message.senderType === "admin"
                          ? "bg-indigo-600 text-white rounded-br-none"
                          : "bg-white dark:bg-muted border border-border dark:border-border text-foreground dark:text-muted-foreground rounded-bl-none"
                    }`}
                  >
                    {message.isInternal && (
                      <div className="flex items-center gap-1 text-xs font-bold mb-1 opacity-70">
                        <Lock className="w-3 h-3" /> ملاحظة داخلية
                      </div>
                    )}
                    <LinkifiedText text={message.content} className="block" />
                    {message.attachments.length > 0 && (
                      <div className="mt-3 space-y-2 pt-2 border-t border-white/20">
                        {message.attachments.map((attachment, i) => (
                          <a
                            href={attachment.url}
                            target="_blank"
                            rel="noreferrer"
                            key={i}
                            className="flex items-center gap-2 text-xs hover:underline bg-black/10 p-2 rounded"
                          >
                            <Paperclip className="w-3 h-3" />{" "}
                            {attachment.originalName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Admin Reply Area - Fixed at bottom */}
          <div
            className="bg-white dark:bg-muted border-t border-border dark:border-border flex-shrink-0"
            style={{ minHeight: "140px", maxHeight: "140px" }}
          >
            {/* Tabs */}
            <div className="flex border-b border-border dark:border-border px-3 pt-2">
              <button
                onClick={() => setAdminTab("reply")}
                className={`pb-2 px-2 text-xs font-semibold transition-all relative ${adminTab === "reply" ? "text-primary" : "text-slate-400 hover:text-foreground"}`}
              >
                رد عام
                {adminTab === "reply" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full animate-fadeIn" />
                )}
              </button>

              <button
                onClick={() => setAdminTab("note")}
                className={`pb-2 px-2 text-xs font-semibold transition-all relative flex items-center gap-1 ${adminTab === "note" ? "text-amber-600 dark:text-warning" : "text-slate-400 hover:text-foreground"}`}
              >
                <Lock className="w-3 h-3" /> ملاحظة داخلية
                {adminTab === "note" && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-warning rounded-full animate-fadeIn" />
                )}
              </button>
            </div>

            <form
              onSubmit={handleSendMessage}
              className={`p-2 h-full flex flex-col justify-between transition-all duration-300 ${adminTab === "note" ? "bg-amber-50/50 dark:bg-warning/20" : ""}`}
            >
              <textarea
                value={messageContent}
                onChange={(e) => setMessageContent(e.target.value)}
                className={`w-full p-2 border rounded-lg focus:ring-1 outline-none resize-none transition-all text-sm custom-scrollbar text-foreground dark:text-muted-foreground ${
                  adminTab === "note"
                    ? "bg-white dark:bg-muted border-warning dark:border-warning focus:ring-warning focus:border-warning"
                    : "bg-slate-50 dark:bg-muted focus:bg-white dark:focus:bg-muted border-border dark:border-border focus:ring-primary focus:border-primary"
                }`}
                style={{ height: "60px" }}
                placeholder={
                  adminTab === "note"
                    ? "اكتب ملاحظة للفريق الداخلي فقط..."
                    : "اكتب ردك للعميل هنا..."
                }
              />
              <div className="flex items-center justify-between mt-2">
                <div className="flex gap-1">
                  <label className="cursor-pointer p-1.5 hover:bg-muted dark:hover:bg-muted rounded-md text-muted-foreground transition-colors group">
                    <Paperclip className="w-3 h-3 group-hover:text-primary transition-colors" />
                    <input
                      type="file"
                      multiple
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
                <button
                  type="submit"
                  disabled={
                    sendingMessage ||
                    (!messageContent.trim() && attachments.length === 0)
                  }
                  className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                    adminTab === "note"
                      ? "bg-amber-500 hover:bg-warning text-white"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  {sendingMessage ? (
                    "جاري الإرسال..."
                  ) : (
                    <>
                      <Send className="w-3 h-3 transform rotate-180" />{" "}
                      {adminTab === "note" ? "حفظ" : "إرسال"}
                    </>
                  )}
                </button>
              </div>

              {attachments.length > 0 && (
                <div className="flex gap-2 overflow-x-auto mt-3">
                  {attachments.map((file, idx) => (
                    <div
                      key={idx}
                      className="relative group bg-muted dark:bg-muted rounded-lg p-2 border border-border dark:border-border flex items-center gap-2 min-w-[100px] flex-shrink-0 text-foreground dark:text-muted-foreground"
                    >
                      <div className="text-sm truncate max-w-[80px]">
                        {file.file.name}
                      </div>
                      <button
                        type="button"
                        onClick={() => removeAttachment(idx)}
                        className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
