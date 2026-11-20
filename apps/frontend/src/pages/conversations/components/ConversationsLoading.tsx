import React from "react";

export const ConversationsLoading: React.FC = () => {
  return (
    <div className="min-h-[400px] flex items-center justify-center bg-gradient-to-br from-primary via-white to-primary">
      <div className="text-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-transparent bg-gradient-to-r from-primary to-primary mx-auto" />
          <div className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-white mx-auto" />
        </div>
        <div className="mt-6 space-y-2">
          <p className="text-lg font-semibold bg-gradient-to-r from-primary to-primary bg-clip-text text-transparent">
            جاري تحميل المحادثات
          </p>
          <p className="text-sm text-muted-foreground">يرجى الانتظار قليلاً...</p>
        </div>
      </div>
    </div>
  );
};
