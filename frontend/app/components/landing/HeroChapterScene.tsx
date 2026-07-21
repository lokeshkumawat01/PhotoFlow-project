"use client";

import { useRef, useEffect, type ReactNode } from "react";
import { ensureGsapRegistered, gsap, prefersReducedMotion } from "@/app/lib/gsap-config";
import InfinityRibbon from "./InfinityRibbon";

const HALF_STEP_DURATION = 6;
const LAYER_STAGGER = 0.5;
const ROTATE_AMPLITUDE = 1.5;
const SCALE_TO = 0.92;

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

    // No scroll/hover dependency here at all: these 17 timelines are
    // created with no scrollTrigger and GSAP timelines autoplay on
    // creation by default, so rotation/scale genuinely starts the moment
    // the SVG's layers are parsed — same for every visitor, first load.
    // The ONLY thing that's scroll-linked is the background's vertical
    // drift below (that one's meant to move with scroll).
    const ctx = gsap.context(() => {
      layersRef.current.forEach((g, i) => {
        const tl = gsap.timeline({ repeat: -1, delay: i * LAYER_STAGGER });
        tl.to(g, {
          rotate: ROTATE_AMPLITUDE,
          scale: SCALE_TO,
          duration: HALF_STEP_DURATION,
          ease: "sine.inOut",
        }).to(g, {
          rotate: 0,
          scale: 1,
          duration: HALF_STEP_DURATION,
          ease: "sine.inOut",
        });
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
        {/*
          FIX: this wrapper used to be "absolute top-1/2 left-1/2
          -translate-x/y-1/2" measured against the WHOLE HeroChapterScene
          container — which is however tall Hero + Stats together are,
          not just Hero. So "centered" meant centered in that combined
          height, which visually reads as "too low" / off-center relative
          to Hero itself.

          Fix: pin a sub-wrapper to exactly 100dvh at the TOP of the scene
          (i.e. Hero's own height) and center within THAT. The outer
          bgGroupRef still spans the whole scene and still gets the
          scroll-linked y drift above, so the parallax behavior is
          unchanged — only the ribbon's resting center point changes.
        */}
        <div className="absolute top-0 left-0 w-full h-[100dvh] opacity-100 flex items-center justify-center">
          <div style={{ width: "70vw", mixBlendMode: "screen" }}>
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