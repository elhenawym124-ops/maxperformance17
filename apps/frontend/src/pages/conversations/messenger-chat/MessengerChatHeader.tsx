import React from "react";
import {
  InformationCircleIcon,
  ChatBubbleLeftRightIcon,
  PaperClipIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import type { Conversation } from "./types";

export interface MessengerChatHeaderProps {
  conversation: Conversation;
  onToggleAi: () => void;
  onOpenCustomerProfile: () => void;
  onOpenSavedReplies: () => void;
  onTriggerFileUpload: () => void;
  onRequestDelete: () => void;
}

export const MessengerChatHeader: React.FC<MessengerChatHeaderProps> = ({
  conversation,
  onToggleAi,
  onOpenCustomerProfile,
  onOpenSavedReplies,
  onTriggerFileUpload,
  onRequestDelete,
}) => {
  return (
    <div className="bg-white border-b border-border p-4 flex justify-between items-center">
      <div className="flex items-center">
        {conversation.customerAvatar ? (
          <img
            src={conversation.customerAvatar}
            alt={conversation.customerName}
            className="w-10 h-10 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-gray-600 text-sm font-medium">
              {conversation.customerName?.charAt(0) || "ع"}
            </span>
          </div>
        )}
        <div className="ms-3">
          <h3 className="text-sm font-medium text-foreground">
            {conversation.customerName}
          </h3>
          <p className="text-sm text-muted-foreground">
            {conversation.isOnline ? "نشط الآن" : "غير متصل"}
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 space-x-reverse">
        <button
          onClick={onToggleAi}
          className={`p-2 rounded-full transition-colors ${
            conversation.aiEnabled !== false
              ? "text-blue-600 hover:text-blue-800 bg-blue-50"
              : "text-gray-400 hover:text-foreground"
          }`}
          title={
            conversation.aiEnabled !== false
              ? "إيقاف الرد الآلي"
              : "تشغيل الرد الآلي"
          }
          aria-label="تبديل الرد الآلي"
        >
          <span className="text-base font-bold">🤖</span>
        </button>
        <button
          onClick={onOpenCustomerProfile}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="ملف العميل"
          aria-label="ملف العميل"
        >
          <InformationCircleIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onOpenSavedReplies}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="الردود المحفوظة"
          aria-label="الردود المحفوظة"
        >
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onTriggerFileUpload}
          className="p-2 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
          title="إرفاق ملف"
          aria-label="إرفاق ملف"
        >
          <PaperClipIcon className="h-5 w-5" />
        </button>
        <button
          onClick={onRequestDelete}
          className="p-2 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          title="حذف المحادثة"
          aria-label="حذف المحادثة"
        >
          <TrashIcon className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
