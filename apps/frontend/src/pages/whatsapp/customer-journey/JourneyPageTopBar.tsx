import React from "react";
import { Link } from "react-router-dom";
import {
  ChevronLeft,
  LayoutGrid,
  List,
  MessageSquareText,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JourneyViewMode } from "./types";

export interface JourneyPageTopBarProps {
  backHref: string;
  backLabel: string;
  isRtl: boolean;
  viewMode: JourneyViewMode;
  onChangeViewMode: (mode: JourneyViewMode) => void;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenTimeline: () => void;
  onOpenTestSend: () => void;
  onOpenCopilot: () => void;
  copilotTitle: string;
  isAdmin: boolean;
  onAddNewFlow: () => void;
  refreshLabel: string;
  addNewFlowLabel: string;
}

export const JourneyPageTopBar: React.FC<JourneyPageTopBarProps> = ({
  backHref,
  backLabel,
  isRtl,
  viewMode,
  onChangeViewMode,
  refreshing,
  onRefresh,
  onOpenTimeline,
  onOpenTestSend,
  onOpenCopilot,
  copilotTitle,
  isAdmin,
  onAddNewFlow,
  refreshLabel,
  addNewFlowLabel,
}) => {
  return (
    <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <Link
          to={backHref}
          aria-label={backLabel}
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-sm" }),
            "shrink-0 rounded-xl border-border/70 bg-card text-foreground hover:bg-muted/50",
          )}
        >
          <ChevronLeft className={cn("size-4", isRtl && "rotate-180")} />
        </Link>

        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary">
          <Workflow className="size-5" />
        </div>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-bold tracking-tight text-foreground sm:text-xl">
            غرفة قيادة رحلة العميل والمراسلة
          </h1>
          <p className="truncate text-xs text-muted-foreground sm:text-sm">
            خريطة موحدة لرسائل الطلبات، ما بعد التسليم، الولاء، والمناسبات مع فحص قوالب Meta.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none sm:pb-0">
        <div
          role="tablist"
          aria-label="وضع العرض"
          className="inline-flex shrink-0 items-center rounded-xl border border-border/70 bg-muted/40 p-0.5"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "canvas"}
            onClick={() => onChangeViewMode("canvas")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
              viewMode === "canvas"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LayoutGrid className="size-3.5" />
            <span>خريطة المسار</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === "list"}
            onClick={() => onChangeViewMode("list")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.97]",
              viewMode === "list"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <List className="size-3.5" />
            <span>دليل المحركات</span>
          </button>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTestSend}
          className="shrink-0 active:scale-[0.97] transition-transform duration-150"
        >
          <Send className="size-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>تجربة إرسال</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenTimeline}
          className="shrink-0 active:scale-[0.97] transition-transform duration-150"
        >
          <MessageSquareText className="size-3.5" />
          <span>رسايل عميل</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={onOpenCopilot}
          title={copilotTitle + " (⌘K)"}
          className="shrink-0 active:scale-[0.97] transition-transform duration-150"
        >
          <Sparkles className="size-3.5" />
          <span>{copilotTitle}</span>
        </Button>

        <Button
          variant="outline"
          size="sm"
          disabled={refreshing}
          onClick={onRefresh}
          className="shrink-0 active:scale-[0.97] transition-transform duration-150"
        >
          <RefreshCw className={cn("size-3.5", refreshing && "animate-spin")} />
          <span>{refreshLabel}</span>
        </Button>

        {isAdmin && (
          <Button
            size="sm"
            onClick={onAddNewFlow}
            className="shrink-0 active:scale-[0.97] transition-transform duration-150"
          >
            <Plus className="size-3.5" />
            <span>{addNewFlowLabel}</span>
          </Button>
        )}
      </div>
    </div>
  );
};
