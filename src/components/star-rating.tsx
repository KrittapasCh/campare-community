import { cn } from "@/lib/format";

export default function StarRating({
  value,
  count,
  size = "sm",
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
}) {
  const full = Math.round(value);
  return (
    <span className="inline-flex items-center gap-1 align-middle">
      <span
        className={cn(
          "text-brand-400 leading-none tracking-tight",
          size === "sm" ? "text-sm" : "text-base"
        )}
        aria-hidden
      >
        {"★".repeat(full)}
        <span className="text-ink-200">{"★".repeat(5 - full)}</span>
      </span>
      <span
        className={cn(
          "text-ink-500",
          size === "sm" ? "text-xs" : "text-sm"
        )}
      >
        {value.toFixed(1)}
        {count !== undefined && ` (${count} รีวิว)`}
      </span>
    </span>
  );
}
