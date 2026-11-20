import React from "react";
import { ShieldCheck } from "lucide-react";

interface StorefrontThemesFooterProps {
  filteredCount: number;
  totalCount: number;
}

export const StorefrontThemesFooter: React.FC<StorefrontThemesFooterProps> = ({
  filteredCount,
  totalCount,
}) => {
  return (
    <footer className="hidden sm:flex bg-white/50 dark:bg-muted backdrop-blur-md border-t border-border dark:border-border px-6 h-10 items-center justify-between text-[9px] font-black text-muted-foreground uppercase tracking-widest">
      <div className="flex items-center gap-3">
        <span className="flex items-center gap-1.5">
          <ShieldCheck className="size-3 text-success" />
          SECURE_CATALOG_SYNC
        </span>
        <span>•</span>
        <span className="tabular-nums font-mono">
          {filteredCount} / {totalCount} THEMES_LOADED
        </span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-success" />
        CORE_ENGINE_V2_ACTIVE
      </div>
    </footer>
  );
};
