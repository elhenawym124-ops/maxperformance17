import React from "react";
import { Search, Plus } from "lucide-react";
import { Card, CardContent } from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";

interface ShiftsEmptyStateProps {
  searchTerm: string;
  onClearSearch: () => void;
  onCreateNew: () => void;
}

export const ShiftsEmptyState: React.FC<ShiftsEmptyStateProps> = ({
  searchTerm,
  onClearSearch,
  onCreateNew,
}) => {
  return (
    <Card className="border-dashed bg-white/50 dark:bg-muted">
      <CardContent className="p-12 text-center flex flex-col items-center">
        <div className="bg-gray-50 dark:bg-muted p-4 rounded-full mb-4">
          <Search className="h-8 w-8 text-muted-foreground/80" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-1">
          {searchTerm ? "لا توجد نتائج مطابقة" : "لا توجد مناوبات"}
        </h3>
        <p className="text-muted-foreground mb-4 max-w-sm text-sm">
          {searchTerm
            ? `لم يتم العثور على أي مناوبات تطابق "${searchTerm}". جرب مصطلحات بحث مختلفة.`
            : "قم بإنشاء أول مناوبة عمل لتنظيم جدول الموظفين."}
        </p>
        {searchTerm ? (
          <Button
            type="button"
            variant="outline"
            onClick={onClearSearch}
            className="text-sm font-medium"
          >
            مسح البحث
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onCreateNew}
            className="bg-primary hover:bg-primary/90 text-white font-bold text-sm shadow-sm"
          >
            <Plus className="h-4 w-4 ms-2" />
            <span>إنشاء مناوبة الآن</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
