"use client";

import { useEffect, useRef, RefObject } from "react";
import { ensureGsapRegistered, gsap, ScrollTrigger, prefersReducedMotion } from "../lib/gsap-config";
import { SCENE_PIN } from "../lib/motion-tokens";

interface ScrollTimelineConfig extends Partial<GSAPScrollTriggerVars> {
  markers?: boolean; // dev-only debugging aid, never true in production code
}

// Minimal local alias so this file doesn't need @types/gsap's full ScrollTrigger.Vars import path
type GSAPScrollTriggerVars = typeof SCENE_PIN;

/**
 * Lower-level than useGSAPScene: gives you a raw gsap.timeline() bound to a
 * ScrollTrigger on a *specific ref you already have* (rather than creating
 * the wrapping element for you). Use this when a scene needs multiple
 * independent elements choreographed together rather than one container
 * timeline — e.g. the QR → Phone → Camera sequence where the QR, phone
 * outline, and camera viewfinder are three separate DOM nodes.
 *
 * Usage:
 *   const qrRef = useRef<HTMLDivElement>(null);
 *   const phoneRef = useRef<HTMLDivElement>(null);
 *   const triggerRef = useRef<HTMLDivElement>(null);
 *
 *   useScrollTimeline(triggerRef, (tl) => {
 *     tl.to(qrRef.current, { scale: 0.4, x: 200, duration: 1 })
 *       .to(phoneRef.current, { opacity: 1, duration: 1 }, "<0.2");
 *   });
 */
export function useScrollTimeline(
  triggerRef: RefObject<HTMLElement | null>,
  build: (timeline: gsap.core.Timeline) => void,
  config: ScrollTimelineConfig = {},
  deps: unknown[] = []
) {
  useEffect(() => {
    if (!triggerRef.current) return;
    ensureGsapRegistered();

    const reduced = prefersReducedMotion();
    const trigger = triggerRef.current;

    const ctx = gsap.context(() => {
      const timeline = gsap.timeline({
        scrollTrigger: reduced
          ? undefined
          : {
              trigger,
              ...SCENE_PIN,
              markers: false,
              ...config,
            },
        paused: reduced,
      });

      build(timeline);

      if (reduced) timeline.progress(1);
    });

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
