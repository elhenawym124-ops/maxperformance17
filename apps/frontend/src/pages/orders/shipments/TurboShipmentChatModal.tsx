import React, { useState, useEffect } from "react";
import {
  XMarkIcon,
  PaperAirplaneIcon,
  ChatBubbleLeftRightIcon,
  ArrowPathIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import { toast } from "sonner";
import { apiClient } from "../../../services/apiClient";

interface MessageItem {
  id: number | string;
  sender_name?: string;
  message?: string;
  created_at?: string;
  grouped_message_date?: string;
  your_message?: number | boolean;
}

interface TurboShipmentChatModalProps {
  shipmentId: string;
  trackingCode: string;
  orderNumber?: string;
  onClose: () => void;
}

export const TurboShipmentChatModal: React.FC<TurboShipmentChatModalProps> = ({
  shipmentId,
  trackingCode,
  orderNumber,
  onClose,
}) => {
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [canSend, setCanSend] = useState(true);
  const [text, setText] = useState("");

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<any>(`/shipments/${shipmentId}/messages`);
      if (res.data?.success) {
        setMessages(res.data.messages || []);
        if (res.data.can_send !== undefined) {
          setCanSend(Boolean(res.data.can_send));
        }
      } else {
        toast.error(res.data?.message || "تعذر جلب رسائل الشحنة");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "حدث خطأ أثناء تحميل المحادثة");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [shipmentId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || sending || !canSend) return;

    const messageText = text.trim();
    setSending(true);
    try {
      const res = await apiClient.post<any>(`/shipments/${shipmentId}/messages`, {
        message: messageText,
      });

      if (res.data?.success) {
        toast.success("تم إرسال الرسالة إلى شركة الشحن");
        setText("");
        // Optimistic append
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now(),
            sender_name: "أنا (المتجر)",
            message: messageText,
            created_at: new Date().toISOString(),
            your_message: 1,
          },
        ]);
      } else {
        toast.error(res.data?.message || "فشل إرسال الرسالة");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "تعذر إرسال الرسالة لشركة الشحن");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-xs animate-fadeIn">
      <div className="w-full max-w-lg bg-white dark:dark:bg-muted rounded-xl border border-border dark:dark:border-border shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3.5 border-b border-border dark:dark:border-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-primary/10 dark:bg-primary/40 text-primary">
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <span>محادثة الشحنة #{trackingCode}</span>
                {orderNumber && (
                  <span className="text-xs font-normal text-muted-foreground">
                    (طلب {orderNumber})
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-muted-foreground">
                التواصل المباشر مع إدارة تربو ومندوب الشحن
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={fetchMessages}
              disabled={loading}
              className="p-1.5 text-muted-foreground hover:hover:text-foreground dark:hover:dark:hover:text-muted-foreground rounded-lg hover:hover:bg-muted dark:hover:dark:hover:bg-muted"
              title="تحديث الرسائل"
            >
              <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-muted-foreground hover:hover:text-foreground dark:hover:dark:hover:text-muted-foreground rounded-lg hover:hover:bg-muted dark:hover:dark:hover:bg-muted"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Area */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 /50/50bg-muted dark:dark:bg-muted">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
              جاري تحميل المحادثة من نظام تربو...
            </div>
          ) : messages.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground space-y-1">
              <ChatBubbleLeftRightIcon className="h-8 w-8 mx-auto text-muted-foreground dark:dark:text-foreground mb-2" />
              <p className="font-semibold text-muted-foreground">
                لا توجد رسائل سابقة على هذه الشحنة
              </p>
              <p className="text-[11px]">
                يمكنك كتابة ملاحظة أو استفسار للمندوب والإدارة بالأسفل.
              </p>
            </div>
          ) : (
            messages.map((m) => {
              const isMine = Boolean(m.your_message);
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isMine ? "items-start" : "items-end"}`}
                >
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mb-1 px-1">
                    <span className="font-medium text-muted-foreground">
                      {m.sender_name || (isMine ? "المتجر" : "تربو / المندوب")}
                    </span>
                    {m.created_at && (
                      <span>• {new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</span>
                    )}
                  </div>

                  <div
                    className={`max-w-[85%] rounded-xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs ${
                      isMine
                        ? "bg-primary text-white rounded-br-xs"
                        : "bg-card text-foreground border /80/80border-border dark:dark:border-border rounded-bl-xs"
                    }`}
                  >
                    {m.message}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input Bar or Closed Notice */}
        <div className="p-3 border-t border-border dark:dark:border-border bg-white dark:dark:bg-muted">
          {!canSend ? (
            <div className="p-2.5 rounded-xl bg-warning/10 dark:bg-warning/40 border border-warning dark:border-warning flex items-center gap-2 text-xs text-warning dark:text-warning">
              <LockClosedIcon className="h-4 w-4 shrink-0" />
              <span>
                المحادثة مغلقة على هذه الشحنة (مضى أكثر من 24 ساعة على تنفيذها أو تم إنهاؤها).
              </span>
            </div>
          ) : (
            <form onSubmit={handleSendMessage} className="flex items-center gap-2">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب رسالة أو تعليمات للمندوب وإدارة الشحن..."
                disabled={sending}
                className="flex-1 px-3 py-2 text-xs bg-muted dark:dark:bg-muted border border-border dark:dark:border-border rounded-xl focus:ring-2 focus:ring-primary text-foreground"
              />
              <button
                type="submit"
                disabled={sending || !text.trim()}
                className="p-2 rounded-xl bg-primary hover:bg-primary/90 disabled:opacity-50 text-white transition active:scale-95 flex items-center justify-center shrink-0"
              >
                <PaperAirplaneIcon className="h-4 w-4 rotate-180" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
