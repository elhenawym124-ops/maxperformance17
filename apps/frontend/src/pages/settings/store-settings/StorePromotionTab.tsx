import React from "react";
import PromotionSettings from "../PromotionSettings";

export const StorePromotionTab: React.FC = () => {
  return (
    <div className="bg-gray-50/50 dark:bg-muted rounded-xl p-6 border border-border dark:border-border">
      <PromotionSettings />
    </div>
  );
};
