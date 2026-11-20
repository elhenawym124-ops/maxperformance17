import React from "react";
import type { MultiSelectOption } from "./types";

export interface MultiSelectDropdownProps {
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
  emptyText: string;
}

export function MultiSelectDropdown({
  options,
  selectedValues,
  onChange,
  placeholder,
  emptyText,
}: MultiSelectDropdownProps) {
  const selectedSet = new Set(selectedValues);
  const selectedLabels = options
    .filter((option) => selectedSet.has(option.value))
    .map((option) => option.label);

  return (
    <details className="relative">
      <summary className="cursor-pointer list-none rounded-xl border border-border bg-white px-3 py-2 text-xs transition-colors hover:border-border dark:border-border dark:bg-muted">
        <span className="block truncate font-medium text-foreground dark:text-white">
          {selectedLabels.length ? selectedLabels.join("، ") : placeholder}
        </span>
        <span className="mt-1 block font-mono text-[10px] tabular-nums text-muted-foreground dark:text-muted-foreground">
          {selectedLabels.length ? `${selectedLabels.length} اختيار` : "اضغط لاختيار أكثر من عنصر"}
        </span>
      </summary>
      <div className="absolute z-20 mt-1 max-h-60 w-full min-w-[260px] overflow-auto rounded-xl border border-border bg-white p-2 shadow-lg dark:border-border dark:bg-muted">
        {options.length === 0 ? (
          <div className="px-2 py-3 text-xs text-muted-foreground dark:text-muted-foreground">{emptyText}</div>
        ) : (
          options.map((option) => {
            const checked = selectedSet.has(option.value);
            return (
              <label
                key={option.value}
                className="flex items-start gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-muted dark:hover:bg-muted"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => {
                    const next = new Set(selectedValues);
                    if (checked) next.delete(option.value);
                    else next.add(option.value);
                    onChange(Array.from(next));
                  }}
                  className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-foreground dark:text-white">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="block text-[11px] text-muted-foreground dark:text-muted-foreground">
                      {option.description}
                    </span>
                  ) : null}
                </span>
              </label>
            );
          })
        )}
      </div>
    </details>
  );
}
