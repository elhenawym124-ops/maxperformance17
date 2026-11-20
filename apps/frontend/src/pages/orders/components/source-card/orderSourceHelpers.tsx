import React from "react";
import {
  User,
  Globe,
  Share2,
  ShoppingBag,
  Bot,
  Link2,
} from "lucide-react";

export interface ChannelInfo {
  name: string;
  color: string;
}

export interface SourceTypeInfo {
  name: string;
  icon: React.ReactNode;
}

export const getChannelInfo = (order: {
  conversationId?: string;
  conversation?: { id: string; channel: string };
  sourceType?: string;
  extractionMethod?: string;
}): ChannelInfo | null => {
  if (!order.conversation && !order.conversationId) return null;

  let channel = order.conversation?.channel || "";
  if (!channel) {
    const src = String(order.sourceType || order.extractionMethod || "").toLowerCase();
    if (src.includes("whatsapp")) channel = "WHATSAPP";
    else if (src.includes("instagram")) channel = "INSTAGRAM";
    else if (src.includes("telegram")) channel = "TELEGRAM";
    else channel = "FACEBOOK";
  }

  const channelMap: Record<string, { name: string; color: string }> = {
    WHATSAPP: {
      name: "واتساب",
      color: "border-success/30 bg-success/10 text-success dark:text-success",
    },
    FACEBOOK: {
      name: "فيسبوك",
      color: "border-primary/30 bg-primary/10 text-primary dark:text-primary",
    },
    INSTAGRAM: {
      name: "انستجرام",
      color: "border-primary/30 bg-primary/10 text-primary dark:text-primary",
    },
    TELEGRAM: {
      name: "تيليجرام",
      color: "border-info/30 bg-info/10 text-info dark:text-info",
    },
    WEBCHAT: {
      name: "الدردشة المباشرة",
      color: "border-primary/30 bg-primary/10 text-primary dark:text-primary",
    },
  };

  return (
    channelMap[channel] || {
      name: channel,
      color: "border-border/60 bg-muted/40 text-muted-foreground",
    }
  );
};

export const getSourceTypeInfo = (order: {
  sourceType?: string;
  extractionMethod?: string;
  orderSource?: string;
  conversationId?: string;
  createdBy?: string;
  createdByName?: string;
  metadata?: any;
}): SourceTypeInfo => {
  let sourceType = order.sourceType || "";

  if (
    order.sourceType === "storefront" ||
    order.extractionMethod === "storefront" ||
    order.orderSource === "STOREFRONT" ||
    order.orderSource === "GUEST_CART" ||
    order.metadata?.source === "storefront" ||
    order.metadata?.isGuestOrder
  ) {
    sourceType = "storefront";
  } else if (
    order.extractionMethod === "manual" ||
    order.extractionMethod === "manual_order_modal" ||
    order.extractionMethod === "manual_admin" ||
    order.sourceType === "manual"
  ) {
    sourceType = "manual";
  } else if (
    !sourceType ||
    sourceType === "unknown" ||
    (sourceType === "ai_conversation" && !order.conversationId)
  ) {
    if (order.conversationId) {
      sourceType = "ai_conversation";
    } else if (order.createdBy || order.createdByName) {
      sourceType = "manual";
    } else {
      sourceType = "unknown";
    }
  }

  const sourceMap: Record<string, { name: string; icon: React.ReactNode }> = {
    ai_conversation: { name: "محادثة تلقائية", icon: <Bot className="h-3.5 w-3.5" /> },
    manual: { name: "طلب يدوي", icon: <User className="h-3.5 w-3.5" /> },
    manual_order_modal: { name: "طلب يدوي", icon: <User className="h-3.5 w-3.5" /> },
    storefront: { name: "المتجر الإلكتروني", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    woocommerce: { name: "WooCommerce", icon: <ShoppingBag className="h-3.5 w-3.5" /> },
    api: { name: "API", icon: <Link2 className="h-3.5 w-3.5" /> },
    import: { name: "استيراد", icon: <Share2 className="h-3.5 w-3.5" /> },
    unknown: { name: "غير محدد", icon: <Globe className="h-3.5 w-3.5" /> },
  };

  return sourceMap[sourceType] || { name: "غير محدد", icon: <Globe className="h-3.5 w-3.5" /> };
};

export const parseOrderMetadata = (metadata: unknown): Record<string, any> => {
  if (!metadata) return {};
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return (metadata as Record<string, any>) || {};
};
