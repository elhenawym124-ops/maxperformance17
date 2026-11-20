import React from "react";
import type { DuplicateGroup } from "./types";

interface ConsolidatorGroupStepProps {
  groups: DuplicateGroup[];
  selectedGroup: string;
  onSelectGroup: (groupName: string) => void;
}

export const ConsolidatorGroupStep: React.FC<ConsolidatorGroupStepProps> = ({
  groups,
  selectedGroup,
  onSelectGroup,
}) => {
  return (
    <div className="mb-6">
      <h2 className="text-sm font-semibold text-foreground mb-2">
        1. اختر مجموعة المنتجات المكررة
      </h2>
      <select
        value={selectedGroup}
        onChange={(e) => onSelectGroup(e.target.value)}
        className="w-full md:w-96 border-border bg-card text-foreground rounded-lg text-sm p-2 cursor-pointer"
      >
        <option value="">اختر مجموعة...</option>
        {groups.map((group) => (
          <option key={group.name} value={group.name}>
            {group.name} ({group.count} منتجات)
          </option>
        ))}
      </select>
    </div>
  );
};
