import React from "react";
import { AlertCircle, Paperclip, Send, X } from "lucide-react";
import { AttachmentFile } from "./types";

interface UserReplyFormProps {
  messageContent: string;
  setMessageContent: (content: string) => void;
  error: string | null;
  sendingMessage: boolean;
  attachments: AttachmentFile[];
  handleSendMessage: (e: React.FormEvent) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAttachment: (index: number) => void;
}

export const UserReplyForm: React.FC<UserReplyFormProps> = ({
  messageContent,
  setMessageContent,
  error,
  sendingMessage,
  attachments,
  handleSendMessage,
  handleFileUpload,
  removeAttachment,
}) => {
  return (
    <div className="bg-white dark:bg-muted rounded-lg shadow-md p-4 flex-shrink-0 border border-border dark:border-border">
      <h3 className="text-lg font-semibold text-foreground dark:text-muted-foreground mb-3">
        إضافة رد
      </h3>

      {error && (
        <div className="bg-red-50 dark:bg-destructive/40 border border-destructive dark:border-destructive rounded-lg p-3 mb-3 flex items-center">
          <AlertCircle className="w-5 h-5 text-destructive ms-3" />
          <span className="text-red-700 dark:text-destructive text-sm">{error}</span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="space-y-3">
        <textarea
          value={messageContent}
          onChange={(e) => setMessageContent(e.target.value)}
          placeholder="اكتب ردك هنا..."
          rows={3}
          className="w-full px-3 py-2 border border-border dark:border-border bg-white dark:bg-muted text-foreground dark:text-muted-foreground rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
        />

        {/* File Upload */}
        <div>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileUpload}
            className="hidden"
            id="user-message-file-upload"
          />
          <label
            htmlFor="user-message-file-upload"
            className="inline-flex items-center px-4 py-2 border border-border dark:border-border rounded-lg hover:bg-muted dark:hover:bg-muted cursor-pointer transition-colors text-sm text-foreground dark:text-muted-foreground"
          >
            <Paperclip className="w-4 h-4 ms-2" />
            إرفاق ملفات
          </label>
        </div>

        {/* Attachments Preview */}
        {attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((attachment, index) => (
              <div
                key={index}
                className="flex items-center justify-between bg-muted dark:bg-muted rounded-lg p-3 border border-border dark:border-border"
              >
                <div className="flex items-center gap-3">
                  {attachment.preview ? (
                    <img
                      src={attachment.preview}
                      alt="Preview"
                      className="w-8 h-8 object-cover rounded"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-muted dark:bg-muted rounded flex items-center justify-center">
                      <Paperclip className="w-3 h-3 text-muted-foreground dark:text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm text-foreground dark:text-muted-foreground truncate max-w-xs">
                    {attachment.file.name}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => removeAttachment(index)}
                  className="text-red-500 hover:text-destructive p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              sendingMessage ||
              (!messageContent.trim() && attachments.length === 0)
            }
            className="inline-flex items-center px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >
            {sendingMessage ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ms-2"></div>
                جاري الإرسال...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 ms-2" />
                إرسال
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
