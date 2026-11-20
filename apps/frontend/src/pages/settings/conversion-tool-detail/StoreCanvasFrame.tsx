import React from "react";
import { ShoppingBag } from "lucide-react";
import type { ConversionToolDisplayKind } from "../conversionToolMeta";
import type { CanvasView } from "./types";

interface StoreCanvasFrameProps {
  view: CanvasView;
  displayKind: ConversionToolDisplayKind;
  children: React.ReactNode;
}

export const StoreCanvasFrame: React.FC<StoreCanvasFrameProps> = ({
  view,
  displayKind,
  children,
}) => (
  <div className="flex min-h-[240px] items-start justify-center rounded-xl border border-border bg-muted p-3 dark:border-border dark:bg-muted sm:min-h-[420px] sm:p-6">
    <div
      className={`w-full transition-[max-width] duration-200 ease-out ${
        view === "mobile" ? "max-w-[420px]" : "max-w-full"
      }`}
    >
      {/* شريط متصفح رمزي يفصل "عالم المتجر" عن "عالم اللوحة" */}
      <div className="flex items-center gap-2 rounded-t-xl border border-b-0 border-border bg-muted px-3 py-2 dark:border-border dark:bg-muted">
        <span className="flex gap-1">
          <span className="h-2 w-2 rounded-full bg-muted dark:bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted dark:bg-muted" />
          <span className="h-2 w-2 rounded-full bg-muted dark:bg-muted" />
        </span>
        <span className="mx-auto rounded-md bg-white px-3 py-0.5 text-[10px] font-bold text-muted-foreground dark:bg-muted font-mono">
          متجر-التاجر.maxp.online
        </span>
      </div>
      {/* عالم المتجر فاتح دائمًا — النافذة لا تتبع وضع اللوحة */}
      <div className="space-y-4 rounded-b-xl border border-t-0 border-border bg-white p-4 text-foreground shadow-sm sm:p-5">
        {displayKind === "pdp" ? (
          <div className="flex items-center justify-between border-b border-border pb-3 dark:border-border">
            <span className="text-xs font-black text-foreground">
              متجر التاجر
            </span>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </div>
        ) : null}
        {children}
      </div>
    </div>
  </div>
);
