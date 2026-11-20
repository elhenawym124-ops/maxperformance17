import React from "react";
import { PaperAirplaneIcon, PhotoIcon } from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface TicketReplyFormCardProps {
  replyMessage: string;
  replyImage: File | null;
  sendingReply: boolean;
  onChangeMessage: (message: string) => void;
  onSetImage: (image: File | null) => void;
  onChangeImage: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const TicketReplyFormCard: React.FC<TicketReplyFormCardProps> = ({
  replyMessage,
  replyImage,
  sendingReply,
  onChangeMessage,
  onSetImage,
  onChangeImage,
  onSubmit,
}) => {
  return (
    <div className="mt-6 rounded-lg bg-white p-6 shadow dark:bg-muted dark:shadow-black/20">
      <h2 className="mb-4 text-lg font-semibold text-foreground">
        إرسال رد
      </h2>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="replyMessage"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            الرسالة
          </label>
          <textarea
            id="replyMessage"
            value={replyMessage}
            onChange={(e) => onChangeMessage(e.target.value)}
            onPaste={(e) => {
              const items = e.clipboardData?.items;
              if (!items) return;
              for (let i = 0; i < items.length; i++) {
                if (items[i].type && items[i].type.startsWith("image/")) {
                  const blob = items[i].getAsFile();
                  if (blob) {
                    e.preventDefault();
                    const ext = blob.type.split("/")[1] || "png";
                    const file = new File([blob], `screenshot_${Date.now()}.${ext}`, {
                      type: blob.type || "image/png",
                    });
                    onSetImage(file);
                    toast.success("تم لصق لقطة الشاشة بنجاح!");
                    return;
                  }
                }
              }
            }}
            rows={4}
            className="w-full rounded-lg border border-border px-3 py-2 focus:border-primary focus:ring-primary dark:border-border dark:bg-muted dark:text-muted-foreground"
            placeholder={
              replyImage
                ? "اكتب تعليقاً على الصورة (اختياري) أو اضغط إرسال..."
                : "اكتب رسالتك هنا، أو الصق لقطة الشاشة مباشرة (Ctrl+V)..."
            }
            disabled={sendingReply}
          />
        </div>

        <div>
          <label
            htmlFor="replyImage"
            className="mb-2 block text-sm font-medium text-foreground"
          >
            صورة (اختياري)
          </label>
          <div className="flex items-center gap-4">
            <label
              htmlFor="replyImage"
              className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-4 py-2 hover:bg-muted dark:border-border dark:hover:bg-muted transition-colors"
            >
              <PhotoIcon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-foreground">
                {replyImage ? replyImage.name : "اختر صورة"}
              </span>
            </label>
            <input
              id="replyImage"
              type="file"
              accept="image/*"
              onChange={onChangeImage}
              className="hidden"
              disabled={sendingReply}
            />
            {replyImage && (
              <button
                type="button"
                onClick={() => onSetImage(null)}
                className="text-sm text-destructive hover:text-destructive dark:text-destructive dark:hover:text-destructive font-medium"
                disabled={sendingReply}
              >
                إزالة
              </button>
            )}
          </div>
        </div>

        <button
          type="submit"
          disabled={sendingReply || (!replyMessage.trim() && !replyImage)}
          className="flex items-center gap-2 bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary disabled:bg-muted disabled:cursor-not-allowed font-medium transition-colors"
        >
          <PaperAirplaneIcon className="w-5 h-5 rtl:scale-x-[-1]" />
          <span>{sendingReply ? "جاري الإرسال..." : "إرسال الرد"}</span>
        </button>
      </form>
    </div>
  );
};
