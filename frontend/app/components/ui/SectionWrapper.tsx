import { cn } from "../../lib/utils";
import type { SurfaceLevel } from "../../lib/design-tokens";

interface SectionWrapperProps extends React.HTMLAttributes<HTMLElement> {
  surface?: SurfaceLevel;
  /** Vertical rhythm — maps to design-tokens.ts SPACE scale. */
  padding?: "sm" | "md" | "lg";
}

const surfaceClass: Record<SurfaceLevel, string> = {
  l1: "surface-l1",
  l2: "surface-l2",
  l3: "surface-glass",
  l4: "surface-l4",
};

const paddingClass = {
  sm: "py-12 sm:py-16",
  md: "py-16 sm:py-24",
  lg: "py-24 sm:py-40",
};

/**
 * For the Trust/CTA bookend scenes and any content that's genuinely a
 * "section" rather than a pinned cinematic "scene" — see SceneWrapper for
 * the latter. Keeping these separate means we don't force GSAP pin/scrub
 * machinery onto content that's deliberately calmer (Creative Direction
 * §7: Trust is "deliberately calmer than everything before it").
 */
export default function SectionWrapper({
  surface = "l1",
  padding = "md",
  className,
  children,
  ...props
}: SectionWrapperProps) {
  return (
    <section className={cn(surfaceClass[surface], paddingClass[padding], className)} {...props}>
      {children}
    </section>
  );
}
