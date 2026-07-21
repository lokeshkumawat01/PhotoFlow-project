import { DURATION as TOKEN_DURATION } from "./design-tokens";

// Framer Motion (component-level interactions only — see Creative Direction §5:
// GSAP owns scene storytelling, Framer Motion owns hover/tap/focus/toggle states)
export const EASE = {
  soft: [0.16, 1, 0.3, 1] as const,
  emerge: [0.34, 1.56, 0.64, 1] as const,
  decel: [0.11, 0, 0.16, 1] as const,
  cinematic: [0.22, 0.61, 0.36, 1] as const,
  linear: [0, 0, 1, 1] as const,
} satisfies Record<string, readonly [number, number, number, number]>;

// GSAP eases — used by scene timelines (useGSAPScene / useScrollTimeline)
export const GSAP_EASE = {
  soft: "power3.out",
  emerge: "back.out(1.6)",
  decel: "power4.out",
  cinematic: "power2.inOut",
  linear: "none",
} as const;

// Component-level durations (Framer Motion)
export const DURATION = {
  instant: TOKEN_DURATION.instant,
  quick: TOKEN_DURATION.quick,
  base: TOKEN_DURATION.base,
  slow: TOKEN_DURATION.slow,
  cinematic: TOKEN_DURATION.cinematic,
  ambient: TOKEN_DURATION.ambient,
} as const;

// Scene-transition durations (GSAP, scroll-scrubbed — see useGSAPScene).
// These are advisory when scrub is a number (e.g. scrub: 1 already ties
// timeline progress to scroll), and used directly when a timeline plays
// on trigger rather than on scrub.
export const SCENE_DURATION = {
  base: TOKEN_DURATION.scene,      // most scene-to-scene transitions
  long: TOKEN_DURATION.sceneLong,  // reserved: Matching → Gallery Reveal only
} as const;

export const STAGGER = {
  tight: 0.04,
  normal: 0.08,
  loose: 0.15,
} as const;

/**
 * Default ScrollTrigger pin config shared by every scene transition, so
 * pinning/scrub feel is identical across the whole scroll story instead of
 * being re-tuned per component. Individual scenes may override `scrub` for
 * the one deliberately slower beat (Matching → Gallery Reveal).
 */
export const SCENE_PIN = {
  start: "top top",
  end: "+=100%",
  scrub: 1,
  pin: true,
  anticipatePin: 1,
} as const;

export const SCENE_PIN_LONG = {
  ...SCENE_PIN,
  end: "+=140%",
  scrub: 1.6,
} as const;

/**
 * Background scene states — driven by scroll position, consumed by
 * GlobalScene.tsx. Each is a lerp target, not a hard cut (see GlobalScene).
 * Renamed "gold-bloom" → "warm-bloom" to match the Creative Direction's
 * accent color (no gold in the new palette).
 */
export type BackgroundSceneState =
  | "arrival-still"      // L1, near-static — Arrival
  | "drift"               // L1→L2 — Curiosity, Discovery
  | "held"                // L2 — QR/Phone/Camera pinned beats
  | "technical"           // L3 — Face Detection / Mesh / Matching
  | "warm-bloom"          // L3→L4 — the one hard shift, Gallery Reveal
  | "warm-calm"           // L4 — Memories / Download
  | "return-dark";        // L4→L1 — Dashboard preview, Trust, CTA

export const BACKGROUND_STATE_COLOR: Record<BackgroundSceneState, string> = {
  "arrival-still": "#0B0C0E",
  drift: "#14171C",
  held: "#171B21",
  technical: "#1C2027",
  "warm-bloom": "#D9C4A0", // transitional midpoint between L3 and L4
  "warm-calm": "#F6F3EE",
  "return-dark": "#0B0C0E",
};
