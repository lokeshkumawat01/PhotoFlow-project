"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import Lenis from "lenis";
import { ensureGsapRegistered, gsap, ScrollTrigger } from "../lib/gsap-config";

const LenisContext = createContext<Lenis | null>(null);

/**
 * Global smooth-scroll provider. Wraps the entire app once, in the root
 * layout. Now synced with GSAP's ScrollTrigger (Phase 1): Lenis drives the
 * scroll, and on every Lenis scroll tick we tell ScrollTrigger to update
 * against that same position, so every scene's pinned/scrubbed timeline
 * (built in later phases with useGSAPScene/useScrollTimeline) reads scroll
 * progress consistently instead of racing native scroll against Lenis.
 */
export default function LenisProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (prefersReducedMotion) {
      setReady(true);
      return;
    }

    ensureGsapRegistered();

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenisRef.current = lenis;
    setReady(true);

    // Keep every ScrollTrigger instance in sync with Lenis's scroll position
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis from GSAP's own ticker rather than a separate rAF loop —
    // avoids two competing animation frames and keeps scene timelines and
    // scroll position perfectly phase-locked.
    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      lenisRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!ready) return null;

  return <LenisContext.Provider value={lenisRef.current}>{children}</LenisContext.Provider>;
}

/**
 * Access the shared Lenis instance from any component — e.g. to
 * programmatically scrollTo() a scene.
 */
export function useLenis() {
  return useContext(LenisContext);
}
