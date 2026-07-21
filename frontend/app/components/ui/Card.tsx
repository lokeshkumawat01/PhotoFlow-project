"use client";

import { motion, type HTMLMotionProps, type Variants } from "framer-motion";
import { cn } from "../../lib/utils";
import { EASE } from "../../lib/motion-tokens";

// Card's own reveal variant, sourced from the token system directly —
// no dependency on the legacy lib/motion.ts file (see Phase 1 audit).
const cardReveal: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: EASE.soft },
  },
};
const cardViewport = { once: true, margin: "-80px" };

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  hoverLift?: boolean;
  glass?: boolean;
  animate?: boolean;
  /** Set true when the card sits on the warm L4 surface. */
  onWarmSurface?: boolean;
}

export default function Card({
  hoverLift = false,
  glass = true,
  animate = false,
  onWarmSurface = false,
  className,
  children,
  ...props
}: CardProps) {
  const sharedProps = animate
    ? {
        initial: "hidden",
        whileInView: "visible",
        viewport: cardViewport,
        variants: cardReveal,
      }
    : {};

  const surfaceClass = glass
    ? onWarmSurface
      ? "glass-panel-warm"
      : "surface-glass"
    : onWarmSurface
      ? "bg-white border border-[var(--color-hairline-warm)]"
      : "bg-[var(--color-surface-l2)] border border-[var(--color-hairline-dark)]";

  return (
    <motion.div
      className={cn("rounded-[var(--radius-lg)] p-6", surfaceClass, hoverLift && "lift-on-hover", className)}
      {...sharedProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}