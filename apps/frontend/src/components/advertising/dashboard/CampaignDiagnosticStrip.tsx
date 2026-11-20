import { formatNumber, formatPercentage } from "../../../utils/facebookAdsHelpers";

interface SummaryCampaign {
  performance: {
    spend: number;
    purchases: number;
    roas: number;
    cpa: number;
    ctr: number;
    impressions: number;
    frequency: number;
  };
}

export default function CampaignDiagnosticStrip({
  campaign,
}: {
  campaign: SummaryCampaign;
}) {
  const { performance } = campaign;
  const diagnostics = [
    {
      label: "Hook",
      value: formatPercentage(performance.ctr),
      tone: performance.ctr >= 1 ? "good" : "warn",
    },
    {
      label: "Conversion",
      value: formatNumber(performance.purchases),
      tone:
        performance.spend > 0 && performance.purchases === 0 ? "bad" : "good",
    },
    {
      label: "Frequency",
      value: formatNumber(performance.frequency, 2),
      tone: performance.frequency >= 3 ? "warn" : "good",
    },
  ] as const;

  return (
    <div className="mt-2 grid grid-cols-3 gap-1.5">
      {diagnostics.map((item) => (
        <span
          key={item.label}
          className={[
            "rounded-lg px-2 py-1 text-[10px] font-black",
            item.tone === "good"
              ? "bg-emerald-50 text-success dark:bg-success/35 dark:text-success"
              : item.tone === "bad"
                ? "bg-red-50 text-destructive dark:bg-destructive/35 dark:text-destructive"
                : "bg-amber-50 text-warning dark:bg-warning/35 dark:text-warning",
          ].join(" ")}
        >
          {item.label}: {item.value}
        </span>
      ))}
    </div>
  );
}
