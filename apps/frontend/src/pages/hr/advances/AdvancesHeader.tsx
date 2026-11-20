import React from "react";
import { Plus } from "lucide-react";
import { Button } from "../../../components/ui/button";

interface AdvancesHeaderProps {
  onCreateNew: () => void;
}

export const AdvancesHeader: React.FC<AdvancesHeaderProps> = ({
  onCreateNew,
}) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">
          إدارة السلف
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          متابعة طلبات السلف والأقساط
        </p>
      </div>
      <Button
        type="button"
        onClick={onCreateNew}
        className="bg-white text-foreground dark:bg-muted dark:text-foreground font-semibold shadow-md shadow-slate-300/40 hover:shadow-slate-400/50 border border-border hover:-translate-y-0.5 transition duration-150 rounded-full px-5 self-start sm:self-auto"
      >
        <Plus className="h-4 w-4 ms-2" />
        <span>طلب سلفة جديد</span>
      </Button>
    </div>
  );
};
