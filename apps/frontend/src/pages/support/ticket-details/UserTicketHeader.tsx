import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  AlertCircle,
  Star,
} from "lucide-react";
import { Ticket, getStatusText, getCategoryText } from "./types";

interface UserTicketHeaderProps {
  ticket: Ticket;
  onBack: () => void;
}

export const UserTicketHeader: React.FC<UserTicketHeaderProps> = ({
  ticket,
  onBack,
}) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open":
        return <Clock className="w-5 h-5 text-warning" />;
      case "in_progress":
        return <AlertCircle className="w-5 h-5 text-blue-500" />;
      case "closed":
        return <CheckCircle className="w-5 h-5 text-success" />;
      default:
        return <Clock className="w-5 h-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center text-blue-600 hover:text-blue-700 mb-4"
      >
        <ArrowLeft className="w-4 h-4 ms-2" />
        العودة إلى التذاكر
      </button>

      <div className="bg-white dark:bg-muted rounded-lg shadow-md p-6 border border-border dark:border-border">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground dark:text-muted-foreground mb-2">
              {ticket.subject}
            </h1>
            <div className="flex items-center space-x-4 space-x-reverse text-sm text-foreground dark:text-muted-foreground">
              <span>#{ticket.ticketId}</span>
              <span>•</span>
              <span>{getCategoryText(ticket.category)}</span>
              <span>•</span>
              <span>
                {new Date(ticket.createdAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
          </div>
          <div className="flex items-center">
            {getStatusIcon(ticket.status)}
            <span className="me-2 font-medium text-foreground dark:text-muted-foreground">
              {getStatusText(ticket.status)}
            </span>
          </div>
        </div>

        {ticket.status === "closed" && ticket.resolvedAt && (
          <div className="bg-green-50 dark:bg-success/40 border border-success dark:border-success rounded-lg p-4 mb-4">
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 text-success ms-2" />
              <span className="text-green-800 dark:text-success">
                تم حل التذكرة في{" "}
                {new Date(ticket.resolvedAt).toLocaleDateString("ar-EG")}
              </span>
            </div>
            {ticket.rating && (
              <div className="mt-2 flex items-center">
                <span className="text-green-700 dark:text-success ms-2">التقييم:</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= ticket.rating!
                          ? "text-yellow-400 fill-current"
                          : "text-gray-300 dark:text-foreground"
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
