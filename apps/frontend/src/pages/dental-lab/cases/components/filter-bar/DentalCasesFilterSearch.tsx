import React from "react";
import { Search, X as XMarkIcon } from "lucide-react";

export interface DentalCasesFilterSearchProps {
  searchInput: string;
  onSearchInputChange: (val: string) => void;
  onClearSearch: () => void;
  setPage: (p: number | ((prev: number) => number)) => void;
}

export const DentalCasesFilterSearch: React.FC<DentalCasesFilterSearchProps> = ({
  searchInput,
  onSearchInputChange,
  onClearSearch,
  setPage,
}) => {
  return (
    <div className="relative flex-1 min-w-[200px] max-w-sm">
      <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-muted-foreground" />
      <input
        className="w-full bg-muted dark:bg-muted border border-border dark:border-border rounded-xl pe-8 ps-8 py-1.5 text-xs text-foreground dark:text-muted-foreground placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
        placeholder="بحث سريع (رقم الحالة، المريض، الطبيب)..."
        value={searchInput}
        onChange={(e) => {
          onSearchInputChange(e.target.value);
          setPage(1);
        }}
      />
      {searchInput && (
        <button
          onClick={onClearSearch}
          className="absolute left-2.5 top-2 text-muted-foreground hover:text-foreground"
          title="مسح البحث"
          aria-label="مسح البحث"
        >
          <XMarkIcon className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};

export default DentalCasesFilterSearch;
