import React from "react";
import { ChatBubbleLeftIcon } from "@heroicons/react/24/outline";

export interface DevTaskCommentsTabProps {
  comments?: any[];
  newComment: string;
  setNewComment: (comment: string) => void;
  handleAddComment: () => void;
}

export const DevTaskCommentsTab: React.FC<DevTaskCommentsTabProps> = ({
  comments,
  newComment,
  setNewComment,
  handleAddComment,
}) => {
  return (
    <div className="space-y-6">
      <div className="border-b border-border dark:border-border pb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="اكتب تعليقاً..."
          rows={3}
          className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary dark:focus:ring-primary mb-3 bg-card text-foreground placeholder-muted dark:placeholder-muted transition-shadow shadow-sm"
        />
        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-6 py-2 bg-primary dark:bg-primary text-white rounded-lg hover:bg-primary dark:hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-md transition-all active:scale-95"
          >
            إضافة تعليق
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {comments?.map((comment) => (
          <div
            key={comment.id}
            className="border-b border-border dark:border-border pb-6 last:border-0"
          >
            <div className="flex items-start gap-4">
              {comment.authorAvatar ? (
                <img
                  src={comment.authorAvatar}
                  alt=""
                  className="w-10 h-10 rounded-full ring-2 ring-border dark:ring-border"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-primary dark:bg-primary/30 text-primary flex items-center justify-center font-bold text-sm">
                  {comment.authorName?.charAt(0) || "U"}
                </div>
              )}
              <div className="flex-1 bg-muted dark:bg-muted p-4 rounded-xl rounded-tr-none">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-foreground">
                    {comment.authorName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(comment.createdAt).toLocaleString("ar-EG")}
                    {comment.isEdited && (
                      <span className="me-1">(معدل)</span>
                    )}
                  </span>
                </div>
                <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                  {comment.content}
                </p>
              </div>
            </div>
          </div>
        ))}
        {(!comments || comments.length === 0) && (
          <div className="text-center py-12 text-muted-foreground bg-muted dark:bg-muted rounded-xl border border-dashed border-border dark:border-border">
            <ChatBubbleLeftIcon className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
            <p>لا توجد تعليقات بعد</p>
          </div>
        )}
      </div>
    </div>
  );
};
