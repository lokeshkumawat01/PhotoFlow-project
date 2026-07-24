"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { ensureGsapRegistered, gsap, prefersReducedMotion } from "@/app/lib/gsap-config";
import InfinityRibbon from "./InfinityRibbon";

const HALF_STEP_DURATION = 6;
const LAYER_STAGGER = 0.5;
const ROTATE_AMPLITUDE = 1.5;
const SCALE_TO = 0.92;
const CYCLE_DURATION = HALF_STEP_DURATION * 2;
const EPOCH_MS = 0;

export default function HeroChapterScene({ children }: { children: ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const bgGroupRef = useRef<HTMLDivElement>(null);
  const layersRef = useRef<SVGGElement[]>([]);
  const startedRef = useRef(false);
  const revertRef = useRef<(() => void) | null>(null);

  function handleLayersReady(layers: SVGGElement[]) {
    layersRef.current = layers;
    startAnimation();
  }

  function startAnimation() {
    if (startedRef.current || layersRef.current.length === 0) return;
    if (prefersReducedMotion()) return;
    startedRef.current = true;
    ensureGsapRegistered();

    const ctx = gsap.context(() => {
      layersRef.current.forEach((g, i) => {
        // FIX: no more wrapping gsap.timeline() around a single tween.
        // A plain gsap.to(..., {yoyo:true, repeat:-1}) is GSAP's own
        // standard pattern for an infinite back-and-forth oscillation,
        // and .totalTime() seeking on a repeating+yoyo-ing TWEEN is more
        // robust than .time() seeking on a TIMELINE wrapping one tween —
        // the extra timeline layer was pure indirection with no benefit
        // here, and is the most likely source of the seam at the
        // reversal/repeat boundary.
        // force3D ensures this stays on its own GPU-composited layer
        // instead of triggering a main-thread layout recalculation on
        // every frame, which is the other common cause of jank exactly
        // at a direction change (transform-box: fill-box on SVG <g>
        // elements can be expensive to recompute repeatedly otherwise).
        const tween = gsap.to(g, {
          rotate: ROTATE_AMPLITUDE,
          scale: SCALE_TO,
          duration: HALF_STEP_DURATION,
          ease: "sine.inOut",
          yoyo: true,
          repeat: -1,
          force3D: true,
        });

        const elapsedSeconds = (Date.now() - EPOCH_MS) / 1000 + i * LAYER_STAGGER;
        tween.totalTime(elapsedSeconds % CYCLE_DURATION);
      });

      gsap.to(bgGroupRef.current, {
        y: "-6%",
        ease: "none",
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.2,
        },
      });
    }, containerRef);

    revertRef.current = () => ctx.revert();
  }

  useEffect(() => {
    return () => {
      revertRef.current?.();
      revertRef.current = null;
      startedRef.current = false;
    };
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div ref={bgGroupRef} className="absolute inset-0 z-background overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-[100dvh] flex items-center justify-center">
          <div style={{ width: "88vw"}}>
            <InfinityRibbon
              className="w-full h-auto block [&_svg]:w-full [&_svg]:h-auto"
              onLayersReady={handleLayersReady}
            />
          </div>
        </div>

        <div className="living-noise absolute inset-0" />
        <div
          className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(11,12,14,0.65) 100%)" }}
        />
      </div>

      <div className="relative z-content">{children}</div>
    </div>
  );
}