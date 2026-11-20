import React from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import type { Conversation, ConversationFilter } from "./types";

export interface MessengerConversationsSidebarProps {
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  onSelectConversation: (conversation: Conversation) => void;
  loading: boolean;
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  conversationFilter: ConversationFilter;
  onConversationFilterChange: (filter: ConversationFilter) => void;
}

export const MessengerConversationsSidebar: React.FC<
  MessengerConversationsSidebarProps
> = ({
  conversations,
  selectedConversation,
  onSelectConversation,
  loading,
  searchQuery,
  onSearchQueryChange,
  conversationFilter,
  onConversationFilterChange,
}) => {
  const filterOptions: ConversationFilter[] = [
    "all",
    "new",
    "active",
    "archived",
    "important",
  ];

  return (
    <div className="w-80 bg-white border-l border-border flex flex-col">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground">المحادثات</h2>

        <div className="mt-3 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="ابحث عن محادثة..."
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            className="w-full ps-10 pe-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
          />
        </div>

        <div className="mt-3 flex gap-1">
          {filterOptions.map((filter) => (
            <button
              key={filter}
              onClick={() => onConversationFilterChange(filter)}
              className={`px-3 py-1 text-xs rounded-full transition-colors ${
                conversationFilter === filter
                  ? "bg-blue-500 text-white font-medium"
                  : "bg-gray-100 text-foreground hover:bg-muted"
              }`}
            >
              {filter === "all"
                ? "الكل"
                : filter === "new"
                  ? "جديد"
                  : filter === "active"
                    ? "نشط"
                    : filter === "archived"
                      ? "مؤرشف"
                      : "مهم"}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            جاري التحميل...
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground text-sm">
            لا توجد محادثات
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              onClick={() => onSelectConversation(conversation)}
              className={`p-4 border-b border-border cursor-pointer hover:bg-muted transition-colors ${
                selectedConversation?.id === conversation.id ? "bg-blue-50" : ""
              }`}
            >
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
                <div className="ms-3 flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-medium text-foreground truncate">
                      {conversation.customerName}
                      {conversation.pageName && (
                        <span className="text-xs text-primary font-medium bg-primary/10 px-1.5 py-0.5 rounded me-2">
                          {conversation.pageName}
                        </span>
                      )}
                    </h3>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {conversation.lastMessageTime
                        ? new Date(
                            conversation.lastMessageTime,
                          ).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "الآن"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {conversation.lastMessage}
                  </p>
                  <div className="flex justify-between items-center mt-1">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        conversation.status === "new"
                          ? "bg-green-100 text-success"
                          : conversation.status === "active"
                            ? "bg-blue-100 text-primary"
                            : conversation.status === "archived"
                              ? "bg-gray-100 text-foreground"
                              : "bg-yellow-100 text-warning"
                      }`}
                    >
                      {conversation.status === "new"
                        ? "جديد"
                        : conversation.status === "active"
                          ? "نشط"
                          : conversation.status === "archived"
                            ? "مؤرشف"
                            : "مهم"}
                    </span>
                    {conversation.isOnline && (
                      <span className="ms-2 w-2 h-2 bg-success rounded-full"></span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
