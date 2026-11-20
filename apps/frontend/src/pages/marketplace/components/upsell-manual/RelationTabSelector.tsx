import React from "react";
import { Package, ShoppingCart, Mail } from "lucide-react";
import { RelationBadge } from "./RelationBadge";
import {
  RELATION_ORDER,
  RELATION_CONFIG_DATA,
  type ManagedRelationType,
  type RelationBuckets,
} from "../../types/upsellManualTypes";

interface RelationTabSelectorProps {
  activeRelation: ManagedRelationType;
  setActiveRelation: (relation: ManagedRelationType) => void;
  relationBuckets: RelationBuckets;
}

const getRelationIcon = (type: ManagedRelationType) => {
  switch (type) {
    case "related":
      return <Package size={16} />;
    case "crossSell":
      return <ShoppingCart size={16} />;
    case "upsell":
      return <Mail size={16} />;
  }
};

export function RelationTabSelector({
  activeRelation,
  setActiveRelation,
  relationBuckets,
}: RelationTabSelectorProps) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      {RELATION_ORDER.map((relationType) => {
        const isActive = activeRelation === relationType;
        const config = RELATION_CONFIG_DATA[relationType];

        return (
          <button
            key={relationType}
            type="button"
            onClick={() => setActiveRelation(relationType)}
            className={`rounded-xl border px-4 py-3 text-left transition-colors ${
              isActive
                ? "border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-900/40 dark:bg-blue-950/20 dark:text-blue-100"
                : "border-gray-200 bg-muted text-foreground hover:border-border hover:bg-white dark:border-border dark:bg-muted dark:text-muted-foreground dark:hover:border-border dark:hover:bg-muted"
            }`}
          >
            <div className="flex items-center gap-2 text-sm font-bold">
              {getRelationIcon(relationType)}
              {config.title}
            </div>
            <div className="mt-1 text-xs leading-6 opacity-80">{config.subtitle}</div>
            <div className="mt-2">
              <RelationBadge
                label={`${relationBuckets[relationType].length} linked`}
                tone={
                  relationType === "crossSell"
                    ? "green"
                    : relationType === "upsell"
                      ? "amber"
                      : "blue"
                }
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}
