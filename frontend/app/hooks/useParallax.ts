"use client";

import { useEffect, useRef, RefObject } from "react";
import { ensureGsapRegistered, gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap-config";

interface UseParallaxOptions {
  /** Positive = moves slower than scroll (feels "far"); negative = faster ("near"). Range roughly -1..1. */
  speed?: number;
  /** Which axis to move on. */
  axis?: "y" | "x";
  disabled?: boolean;
}

/**
 * Depth-via-parallax, per Creative Direction §9 ("depth via real blur... +
 * parallax scroll speed differences"). Attach to any element that should
 * drift at a different rate than the page scroll — background photography
 * layers, ambient blobs, foreground/background separation in a scene.
 *
 * Usage:
 *   const bgRef = useParallax({ speed: 0.3 });   // slow background layer
 *   const fgRef = useParallax({ speed: -0.15 }); // slightly faster foreground layer
 */
export function useParallax({
  speed = 0.2,
  axis = "y",
  disabled = false,
}: UseParallaxOptions = {}): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || disabled || prefersReducedMotion()) return;
    ensureGsapRegistered();

    const el = ref.current;
    const distance = speed * 100; // vh/vw percent of travel across the trigger's scroll range

    const ctx = gsap.context(() => {
      gsap.to(el, {
        [axis]: `${distance}%`,
        ease: "none",
        scrollTrigger: {
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          scrub: true,
        },
      });
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speed, axis, disabled]);

  return ref;
}
