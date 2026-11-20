import React from "react";
import { Plus, Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShopifyPageHeader } from "@/components/layout/ShopifyPageHeader";
import { PositionsGrid } from "./positions-management/index";

export interface PolarisPositionsViewProps {
  positions: any[];
  filteredPositions: any[];
  searchTerm: string;
  setSearchTerm: (s: string) => void;
  onEdit: (position: any) => void;
  onDelete: (id: string) => void;
  onNewPosition: () => void;
}

export const PolarisPositionsView: React.FC<PolarisPositionsViewProps> = ({
  positions,
  filteredPositions,
  searchTerm,
  setSearchTerm,
  onEdit,
  onDelete,
  onNewPosition,
}) => {
  return (
    <div
      data-polaris-positions-view="true"
      className="polaris-positions-container max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4 space-y-4"
      dir="rtl"
    >
      {/* 1. Authentic Shopify Polaris Page Header */}
      <ShopifyPageHeader
        title="إدارة المسميات والوظائف"
        subtitle="تحديد التوصيفات الوظيفية، السلالم المالية، وتعيين متطلبات الأدوار بالأقسام"
        badges={
          <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-muted text-muted-foreground tabular-nums">
            {positions.length} مسمى وظيفي
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={onNewPosition}
              className="gap-1.5 h-8 px-3 text-xs font-semibold rounded-lg bg-[var(--p-action-primary,#008060)] hover:bg-[#006e52] text-white transition-all active:scale-95 shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>إضافة مسمى وظيفي</span>
            </Button>
          </div>
        }
      />

      {/* 2. Single Polaris Card Chassis */}
      <div className="bg-card rounded-xl border border-border/70 shadow-xs overflow-hidden flex flex-col">
        {/* Integrated Search Bar */}
        <div className="p-2.5 sm:p-3 border-b border-border/70 bg-muted/15 flex items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="ابحث بالمسمى، الكود، أو الوصف..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pe-9 h-8 text-xs bg-background border-border/70 rounded-lg shadow-none focus-visible:ring-1"
            />
          </div>
        </div>

        {/* 3. Positions Content */}
        <div className="p-4">
          <PositionsGrid
            positions={filteredPositions}
            searchTerm={searchTerm}
            onEdit={onEdit}
            onDelete={onDelete}
            onNewPosition={onNewPosition}
          />
        </div>
      </div>
    </div>
  );
};

export default PolarisPositionsView;
