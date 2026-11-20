import React from "react";
import { Switch } from "@/components/ui/switch";

export interface ToggleCardProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function ToggleCard({
  title,
  description,
  checked,
  onCheckedChange,
  disabled,
}: ToggleCardProps) {
  return (
    <div className="rounded-[20px] border border-border bg-muted p-4 dark:border-border dark:bg-muted">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm font-bold text-foreground dark:text-muted-foreground">{title}</p>
          <p className="text-xs leading-6 text-muted-foreground dark:text-muted-foreground">{description}</p>
        </div>
        <Switch
          aria-label={title}
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
