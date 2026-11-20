import React from "react";
import type { MarketplaceApp as MPA } from "@/types/marketplace";
import { getMarketplaceLimitations } from "../../featureCatalog";

interface AppDetailsFitFenceProps {
  app: MPA;
}

/**
 * The honest exclusion: «مش ليك لو…». One line telling a merchant this app is
 * the wrong buy — it is the cheapest trust signal on the page.
 */
export const AppDetailsFitFence: React.FC<AppDetailsFitFenceProps> = ({ app }) => {
  const note = getMarketplaceLimitations(app);
  if (!note) return null;

  return (
    <section className="rounded-xl border border-warning/50 bg-warning/80 p-5 text-right dark:border-warning/25 dark:bg-warning/10">
      <b className="mb-1.5 block text-[13.5px] font-bold text-warning dark:text-warning">مش ليك لو…</b>
      <p className="m-0 text-[13.5px] leading-7 text-warning/90 dark:text-warning/85">{note}</p>
    </section>
  );
};
