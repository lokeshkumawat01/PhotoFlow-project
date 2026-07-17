"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/app/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-gold)] text-white hover:bg-[var(--color-gold-dark)] shadow-[0_10px_30px_-10px_rgba(200,155,99,0.5)]",
  secondary:
    "bg-white text-[var(--color-ink)] border border-[var(--color-hairline)] hover:border-[var(--color-gold)]",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-[var(--color-bg-secondary)]",
};

// Each size now scales itself across breakpoints — no need for
// callers to bolt on !px-8 sm:!py-4 style overrides anymore.
const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm px-4 py-2 rounded-lg",
  md: "text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl",
  lg: "text-base sm:text-lg px-6 py-3 sm:px-8 sm:py-4 rounded-xl",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.015 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled || loading}
      className={cn(
        "font-medium inline-flex items-center justify-center gap-2 transition-colors focus-ring disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
      )}
      {children}
    </motion.button>
  );
}