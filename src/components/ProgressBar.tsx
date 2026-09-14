export function ProgressBar({
  current,
  total,
  color = "purple",
  label,
}: {
  current: number;
  total: number;
  color?: "purple" | "green";
  label?: string;
}) {
  const fill = color === "green" ? "bg-ok" : "bg-purple";
  return (
    <div className="flex items-center gap-3" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current} aria-label={label ?? `Schritt ${current} von ${total}`}>
      <div className="flex flex-1 gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} className={`h-2 flex-1 rounded-full ${i < current ? fill : "bg-line"}`} />
        ))}
      </div>
      <span className="text-sm font-semibold text-muted tabular-nums">
        {current} / {total}
      </span>
    </div>
  );
}
