import React from "react";
import {
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  PaperAirplaneIcon,
} from "@heroicons/react/24/outline";

export interface MessengerMessageInputProps {
  newMessage: string;
  onNewMessageChange: (val: string) => void;
  onSendMessage: () => void;
  onOpenSavedReplies: () => void;
  onFileUpload: (file: File) => void;
  sending: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

export const MessengerMessageInput: React.FC<MessengerMessageInputProps> = ({
  newMessage,
  onNewMessageChange,
  onSendMessage,
  onOpenSavedReplies,
  onFileUpload,
  sending,
  fileInputRef,
}) => {
  return (
    <div className="bg-white border-t border-border p-4">
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenSavedReplies}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="الردود المحفوظة"
          aria-label="الردود المحفوظة"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </button>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*,audio/*,video/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onFileUpload(file);
            }
          }}
          aria-label="اختيار ملف للإرفاق"
        />
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onNewMessageChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              onSendMessage();
            }
          }}
          placeholder="اكتب رسالتك..."
          className="flex-1 px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        <button
          onClick={onSendMessage}
          disabled={!newMessage.trim() || sending}
          className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="إرسال الرسالة"
          aria-label="إرسال الرسالة"
        >
          <PaperAirplaneIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
