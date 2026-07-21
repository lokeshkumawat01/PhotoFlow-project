"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  BACKGROUND_STATE_COLOR,
  type BackgroundSceneState,
} from "../lib/motion-tokens";

interface SceneBackgroundContextValue {
  setState: (state: BackgroundSceneState) => void;
}

const SceneBackgroundContext = createContext<SceneBackgroundContextValue | null>(null);

/**
 * Reads the active background state from anywhere. Mostly used internally
 * by useSceneTransition — most scene components won't call this directly.
 */
export function useSceneBackground() {
  const ctx = useContext(SceneBackgroundContext);
  if (!ctx) {
    throw new Error("useSceneBackground must be used within GlobalScene");
  }
  return ctx;
}

/**
 * ONE continuous background, mounted once in layout.tsx, sitting behind
 * every scene on the site. Replaces the old per-section LivingBackground.tsx
 * approach (Creative Direction §6): scenes never mount their own background,
 * they just call useSceneTransition(state) to tell this component what
 * atmosphere to lerp toward.
 *
 * Phase 1 scope: the infrastructure only — continuous ambient mesh, noise
 * layer, and a color lerp driven by state changes. The actual per-scene
 * `useSceneTransition(...)` calls that drive it scene-by-scene are wired
 * up in Phase 2+ as each scene is built. Until then this renders the
 * "arrival-still" resting state end to end, which is the correct default
 * for a site that's still all-Arrival-scene today.
 */
export default function GlobalScene({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BackgroundSceneState>("arrival-still");
  const targetColor = BACKGROUND_STATE_COLOR[state];
  const layerRef = useRef<HTMLDivElement>(null);

  // Smoothly lerp the background color on every state change rather than
  // hard-cutting — "the background should evolve while scrolling, not restart."
  useEffect(() => {
    const el = layerRef.current;
    if (!el) return;
    el.style.transition = "background-color 2.4s cubic-bezier(0.22, 0.61, 0.36, 1)";
    el.style.backgroundColor = targetColor;
  }, [targetColor]);

  return (
    <SceneBackgroundContext.Provider value={{ setState }}>
      <div
        ref={layerRef}
        aria-hidden
        className="fixed inset-0 z-background pointer-events-none"
        style={{ backgroundColor: targetColor }}
      >
        {/* Ambient mesh — two soft aurora blobs, always drifting. Position
            and opacity read from the current state via data attributes so
            future phases can retune per-scene without touching this file. */}
        <div
          className="living-aurora-blob absolute -top-1/4 -left-1/4 w-[70vw] h-[70vw] rounded-full opacity-20 blur-[120px]"
          style={{ background: "radial-gradient(circle, var(--color-accent-faint), transparent 70%)", animationDuration: "22s" }}
        />
        <div
          className="living-aurora-blob absolute -bottom-1/4 -right-1/4 w-[60vw] h-[60vw] rounded-full opacity-15 blur-[120px]"
          style={{ background: "radial-gradient(circle, rgba(242,241,238,0.15), transparent 70%)", animationDuration: "28s", animationDelay: "-6s" }}
        />

        {/* Noise / film-grain layer — single shared texture across the whole scroll */}
        <div className="living-noise absolute inset-0" />
      </div>

      {/* Scene content sits above the background */}
      <div className="relative z-content">{children}</div>
    </SceneBackgroundContext.Provider>
  );
}
