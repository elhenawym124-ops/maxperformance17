import React from "react";
import type { TurboTicketItem } from "../types";
import { formatSafeDateTime } from "../ticketDateUtils";
import { extractMediaUrls } from "./chatPanelUtils";

export interface TurboTicketInitialCardProps {
  ticket: TurboTicketItem;
  user: any;
  onPreviewImage: (url: string) => void;
}

export const TurboTicketInitialCard: React.FC<TurboTicketInitialCardProps> = ({
  ticket,
  user,
  onPreviewImage,
}) => {
  const storeName = user?.company?.name?.trim() || "المتجر";
  let creatorClean = (
    ticket.creator_name ||
    ticket.user?.name ||
    ticket.user_name ||
    ticket.client_name ||
    ""
  )
    .trim()
    .replace(/العميل\s+[^\s]+/gi, "")
    .trim();

  if (
    !creatorClean ||
    creatorClean.toLowerCase() === "swan" ||
    creatorClean === "المتجر"
  ) {
    creatorClean =
      `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
      "المسؤول";
  }
  const byText = `${storeName} - ${creatorClean}`;
  const initialMediaUrls = extractMediaUrls(ticket);

  return (
    <div className="p-3 sm:p-3.5 rounded-xl border border-border dark:border-border bg-white dark:bg-muted shadow-2xs">
      <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5 flex-wrap gap-1">
        <span className="font-semibold text-foreground dark:text-muted-foreground">
          تذكرة بواسطة: {byText}
        </span>
        <span className="tabular-nums font-mono text-[11px]">
          {ticket.created_at ? formatSafeDateTime(ticket.created_at) : ""}
        </span>
      </div>
      {ticket.category?.name && (
        <div className="mb-2">
          <span className="text-[11px] font-medium px-2 py-0.5 rounded bg-muted dark:bg-muted text-foreground dark:text-muted-foreground border border-border dark:border-border">
            الفئة: {ticket.category.name}
          </span>
        </div>
      )}
      <p className="text-xs text-foreground dark:text-muted-foreground leading-relaxed whitespace-pre-wrap">
        {ticket.content || ticket.description || "لا يوجد وصف إضافي"}
      </p>

      {/* Initial Ticket Attachment if present */}
      {initialMediaUrls.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-border dark:border-border">
          <p className="text-[11px] text-muted-foreground mb-1.5 font-medium">
            مرفقات التذكرة ({initialMediaUrls.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {initialMediaUrls.map((url, attIdx) => (
              <button
                key={attIdx}
                type="button"
                onClick={() => onPreviewImage(url)}
                className="group relative rounded-lg overflow-hidden border border-border dark:border-border max-w-[160px] max-h-[120px] focus:outline-hidden bg-muted"
                title="تكبير المرفق"
              >
                <img
                  src={url}
                  alt={`مرفق ${attIdx + 1}`}
                  className="object-cover w-full h-full group-hover:scale-105 transition"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
