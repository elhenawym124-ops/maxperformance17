import React from "react";
import {
  ChatBubbleLeftRightIcon,
  ClockIcon,
  StarIcon as StarOutlineIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import {
  formatDate,
  getStatusColor,
  getStatusText,
  TicketDetailsData,
} from "./types";

interface TicketInfoCardProps {
  ticket: TicketDetailsData;
  currentRating: number | null;
  submittingRating: boolean;
  onRateTicket: (score: number) => void;
}

export const TicketInfoCard: React.FC<TicketInfoCardProps> = ({
  ticket,
  currentRating,
  submittingRating,
  onRateTicket,
}) => {
  return (
    <div className="mb-6 rounded-lg bg-white p-6 shadow dark:bg-muted dark:shadow-black/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <ChatBubbleLeftRightIcon className="w-6 h-6 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            معلومات التذكرة
          </h2>
        </div>

        <div className="flex items-center gap-3">
          {/* Rating Component */}
          <div className="flex items-center gap-1 bg-warning/80 dark:bg-warning/30 border border-warning dark:border-warning/60 rounded-xl px-2.5 py-1">
            <span className="text-xs font-semibold text-warning dark:text-warning ms-1">
              {currentRating ? (
                <>
                  التقييم (<span className="font-mono tabular-nums">{currentRating}</span>/5):
                </>
              ) : (
                "تقييم الدعم:"
              )}
            </span>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                disabled={submittingRating}
                onClick={() => onRateTicket(star)}
                className="p-0.5 text-warning hover:scale-110 transition disabled:opacity-50"
                title={`تقييم ${star} من 5 نجوم`}
              >
                {currentRating && currentRating >= star ? (
                  <StarSolidIcon className="h-4 w-4 fill-warning text-warning" />
                ) : (
                  <StarOutlineIcon className="h-4 w-4 text-warning hover:text-warning" />
                )}
              </button>
            ))}
          </div>

          <span
            className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(
              ticket.status
            )}`}
          >
            {getStatusText(ticket.status)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ClockIcon className="w-4 h-4" />
          تاريخ الإنشاء:{" "}
          <span className="font-mono tabular-nums">{formatDate(ticket.created_at)}</span>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-foreground">
          وصف المشكلة
        </label>
        <p className="rounded-lg bg-muted p-4 text-foreground dark:bg-muted dark:text-muted-foreground">
          {ticket.description}
        </p>
      </div>
    </div>
  );
};
