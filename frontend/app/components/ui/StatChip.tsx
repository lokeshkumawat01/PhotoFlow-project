import { cn } from "../../lib/utils";

interface StatChipProps {
  value: string;
  label: string;
  onWarmSurface?: boolean;
  className?: string;
}

/**
 * A single number+label pair, used on the Stats/Trust scenes. Deliberately
 * plain — no card, no border, no icon — because the type scale (Heading's
 * h2/h3 sizes) is meant to carry the emphasis, not a container around it.
 */
export default function StatChip({ value, label, onWarmSurface = false, className }: StatChipProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span
        className={cn(
          "font-heading text-[clamp(1.75rem,4vw,3rem)] tracking-[-0.02em] font-semibold",
          onWarmSurface ? "text-[var(--color-text-on-warm)]" : "text-[var(--color-text-on-dark)]"
        )}
      >
        {value}
      </span>
      <span
        className={cn(
          "text-sm",
          onWarmSurface ? "text-[var(--color-text-on-warm-muted)]" : "text-[var(--color-text-on-dark-muted)]"
        )}
      >
        {label}
      </span>
    </div>
  );
}
