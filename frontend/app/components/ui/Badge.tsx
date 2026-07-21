import { cn } from "../../lib/utils";

type BadgeVariant = "ai" | "vip" | "success" | "danger" | "neutral";

// "ai" is the only variant that uses the accent — matches the rule that
// the accent color means "AI is involved," never generic emphasis.
const variantStyles: Record<BadgeVariant, string> = {
  ai: "bg-[var(--color-accent-faint)] text-[var(--color-accent)] border-[var(--color-accent)]/30",
  vip: "bg-white/5 text-[var(--color-text-on-dark)] border-[var(--color-hairline-dark)]",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
  neutral: "bg-white/5 text-[var(--color-text-on-dark-muted)] border-[var(--color-hairline-dark)]",
};

export default function Badge({
  variant = "neutral",
  children,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-[var(--radius-pill)] border",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}
