import { cn } from "../../lib/utils";

type HeadingLevel = "display" | "h1" | "h2" | "h3";

interface HeadingProps extends React.HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel;
  /** Renders an uppercase, tracked-out label above the heading (an "eyebrow") — use only where it names something real, not as decoration. */
  eyebrow?: string;
  onWarmSurface?: boolean;
  as?: "h1" | "h2" | "h3" | "p";
}

const levelStyles: Record<HeadingLevel, string> = {
  display: "text-[clamp(3rem,9vw,8rem)] leading-[1.05] tracking-[-0.03em] font-semibold",
  h1: "text-[clamp(2.25rem,6vw,4.5rem)] leading-[1.1] tracking-[-0.02em] font-semibold",
  h2: "text-[clamp(1.75rem,4vw,3rem)] leading-[1.15] tracking-[-0.02em] font-semibold",
  h3: "text-[clamp(1.25rem,2.4vw,1.75rem)] leading-[1.2] tracking-[-0.01em] font-medium",
};

/**
 * Enforces the Creative Direction's §3 rule: one cinematic title per scene,
 * generous scale, no paragraph-block copy underneath. Every scene component
 * should reach for this instead of a raw <h1>/<h2> so the type scale can't
 * silently drift the way spacing/color did in the old codebase.
 */
export default function Heading({
  level = "h2",
  eyebrow,
  onWarmSurface = false,
  as,
  className,
  children,
  ...props
}: HeadingProps) {
  const Tag = as ?? (level === "display" ? "h1" : level);
  const textColor = onWarmSurface ? "text-[var(--color-text-on-warm)]" : "text-[var(--color-text-on-dark)]";

  return (
    <div>
      {eyebrow && (
        <p
          className={cn(
            "text-xs uppercase tracking-[0.2em] mb-3",
            onWarmSurface ? "text-[var(--color-text-on-warm-muted)]" : "text-[var(--color-text-on-dark-muted)]"
          )}
        >
          {eyebrow}
        </p>
      )}
      <Tag className={cn("font-heading", levelStyles[level], textColor, className)} {...props}>
        {children}
      </Tag>
    </div>
  );
}
