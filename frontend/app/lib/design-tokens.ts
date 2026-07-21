/**
 * PhotoFlow Design Tokens — single source of truth.
 *
 * These values are mirrored into CSS custom properties in globals.css
 * (so Tailwind utilities and plain CSS can use them) AND exported here
 * as typed JS constants (so GSAP timelines, canvas/SVG background code,
 * and any place that needs a raw number rather than a class name can
 * import the same values instead of re-guessing them).
 *
 * Rule: if a color, size, or timing value is used more than once,
 * it belongs here — not hardcoded in a component.
 */

// ---------------------------------------------------------------------------
// COLOR — layered dark-surface system + one functional accent.
// No gold, no crypto gradient, no neon. See Creative Direction §2.
// ---------------------------------------------------------------------------

export const COLOR = {
  // Surface hierarchy — the "world" the user scrolls through
  surface: {
    l1: "#0B0C0E", // Deep Charcoal — Arrival, Trust, CTA
    l2: "#14171C", // Slate — Discovery, QR/Phone/Camera transitions
    l3: "#1C2027", // Soft Glass — Face Detection / AI Processing (used with blur+opacity, see GLASS below)
    l4: "#F6F3EE", // Warm Neutral — Gallery Reveal / Memories / Download
  },

  // Text
  text: {
    onDark: "#F2F1EE",
    onDarkMuted: "#8B8F98",
    onWarm: "#1A1814",
    onWarmMuted: "#6B655C",
  },

  // The ONE accent. Used only to signal AI activity — scanning lines,
  // match confirmations, active states. Never a decorative fill.
  // This is the direct fix for the old gold/coral split — there is
  // exactly one accent and it has exactly one job.
  accent: {
    DEFAULT: "#E8A672",
    dim: "#E8A672A8", // ~66% — for glows/lines instead of a second color
    faint: "#E8A67233", // ~20% — for hover backgrounds, never a solid fill
  },

  // Functional (non-brand) colors — status only, never used for decoration
  status: {
    success: "#4E8B6E",
    danger: "#C4574F",
  },

  hairlineOnDark: "rgba(242, 241, 238, 0.10)",
  hairlineOnWarm: "rgba(26, 24, 20, 0.10)",
} as const;

// ---------------------------------------------------------------------------
// TYPOGRAPHY — one display face (cinematic, large), one body face (quiet).
// ---------------------------------------------------------------------------

export const TYPE_SCALE = {
  // Scene titles — meaningfully bigger than the old hero (clamp(1.9rem,7vw,4.5rem))
  display: "clamp(3rem, 9vw, 8rem)",
  h1: "clamp(2.25rem, 6vw, 4.5rem)",
  h2: "clamp(1.75rem, 4vw, 3rem)",
  h3: "clamp(1.25rem, 2.4vw, 1.75rem)",
  body: "clamp(1rem, 1.4vw, 1.125rem)",
  bodySmall: "clamp(0.875rem, 1.1vw, 0.9375rem)",
  caption: "0.8125rem",
} as const;

export const TRACKING = {
  display: "-0.03em",
  heading: "-0.02em",
  body: "0em",
  eyebrow: "0.2em", // for uppercase labels
} as const;

export const LEADING = {
  display: 1.05,
  heading: 1.15,
  body: 1.65,
} as const;

// ---------------------------------------------------------------------------
// SPACING — 8px base scale. One scale, used everywhere (no ad-hoc px values).
// ---------------------------------------------------------------------------

export const SPACE = {
  0: "0",
  1: "0.25rem",  // 4px
  2: "0.5rem",   // 8px
  3: "0.75rem",  // 12px
  4: "1rem",     // 16px
  5: "1.5rem",   // 24px
  6: "2rem",     // 32px
  7: "3rem",     // 48px
  8: "4rem",     // 64px
  9: "6rem",     // 96px
  10: "8rem",    // 128px
  11: "12rem",   // 192px — scene-level vertical rhythm
} as const;

// ---------------------------------------------------------------------------
// RADIUS
// ---------------------------------------------------------------------------

export const RADIUS = {
  sm: "0.5rem",
  md: "0.875rem",
  lg: "1.25rem",
  xl: "1.75rem",
  pill: "999px",
} as const;

// ---------------------------------------------------------------------------
// SHADOW — restrained, used for lift/elevation only, never for glow
// (glow is the accent color's job, see GLOW below).
// ---------------------------------------------------------------------------

export const SHADOW = {
  sm: "0 2px 8px -2px rgba(0, 0, 0, 0.20)",
  md: "0 12px 32px -8px rgba(0, 0, 0, 0.35)",
  lg: "0 24px 60px -16px rgba(0, 0, 0, 0.45)",
  // Warm-surface shadows are softer — L4 scenes shouldn't feel like dark-mode shadows pasted onto a light background
  warmSm: "0 2px 10px -4px rgba(26, 24, 20, 0.12)",
  warmMd: "0 16px 40px -12px rgba(26, 24, 20, 0.16)",
} as const;

// Accent glow — the only place the accent color is allowed to "spread"
export const GLOW = {
  scan: "0 0 24px 2px var(--color-accent-dim)",
  match: "0 0 40px 6px var(--color-accent-dim)",
} as const;

// ---------------------------------------------------------------------------
// BLUR — glass surfaces (L3) and scroll-driven depth-of-field
// ---------------------------------------------------------------------------

export const BLUR = {
  glassPanel: "20px",
  ambientSoft: "60px",
  ambientHeavy: "120px",
  depthNear: "0px",
  depthFar: "6px",
} as const;

// ---------------------------------------------------------------------------
// Z-INDEX — one map, so stacking order is decided once, not per-component.
// ---------------------------------------------------------------------------

export const Z = {
  background: 0,     // GlobalScene
  content: 10,        // normal scene content
  stickyHeader: 30,
  overlay: 40,         // lightbox, modals
  pageLoader: 50,
  toast: 60,
} as const;

// ---------------------------------------------------------------------------
// CONTAINER / GRID
// ---------------------------------------------------------------------------

export const GRID = {
  columns: 12,
  gutter: "clamp(1rem, 2.5vw, 2rem)",
  maxWidth: "1600px",
  edgePadding: "clamp(1.25rem, 4vw, 4rem)",
} as const;

// ---------------------------------------------------------------------------
// MOTION — see also lib/motion-tokens.ts for GSAP-specific ease strings
// and lib/motion.ts for Framer Motion variants. This block is the numeric
// source both of those files should read from.
// ---------------------------------------------------------------------------

export const DURATION = {
  instant: 0.15,
  quick: 0.3,
  base: 0.5,
  slow: 0.9,
  cinematic: 1.6,
  // New: full scene-transition timelines (GSAP-driven scroll-scrubbed morphs)
  // are much longer than a component reveal — see Creative Direction §5.
  scene: 3.2,
  sceneLong: 4.5, // reserved for the Matching → Gallery Reveal beat specifically
  ambient: 14,
} as const;

export type SurfaceLevel = keyof typeof COLOR.surface;

export const RIBBON_SPECTRUM = {
  magenta: "#E834A0",
  purple: "#8B4CE8",
  blue: "#4C6FE8",
  teal: "#34D8C8",
} as const;

// Convenience: an ordered array for gradient stops / cycling through chips
export const RIBBON_SPECTRUM_ORDER = [
  RIBBON_SPECTRUM.magenta,
  RIBBON_SPECTRUM.purple,
  RIBBON_SPECTRUM.blue,
  RIBBON_SPECTRUM.teal,
] as const;