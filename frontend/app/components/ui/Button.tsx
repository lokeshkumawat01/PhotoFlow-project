"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/app/lib/utils";

type ButtonVariant = "primary" | "secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-white/[0.05] border border-white/20",
  secondary: "bg-white/[0.03] border border-white/12",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm px-4 py-2 rounded-full",
  md: "text-sm sm:text-base px-5 py-2.5 sm:px-6 sm:py-3 rounded-full",
  lg: "text-base sm:text-lg px-7 py-3.5 sm:px-8 sm:py-4 rounded-full",
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
      whileHover={{ y: -2, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      disabled={disabled || loading}
      className={cn(
        // NO overflow-hidden here anymore — the button root stays
        // "open" so its box-shadow can render and transition freely
        // outside the pill's own bounds. Only the sweep-layer (below)
        // gets clipped, on its own inner wrapper.
        "group relative inline-flex items-center justify-center backdrop-blur-sm",
        "transition-[border-color,box-shadow] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
        "hover:border-transparent",
        "shadow-[0_0_0_0_rgba(225,1,145,0)]",
        "hover:shadow-[0_14px_44px_-10px_rgba(225,1,145,0.55)]",
        "focus-ring disabled:opacity-50 disabled:pointer-events-none",
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {/* Inner clipping wrapper — ONLY this has overflow-hidden, so the
          sweep-fill stays confined to the pill shape while the button
          root above is free to show its shadow. */}
      <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
        <span
          aria-hidden
          className="absolute inset-0 origin-left scale-x-0 transition-transform duration-[600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100"
          style={{ background: "linear-gradient(135deg, #7633e8, #e10191)" }}
        />
      </span>

      <span className="relative z-10 flex items-center gap-2 font-medium text-[var(--color-text-on-dark)] transition-colors duration-500 group-hover:text-white">
        {loading && (
          <span className="h-4 w-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
        )}
        {children}
      </span>
    </motion.button>
  );
}