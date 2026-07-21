"use client";

import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

let registered = false;

/**
 * Idempotent GSAP plugin registration. Call this once at the top of any
 * component/hook that uses ScrollTrigger — safe to call multiple times
 * across different components, it only registers once per page load.
 */
export function ensureGsapRegistered() {
  if (registered || typeof window === "undefined") return;
  gsap.registerPlugin(ScrollTrigger);
  registered = true;
}

/**
 * Global "reduced motion" check, read once per call site. Every scene
 * timeline (useGSAPScene, useScrollTimeline) should branch on this and
 * play its static final-frame state instead of a scrubbed/pinned timeline.
 * globals.css's `prefers-reduced-motion` media query covers CSS animations,
 * but ScrollTrigger pins are JS-driven and need this explicit check too.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export { gsap, ScrollTrigger };
