import React from "react";
import { Pin, X } from "lucide-react";
import { Message } from "../../../hooks/useWhatsAppQueries";
import { cn } from "@/lib/utils";

interface PinnedMessageBannerProps {
  pinnedMessage: Message | null;
  onScrollToMessage: (messageId: string) => void;
  onUnpin: (messageId: string) => void;
  className?: string;
}

export const PinnedMessageBanner: React.FC<PinnedMessageBannerProps> = ({
  pinnedMessage,
  onScrollToMessage,
  onUnpin,
  className,
}) => {
  if (!pinnedMessage) return null;

  const getSnippet = (msg: Message): string => {
    if (msg.messageType === "POLL") {
      try {
        const p = JSON.parse(msg.interactiveData || "{}");
        return `📊 استطلاع رأي: ${p.name || msg.content || ""}`;
      } catch {
        return `📊 استطلاع رأي: ${msg.content || ""}`;
      }
    }
    if (msg.messageType === "IMAGE") return "📷 صورة";
    if (msg.messageType === "STICKER") return "💟 ملصق";
    if (msg.messageType === "VIDEO") return "🎥 فيديو";
    if (msg.messageType === "AUDIO" || msg.messageType === "VOICE") return "🎵 مقطع صوتي";
    if (msg.messageType === "DOCUMENT" || msg.messageType === "FILE") return `📄 مستند: ${msg.mediaFileName || ""}`;
    if (msg.messageType === "LOCATION") return "📍 موقع جغرافي";
    if (msg.messageType === "INTERACTIVE") return `✨ رسالة تفاعلية: ${msg.content || ""}`;
    return msg.content || "رسالة مثبتة";
  };

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 border-b border-border/70 bg-[var(--whatsapp-surface-overlay)] px-4 py-2 text-xs transition-colors backdrop-blur-xs",
        className,
      )}
    >
      <button
        type="button"
        onClick={() => onScrollToMessage(pinnedMessage.messageId)}
        className="flex min-w-0 flex-1 items-center gap-2 text-start transition-opacity hover:opacity-85"
        title="انقر للانتقال إلى الرسالة"
      >
        <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-warning/15 text-warning dark:text-warning">
          <Pin className="size-3.5" />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block font-bold text-warning dark:text-warning text-[11px]">
            رسالة مثبتة
          </span>
          <p className="truncate text-[11px] text-muted-foreground">
            {getSnippet(pinnedMessage)}
          </p>
        </div>
      </button>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onUnpin(pinnedMessage.messageId);
        }}
        className="flex size-6 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        title="إلغاء التثبيت"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
};

export default PinnedMessageBanner;
