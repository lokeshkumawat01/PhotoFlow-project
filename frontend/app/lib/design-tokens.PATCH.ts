/**
 * ADD THIS BLOCK to app/lib/design-tokens.ts — right after the existing
 * `accent` block inside COLOR (or as a separate export, either works).
 *
 * Scope rule: RIBBON_SPECTRUM is used ONLY inside the Hero constellation
 * (headline highlight words, floating chips, InfinityRibbon glow) — not
 * buttons, not badges elsewhere, not any other scene. The single
 * `accent` token above still means "AI is doing something" everywhere
 * else in the product. This is a deliberate, contained exception for one
 * scene, not a reopening of the gold/coral multi-color sprawl the audit
 * flagged — if a second scene wants this palette later, promote it
 * out of "Hero-only" deliberately, don't let it leak in silently.
 */
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
