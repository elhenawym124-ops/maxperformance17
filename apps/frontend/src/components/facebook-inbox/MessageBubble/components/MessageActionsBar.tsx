import React from "react";
import {
  MoreHorizontal,
  Smile,
  Reply,
  Star,
  Forward,
  Trash2,
} from "lucide-react";
import ReactionSelector from "../../Generic/ReactionSelector";
import { Message } from "./types";

interface MessageActionsBarProps {
  message: Message;
  isCustomer: boolean;
  showActions: boolean;
  setShowActions: React.Dispatch<React.SetStateAction<boolean>>;
  showReactionSelector: boolean;
  setShowReactionSelector: React.Dispatch<React.SetStateAction<boolean>>;
  reactionTriggerRef: React.RefObject<HTMLButtonElement | null>;
  myReaction?: string;
  isStarred?: boolean;
  onReaction?: (messageId: string, reaction: string) => void;
  onReply?: (message: Message) => void;
  onStar?: (messageId: string, isStarred: boolean) => void;
  onForward?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}

export const MessageActionsBar: React.FC<MessageActionsBarProps> = ({
  message,
  isCustomer,
  showActions,
  setShowActions,
  showReactionSelector,
  setShowReactionSelector,
  reactionTriggerRef,
  myReaction,
  isStarred,
  onReaction,
  onReply,
  onStar,
  onForward,
  onDelete,
}) => {
  const hasMessageActions =
    !!onReaction ||
    !!onReply ||
    !!onStar ||
    !!onForward ||
    (!isCustomer && !!onDelete);

  if (!hasMessageActions) return null;

  const actionButtonClassName =
    "flex-shrink-0 flex items-center justify-center rounded-full transition-all active:scale-90 duration-150 border";

  return (
    <>
      <button
        type="button"
        onClick={() => setShowActions((current) => !current)}
        className={`absolute z-20 flex h-7 w-7 sm:h-6 sm:w-6 items-center justify-center rounded-full shadow-md transition-all active:scale-90 ${
          isCustomer
            ? "-left-8 top-1 sm:-left-7 sm:top-1.5"
            : "-right-8 top-1 sm:-right-7 sm:top-1.5"
        }`}
        style={{
          background:
            "var(--business-floating-surface, rgba(255, 255, 255, 0.95))",
          border:
            "1px solid var(--business-card-border, rgba(203, 213, 225, 0.8))",
          color: "var(--color-muted-foreground)",
          backdropFilter: "blur(12px)",
        }}
        title="إجراءات الرسالة"
        aria-label="إجراءات الرسالة"
        aria-expanded={showActions}
      >
        <MoreHorizontal size={15} />
      </button>

      {/* Action Buttons Floating Bar */}
      {showActions && (
        <div
          className={`absolute z-40 flex items-center gap-1.5 sm:gap-1 rounded-full p-1 shadow-xl border backdrop-blur-md transition-all duration-200 flex-nowrap whitespace-nowrap max-w-[calc(100vw-2.5rem)] ${
            isCustomer
              ? "rtl:right-0 ltr:left-0 top-9"
              : "rtl:left-0 ltr:right-0 top-9"
          }`}
          style={{
            background:
              "var(--business-floating-surface, rgba(255, 255, 255, 0.98))",
            borderColor:
              "var(--business-card-border, rgba(203, 213, 225, 0.8))",
          }}
        >
          {onReaction && (
            <div className="relative flex-shrink-0">
              <button
                type="button"
                ref={reactionTriggerRef}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setShowReactionSelector(!showReactionSelector);
                }}
                className={`${actionButtonClassName} w-8 h-8 sm:w-7 sm:h-7 ${
                  myReaction
                    ? "text-amber-600 bg-warning border-warning"
                    : "text-amber-500 dark:text-warning bg-warning/10 dark:bg-warning/60 hover:bg-warning dark:hover:bg-warning/60 border-warning/80 dark:border-warning/80"
                }`}
                title="إضافة تفاعل"
              >
                <Smile size={16} strokeWidth={2.4} />
              </button>
              {showReactionSelector && (
                <ReactionSelector
                  triggerRef={reactionTriggerRef}
                  onSelect={(r) => {
                    onReaction(message.id, r);
                    setShowReactionSelector(false);
                    setShowActions(false);
                  }}
                  onClose={() => setShowReactionSelector(false)}
                  currentReaction={myReaction}
                />
              )}
            </div>
          )}

          {onReply && (
            <button
              onClick={() => {
                onReply(message);
                setShowActions(false);
              }}
              className={`${actionButtonClassName} w-8 h-8 sm:w-7 sm:h-7 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 border-blue-200/80 dark:border-blue-800/80`}
              title="رد"
            >
              <Reply size={16} strokeWidth={2.4} />
            </button>
          )}

          {onStar && (
            <button
              onClick={() => onStar(message.id, !!isStarred)}
              className={`${actionButtonClassName} w-8 h-8 sm:w-7 sm:h-7 ${
                isStarred
                  ? "text-white bg-warning hover:bg-warning border-warning shadow-sm"
                  : "text-amber-500 dark:text-warning bg-warning/10 dark:bg-warning/60 hover:bg-warning dark:hover:bg-warning/60 border-warning/80 dark:border-warning/80"
              }`}
              title={isStarred ? "إلغاء التمييز" : "تمييز الرسالة"}
            >
              <Star
                size={16}
                strokeWidth={2.4}
                fill={isStarred ? "currentColor" : "none"}
              />
            </button>
          )}

          {onForward && (
            <button
              onClick={() => {
                onForward(message);
                setShowActions(false);
              }}
              className={`${actionButtonClassName} w-8 h-8 sm:w-7 sm:h-7 text-primary bg-primary/10 dark:bg-primary/60 hover:bg-primary dark:hover:bg-primary/60 border-primary/80 dark:border-primary/80`}
              title="إعادة توجيه"
            >
              <Forward size={16} strokeWidth={2.4} />
            </button>
          )}

          {!isCustomer && onDelete && (
            <button
              onClick={() => {
                onDelete(message.id);
                setShowActions(false);
              }}
              className={`${actionButtonClassName} w-8 h-8 sm:w-7 sm:h-7 text-destructive dark:text-destructive bg-destructive/10 dark:bg-destructive/60 hover:bg-destructive dark:hover:bg-destructive/60 border-destructive/80 dark:border-destructive/80`}
              title="حذف الرسالة"
            >
              <Trash2 size={16} strokeWidth={2.4} />
            </button>
          )}
        </div>
      )}
    </>
  );
};
