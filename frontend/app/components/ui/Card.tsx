"use client";

import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/app/lib/utils";
import { fadeUp, viewportOnce } from "@/app/lib/motion";

interface CardProps extends Omit<HTMLMotionProps<"div">, "ref"> {
  hoverLift?: boolean;
  glass?: boolean;
  animate?: boolean;
}

export default function Card({
  hoverLift = false,
  glass = true,
  animate = false,
  className,
  children,
  ...props
}: CardProps) {
  const sharedProps = animate
    ? {
        initial: "hidden",
        whileInView: "visible",
        viewport: viewportOnce,
        variants: fadeUp,
      }
    : {};

  return (
    <motion.div
      className={cn(
        "rounded-2xl p-6",
        glass ? "glass-card" : "bg-white border border-[var(--color-hairline)]",
        hoverLift && "lift-on-hover",
        className
      )}
      {...sharedProps}
      {...props}
    >
      {children}
    </motion.div>
  );
}