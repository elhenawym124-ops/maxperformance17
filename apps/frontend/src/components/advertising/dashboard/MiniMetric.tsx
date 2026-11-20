export default function MiniMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-muted px-2.5 py-1.5 transition-colors dark:border-border dark:bg-muted">
      <span className="block text-[10px] font-bold text-muted-foreground dark:text-muted-foreground">{label}</span>
      <span className="mt-0.5 block truncate text-xs font-black text-foreground dark:text-white">
        {value}
      </span>
    </div>
  );
}
