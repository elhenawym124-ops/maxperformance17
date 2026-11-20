import React from "react";
import { Cloud, Layers, Smartphone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ChannelBadgeProps {
  channel?: string | null;
  isArabic: boolean;
}

export const ChannelBadge: React.FC<ChannelBadgeProps> = ({ channel, isArabic }) => {
  const norm = (channel || "AUTO").toUpperCase();
  if (norm === "META_CLOUD") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-info/80 bg-info/10 text-info dark:border-info/40 dark:text-info"
      >
        <Cloud className="size-3" />
        {isArabic ? "ميتا كلاود (Meta Cloud)" : "Meta Cloud"}
      </Badge>
    );
  }
  if (norm === "BAILEYS") {
    return (
      <Badge
        variant="outline"
        className="gap-1 border-success/80 bg-success/10 text-success dark:border-success/40 dark:text-success"
      >
        <Smartphone className="size-3" />
        {isArabic ? "واتساب ويب (Baileys)" : "Baileys"}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="gap-1 border-border bg-muted text-foreground dark:border-border dark:text-muted-foreground"
    >
      <Layers className="size-3" />
      {isArabic ? "توجيه ذكي (Auto)" : "Smart Auto"}
    </Badge>
  );
};
