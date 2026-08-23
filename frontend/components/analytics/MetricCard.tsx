export function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="group relative overflow-hidden rounded-md border border-line bg-panel p-5 shadow-panel transition duration-200 hover:-translate-y-0.5 hover:shadow-desk">
      <div className="absolute left-0 top-0 h-full w-1 bg-accent" />
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">{label}</p>
        <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-brass" />
      </div>
      <p className="tabular mt-4 break-words text-3xl font-semibold leading-none tracking-normal text-ink">{value}</p>
      <p className="mt-3 rounded-sm bg-paper px-2 py-1 text-xs leading-5 text-muted">{detail}</p>
    </div>
  );
}
