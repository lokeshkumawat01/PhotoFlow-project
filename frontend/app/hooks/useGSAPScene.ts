"use client";

import { useEffect, useRef, RefObject } from "react";
import { ensureGsapRegistered, gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap-config";
import { SCENE_PIN } from "../lib/motion-tokens";

type SceneBuilder = (ctx: {
  gsap: typeof gsap;
  timeline: gsap.core.Timeline;
  el: HTMLElement;
}) => void;

interface UseGSAPSceneOptions {
  /** Override the default pin/scrub config (see SCENE_PIN / SCENE_PIN_LONG). */
  pinConfig?: Partial<typeof SCENE_PIN>;
  /** Skip pinning entirely — for scenes that animate in-place without holding scroll. */
  pin?: boolean;
  deps?: unknown[];
}

/**
 * The core primitive for scene storytelling (Creative Direction §5/§7).
 * Wraps a scene element in a pinned, scroll-scrubbed GSAP timeline.
 *
 * Usage (added in later phases, once actual scene components are built):
 *
 *   const sceneRef = useGSAPScene(({ timeline, el }) => {
 *     timeline
 *       .from(el.querySelector(".qr"), { scale: 1, opacity: 1 })
 *       .to(el.querySelector(".qr"), { scale: 0.4, x: 200 })
 *       .to(el.querySelector(".phone-outline"), { opacity: 1 }, "<");
 *   });
 *
 *   return <section ref={sceneRef}>...</section>;
 *
 * Automatically falls back to a static (non-pinned, non-scrubbed) state
 * when the user prefers reduced motion — the timeline still builds (so
 * the DOM end-state is correct) but plays instantly with no pin.
 */
export function useGSAPScene(
  build: SceneBuilder,
  options: UseGSAPSceneOptions = {}
): RefObject<HTMLDivElement | null> {
  const ref = useRef<HTMLDivElement>(null);
  const { pinConfig, pin = true, deps = [] } = options;

  useEffect(() => {
    if (!ref.current) return;
    ensureGsapRegistered();

    const reduced = prefersReducedMotion();
    const el = ref.current;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: reduced
          ? undefined
          : {
              trigger: el,
              ...SCENE_PIN,
              pin: pin && SCENE_PIN.pin,
              ...pinConfig,
            },
        paused: reduced,
      });

      build({ gsap, timeline, el });

      if (reduced) {
        // Jump straight to the finished state — no pin, no scrub.
        timeline.progress(1);
      }
    }, el);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
