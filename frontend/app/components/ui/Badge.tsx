import { cn } from "@/app/lib/utils";

type BadgeVariant = "ai" | "vip" | "success" | "danger" | "neutral";

const variantStyles: Record<BadgeVariant, string> = {
  ai: "bg-[var(--color-gold)]/10 text-[var(--color-gold-dark)] border-[var(--color-gold)]/30",
  vip: "bg-[var(--color-ink)]/5 text-[var(--color-ink)] border-[var(--color-ink)]/15",
  success: "bg-[var(--color-success)]/10 text-[var(--color-success)] border-[var(--color-success)]/25",
  danger: "bg-[var(--color-danger)]/10 text-[var(--color-danger)] border-[var(--color-danger)]/25",
  neutral: "bg-[var(--color-bg-secondary)] text-[var(--color-muted)] border-[var(--color-hairline)]",
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
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
        variantStyles[variant]
      )}
    >
      {children}
    </span>
  );
}