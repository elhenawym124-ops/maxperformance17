import React from "react";
import {
  PaperAirplaneIcon,
  FaceSmileIcon,
  PaperClipIcon,
} from "@heroicons/react/24/outline";

interface ChatMessageInputProps {
  newMessage: string;
  setNewMessage: (msg: string) => void;
  onTypingStart: () => void;
  onSendMessage: () => void;
  onKeyPress: (e: React.KeyboardEvent) => void;
}

export const ChatMessageInput: React.FC<ChatMessageInputProps> = ({
  newMessage,
  setNewMessage,
  onTypingStart,
  onSendMessage,
  onKeyPress,
}) => {
  return (
    <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-t border-border p-6 shadow-lg">
      <div className="flex items-end space-x-3 space-x-reverse">
        <button
          type="button"
          className="p-3 text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/10 transition-all duration-200 group"
          aria-label="إرفاق ملف"
        >
          <PaperClipIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
        <div className="flex-1 relative">
          <label htmlFor="conversation-message-input" className="sr-only">
            اكتب رسالتك هنا
          </label>
          <textarea
            id="conversation-message-input"
            name="message"
            autoComplete="off"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              onTypingStart();
            }}
            onKeyPress={onKeyPress}
            placeholder="اكتب رسالتك هنا..."
            className="w-full px-5 py-4 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary resize-none bg-white/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:shadow-md"
            rows={1}
          />
        </div>
        <button
          type="button"
          className="p-3 text-muted-foreground hover:text-primary rounded-xl hover:bg-primary/10 transition-all duration-200 group"
          aria-label="إضافة رموز تعبيرية"
        >
          <FaceSmileIcon className="h-5 w-5 group-hover:scale-110 transition-transform duration-200" />
        </button>
        <button
          type="button"
          onClick={onSendMessage}
          disabled={!newMessage.trim()}
          className="p-4 bg-gradient-to-r from-primary to-primary text-white rounded-xl hover:from-primary hover:to-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-105 group"
          aria-label="إرسال الرسالة"
        >
          <PaperAirplaneIcon className="h-5 w-5 group-hover:translate-x-1 transition-transform duration-200" />
        </button>
      </div>
    </div>
  );
};
