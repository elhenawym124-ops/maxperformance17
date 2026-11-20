import React from "react";
import { Switch } from "@/components/ui/switch";

export interface ToggleRowProps {
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export const ToggleRow: React.FC<ToggleRowProps> = ({
  title,
  description,
  checked,
  onChange,
  disabled = false,
}) => (
  <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-white px-4 py-3 transition hover:bg-muted dark:border-border dark:bg-muted dark:hover:bg-muted">
    <div className="min-w-0 flex-1">
      <p className="text-sm font-medium text-foreground dark:text-muted-foreground">{title}</p>
      {description && <p className="text-xs text-muted-foreground dark:text-muted-foreground">{description}</p>}
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
  </div>
);
